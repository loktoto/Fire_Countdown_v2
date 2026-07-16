import { defaultScenario, deriveFireView, monthlyCategoryLeaders } from "../selectors";
import { seedSnapshot } from "../../data/seed";
import type { Transaction } from "../../features/types";

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
