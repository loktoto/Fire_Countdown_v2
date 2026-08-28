import type { Asset, AssetQuoteCache } from "../types";

import {
  exchangeCode,
  inferredQuoteCurrency,
  normalizeCurrency,
  normalizeSymbol,
  quoteSymbolForAsset,
  safeSymbol,
  type UnknownRecord,
} from "./quoteSymbols";

const FREE_STOCK_BATCH_URL = "https://api.robinhood.com/quotes/";
const FREE_STOCK_QUOTE_URL = "https://stockprices.dev/api";
const FREE_CRYPTO_QUOTE_URL = "https://api.coinbase.com/v2/prices";
const FREE_FX_RATE_URL = "https://api.frankfurter.dev/v2/rate";
const FREE_QUOTE_CONCURRENCY = 2;
const REQUEST_TIMEOUT_MS = 15_000;

type AssetQuoteRequest = {
  asset: Asset;
  symbol: string;
  expectedCurrency: string;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalPositiveNumber(value: unknown) {
  const parsed = finiteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

async function fetchJson(input: string, init?: RequestInit, service = "Free market quotes") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const json: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`${service} HTTP ${response.status}`);
    }
    if (!isRecord(json)) {
      throw new Error(`${service} returned an invalid response`);
    }
    return json;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${service} request timed out`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function activeQuoteRequests(assets: Asset[], baseCurrency: string) {
  return assets
    .filter(
      (asset) => !asset.archivedAt && asset.updateMethod !== "manual" && (asset.quantity ?? 0) > 0,
    )
    .map((asset): AssetQuoteRequest | null => {
      const symbol = quoteSymbolForAsset(asset);
      if (!symbol) {
        return null;
      }
      return {
        asset,
        symbol,
        expectedCurrency: inferredQuoteCurrency(asset, baseCurrency),
      };
    })
    .filter((request): request is AssetQuoteRequest => request !== null);
}

type FreeQuotePayload = {
  symbol: string;
  price: number;
  currency: string;
  source: "FREE_MARKET" | "COINBASE";
  status: "ok" | "delayed";
  delayMinutes: number | null;
  asOf: string | null;
  change: number | null;
  changePercent: number | null;
  raw: UnknownRecord;
};

type FxRatePayload = {
  rate: number;
  raw: UnknownRecord;
};

function freeTickerForAsset(asset: Asset) {
  const ticker = safeSymbol(asset.ticker);
  if (ticker) {
    const parts = ticker.split(":");
    if (parts.length === 2) {
      const first = exchangeCode(parts[0]);
      const second = exchangeCode(parts[1]);
      const exchanges = new Set([
        "AMEX",
        "NASDAQ",
        "NYSE",
        "HKEX",
        "JPX",
        "LSE",
        "SGX",
        "SSE",
        "SZSE",
        "TWSE",
      ]);
      if (exchanges.has(first)) {
        return parts[1] ?? null;
      }
      if (exchanges.has(second)) {
        return parts[0] ?? null;
      }
    }
    return ticker;
  }

  const googleSymbol = safeSymbol(asset.googleFinanceSymbol);
  if (!googleSymbol) {
    return null;
  }
  const parts = googleSymbol.split(":");
  return parts.length === 2 ? (parts[1] ?? null) : googleSymbol;
}

function cryptoBaseSymbol(asset: Asset) {
  const ticker = freeTickerForAsset(asset);
  if (!ticker) {
    return null;
  }
  const pairParts = ticker.split(/[\/-]/).filter(Boolean);
  if (pairParts.length > 1) {
    return pairParts[0] ?? null;
  }
  return ticker.endsWith("USD") && ticker.length > 3 ? ticker.slice(0, -3) : ticker;
}

function quoteTime(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return Number.NEGATIVE_INFINITY;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function parseFreeStockBatchQuote(
  value: unknown,
  expectedCurrency: string,
): FreeQuotePayload | null {
  if (!isRecord(value) || typeof value.symbol !== "string") {
    return null;
  }
  const symbol = normalizeSymbol(value.symbol);
  const regularPrice = optionalPositiveNumber(value.last_trade_price);
  const regularTime = quoteTime(value.venue_last_trade_time);
  const extendedPrice = optionalPositiveNumber(
    value.last_non_reg_trade_price ?? value.last_extended_hours_trade_price,
  );
  const extendedTime = quoteTime(value.venue_last_non_reg_trade_time);
  const useExtended = extendedPrice !== null && extendedTime > regularTime;
  const price = useExtended ? extendedPrice : regularPrice;
  if (!symbol || !price) {
    return null;
  }
  const asOfValue = useExtended ? value.venue_last_non_reg_trade_time : value.venue_last_trade_time;
  const asOf = typeof asOfValue === "string" ? asOfValue : null;
  const previousClose = optionalPositiveNumber(
    value.adjusted_previous_close ?? value.previous_close,
  );
  const change = previousClose ? price - previousClose : null;
  const delayMinutes = asOf
    ? Math.max(0, Math.round((Date.now() - Date.parse(asOf)) / 60_000))
    : null;

  return {
    symbol,
    price,
    currency: expectedCurrency,
    source: "FREE_MARKET",
    status: "delayed",
    delayMinutes,
    asOf,
    change,
    changePercent: change !== null && previousClose ? change / previousClose : null,
    raw: value,
  };
}

async function fetchFreeStockBatch(requests: AssetQuoteRequest[]) {
  const requestsByTicker = new Map<string, AssetQuoteRequest[]>();
  requests.forEach((request) => {
    const ticker = freeTickerForAsset(request.asset);
    if (!ticker) {
      return;
    }
    const normalized = normalizeSymbol(ticker);
    requestsByTicker.set(normalized, [...(requestsByTicker.get(normalized) ?? []), request]);
  });

  const payloads = new Map<string, FreeQuotePayload>();
  const tickers = [...requestsByTicker.keys()];
  for (let offset = 0; offset < tickers.length; offset += 40) {
    const url = new URL(FREE_STOCK_BATCH_URL);
    url.searchParams.set("symbols", tickers.slice(offset, offset + 40).join(","));
    const json = await fetchJson(url.toString(), undefined, "Free market quotes");
    if (!Array.isArray(json.results)) {
      throw new Error("Free market quotes returned an invalid batch response");
    }
    json.results.forEach((value) => {
      if (!isRecord(value) || typeof value.symbol !== "string") {
        return;
      }
      const ticker = normalizeSymbol(value.symbol);
      const matchingRequests = requestsByTicker.get(ticker) ?? [];
      matchingRequests.forEach((request) => {
        const payload = parseFreeStockBatchQuote(value, request.expectedCurrency);
        if (payload) {
          payloads.set(request.asset.id, payload);
        }
      });
    });
  }
  return payloads;
}

function isRateLimitError(error: unknown) {
  return error instanceof Error && /429|too many requests|rate.?limit/i.test(error.message);
}

function waitForRetry(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchFreeStockQuote(request: AssetQuoteRequest): Promise<FreeQuotePayload> {
  const ticker = freeTickerForAsset(request.asset);
  if (!ticker) {
    throw new Error(`${request.asset.name} is missing a ticker`);
  }
  const instrumentPath = request.asset.assetClass === "etf" ? "etfs" : "stocks";
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const json = await fetchJson(
        `${FREE_STOCK_QUOTE_URL}/${instrumentPath}/${encodeURIComponent(ticker)}`,
        undefined,
        "Free market quote fallback",
      );
      const responseTicker = typeof json.Ticker === "string" ? normalizeSymbol(json.Ticker) : "";
      const price = optionalPositiveNumber(json.Price);
      if (!price || responseTicker !== normalizeSymbol(ticker)) {
        throw new Error(`Free market quote fallback returned an invalid response for ${ticker}`);
      }

      return {
        symbol: responseTicker,
        price,
        currency: request.expectedCurrency,
        source: "FREE_MARKET",
        status: "delayed",
        delayMinutes: 1,
        asOf: null,
        change: finiteNumber(json.ChangeAmount),
        changePercent:
          finiteNumber(json.ChangePercentage) === null
            ? null
            : (finiteNumber(json.ChangePercentage) ?? 0) / 100,
        raw: json,
      };
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === 2) {
        throw error;
      }
      await waitForRetry(750 * 2 ** attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Unable to refresh ${ticker}`);
}

async function fetchFreeCryptoQuote(request: AssetQuoteRequest): Promise<FreeQuotePayload> {
  const baseSymbol = cryptoBaseSymbol(request.asset);
  if (!baseSymbol) {
    throw new Error(`${request.asset.name} is missing a ticker`);
  }
  const json = await fetchJson(
    `${FREE_CRYPTO_QUOTE_URL}/${encodeURIComponent(`${baseSymbol}-USD`)}/spot`,
    undefined,
    "Coinbase",
  );
  const data = isRecord(json.data) ? json.data : null;
  const price = optionalPositiveNumber(data?.amount);
  const currency = normalizeCurrency(typeof data?.currency === "string" ? data.currency : "USD");
  if (!price || !currency) {
    throw new Error(`Coinbase returned an invalid response for ${baseSymbol}`);
  }

  const receivedAt = new Date().toISOString();
  return {
    symbol: `${baseSymbol}/${currency}`,
    price,
    currency,
    source: "COINBASE",
    status: "ok",
    delayMinutes: 0,
    asOf: receivedAt,
    change: null,
    changePercent: null,
    raw: json,
  };
}

async function fetchFreeFxRate(baseCurrency: string, quoteCurrency: string) {
  const json = await fetchJson(
    `${FREE_FX_RATE_URL}/${encodeURIComponent(baseCurrency)}/${encodeURIComponent(quoteCurrency)}`,
    undefined,
    "Frankfurter FX",
  );
  const rate = optionalPositiveNumber(json.rate);
  const responseBase = normalizeCurrency(typeof json.base === "string" ? json.base : "");
  const responseQuote = normalizeCurrency(typeof json.quote === "string" ? json.quote : "");
  if (!rate || responseBase !== baseCurrency || responseQuote !== quoteCurrency) {
    throw new Error(`Frankfurter FX returned an invalid ${baseCurrency}/${quoteCurrency} rate`);
  }
  return { rate, raw: json } satisfies FxRatePayload;
}

async function fetchFreeQuotePayload(request: AssetQuoteRequest) {
  if (request.asset.assetClass === "crypto") {
    return fetchFreeCryptoQuote(request);
  }
  if (request.asset.assetClass === "stock" || request.asset.assetClass === "etf") {
    return fetchFreeStockQuote(request);
  }
  throw new Error(`${request.asset.assetClass} does not support automatic free quotes`);
}

export async function getFreeMarketQuotes(
  assets: Asset[],
  baseCurrency: string,
): Promise<AssetQuoteCache[]> {
  const normalizedBaseCurrency = normalizeCurrency(baseCurrency);
  if (!normalizedBaseCurrency) {
    throw new Error("FIRE base currency is invalid");
  }
  const requests = activeQuoteRequests(assets, normalizedBaseCurrency).filter(
    (request) =>
      request.asset.assetClass === "stock" ||
      request.asset.assetClass === "etf" ||
      request.asset.assetClass === "crypto",
  );
  if (requests.length === 0) {
    throw new Error("No supported stock, ETF, or crypto assets are configured for quotes");
  }

  const stockRequests = requests.filter(
    (request) => request.asset.assetClass === "stock" || request.asset.assetClass === "etf",
  );
  const stockPayloads = await fetchFreeStockBatch(stockRequests).catch(
    () => new Map<string, FreeQuotePayload>(),
  );

  const fxRates = new Map<string, Promise<FxRatePayload | null>>();
  const fxRateFor = (currency: string) => {
    if (currency === normalizedBaseCurrency) {
      return Promise.resolve({ rate: 1, raw: {} } satisfies FxRatePayload);
    }
    const pair = `${currency}/${normalizedBaseCurrency}`;
    const existing = fxRates.get(pair);
    if (existing) {
      return existing;
    }
    const pending = fetchFreeFxRate(currency, normalizedBaseCurrency).catch(() => null);
    fxRates.set(pair, pending);
    return pending;
  };

  const quotes: AssetQuoteCache[] = [];
  for (let offset = 0; offset < requests.length; offset += FREE_QUOTE_CONCURRENCY) {
    const batch = requests.slice(offset, offset + FREE_QUOTE_CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async (request, batchIndex) => {
        const payload =
          stockPayloads.get(request.asset.id) ?? (await fetchFreeQuotePayload(request));
        const fx = await fxRateFor(payload.currency);
        const receivedAt = new Date().toISOString();
        const convertedPrice = fx ? payload.price * fx.rate : null;
        const raw = JSON.stringify({ quote: payload.raw, fx: fx?.raw ?? null });
        return {
          id: `quote-${request.asset.id}-${Date.parse(receivedAt)}-${offset + batchIndex}`,
          assetId: request.asset.id,
          symbol: payload.symbol,
          price: payload.price,
          currency: payload.currency,
          convertedPrice,
          convertedCurrency: convertedPrice ? normalizedBaseCurrency : null,
          fxRate: fx?.rate ?? null,
          asOf: payload.asOf,
          receivedAt,
          source: payload.source,
          status:
            payload.currency === normalizedBaseCurrency ? payload.status : ("delayed" as const),
          delayMinutes: payload.delayMinutes,
          change: payload.change,
          changePercent: payload.changePercent,
          marketOpen: null,
          raw: raw.length > 4000 ? raw.slice(0, 4000) : raw,
        } satisfies AssetQuoteCache;
      }),
    );
    settled.forEach((result) => {
      if (result.status === "fulfilled") {
        quotes.push(result.value);
      }
    });
  }

  if (quotes.length === 0) {
    throw new Error("Free quote services returned no usable quotes; cached values are unchanged");
  }
  return quotes;
}
