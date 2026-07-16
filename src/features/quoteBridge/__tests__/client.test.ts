import * as SecureStore from "expo-secure-store";

import {
  getFreeMarketQuotes,
  getQuotes,
  isValidQuoteBridgeUrl,
  quoteSymbolForAsset,
  saveQuoteCredential,
  saveQuoteToken,
  upsertAsset,
} from "../client";
import { seedSnapshot } from "../../../data/seed";

jest.mock("expo-secure-store", () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as typeof fetch;

const settings = {
  ...seedSnapshot.quoteSettings,
  scriptUrl: "https://script.google.com/macros/s/example/exec",
};

function response(json: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(json),
  } as unknown as Response;
}

describe("Quote Bridge client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("secret-token");
  });

  it("requires HTTPS before making any request", async () => {
    await expect(
      getQuotes({ ...settings, scriptUrl: "http://example.com/quotes" }, "HKD"),
    ).rejects.toThrow("HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(isValidQuoteBridgeUrl("https://example.com/quotes")).toBe(true);
    expect(isValidQuoteBridgeUrl("not a URL")).toBe(false);
  });

  it("validates and normalizes quote responses", async () => {
    fetchMock.mockResolvedValue(
      response({
        quotes: [
          {
            assetId: "asset-stock",
            ticker: "VOO",
            price: "101.25",
            currency: "usd",
            convertedPrice: "789.75",
            convertedCurrency: "hkd",
            status: "delayed",
            dataDelay: "15",
          },
        ],
      }),
    );

    await expect(getQuotes(settings, "hkd")).resolves.toEqual([
      expect.objectContaining({
        assetId: "asset-stock",
        price: 101.25,
        currency: "USD",
        convertedPrice: 789.75,
        convertedCurrency: "HKD",
        status: "delayed",
        delayMinutes: 15,
      }),
    ]);
  });

  it("rejects malformed quote payloads so existing cache is not replaced", async () => {
    fetchMock.mockResolvedValue(response({ quotes: [{ assetId: "asset-stock", price: "NaN" }] }));
    await expect(getQuotes(settings, "HKD")).rejects.toThrow("no usable quotes");

    fetchMock.mockResolvedValue(response({ unexpected: [] }));
    await expect(getQuotes(settings, "HKD")).rejects.toThrow("missing quotes");
  });

  it("trims tokens in SecureStore and sends asset mutations in the request body", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    await saveQuoteToken("  token-value  ");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "fire-countdown-v2.quote-token",
      "token-value",
    );

    fetchMock.mockResolvedValue(response({ ok: true }));
    await upsertAsset(settings, seedSnapshot.assets[0]!, "HKD");
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      token: "secret-token",
      action: "upsertAsset",
      assetId: seedSnapshot.assets[0]!.id,
    });
  });
});

describe("Free market quote client", () => {
  const liveAsset = seedSnapshot.assets.find((asset) => asset.id === "asset-voo")!;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes symbols for supported asset classes and exchanges", () => {
    expect(quoteSymbolForAsset({ ...liveAsset, ticker: "aapl", exchange: "NASDAQGS" })).toBe(
      "AAPL:NASDAQ",
    );
    expect(quoteSymbolForAsset({ ...liveAsset, assetClass: "crypto", ticker: "btc" })).toBe(
      "BTC/USD",
    );
    expect(
      quoteSymbolForAsset({
        ...liveAsset,
        ticker: null,
        exchange: null,
        googleFinanceSymbol: "HKG:2800",
      }),
    ).toBe("2800:HKEX");
  });

  it("does not accept or request an API credential", async () => {
    await expect(saveQuoteCredential("free_market", "not-needed")).rejects.toThrow(
      "do not require",
    );
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  });

  it("gets a free ETF quote and converts it with keyless FX data", async () => {
    fetchMock.mockImplementation(async (requestUrl: string) => {
      if (requestUrl === "https://api.robinhood.com/quotes/?symbols=VOO") {
        return response({
          results: [
            {
              symbol: "VOO",
              last_trade_price: "688.5",
              venue_last_trade_time: new Date().toISOString(),
              last_non_reg_trade_price: null,
              venue_last_non_reg_trade_time: null,
              adjusted_previous_close: "693.86",
            },
          ],
        });
      }
      if (requestUrl === "https://api.frankfurter.dev/v2/rate/USD/HKD") {
        return response({ date: "2026-07-14", base: "USD", quote: "HKD", rate: 7.8 });
      }
      return response({ error: "unexpected request" }, false, 500);
    });

    const quotes = await getFreeMarketQuotes([liveAsset], "HKD");
    expect(quotes).toEqual([
      expect.objectContaining({
        assetId: liveAsset.id,
        symbol: "VOO",
        price: 688.5,
        currency: "USD",
        convertedPrice: 5370.3,
        convertedCurrency: "HKD",
        fxRate: 7.8,
        source: "FREE_MARKET",
        status: "delayed",
      }),
    ]);
    expect(quotes[0]?.change).toBeCloseTo(-5.36);
    expect(quotes[0]?.changePercent).toBeCloseTo(-0.007725);
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  });

  it("keeps usable quotes when another symbol fails", async () => {
    const secondAsset = {
      ...liveAsset,
      id: "asset-msft",
      name: "Microsoft",
      ticker: "MSFT",
      exchange: "NASDAQ",
      googleFinanceSymbol: "NASDAQ:MSFT",
    };
    fetchMock.mockImplementation(async (requestUrl: string) => {
      if (requestUrl.startsWith("https://api.robinhood.com/quotes/")) {
        return response({
          results: [
            {
              symbol: "VOO",
              last_trade_price: "688.5",
              venue_last_trade_time: new Date().toISOString(),
              adjusted_previous_close: "693.86",
            },
          ],
        });
      }
      return response({ error: "not found" }, false, 404);
    });

    const quotes = await getFreeMarketQuotes([liveAsset, secondAsset], "USD");
    expect(quotes).toHaveLength(1);
    expect(quotes[0]?.assetId).toBe(liveAsset.id);
  });

  it("uses Coinbase without a key for crypto and keeps daily FX conversion", async () => {
    const cryptoAsset = {
      ...liveAsset,
      id: "asset-btc",
      name: "Bitcoin",
      assetClass: "crypto" as const,
      ticker: "BTC",
      exchange: null,
      googleFinanceSymbol: null,
    };
    fetchMock.mockImplementation(async (requestUrl: string) => {
      if (requestUrl === "https://api.coinbase.com/v2/prices/BTC-USD/spot") {
        return response({ data: { amount: "60000", base: "BTC", currency: "USD" } });
      }
      return response({ date: "2026-07-14", base: "USD", quote: "HKD", rate: 7.8 });
    });

    await expect(getFreeMarketQuotes([cryptoAsset], "HKD")).resolves.toEqual([
      expect.objectContaining({
        assetId: "asset-btc",
        symbol: "BTC/USD",
        price: 60000,
        convertedPrice: 468000,
        source: "COINBASE",
        status: "delayed",
      }),
    ]);
  });

  it("reports a provider failure without manufacturing replacement quotes", async () => {
    fetchMock.mockResolvedValue(response({ error: "offline" }, false, 503));
    await expect(getFreeMarketQuotes([liveAsset], "HKD")).rejects.toThrow(
      "cached values are unchanged",
    );
  });
});
