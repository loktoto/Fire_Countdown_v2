import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";

import { useFireStore } from "../../data/fireStore";
import { seedSnapshot } from "../../data/seed";
import type { Asset, AssetQuoteCache } from "../../features/types";
import { shapePortfolioAssetRows, usePortfolioViewModel } from "../usePortfolioViewModel";

jest.mock("../../data/fireStore", () => ({ useFireStore: jest.fn() }));

const useFireStoreMock = useFireStore as jest.Mock;
const timestamp = "2026-08-04T00:00:00.000Z";

function asset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "asset-test",
    typeId: "type-etf",
    name: "Test asset",
    assetClass: "etf",
    ticker: "TEST",
    quantity: 2,
    manualValue: 300,
    currency: "HKD",
    expectedAnnualReturn: 0.07,
    includeInFire: true,
    updateMethod: "hybrid",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function quote(overrides: Partial<AssetQuoteCache> = {}): AssetQuoteCache {
  return {
    id: "quote-test",
    assetId: "asset-test",
    symbol: "TEST",
    price: 200,
    currency: "HKD",
    receivedAt: timestamp,
    source: "FREE_MARKET",
    status: "ok",
    changePercent: 0.025,
    ...overrides,
  };
}

describe("Portfolio asset row shaping", () => {
  it("returns resolved live quote value, freshness, change, and inclusion state", () => {
    const [row] = shapePortfolioAssetRows([asset()], [quote()], "HKD");

    expect(row).toMatchObject({
      quoteChange: 0.025,
      freshness: "fresh",
      fallbackState: "none",
      inclusionState: "included",
      currencyState: "supported",
      resolution: {
        value: 400,
        currency: "HKD",
        source: "quote",
        status: "ok",
      },
      latestQuote: { id: "quote-test", source: "FREE_MARKET" },
    });
  });

  it("identifies cached quotes without changing their resolved value", () => {
    const [row] = shapePortfolioAssetRows(
      [asset()],
      [quote({ source: "CACHE", status: "stale", price: 180 })],
      "HKD",
    );

    expect(row).toMatchObject({
      freshness: "cached",
      fallbackState: "none",
      resolution: { value: 360, source: "quote", status: "stale" },
    });
  });

  it("distinguishes manual and manual-fallback valuations", () => {
    const rows = shapePortfolioAssetRows(
      [
        asset({ id: "asset-manual", updateMethod: "manual", manualValue: 500 }),
        asset({ id: "asset-fallback", manualValue: 450 }),
      ],
      [],
      "HKD",
    );

    expect(rows[0]).toMatchObject({
      fallbackState: "manual",
      freshness: "unavailable",
      resolution: { value: 500, source: "manual" },
    });
    expect(rows[1]).toMatchObject({
      fallbackState: "manual_fallback",
      freshness: "unavailable",
      resolution: { value: 450, source: "manual_fallback" },
    });
  });

  it("exposes excluded, archived, and unsupported-currency state deterministically", () => {
    const rows = shapePortfolioAssetRows(
      [
        asset({ id: "asset-excluded", includeInFire: false, updateMethod: "manual" }),
        asset({ id: "asset-archived", archivedAt: timestamp, updateMethod: "manual" }),
        asset({
          id: "asset-eur",
          currency: "EUR",
          manualValue: 100,
          updateMethod: "manual",
        }),
      ],
      [],
      "HKD",
    );

    expect(rows[0]).toMatchObject({
      inclusionState: "excluded",
      currencyState: "supported",
    });
    expect(rows[1]).toMatchObject({
      inclusionState: "archived",
      currencyState: "supported",
    });
    expect(rows[2]).toMatchObject({
      inclusionState: "included",
      currencyState: "unsupported",
      fallbackState: "manual",
      resolution: { value: 100, currency: "EUR" },
    });
  });

  it("uses the newest valid quote and ignores invalid timestamps", () => {
    const rows = shapePortfolioAssetRows(
      [asset()],
      [
        quote({ id: "quote-invalid", receivedAt: "invalid", price: 999 }),
        quote({ id: "quote-old", receivedAt: "2026-08-01T00:00:00.000Z", price: 100 }),
        quote({ id: "quote-new", receivedAt: "2026-08-03T00:00:00.000Z", price: 250 }),
      ],
      "HKD",
    );

    expect(rows[0]).toMatchObject({
      latestQuote: { id: "quote-new" },
      resolution: { value: 500 },
    });
  });
});

describe("Portfolio workflow", () => {
  it("opens a draft asset without persisting a placeholder holding", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const createAsset = jest.fn();
    const archiveAsset = jest.fn();
    useFireStoreMock.mockReturnValue({
      snapshot: seedSnapshot,
      updateAsset: jest.fn(),
      createAsset,
      archiveAsset,
      updateGoal: jest.fn(),
      updateMilestone: jest.fn(),
      createMilestone: jest.fn(),
      archiveMilestone: jest.fn(),
      updateScenario: jest.fn(),
      createScenario: jest.fn(),
      archiveScenario: jest.fn(),
    });

    const { result } = await renderHook(() => usePortfolioViewModel(), { wrapper });
    const draft = result.current.newAssetDraft();

    expect(draft).toMatchObject({
      id: "draft-asset",
      name: "",
      manualValue: 0,
      currency: "HKD",
      updateMethod: "manual",
    });
    expect(result.current.assetRows).toHaveLength(seedSnapshot.assets.length);
    expect(createAsset).not.toHaveBeenCalled();
    expect(result.current.archiveAsset).toBe(archiveAsset);
  });
});
