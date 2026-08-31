import { seedSnapshot } from "../../data/seed";
import { fireTarget, weightedExpectedReturn } from "../fireEngine";
import { effectiveProjectionAssumptions } from "../projectionAssumptions";
import { scenarioWhatIfInputs } from "../selectors";

describe("effectiveProjectionAssumptions", () => {
  it("keeps engine, dashboard, sheet, and what-if bounds on one deterministic contract", () => {
    const goal = seedSnapshot.goals[0]!;
    const scenario = {
      ...seedSnapshot.scenarios[0]!,
      expectedReturnAdjustment: 100,
      inflationAdjustment: -100,
      monthlySavingAdjustment: -goal.monthlySaving - 1,
      targetSpendingAdjustment: -goal.targetMonthlySpending - 1,
      withdrawalRateAdjustment: 100,
    };
    const baseExpectedReturn = weightedExpectedReturn(
      seedSnapshot.assets,
      seedSnapshot.quoteCache,
      goal.baseCurrency,
    );

    const assumptions = effectiveProjectionAssumptions(goal, scenario, baseExpectedReturn);

    expect(assumptions).toEqual({
      expectedReturn: 10,
      inflationRate: -0.95,
      monthlySaving: 0,
      targetMonthlySpending: 0,
      withdrawalRate: 1,
    });
    expect(fireTarget(goal, scenario)).toBe(0);
    expect(scenarioWhatIfInputs(seedSnapshot, scenario)).toEqual({
      expectedReturn: assumptions.expectedReturn,
      monthlySaving: assumptions.monthlySaving,
      targetMonthlySpending: assumptions.targetMonthlySpending,
    });
  });

  it("repairs non-finite inputs without emitting NaN or Infinity", () => {
    const goal = {
      ...seedSnapshot.goals[0]!,
      monthlySaving: Number.NaN,
      targetMonthlySpending: Number.POSITIVE_INFINITY,
      withdrawalRate: Number.NaN,
      inflationRate: Number.NEGATIVE_INFINITY,
    };
    const scenario = {
      ...seedSnapshot.scenarios[0]!,
      expectedReturnAdjustment: Number.NaN,
      inflationAdjustment: Number.NaN,
      monthlySavingAdjustment: Number.NaN,
      targetSpendingAdjustment: Number.NaN,
      withdrawalRateAdjustment: Number.NaN,
    };

    const assumptions = effectiveProjectionAssumptions(goal, scenario, Number.NaN);

    expect(assumptions).toEqual({
      expectedReturn: 0,
      inflationRate: 0,
      monthlySaving: 0,
      targetMonthlySpending: 0,
      withdrawalRate: 0.001,
    });
    Object.values(assumptions).forEach((value) => expect(Number.isFinite(value)).toBe(true));
  });

  it("repairs overflow when individually finite values are added", () => {
    const goal = {
      ...seedSnapshot.goals[0]!,
      monthlySaving: Number.MAX_VALUE,
      targetMonthlySpending: Number.MAX_VALUE,
      withdrawalRate: Number.MAX_VALUE,
      inflationRate: Number.MAX_VALUE,
    };
    const scenario = {
      ...seedSnapshot.scenarios[0]!,
      expectedReturnAdjustment: Number.MAX_VALUE,
      inflationAdjustment: Number.MAX_VALUE,
      monthlySavingAdjustment: Number.MAX_VALUE,
      targetSpendingAdjustment: Number.MAX_VALUE,
      withdrawalRateAdjustment: Number.MAX_VALUE,
    };

    const assumptions = effectiveProjectionAssumptions(goal, scenario, Number.MAX_VALUE);

    expect(assumptions).toEqual({
      expectedReturn: 0,
      inflationRate: 0,
      monthlySaving: 0,
      targetMonthlySpending: 0,
      withdrawalRate: 0.001,
    });
    Object.values(assumptions).forEach((value) => expect(Number.isFinite(value)).toBe(true));
  });
});
