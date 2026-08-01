import {
  fireTarget,
  includedFireAssets,
  daysToFire,
  milestoneETAs,
  monthlySummary,
  progressPercent,
  projectionSeries,
  todayActualImpact,
  totalAssets,
  transactionCashflowNet,
  weightedExpectedReturn,
} from "./fireEngine";
import type { FireSnapshot, ProjectionScenario, TransactionType } from "../features/types";
import { todayIso } from "../utils/format";

export type CategoryCashflowLeader = {
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  amount: number;
  transactionCount: number;
};

export function mainGoal(snapshot: FireSnapshot) {
  return snapshot.goals.find((goal) => goal.isMain) ?? snapshot.goals[0];
}

export function defaultScenario(snapshot: FireSnapshot) {
  const scenarios = snapshot.scenarios.filter((scenario) => !scenario.archivedAt);
  return scenarios.find((scenario) => scenario.isDefault) ?? scenarios[0];
}

function categoryMonthlyLeader(
  snapshot: FireSnapshot,
  date: string,
  type: TransactionType,
  currency?: string,
): CategoryCashflowLeader | null {
  const month = date.slice(0, 7);
  const categories = new Map(snapshot.categories.map((category) => [category.id, category]));
  const totals = new Map<string, { amount: number; transactionCount: number }>();

  snapshot.transactions
    .filter(
      (transaction) =>
        !transaction.archivedAt &&
        transaction.type === type &&
        transaction.date.startsWith(month) &&
        (!currency || transaction.currency.trim().toUpperCase() === currency.trim().toUpperCase()),
    )
    .forEach((transaction) => {
      const current = totals.get(transaction.categoryId) ?? { amount: 0, transactionCount: 0 };
      current.amount += transaction.amount;
      current.transactionCount += 1;
      totals.set(transaction.categoryId, current);
    });

  const [categoryId, total] =
    Array.from(totals.entries()).sort(([, a], [, b]) => b.amount - a.amount)[0] ?? [];

  if (!categoryId || !total) {
    return null;
  }

  const category = categories.get(categoryId);

  return {
    type,
    categoryId,
    categoryName: category?.name ?? "Uncategorized",
    categoryIcon: category?.icon,
    categoryColor: category?.color,
    amount: total.amount,
    transactionCount: total.transactionCount,
  };
}

export function monthlyCategoryLeaders(snapshot: FireSnapshot, date = todayIso()) {
  const currency = mainGoal(snapshot)?.baseCurrency ?? snapshot.currency;
  return {
    expense: categoryMonthlyLeader(snapshot, date, "expense", currency),
    income: categoryMonthlyLeader(snapshot, date, "income", currency),
  };
}

export function deriveFireView(
  snapshot: FireSnapshot,
  date = todayIso(),
  scenarioOverride?: ProjectionScenario,
) {
  const goal = mainGoal(snapshot);
  const scenario = scenarioOverride ?? defaultScenario(snapshot);

  if (!goal) {
    throw new Error("Missing main FIRE goal");
  }

  const transactionAdjustment = transactionCashflowNet(
    snapshot.transactions,
    date,
    goal.baseCurrency,
  );
  const projection = projectionSeries({
    assets: snapshot.assets,
    quotes: snapshot.quoteCache,
    goal,
    scenario,
    startDate: date,
    initialFireAssetAdjustment: transactionAdjustment,
  });
  const chartProjection = projectionSeries({
    assets: snapshot.assets,
    quotes: snapshot.quoteCache,
    goal,
    scenario,
    startDate: date,
    initialFireAssetAdjustment: transactionAdjustment,
    months: 900,
    postFireWithdrawal: true,
  });
  const reached = projection.find((point) => point.reached);
  const totalAssetValue =
    totalAssets(snapshot.assets, snapshot.quoteCache, goal.baseCurrency) + transactionAdjustment;
  const includedAssetValue =
    includedFireAssets(snapshot.assets, snapshot.quoteCache, goal.baseCurrency) +
    transactionAdjustment;

  return {
    goal,
    scenario,
    target: fireTarget(goal, scenario),
    totalAssets: totalAssetValue,
    includedAssets: includedAssetValue,
    weightedReturn: weightedExpectedReturn(snapshot.assets, snapshot.quoteCache, goal.baseCurrency),
    progress: progressPercent(
      snapshot.assets,
      snapshot.quoteCache,
      goal,
      transactionAdjustment,
      scenario,
    ),
    todayImpact: todayActualImpact(snapshot.transactions, date, goal.baseCurrency),
    transactionAdjustment,
    projection,
    chartProjection,
    projectedFireDays: daysToFire(projection, date),
    projectedFireDate: reached?.date ?? null,
    milestones: milestoneETAs({
      milestones: snapshot.milestones,
      projection,
    }),
    monthSummary: monthlySummary(
      snapshot.transactions,
      Number.parseInt(date.slice(0, 4), 10),
      Number.parseInt(date.slice(5, 7), 10),
      goal.baseCurrency,
    ),
    monthLeaders: monthlyCategoryLeaders(snapshot, date),
  };
}
