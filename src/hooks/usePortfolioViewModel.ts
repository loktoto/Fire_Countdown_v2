import { useMemo } from "react";

import { resolveAssetValue } from "../engine/fireEngine";
import { deriveFireView, mainGoal } from "../engine/selectors";
import { useFireStore } from "../data/fireStore";
import { todayIso } from "../utils/format";

export function usePortfolioViewModel() {
  const store = useFireStore();
  const {
    snapshot,
    updateAsset,
    createAsset,
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
  const assets = snapshot.assets.filter((asset) => !asset.archivedAt);
  const rawMilestones = [...snapshot.milestones]
    .filter((milestone) => !milestone.archivedAt && (!goal || milestone.goalId === goal.id))
    .sort((a, b) => a.order - b.order);
  const scenarios = snapshot.scenarios.filter((scenario) => !scenario.archivedAt);

  const allocation = useMemo(() => {
    const groups = new Map<string, number>();
    assets.forEach((asset) => {
      const value = resolveAssetValue(asset, snapshot.quoteCache, goal?.baseCurrency).value;
      groups.set(asset.assetClass, (groups.get(asset.assetClass) ?? 0) + value);
    });
    return [...groups.entries()].map(([label, value]) => ({ label, value }));
  }, [assets, goal?.baseCurrency, snapshot.quoteCache]);

  return {
    ...fire,
    assets,
    allocation,
    quoteCache: snapshot.quoteCache,
    assetTypes: snapshot.assetTypes,
    rawMilestones,
    scenarios,
    updateAsset,
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
    addManualAsset: () =>
      createAsset({
        name: "Manual Asset",
        typeId: "type-cash",
        assetClass: "cash",
        manualValue: 25000,
        currency: snapshot.currency,
        expectedAnnualReturn: 0.025,
        includeInFire: true,
        updateMethod: "manual",
        notes: "Created from Portfolio",
      }),
  };
}
