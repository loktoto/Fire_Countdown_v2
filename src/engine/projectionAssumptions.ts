import type { FireGoal, ProjectionScenario } from "../features/types";

function finiteOr(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function finiteSum(left: number | null | undefined, right: number | null | undefined) {
  return finiteOr(finiteOr(left, 0) + finiteOr(right, 0), 0);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * The single normalization contract for assumptions shown in the UI and used
 * by deterministic FIRE projections. Percentage values are decimal fractions.
 */
export function effectiveProjectionAssumptions(
  goal: FireGoal | null,
  scenario?: ProjectionScenario,
  baseExpectedReturn = 0,
) {
  const targetMonthlySpending = Math.max(
    0,
    finiteSum(goal?.targetMonthlySpending, scenario?.targetSpendingAdjustment),
  );
  const monthlySaving = Math.max(
    0,
    finiteSum(goal?.monthlySaving, scenario?.monthlySavingAdjustment),
  );
  const withdrawalRate = clamp(
    finiteSum(goal?.withdrawalRate, scenario?.withdrawalRateAdjustment),
    0.001,
    1,
  );
  const inflationRate = clamp(
    finiteSum(goal?.inflationRate, scenario?.inflationAdjustment),
    -0.95,
    10,
  );
  const expectedReturn = clamp(
    finiteSum(baseExpectedReturn, scenario?.expectedReturnAdjustment),
    -0.95,
    10,
  );

  return {
    expectedReturn,
    inflationRate,
    monthlySaving,
    targetMonthlySpending,
    withdrawalRate,
  };
}
