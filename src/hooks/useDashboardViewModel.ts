import { useMemo, useState } from "react";

import { monthlySummary } from "../engine/fireEngine";
import { effectiveProjectionAssumptions } from "../engine/projectionAssumptions";
import { deriveFireView, mainGoal, monthlyCategoryLeaders } from "../engine/selectors";
import { useFireStore } from "../data/fireStore";
import { todayIso } from "../utils/format";

export function useDashboardViewModel() {
  const { snapshot, updateGoal, updateScenario, createScenario, archiveScenario } = useFireStore();
  const scenarios = useMemo(
    () => snapshot.scenarios.filter((entry) => !entry.archivedAt),
    [snapshot.scenarios],
  );
  const defaultScenario = scenarios.find((scenario) => scenario.isDefault) ?? scenarios[0];
  const [selectedScenarioId, setScenarioId] = useState<string | undefined>();
  const goal = mainGoal(snapshot);

  const scenario =
    scenarios.find((entry) => entry.id === selectedScenarioId) ?? defaultScenario ?? scenarios[0];
  const today = todayIso();
  const latestTransaction = useMemo(
    () =>
      snapshot.transactions
        .filter((transaction) => !transaction.archivedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
    [snapshot.transactions],
  );
  const activityDate = latestTransaction?.date ?? today;
  const activityMonthSummary = useMemo(
    () =>
      monthlySummary(
        snapshot.transactions,
        Number.parseInt(activityDate.slice(0, 4), 10),
        Number.parseInt(activityDate.slice(5, 7), 10),
        goal?.baseCurrency ?? snapshot.currency,
      ),
    [activityDate, goal?.baseCurrency, snapshot.currency, snapshot.transactions],
  );
  const activityMonthLeaders = useMemo(
    () => monthlyCategoryLeaders(snapshot, activityDate),
    [activityDate, snapshot],
  );
  const base = useMemo(
    () => (goal ? deriveFireView(snapshot, today, scenario) : null),
    [goal, scenario, snapshot, today],
  );
  const view = base ?? deriveFireView(snapshot, today);
  const effectiveAssumptions = useMemo(
    () => ({
      ...effectiveProjectionAssumptions(view.goal, scenario, view.weightedReturn),
      targetAmount: view.target,
    }),
    [scenario, view],
  );

  return {
    ...view,
    effectiveAssumptions,
    scenario,
    scenarioId: scenario?.id,
    latestTransaction,
    activityDate,
    activityMonthSummary,
    activityMonthLeaders,
    setScenarioId,
    scenarios,
    updateGoal,
    updateScenario,
    createScenario,
    archiveScenario,
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
  };
}
