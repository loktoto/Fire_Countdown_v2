import * as SecureStore from "expo-secure-store";

import type { Asset, AssetQuoteCache, QuoteBridgeSettings } from "../types";

const TOKEN_KEY = "fire-countdown-v2:quote-token";

export async function saveQuoteToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function readQuoteToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearQuoteToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function parseJson(response: Response) {
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error ?? `HTTP ${response.status}`);
  }
  if (json?.error) {
    throw new Error(json.error);
  }
  return json;
}

function optionalNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

  const url = new URL(settings.scriptUrl);
  url.searchParams.set("action", "quotes");
  url.searchParams.set("token", token);
  if (baseCurrency) {
    url.searchParams.set("baseCurrency", baseCurrency);
  }

  const json = await fetch(url.toString()).then(parseJson);
  const receivedAt = new Date().toISOString();

  return (json.quotes ?? []).map((quote: Record<string, unknown>) => ({
    id: `quote-${String(quote.assetId)}-${Date.now()}`,
    assetId: String(quote.assetId),
    symbol: String(quote.ticker ?? ""),
    price: Number(quote.price ?? 0),
    currency: String(quote.currency ?? "HKD"),
    convertedPrice: optionalNumber(
      quote.convertedPrice ?? quote.localPrice ?? quote.priceInBaseCurrency,
    ),
    convertedCurrency:
      quote.convertedCurrency || quote.localCurrency || quote.baseCurrency
        ? String(quote.convertedCurrency ?? quote.localCurrency ?? quote.baseCurrency)
        : null,
    fxRate: optionalNumber(quote.fxRate ?? quote.exchangeRate),
    asOf: quote.tradeTime ? String(quote.tradeTime) : null,
    receivedAt,
    source: "GOOGLEFINANCE",
    status: String(quote.status ?? "ok") as AssetQuoteCache["status"],
    delayMinutes: quote.dataDelay == null ? null : Number(quote.dataDelay),
    raw: JSON.stringify(quote),
  }));
}

export async function upsertAsset(
  settings: QuoteBridgeSettings,
  asset: Asset,
  baseCurrency?: string,
) {
  if (!settings.scriptUrl) {
    throw new Error("Missing Script URL");
  }
  const token = await readQuoteToken();
  if (!token) {
    throw new Error("Missing API token");
  }

  await fetch(settings.scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      action: "upsertAsset",
      assetId: asset.id,
      ticker: asset.googleFinanceSymbol ?? asset.ticker ?? "",
      assetType: asset.assetClass,
      quantity: asset.quantity ?? 0,
      manualValue: asset.manualValue ?? 0,
      currency: asset.currency,
      baseCurrency,
      updateMethod: asset.updateMethod,
    }),
  }).then(parseJson);
}

export async function archiveAsset(settings: QuoteBridgeSettings, assetId: string) {
  if (!settings.scriptUrl) {
    throw new Error("Missing Script URL");
  }
  const token = await readQuoteToken();
  if (!token) {
    throw new Error("Missing API token");
  }

  await fetch(settings.scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action: "archiveAsset", assetId }),
  }).then(parseJson);
}
