import {
  dailyNet,
  daysToFire,
  fireTarget,
  includedFireAssets,
  projectionSeries,
  resolveAssetValue,
  transactionPreviewImpact,
  weightedExpectedReturn,
} from "../fireEngine";
import { seedSnapshot } from "../../data/seed";

const goal = seedSnapshot.goals[0]!;

describe("fireEngine", () => {
  it("calculates daily net deterministically", () => {
    expect(dailyNet(seedSnapshot.transactions, "2026-06-29")).toBe(-120);
  });

  it("resolves quote-backed assets before manual fallback", () => {
    const asset = seedSnapshot.assets[0]!;
    expect(resolveAssetValue(asset, seedSnapshot.quoteCache)).toMatchObject({
      value: 242000,
      source: "quote",
    });
  });

  it("uses converted quote values for foreign stock assets in the FIRE currency", () => {
    const asset = {
      ...seedSnapshot.assets[0]!,
      currency: "USD",
      quantity: 2,
      manualValue: 1000,
    };
    const quote = {
      ...seedSnapshot.quoteCache[0]!,
      assetId: asset.id,
      price: 100,
      currency: "USD",
      convertedPrice: 780,
      convertedCurrency: "HKD",
    };

    expect(resolveAssetValue(asset, [quote], "HKD")).toMatchObject({
      value: 1560,
      currency: "HKD",
      source: "quote",
    });
  });

  it("falls back to manual value when a foreign quote has no conversion data", () => {
    const asset = {
      ...seedSnapshot.assets[0]!,
      currency: "USD",
      quantity: 2,
      manualValue: 1000,
    };
    const quote = {
      ...seedSnapshot.quoteCache[0]!,
      assetId: asset.id,
      price: 100,
      currency: "USD",
      convertedPrice: null,
      convertedCurrency: null,
      fxRate: null,
    };

    expect(resolveAssetValue(asset, [quote], "HKD")).toMatchObject({
      value: 1000,
      currency: "USD",
      source: "manual_fallback",
      status: "fx_missing",
    });
  });

  it("sums only FIRE-included assets", () => {
    expect(includedFireAssets(seedSnapshot.assets, seedSnapshot.quoteCache)).toBe(422000);
  });

  it("calculates weighted expected return", () => {
    expect(weightedExpectedReturn(seedSnapshot.assets, seedSnapshot.quoteCache)).toBeCloseTo(
      0.04867,
      4,
    );
  });

  it("derives FIRE target from spending and withdrawal rate", () => {
    expect(fireTarget(goal)).toBe(9600000);
  });

  it("ignores stored FIRE target overrides and recalculates the target", () => {
    expect(fireTarget({ ...goal, targetAmount: 1000 })).toBe(9600000);
  });

  it("lets a FIRE method override withdrawal rate", () => {
    expect(
      fireTarget(goal, { ...seedSnapshot.scenarios[1]!, withdrawalRateAdjustment: 0.005 }),
    ).toBe(8400000);
  });

  it("creates a projection series", () => {
    const series = projectionSeries({
      assets: seedSnapshot.assets,
      quotes: seedSnapshot.quoteCache,
      goal,
      startDate: "2026-06-29",
      months: 12,
    });
    expect(series).toHaveLength(13);
    expect(series[12]!.projectedAssets).toBeGreaterThan(series[0]!.projectedAssets);
  });

  it("models retirement withdrawals instead of savings after FIRE when requested", () => {
    const cashAsset = {
      ...seedSnapshot.assets[1]!,
      expectedAnnualReturn: 0,
      includeInFire: true,
      manualValue: 100000,
      updateMethod: "manual" as const,
    };
    const retirementGoal = {
      ...goal,
      inflationRate: 0,
      monthlySaving: 500,
      targetMonthlySpending: 100,
    };

    const accumulation = projectionSeries({
      assets: [cashAsset],
      quotes: [],
      goal: retirementGoal,
      startDate: "2026-06-29",
      months: 1,
    });
    const retirement = projectionSeries({
      assets: [cashAsset],
      quotes: [],
      goal: retirementGoal,
      startDate: "2026-06-29",
      months: 1,
      postFireWithdrawal: true,
    });

    expect(accumulation[1]!.projectedAssets).toBe(100500);
    expect(retirement[1]!.projectedAssets).toBe(99900);
  });

  it("applies growth before monthly retirement withdrawal in post-FIRE projection", () => {
    const annualReturn = 0.12;
    const monthlyReturnFactor = Math.pow(1 + annualReturn, 1 / 12);
    const cashAsset = {
      ...seedSnapshot.assets[1]!,
      expectedAnnualReturn: annualReturn,
      includeInFire: true,
      manualValue: 100000,
      updateMethod: "manual" as const,
    };
    const retirementGoal = {
      ...goal,
      inflationRate: 0,
      monthlySaving: 500,
      targetMonthlySpending: 100,
    };

    const accumulation = projectionSeries({
      assets: [cashAsset],
      quotes: [],
      goal: retirementGoal,
      startDate: "2026-06-29",
      months: 1,
    });
    const retirement = projectionSeries({
      assets: [cashAsset],
      quotes: [],
      goal: retirementGoal,
      startDate: "2026-06-29",
      months: 1,
      postFireWithdrawal: true,
    });

    expect(accumulation[1]!.projectedAssets).toBeCloseTo(100000 * monthlyReturnFactor + 500, 4);
    expect(retirement[1]!.projectedAssets).toBeCloseTo(100000 * monthlyReturnFactor - 100, 4);
    expect(retirement[1]!.projectedAssets).toBeLessThan(accumulation[1]!.projectedAssets);
  });

  it("can keep growing after FIRE when returns exceed withdrawals", () => {
    const annualReturn = 0.12;
    const cashAsset = {
      ...seedSnapshot.assets[1]!,
      expectedAnnualReturn: annualReturn,
      includeInFire: true,
      manualValue: 100000,
      updateMethod: "manual" as const,
    };
    const retirementGoal = {
      ...goal,
      inflationRate: 0,
      monthlySaving: 5000,
      targetMonthlySpending: 290,
    };

    const retirement = projectionSeries({
      assets: [cashAsset],
      quotes: [],
      goal: retirementGoal,
      startDate: "2026-06-29",
      months: 2,
      postFireWithdrawal: true,
    });

    expect(retirement[1]!.projectedAssets).toBeGreaterThan(retirement[0]!.projectedAssets);
    expect(retirement[2]!.projectedAssets).toBeGreaterThan(retirement[1]!.projectedAssets);
  });

  it("interpolates FIRE crossing inside the reached month", () => {
    const days = daysToFire(
      [
        {
          monthIndex: 0,
          date: "2026-01-01",
          projectedAssets: 0,
          fireTarget: 100,
          reached: false,
        },
        {
          monthIndex: 1,
          date: "2026-02-01",
          projectedAssets: 200,
          fireTarget: 100,
          reached: true,
        },
      ],
      "2026-01-01",
    );

    expect(days).toBeCloseTo(15.5, 1);
  });

  it("previews transaction impact direction", () => {
    const expense = transactionPreviewImpact({
      transactions: seedSnapshot.transactions,
      draft: {
        amount: 10000,
        categoryId: "cat-food",
        currency: "HKD",
        date: "2026-06-29",
        type: "expense",
      },
      assets: seedSnapshot.assets,
      quotes: seedSnapshot.quoteCache,
      goal,
      startDate: "2026-06-29",
    });
    expect(expense.impactDays).toBeGreaterThan(0);
    expect(Number.isInteger(expense.impactDays)).toBe(false);
  });

  it("returns a real day impact for very large draft transactions", () => {
    const expense = transactionPreviewImpact({
      transactions: seedSnapshot.transactions,
      draft: {
        amount: 10000000,
        categoryId: "cat-food",
        currency: "HKD",
        date: "2026-06-29",
        type: "expense",
      },
      assets: seedSnapshot.assets,
      quotes: seedSnapshot.quoteCache,
      goal,
      startDate: "2026-06-29",
    });

    expect(expense.baseDays).not.toBeNull();
    expect(expense.simulatedDays).not.toBeNull();
    expect(expense.impactDays).toBeGreaterThan(30000);
    expect(Number.isFinite(expense.impactDays)).toBe(true);
  });

  it("estimates a real day impact when the crossing is beyond the preview window", () => {
    const expense = transactionPreviewImpact({
      transactions: seedSnapshot.transactions,
      draft: {
        amount: 10000000,
        categoryId: "cat-food",
        currency: "HKD",
        date: "2026-06-29",
        type: "expense",
      },
      assets: seedSnapshot.assets,
      quotes: seedSnapshot.quoteCache,
      goal: {
        ...goal,
        inflationRate: 0,
        monthlySaving: 20000,
        targetMonthlySpending: 3500,
        withdrawalRate: 0.042,
      },
      startDate: "2026-06-29",
      months: 3,
    });

    expect(expense.baseDays).not.toBeNull();
    expect(expense.simulatedDays).not.toBeNull();
    expect(expense.impactDays).toBeGreaterThan(0);
    expect(Number.isFinite(expense.impactDays)).toBe(true);
  });

  it("uses the base crossing speed when a huge expense exceeds the projection horizon", () => {
    const expense = transactionPreviewImpact({
      transactions: seedSnapshot.transactions,
      draft: {
        amount: 100000000,
        categoryId: "cat-food",
        currency: "HKD",
        date: "2026-06-29",
        type: "expense",
      },
      assets: seedSnapshot.assets,
      quotes: seedSnapshot.quoteCache,
      goal,
      startDate: "2026-06-29",
      months: 480,
    });

    expect(expense.baseDays).not.toBeNull();
    expect(expense.simulatedDays).not.toBeNull();
    expect(expense.impactDays).toBeGreaterThan(0);
    expect(Number.isFinite(expense.impactDays)).toBe(true);
  });
});
