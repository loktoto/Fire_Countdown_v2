import { useMemo } from "react";

import { useFireStore } from "../data/fireStore";
import { resolveAssetValue, type AssetValueResolution } from "../engine/fireEngine";
import { deriveFireView, mainGoal } from "../engine/selectors";
import type { Asset, AssetQuoteCache } from "../features/types";
import { todayIso } from "../utils/format";
import { useQuoteRefresh } from "./useQuoteRefresh";

export type PortfolioAssetFreshness = "fresh" | "delayed" | "stale" | "cached" | "unavailable";

export type PortfolioAssetFallbackState =
  "none" | "manual" | "manual_fallback" | "missing" | "unsupported_currency";

export type PortfolioAssetInclusionState = "included" | "excluded" | "archived";
export type PortfolioAssetCurrencyState = "supported" | "unsupported";

export type PortfolioAssetRow = {
  asset: Asset;
  resolution: AssetValueResolution;
  latestQuote: AssetQuoteCache | null;
  quoteChange: number | null;
  freshness: PortfolioAssetFreshness;
  fallbackState: PortfolioAssetFallbackState;
  inclusionState: PortfolioAssetInclusionState;
  currencyState: PortfolioAssetCurrencyState;
};

function normalizeCurrency(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function latestQuoteForAsset(assetId: string, quotes: AssetQuoteCache[]): AssetQuoteCache | null {
  let latest: AssetQuoteCache | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const quote of quotes) {
    if (quote.assetId !== assetId) {
      continue;
    }

    const receivedAt = Date.parse(quote.receivedAt);
    if (Number.isFinite(receivedAt) && receivedAt > latestTime) {
      latest = quote;
      latestTime = receivedAt;
    }
  }

  return latest;
}

function quoteFreshness(
  resolution: AssetValueResolution,
  quote: AssetQuoteCache | null,
): PortfolioAssetFreshness {
  if (resolution.source !== "quote" || !quote) {
    return "unavailable";
  }
  if (quote.source === "CACHE") {
    return "cached";
  }

  switch (quote.status) {
    case "ok":
      return "fresh";
    case "delayed":
      return "delayed";
    case "stale":
      return "stale";
    case "failed":
    case "unsupported":
    case "manual":
      return "unavailable";
  }
}

function fallbackState(resolution: AssetValueResolution): PortfolioAssetFallbackState {
  switch (resolution.source) {
    case "quote":
      return "none";
    case "manual":
      return "manual";
    case "manual_fallback":
      return "manual_fallback";
    case "none":
      return resolution.status === "fx_missing" ? "unsupported_currency" : "missing";
  }
}

export function shapePortfolioAssetRows(
  assets: Asset[],
  quotes: AssetQuoteCache[],
  baseCurrency?: string,
): PortfolioAssetRow[] {
  return assets.map((asset) => {
    const resolution = resolveAssetValue(asset, quotes, baseCurrency);
    const latestQuote = latestQuoteForAsset(asset.id, quotes);
    const currencyState =
      baseCurrency && normalizeCurrency(resolution.currency) !== normalizeCurrency(baseCurrency)
        ? "unsupported"
        : "supported";

    return {
      asset,
      resolution,
      latestQuote,
      quoteChange: latestQuote?.changePercent ?? null,
      freshness: quoteFreshness(resolution, latestQuote),
      fallbackState: fallbackState(resolution),
      inclusionState: asset.archivedAt ? "archived" : asset.includeInFire ? "included" : "excluded",
      currencyState,
    };
  });
}

export function usePortfolioViewModel() {
  const store = useFireStore();
  const quoteRefresh = useQuoteRefresh();
  const {
    snapshot,
    updateAsset,
    createAsset,
    archiveAsset,
    updateGoal,
    updateMilestone,
    createMilestone,
    archiveMilestone,
    updateScenario,
    createScenario,
    archiveScenario,
  } = store;
  const today = todayIso();
  const fire = useMemo(() => deriveFireView(snapshot, today), [snapshot, today]);
  const goal = mainGoal(snapshot);
  const goalBaseCurrency = goal?.baseCurrency;
  const allAssetRows = useMemo(
    () => shapePortfolioAssetRows(snapshot.assets, snapshot.quoteCache, goalBaseCurrency),
    [goalBaseCurrency, snapshot.assets, snapshot.quoteCache],
  );
  const assetRows = useMemo(
    () => allAssetRows.filter((row) => row.inclusionState !== "archived"),
    [allAssetRows],
  );
  const assets = useMemo(() => assetRows.map((row) => row.asset), [assetRows]);
  const rawMilestones = [...snapshot.milestones]
    .filter((milestone) => !milestone.archivedAt && (!goal || milestone.goalId === goal.id))
    .sort((a, b) => a.order - b.order);
  const scenarios = snapshot.scenarios.filter((scenario) => !scenario.archivedAt);

  const allocation = useMemo(() => {
    const groups = new Map<string, number>();
    assetRows.forEach(({ asset, currencyState, resolution }) => {
      if (currencyState === "unsupported") {
        return;
      }
      groups.set(asset.assetClass, (groups.get(asset.assetClass) ?? 0) + resolution.value);
    });
    return [...groups.entries()].map(([label, value]) => ({ label, value }));
  }, [assetRows]);

  return {
    ...fire,
    ...quoteRefresh,
    assets,
    assetRows,
    allocation,
    quoteCache: snapshot.quoteCache,
    assetTypes: snapshot.assetTypes,
    rawMilestones,
    scenarios,
    updateAsset,
    createAsset,
    archiveAsset,
    updateGoal,
    updateMilestone,
    createMilestone,
    archiveMilestone,
    updateScenario,
    createScenario,
    archiveScenario,
    newMilestoneDraft: () => {
      if (!goal) {
        return null;
      }

      const maxOrder = Math.max(0, ...rawMilestones.map((milestone) => milestone.order));
      const maxTarget = Math.max(
        goal.targetMonthlySpending * 12,
        ...rawMilestones.map((milestone) => milestone.targetAmount),
      );
      const timestamp = new Date().toISOString();

      return {
        id: "draft-milestone",
        goalId: goal.id,
        name: `Milestone ${rawMilestones.length + 1}`,
        targetAmount: maxTarget + 100000,
        targetDate: null,
        expectedReturnOverride: null,
        isActive: true,
        isHidden: false,
        order: maxOrder + 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    },
    newScenarioDraft: () => {
      const timestamp = new Date().toISOString();

      return {
        id: "draft-scenario",
        name: `Method ${scenarios.length + 1}`,
        expectedReturnAdjustment: 0,
        inflationAdjustment: 0,
        withdrawalRateAdjustment: 0,
        monthlySavingAdjustment: 0,
        targetSpendingAdjustment: 0,
        isDefault: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    },
    newAssetDraft: () => {
      const timestamp = new Date().toISOString();
      return {
        id: "draft-asset",
        name: "",
        typeId: "type-cash",
        assetClass: "cash",
        manualValue: 0,
        currency: snapshot.currency,
        expectedAnnualReturn: 0,
        includeInFire: true,
        updateMethod: "manual",
        notes: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      } as const;
    },
  };
}
