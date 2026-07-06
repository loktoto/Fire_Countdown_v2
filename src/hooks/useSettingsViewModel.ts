import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { getQuotes, saveQuoteToken } from "../features/quoteBridge/client";
import { useFireStore } from "../data/fireStore";
import { mainGoal } from "../engine/selectors";

export function useSettingsViewModel() {
  const store = useFireStore();
  const {
    snapshot,
    setThemeMode,
    setCurrency,
    setLanguage,
    updateQuoteSettings,
    updateCategory,
    saveQuotes,
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
  const [tokenDraft, setTokenDraft] = useState("");
  const refreshQuotes = useMutation({
    mutationFn: async () =>
      getQuotes(snapshot.quoteSettings, goal?.baseCurrency ?? snapshot.currency),
    onSuccess: (quotes) => saveQuotes(quotes),
  });
  const milestones = [...snapshot.milestones]
    .filter((milestone) => !milestone.archivedAt && (!goal || milestone.goalId === goal.id))
    .sort((a, b) => a.order - b.order);
  const scenarios = snapshot.scenarios.filter((scenario) => !scenario.archivedAt);

  async function saveToken() {
    if (tokenDraft.trim()) {
      await saveQuoteToken(tokenDraft.trim());
      setTokenDraft("");
    }
  }

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
    milestones,
    scenarios,
    categories: snapshot.categories.filter((category) => !category.archivedAt),
    setThemeMode,
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
    refreshQuotes,
    resetSeed,
  };
}
