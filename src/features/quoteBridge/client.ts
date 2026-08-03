import type { Asset, AssetQuoteCache, QuoteBridgeSettings } from "../types";
import {
  clearQuoteToken,
  getFreeMarketQuotes,
  isValidQuoteBridgeUrl,
  quoteSymbolForAsset,
  readQuoteCredential,
  readQuoteToken,
  saveQuoteCredential,
  saveQuoteToken,
  validateQuoteBridgeUrl,
} from "./deprecatedQueryClient";

export {
  clearQuoteToken,
  getFreeMarketQuotes,
  isValidQuoteBridgeUrl,
  quoteSymbolForAsset,
  readQuoteCredential,
  readQuoteToken,
  saveQuoteCredential,
  saveQuoteToken,
  validateQuoteBridgeUrl,
};

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

function redactCredential(value: string, credential: string) {
  return value
    .split(credential)
    .join("[REDACTED]")
    .split(encodeURIComponent(credential))
    .join("[REDACTED]");
}

function redactCredentialValue(value: unknown, credential: string): unknown {
  if (typeof value === "string") {
    return redactCredential(value, credential);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactCredentialValue(item, credential));
  }
  if (isRecord(value)) {
    const redacted: UnknownRecord = {};
    Object.entries(value).forEach(([key, item]) => {
      redacted[key] = redactCredentialValue(item, credential);
    });
    return redacted;
  }
  return value;
}

function secureBridgeUrl(settings: QuoteBridgeSettings, token: string) {
  if (!settings.scriptUrl) {
    throw new Error("Missing Script URL");
  }

  const url = validateQuoteBridgeUrl(settings.scriptUrl);
  const removeKeys: string[] = [];
  url.searchParams.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === "token" ||
      normalizedKey === "action" ||
      normalizedKey === "basecurrency" ||
      value.includes(token)
    ) {
      removeKeys.push(key);
    }
  });
  removeKeys.forEach((key) => url.searchParams.delete(key));

  const requestUrl = url.toString();
  if (requestUrl.includes(token) || requestUrl.includes(encodeURIComponent(token))) {
    throw new Error("Script URL must not contain API token");
  }
  return requestUrl;
}

async function fetchBridgeJson(input: string, init: RequestInit, token: string) {
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
      throw new Error(remoteError ?? `Quote Bridge HTTP ${response.status}`);
    }
    if (remoteError) {
      throw new Error(remoteError);
    }
    if (!isRecord(json)) {
      throw new Error("Quote Bridge returned an invalid response");
    }
    return json;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Quote Bridge request timed out");
    }
    if (error instanceof Error) {
      throw new Error(redactCredential(error.message, token));
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function authenticatedPost(settings: QuoteBridgeSettings, body: UnknownRecord) {
  const token = await readQuoteToken();
  if (!token) {
    throw new Error("Missing API token");
  }

  const requestUrl = secureBridgeUrl(settings, token);
  const json = await fetchBridgeJson(
    requestUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    },
    token,
  );
  return { json, token };
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
  const { json, token } = await authenticatedPost(settings, {
    action: "quotes",
    ...(baseCurrency ? { baseCurrency: baseCurrency.trim().toUpperCase() } : {}),
  });
  if (!Array.isArray(json.quotes)) {
    throw new Error("Quote Bridge response is missing quotes");
  }

  const receivedAt = new Date().toISOString();
  const quotes = json.quotes
    .map((quote, index) =>
      parseBridgeQuote(redactCredentialValue(quote, token), receivedAt, index),
    )
    .filter((quote): quote is AssetQuoteCache => quote !== null);

  if (json.quotes.length > 0 && quotes.length === 0) {
    throw new Error("Quote Bridge returned no usable quotes");
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
