import {
  defaultScenario,
  deriveFireView,
  deriveWhatIfLab,
  monthlyCategoryLeaders,
  monthlyMoneyTimeConversions,
  scenarioWhatIfInputs,
} from "../selectors";
import { seedSnapshot } from "../../data/seed";
import type { Transaction } from "../../features/types";
import { daysBetweenIso } from "../../utils/format";

const startDate = "2026-06-29";
const timestamp = "2026-06-30T00:00:00.000Z";

function withTransaction(transaction: Pick<Transaction, "amount" | "type">) {
  return {
    ...seedSnapshot,
    transactions: [
      {
        id: `txn-test-${transaction.type}`,
        amount: transaction.amount,
        type: transaction.type,
        categoryId: transaction.type === "income" ? "cat-salary" : "cat-food",
        currency: "HKD",
        date: startDate,
        note: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      ...seedSnapshot.transactions,
    ],
  };
}

function crossingFixture({
  assetValue,
  monthlySaving,
  target,
}: {
  assetValue: number;
  monthlySaving: number;
  target: number;
}) {
  return {
    ...seedSnapshot,
    transactions: [],
    assets: [
      {
        ...seedSnapshot.assets[1]!,
        manualValue: assetValue,
        quantity: null,
        updateMethod: "manual" as const,
        expectedAnnualReturn: 0,
        includeInFire: true,
        currency: "HKD",
      },
    ],
    quoteCache: [],
    goals: [
      {
        ...seedSnapshot.goals[0]!,
        targetMonthlySpending: target / 12,
        withdrawalRate: 1,
        inflationRate: 0,
        monthlySaving,
      },
    ],
    milestones: [],
    scenarios: [
      {
        ...seedSnapshot.scenarios[1]!,
        expectedReturnAdjustment: 0,
        inflationAdjustment: 0,
        withdrawalRateAdjustment: 0,
        monthlySavingAdjustment: 0,
        targetSpendingAdjustment: 0,
        isDefault: true,
      },
    ],
  };
}

describe("deriveFireView", () => {
  it("moves Home FIRE outputs when saved transaction cashflow changes", () => {
    const base = deriveFireView(seedSnapshot, startDate);
    const expense = deriveFireView(withTransaction({ type: "expense", amount: 100000 }), startDate);
    const income = deriveFireView(withTransaction({ type: "income", amount: 100000 }), startDate);

    expect(base.projectedFireDate).not.toBeNull();
    expect(expense.projectedFireDate).not.toBeNull();
    expect(income.projectedFireDate).not.toBeNull();
    expect(base.projectedFireDays).not.toBeNull();
    expect(expense.projectedFireDays).not.toBeNull();
    expect(income.projectedFireDays).not.toBeNull();

    expect(expense.projectedFireDays!).toBeGreaterThan(base.projectedFireDays!);
    expect(income.projectedFireDays!).toBeLessThan(base.projectedFireDays!);
    expect(expense.progress).toBeLessThan(base.progress);
    expect(income.progress).toBeGreaterThan(base.progress);
  });

  it("derives the displayed FIRE date from the same interpolated crossing as the countdown", () => {
    const crossingStart = "2026-01-01";
    const view = deriveFireView(
      crossingFixture({ assetValue: 0, monthlySaving: 200, target: 100 }),
      crossingStart,
    );

    expect(view.projectedFireDays).toBeCloseTo(15.5, 1);
    expect(view.projectedFireDate).toBe("2026-01-17");
    expect(daysBetweenIso(crossingStart, view.projectedFireDate!)).toBe(
      Math.round(view.projectedFireDays!),
    );
  });

  it("returns no FIRE date when the projection never crosses the target", () => {
    const view = deriveFireView(
      crossingFixture({ assetValue: 0, monthlySaving: 0, target: 100 }),
      "2026-01-01",
    );

    expect(view.projectedFireDays).toBeNull();
    expect(view.projectedFireDate).toBeNull();
  });

  it("uses the start date when FIRE is already reached", () => {
    const crossingStart = "2026-01-01";
    const view = deriveFireView(
      crossingFixture({ assetValue: 1000, monthlySaving: 0, target: 100 }),
      crossingStart,
    );

    expect(view.projectedFireDays).toBe(0);
    expect(view.projectedFireDate).toBe(crossingStart);
    expect(daysBetweenIso(crossingStart, view.projectedFireDate!)).toBe(
      Math.round(view.projectedFireDays!),
    );
  });

  it("keeps future-dated transactions out of today's FIRE balance", () => {
    const base = deriveFireView(seedSnapshot, startDate);
    const futureSnapshot = withTransaction({ type: "income", amount: 100000 });
    futureSnapshot.transactions[0] = {
      ...futureSnapshot.transactions[0]!,
      date: "2026-07-01",
    };

    const future = deriveFireView(futureSnapshot, startDate);
    expect(future.transactionAdjustment).toBe(base.transactionAdjustment);
    expect(future.includedAssets).toBe(base.includedAssets);
    expect(future.projectedFireDate).toBe(base.projectedFireDate);

    const baseOnExecutionDate = deriveFireView(seedSnapshot, "2026-07-01");
    const executed = deriveFireView(futureSnapshot, "2026-07-01");
    expect(executed.transactionAdjustment).toBe(baseOnExecutionDate.transactionAdjustment + 100000);
    expect(executed.includedAssets).toBe(baseOnExecutionDate.includedAssets + 100000);
    expect(executed.projectedFireDays!).toBeLessThan(baseOnExecutionDate.projectedFireDays!);
  });

  it("keeps other-currency transactions out of base-currency FIRE totals", () => {
    const base = deriveFireView(seedSnapshot, startDate);
    const otherCurrency = withTransaction({ type: "income", amount: 100000 });
    otherCurrency.transactions[0] = {
      ...otherCurrency.transactions[0]!,
      currency: "USD",
    };

    const view = deriveFireView(otherCurrency, startDate);
    expect(view.transactionAdjustment).toBe(base.transactionAdjustment);
    expect(view.monthSummary).toEqual(base.monthSummary);
  });

  it("summarizes the largest income and expense categories for the selected month", () => {
    const leaders = monthlyCategoryLeaders(seedSnapshot, startDate);

    expect(leaders.expense?.categoryName).toBe("Food");
    expect(leaders.expense?.amount).toBe(120);
    expect(leaders.income?.categoryName).toBe("Dividend");
    expect(leaders.income?.amount).toBe(5000);
  });

  it("converts this month's executed income and expense leaders into marginal FIRE days", () => {
    const conversions = monthlyMoneyTimeConversions(seedSnapshot, startDate);

    expect(conversions).toHaveLength(2);
    expect(conversions[0]).toMatchObject({
      type: "income",
      categoryName: "Dividend",
      amount: 5000,
      currency: "HKD",
      transactionCount: 1,
    });
    expect(conversions[0]!.impactDays).toBeLessThan(0);
    expect(conversions[1]).toMatchObject({
      type: "expense",
      categoryName: "Food",
      amount: 120,
      currency: "HKD",
      transactionCount: 1,
    });
    expect(conversions[1]!.impactDays).toBeGreaterThan(0);
  });

  it("keeps future, archived, and other-currency entries out of Money to Time", () => {
    const snapshot = {
      ...seedSnapshot,
      transactions: [
        {
          ...seedSnapshot.transactions[0]!,
          id: "future-salary",
          type: "income" as const,
          categoryId: "cat-salary",
          amount: 100000,
          date: "2026-06-30",
        },
        {
          ...seedSnapshot.transactions[0]!,
          id: "archived-food",
          amount: 100000,
          archivedAt: timestamp,
        },
        {
          ...seedSnapshot.transactions[1]!,
          id: "usd-dividend",
          amount: 100000,
          currency: "USD",
        },
        ...seedSnapshot.transactions,
      ],
    };

    const conversions = monthlyMoneyTimeConversions(snapshot, startDate);

    expect(conversions.map((entry) => [entry.categoryName, entry.amount])).toEqual([
      ["Dividend", 5000],
      ["Food", 120],
    ]);
  });

  it("runs What-if inputs as a deterministic sandbox without mutating the saved plan", () => {
    const baselineScenario = seedSnapshot.scenarios.find((scenario) => scenario.isDefault)!;
    const baselineInputs = scenarioWhatIfInputs(seedSnapshot, baselineScenario);
    const before = JSON.stringify(seedSnapshot);

    const result = deriveWhatIfLab(seedSnapshot, startDate, baselineScenario, {
      monthlySaving: baselineInputs.monthlySaving + 12000,
      expectedReturn: baselineInputs.expectedReturn + 0.03,
      targetMonthlySpending: baselineInputs.targetMonthlySpending - 8000,
    });

    expect(result.baseline.projectedFireDays).not.toBeNull();
    expect(result.result.projectedFireDays).not.toBeNull();
    expect(result.impactDays).toBeLessThan(0);
    expect(result.drivers).toHaveLength(3);
    result.drivers.forEach((driver) => expect(driver.impactDays).toBeLessThanOrEqual(0));
    expect(JSON.stringify(seedSnapshot)).toBe(before);
  });

  it("keeps a no-change What-if projection identical and repairs non-finite inputs", () => {
    const baselineScenario = seedSnapshot.scenarios.find((scenario) => scenario.isDefault)!;
    const baselineInputs = scenarioWhatIfInputs(seedSnapshot, baselineScenario);
    const unchanged = deriveWhatIfLab(seedSnapshot, startDate, baselineScenario, baselineInputs);
    const repaired = deriveWhatIfLab(seedSnapshot, startDate, baselineScenario, {
      ...baselineInputs,
      expectedReturn: Number.NaN,
    });

    expect(unchanged.impactDays).toBe(0);
    expect(unchanged.result).toEqual(unchanged.baseline);
    expect(repaired.inputs.expectedReturn).toBe(baselineInputs.expectedReturn);
    expect(repaired.impactDays).toBe(0);
  });

  it("reflects newly added milestones in the Home milestone journey", () => {
    const view = deriveFireView(
      {
        ...seedSnapshot,
        milestones: [
          ...seedSnapshot.milestones,
          {
            id: "milestone-new",
            goalId: "goal-main",
            name: "New FIRE step",
            targetAmount: 1200000,
            targetDate: null,
            expectedReturnOverride: null,
            isActive: true,
            isHidden: false,
            order: 4,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          {
            id: "milestone-archived",
            goalId: "goal-main",
            name: "Archived FIRE step",
            targetAmount: 1300000,
            targetDate: null,
            expectedReturnOverride: null,
            isActive: false,
            isHidden: false,
            order: 5,
            archivedAt: timestamp,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      },
      startDate,
    );

    expect(view.milestones.map((milestone) => milestone.name)).toContain("New FIRE step");
    expect(view.milestones.map((milestone) => milestone.name)).not.toContain("Archived FIRE step");
  });

  it("uses editable FIRE versions for projection outputs", () => {
    const conservative = {
      ...seedSnapshot.scenarios[0]!,
      name: "Conservative FIRE goal",
      targetSpendingAdjustment: 6000,
      monthlySavingAdjustment: -4000,
      isDefault: true,
      updatedAt: timestamp,
    };
    const view = deriveFireView(
      {
        ...seedSnapshot,
        scenarios: [
          conservative,
          { ...seedSnapshot.scenarios[1]!, isDefault: false, updatedAt: timestamp },
          { ...seedSnapshot.scenarios[2]!, archivedAt: timestamp, isDefault: false },
        ],
      },
      startDate,
    );

    expect(defaultScenario({ ...seedSnapshot, scenarios: [conservative] })?.name).toBe(
      "Conservative FIRE goal",
    );
    expect(view.scenario?.name).toBe("Conservative FIRE goal");
    expect(view.target).toBeGreaterThan(deriveFireView(seedSnapshot, startDate).target);
  });
});
