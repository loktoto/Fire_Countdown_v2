import type { Asset } from "../types";

type UnknownRecord = Record<string, unknown>;

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

export function inferredQuoteCurrency(asset: Asset, baseCurrency: string) {
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

export { normalizeCurrency, normalizeSymbol, safeSymbol, exchangeCode };
export type { UnknownRecord };
