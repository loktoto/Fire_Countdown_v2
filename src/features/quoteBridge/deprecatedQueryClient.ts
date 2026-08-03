import * as SecureStore from "expo-secure-store";

import type { Asset, AssetQuoteCache, QuoteBridgeSettings, QuoteProvider } from "../types";

// SecureStore keys cannot contain a colon on Android. Keep this stable so the
// credential can be saved and read consistently across Expo Go sessions.
const CUSTOM_BRIDGE_TOKEN_KEY = "fire-countdown-v2.quote-token";
const FREE_STOCK_BATCH_URL = "https://api.robinhood.com/quotes/";
const FREE_STOCK_QUOTE_URL = "https://stockprices.dev/api";
const FREE_CRYPTO_QUOTE_URL = "https://api.coinbase.com/v2/prices";
const FREE_FX_RATE_URL = "https://api.frankfurter.dev/v2/rate";
const FREE_QUOTE_CONCURRENCY = 2;
const REQUEST_TIMEOUT_MS = 15_000;
const quoteStatuses = new Set<AssetQuoteCache["status"]>([
  "ok",
  "delayed",
  "stale",
  "failed",
  "unsupported",
  "manual",
]);

type UnknownRecord = Record<string, unknown>;

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

function optionalNonNegativeNumber(value: unknown) {
  const parsed = finiteNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

function normalizeCurrency(value?: string | null) {
  const currency = (value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "";
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function safeSymbol(value?: string | null) {
  const symbol = normalizeSymbol(value ?? "");
  return symbol && /^[A-Z0-9.^=/_:-]{1,40}$/.test(symbol) ? symbol : null;
}

function exchangeCode(value?: string | null) {
  const exchange = normalizeSymbol(value ?? "");
  const aliases: Record<string, string> = {
    NYSEARCA: "NYSE",
    NASDAQGS: "NASDAQ",
    NASDAQGM: "NASDAQ",
    NASDAQCM: "NASDAQ",
    HKG: "HKEX",
    TYO: "JPX",
  };
  return aliases[exchange] ?? exchange;
}

export function quoteSymbolForAsset(asset: Asset) {
  const ticker = safeSymbol(asset.ticker);
  if (ticker) {
    if (asset.assetClass === "crypto" && !ticker.includes("/")) {
      return `${ticker}/USD`;
    }
    const exchange = exchangeCode(asset.exchange);
    return exchange && !ticker.includes(":") && !ticker.includes("/")
      ? `${ticker}:${exchange}`
      : ticker;
  }

  const googleSymbol = safeSymbol(asset.googleFinanceSymbol);
  if (!googleSymbol) {
    return null;
  }
  const parts = googleSymbol.split(":");
  if (parts.length === 2) {
    return `${parts[1]}:${exchangeCode(parts[0])}`;
  }
  return googleSymbol;
}

function inferredQuoteCurrency(asset: Asset, baseCurrency: string) {
  const ticker = safeSymbol(asset.ticker);
  if (ticker?.includes("/")) {
    return normalizeCurrency(ticker.split("/").at(-1)) || "USD";
  }
  if (asset.assetClass === "crypto") {
    return "USD";
  }

  const exchange = exchangeCode(asset.exchange ?? asset.googleFinanceSymbol?.split(":")[0] ?? "");
  const exchangeCurrencies: Record<string, string> = {
    AMEX: "USD",
    NASDAQ: "USD",
    NYSE: "USD",
    HKEX: "HKD",
    JPX: "JPY",
    LSE: "GBP",
    SGX: "SGD",
    SSE: "CNY",
    SZSE: "CNY",
    TWSE: "TWD",
  };
  return exchangeCurrencies[exchange] ?? (normalizeCurrency(asset.currency) || baseCurrency);
}

export function validateQuoteBridgeUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Invalid Script URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Script URL must use HTTPS");
  }
  return url;
}

export function isValidQuoteBridgeUrl(value?: string | null) {
  if (!value?.trim()) {
    return false;
  }
  try {
    validateQuoteBridgeUrl(value);
    return true;
  } catch {
    return false;
  }
}

async function saveSecureCredential(key: string, credential: string) {
  const normalized = credential.trim();
  if (!normalized) {
    throw new Error("API credential cannot be empty");
  }
  await SecureStore.setItemAsync(key, normalized);
}

export async function saveQuoteToken(token: string) {
  await saveSecureCredential(CUSTOM_BRIDGE_TOKEN_KEY, token);
}

export async function readQuoteToken() {
  return SecureStore.getItemAsync(CUSTOM_BRIDGE_TOKEN_KEY);
}

export async function clearQuoteToken() {
  await SecureStore.deleteItemAsync(CUSTOM_BRIDGE_TOKEN_KEY);
}

export async function saveQuoteCredential(provider: QuoteProvider, credential: string) {
  if (provider === "free_market") {
    throw new Error("Free quotes do not require an API credential");
  }
  return saveQuoteToken(credential);
}

export async function readQuoteCredential(provider: QuoteProvider) {
  return provider === "free_market" ? null : readQuoteToken();
}

async function fetchJson(input: string, init?: RequestInit, service = "Quote Bridge") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const json: unknown = await response.json().catch(() => null);
    const remoteError =
      typeof json === "string" && json.trim()
        ? json.trim()
        : isRecord(json) && typeof json.error === "string"
          ? json.error
          : isRecord(json) && json.status === "error" && typeof json.message === "string"
            ? json.message
            : null;

    if (!response.ok) {
      throw new Error(remoteError ?? `${service} HTTP ${response.status}`);
    }
    if (remoteError) {
      throw new Error(remoteError);
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

function parseBridgeQuote(
  value: unknown,
  receivedAt: string,
  index: number,
): AssetQuoteCache | null {
  if (!isRecord(value)) {
    return null;
  }

  const assetId = typeof value.assetId === "string" ? value.assetId.trim() : "";
  const symbol = String(value.ticker ?? value.symbol ?? "").trim();
  const price = optionalPositiveNumber(value.price);
  const currency = normalizeCurrency(String(value.currency ?? ""));
  const status = String(value.status ?? "ok") as AssetQuoteCache["status"];
  if (
    !assetId ||
    !price ||
    !currency ||
    !quoteStatuses.has(status) ||
    status === "failed" ||
    status === "unsupported"
  ) {
    return null;
  }

  const convertedCurrencyValue =
    value.convertedCurrency ?? value.localCurrency ?? value.baseCurrency;
  const convertedCurrency = normalizeCurrency(
    typeof convertedCurrencyValue === "string" ? convertedCurrencyValue : "",
  );
  const raw = JSON.stringify(value);

  return {
    id: `quote-${assetId}-${Date.parse(receivedAt)}-${index}`,
    assetId,
    symbol,
    price,
    currency,
    convertedPrice: optionalPositiveNumber(
      value.convertedPrice ?? value.localPrice ?? value.priceInBaseCurrency,
    ),
    convertedCurrency: convertedCurrency || null,
    fxRate: optionalPositiveNumber(value.fxRate ?? value.exchangeRate),
    asOf: typeof value.tradeTime === "string" ? value.tradeTime : null,
    receivedAt,
    source: "GOOGLEFINANCE",
    status,
    delayMinutes: optionalNonNegativeNumber(value.dataDelay),
    change: finiteNumber(value.change),
    changePercent: finiteNumber(value.changePercent),
    marketOpen: typeof value.marketOpen === "boolean" ? value.marketOpen : null,
    raw: raw.length > 4000 ? raw.slice(0, 4000) : raw,
  } satisfies AssetQuoteCache;
}

export async function getQuotes(
  settings: QuoteBridgeSettings,
  baseCurrency?: string,
): Promise<AssetQuoteCache[]> {
  if (!settings.scriptUrl) {
    throw new Error("Missing Script URL");
  }
  const token = await readQuoteToken();
  if (!token) {
    throw new Error("Missing API token");
  }

  const url = validateQuoteBridgeUrl(settings.scriptUrl);
  url.searchParams.set("action", "quotes");
  url.searchParams.set("token", token);
  if (baseCurrency) {
    url.searchParams.set("baseCurrency", baseCurrency.trim().toUpperCase());
  }

  const json = await fetchJson(url.toString());
  if (!Array.isArray(json.quotes)) {
    throw new Error("Quote Bridge response is missing quotes");
  }
  const receivedAt = new Date().toISOString();
  const quotes = json.quotes
    .map((quote, index) => parseBridgeQuote(quote, receivedAt, index))
    .filter((quote): quote is AssetQuoteCache => quote !== null);

  if (json.quotes.length > 0 && quotes.length === 0) {
    throw new Error("Quote Bridge returned no usable quotes");
  }
  return quotes;
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

export async function getPortfolioQuotes(
  settings: QuoteBridgeSettings,
  assets: Asset[],
  baseCurrency: string,
  _quoteCache: AssetQuoteCache[] = [],
) {
  return settings.provider === "free_market"
    ? getFreeMarketQuotes(assets, baseCurrency)
    : getQuotes(settings, baseCurrency);
}

async function authenticatedPost(settings: QuoteBridgeSettings, body: UnknownRecord) {
  if (!settings.scriptUrl) {
    throw new Error("Missing Script URL");
  }
  const token = await readQuoteToken();
  if (!token) {
    throw new Error("Missing API token");
  }
  const url = validateQuoteBridgeUrl(settings.scriptUrl);

  return fetchJson(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, ...body }),
  });
}

export async function upsertAsset(
  settings: QuoteBridgeSettings,
  asset: Asset,
  baseCurrency?: string,
) {
  await authenticatedPost(settings, {
    action: "upsertAsset",
    assetId: asset.id,
    ticker: asset.googleFinanceSymbol ?? asset.ticker ?? "",
    assetType: asset.assetClass,
    quantity: asset.quantity ?? 0,
    manualValue: asset.manualValue ?? 0,
    currency: asset.currency,
    baseCurrency,
    updateMethod: asset.updateMethod,
  });
}

export async function archiveAsset(settings: QuoteBridgeSettings, assetId: string) {
  await authenticatedPost(settings, { action: "archiveAsset", assetId });
}
