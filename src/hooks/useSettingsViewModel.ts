import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { isValidQuoteBridgeUrl, saveQuoteCredential } from "../features/quoteBridge/client";
import { useFireStore } from "../data/fireStore";
import { deriveFireView, mainGoal } from "../engine/selectors";
import { useQuoteRefresh } from "./useQuoteRefresh";
import { todayIso } from "../utils/format";

export function useSettingsViewModel() {
  const store = useFireStore();
  const quoteRefresh = useQuoteRefresh();
  const {
    snapshot,
    setThemeMode,
    setHapticsEnabled,
    setFireCompanion,
    setFireDestination,
    setCurrency,
    setLanguage,
    updateQuoteSettings,
    updateCategory,
    resetSeed,
    updateGoal,
    updateMilestone,
    archiveMilestone,
    createMilestone,
    updateScenario,
    createScenario,
    archiveScenario,
  } = store;
  const goal = mainGoal(snapshot);
  const today = todayIso();
  const fire = useMemo(() => deriveFireView(snapshot, today), [snapshot, today]);
  const [tokenDraft, setTokenDraft] = useState("");
  const saveToken = useMutation({
    mutationKey: ["save-quote-credential", snapshot.quoteSettings.provider],
    mutationFn: async () => saveQuoteCredential(snapshot.quoteSettings.provider, tokenDraft),
    onSuccess: () => {
      updateQuoteSettings({ enabled: true });
      setTokenDraft("");
    },
  });
  const milestones = [...snapshot.milestones]
    .filter((milestone) => !milestone.archivedAt && (!goal || milestone.goalId === goal.id))
    .sort((a, b) => a.order - b.order);
  const scenarios = snapshot.scenarios.filter((scenario) => !scenario.archivedAt);

  function newMilestoneDraft() {
    if (!goal) {
      return null;
    }

    const maxOrder = Math.max(0, ...milestones.map((milestone) => milestone.order));
    const maxTarget = Math.max(
      goal.targetMonthlySpending * 12,
      ...milestones.map((milestone) => milestone.targetAmount),
    );
    const timestamp = new Date().toISOString();

    return {
      id: "draft-milestone",
      goalId: goal.id,
      name: `Milestone ${milestones.length + 1}`,
      targetAmount: maxTarget + 100000,
      targetDate: null,
      expectedReturnOverride: null,
      isActive: true,
      isHidden: false,
      order: maxOrder + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  function newScenarioDraft() {
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
  }

  return {
    snapshot,
    goal,
    weightedReturn: fire.weightedReturn,
    milestones,
    scenarios,
    categories: snapshot.categories.filter((category) => !category.archivedAt),
    setThemeMode,
    setHapticsEnabled,
    setFireCompanion,
    setFireDestination,
    setCurrency,
    setLanguage,
    updateQuoteSettings,
    updateCategory,
    updateGoal,
    updateMilestone,
    archiveMilestone,
    createMilestone,
    updateScenario,
    archiveScenario,
    createScenario,
    newMilestoneDraft,
    newScenarioDraft,
    tokenDraft,
    setTokenDraft,
    saveToken,
    quoteUrlValid:
      snapshot.quoteSettings.provider === "free_market" ||
      isValidQuoteBridgeUrl(snapshot.quoteSettings.scriptUrl),
    refreshQuotes: quoteRefresh.refreshQuotes,
    quoteAssetCount: quoteRefresh.quoteAssetCount,
    lastRefreshAt: quoteRefresh.lastRefreshAt,
    resetSeed,
  };
}
