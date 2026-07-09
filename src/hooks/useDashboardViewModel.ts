import { useMemo, useState } from "react";

import { deriveFireView, mainGoal } from "../engine/selectors";
import { useFireStore } from "../data/fireStore";
import { todayIso } from "../utils/format";

export function useDashboardViewModel() {
  const { snapshot, updateGoal, updateScenario, createScenario, archiveScenario } = useFireStore();
  const scenarios = snapshot.scenarios.filter((entry) => !entry.archivedAt);
  const defaultScenario = scenarios.find((scenario) => scenario.isDefault) ?? scenarios[0];
  const [selectedScenarioId, setScenarioId] = useState<string | undefined>();
  const goal = mainGoal(snapshot);

  const scenario =
    scenarios.find((entry) => entry.id === selectedScenarioId) ?? defaultScenario ?? scenarios[0];
  const today = todayIso();
  const base = useMemo(
    () => (goal ? deriveFireView(snapshot, today, scenario) : null),
    [goal, scenario, snapshot, today],
  );
  const view = base ?? deriveFireView(snapshot, today);
  const effectiveAssumptions = {
    expectedReturn: Math.max(
      -0.95,
      view.weightedReturn + (scenario?.expectedReturnAdjustment ?? 0),
    ),
    inflationRate: view.goal.inflationRate + (scenario?.inflationAdjustment ?? 0),
    monthlySaving: Math.max(0, view.goal.monthlySaving + (scenario?.monthlySavingAdjustment ?? 0)),
    withdrawalRate: Math.max(
      0.001,
      view.goal.withdrawalRate + (scenario?.withdrawalRateAdjustment ?? 0),
    ),
    targetMonthlySpending: Math.max(
      0,
      view.goal.targetMonthlySpending + (scenario?.targetSpendingAdjustment ?? 0),
    ),
    targetAmount: view.target,
  };

  return {
    ...view,
    effectiveAssumptions,
    scenario,
    scenarioId: scenario?.id,
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
