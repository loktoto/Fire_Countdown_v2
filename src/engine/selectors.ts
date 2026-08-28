import {
  fireTarget,
  daysToFire,
  milestoneETAs,
  monthlySummary,
  progressPercent,
  projectionSeries,
  todayActualImpact,
  transactionCashflowNet,
  transactionPreviewImpact,
  valueAssets,
  weightedExpectedReturn,
} from "./fireEngine";
import type { FireSnapshot, ProjectionScenario, TransactionType } from "../features/types";
import { addIsoDays, todayIso } from "../utils/format";

export type CategoryCashflowLeader = {
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  amount: number;
  transactionCount: number;
};

export type MoneyTimeConversion = CategoryCashflowLeader & {
  currency: string;
  impactDays: number;
  baseDays: number | null;
  simulatedDays: number | null;
};

export type WhatIfInputs = {
  monthlySaving: number;
  expectedReturn: number;
  targetMonthlySpending: number;
};

export type WhatIfDriverKey = keyof WhatIfInputs;

export type WhatIfTiming = {
  projectedFireDays: number | null;
  projectedFireDate: string | null;
};

export type WhatIfDriver = WhatIfTiming & {
  key: WhatIfDriverKey;
  impactDays: number;
};

export type WhatIfLabProjection = {
  baselineInputs: WhatIfInputs;
  inputs: WhatIfInputs;
  baseline: WhatIfTiming;
  result: WhatIfTiming;
  impactDays: number;
  drivers: WhatIfDriver[];
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

export function monthlyMoneyTimeConversions(snapshot: FireSnapshot, date = todayIso()) {
  const goal = mainGoal(snapshot);
  const scenario = defaultScenario(snapshot);
  if (!goal) {
    return [] satisfies MoneyTimeConversion[];
  }

  const month = date.slice(0, 7);
  const baseCurrency = goal.baseCurrency.trim().toUpperCase();
  const categories = new Map(snapshot.categories.map((category) => [category.id, category]));
  const groups = new Map<
    string,
    {
      type: TransactionType;
      categoryId: string;
      amount: number;
      transactionCount: number;
      transactionIds: Set<string>;
      latestDate: string;
    }
  >();

  snapshot.transactions.forEach((transaction) => {
    if (
      transaction.archivedAt ||
      transaction.date > date ||
      !transaction.date.startsWith(month) ||
      transaction.currency.trim().toUpperCase() !== baseCurrency ||
      !Number.isFinite(transaction.amount) ||
      transaction.amount <= 0
    ) {
      return;
    }

    const key = `${transaction.type}|${transaction.categoryId}`;
    const current = groups.get(key) ?? {
      type: transaction.type,
      categoryId: transaction.categoryId,
      amount: 0,
      transactionCount: 0,
      transactionIds: new Set<string>(),
      latestDate: transaction.date,
    };
    current.amount += transaction.amount;
    current.transactionCount += 1;
    current.transactionIds.add(transaction.id);
    current.latestDate =
      current.latestDate > transaction.date ? current.latestDate : transaction.date;
    groups.set(key, current);
  });

  const leaders = (["income", "expense"] as const).flatMap((type) => {
    const leader = Array.from(groups.values())
      .filter((group) => group.type === type)
      .sort(
        (left, right) =>
          right.amount - left.amount ||
          right.latestDate.localeCompare(left.latestDate) ||
          left.categoryId.localeCompare(right.categoryId),
      )[0];

    if (!leader) {
      return [];
    }

    const impact = transactionPreviewImpact({
      transactions: snapshot.transactions.filter(
        (transaction) => !leader.transactionIds.has(transaction.id),
      ),
      draft: {
        amount: leader.amount,
        type: leader.type,
        categoryId: leader.categoryId,
        currency: goal.baseCurrency,
        date,
      },
      assets: snapshot.assets,
      quotes: snapshot.quoteCache,
      goal,
      scenario,
      startDate: date,
    });
    const category = categories.get(leader.categoryId);

    return [
      {
        type: leader.type,
        categoryId: leader.categoryId,
        categoryName: category?.name ?? "Uncategorized",
        categoryIcon: category?.icon,
        categoryColor: category?.color,
        amount: leader.amount,
        transactionCount: leader.transactionCount,
        currency: goal.baseCurrency,
        ...impact,
      } satisfies MoneyTimeConversion,
    ];
  });

  return leaders;
}

function finiteOrFallback(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function scenarioWhatIfInputs(
  snapshot: FireSnapshot,
  scenario?: ProjectionScenario,
): WhatIfInputs {
  const goal = mainGoal(snapshot);
  if (!goal) {
    throw new Error("Missing main FIRE goal");
  }

  return {
    monthlySaving: Math.max(0, goal.monthlySaving + (scenario?.monthlySavingAdjustment ?? 0)),
    expectedReturn: Math.max(
      -0.95,
      weightedExpectedReturn(snapshot.assets, snapshot.quoteCache, goal.baseCurrency) +
        (scenario?.expectedReturnAdjustment ?? 0),
    ),
    targetMonthlySpending: Math.max(
      0,
      goal.targetMonthlySpending + (scenario?.targetSpendingAdjustment ?? 0),
    ),
  };
}

function normalizeWhatIfInputs(inputs: WhatIfInputs, fallback: WhatIfInputs): WhatIfInputs {
  return {
    monthlySaving: Math.max(0, finiteOrFallback(inputs.monthlySaving, fallback.monthlySaving)),
    expectedReturn: Math.min(
      10,
      Math.max(-0.95, finiteOrFallback(inputs.expectedReturn, fallback.expectedReturn)),
    ),
    targetMonthlySpending: Math.max(
      0,
      finiteOrFallback(inputs.targetMonthlySpending, fallback.targetMonthlySpending),
    ),
  };
}

function whatIfScenario(
  snapshot: FireSnapshot,
  baselineScenario: ProjectionScenario | undefined,
  inputs: WhatIfInputs,
): ProjectionScenario {
  const goal = mainGoal(snapshot);
  if (!goal) {
    throw new Error("Missing main FIRE goal");
  }

  const timestamp = baselineScenario?.updatedAt ?? baselineScenario?.createdAt ?? "what-if";
  const baseReturn = weightedExpectedReturn(
    snapshot.assets,
    snapshot.quoteCache,
    goal.baseCurrency,
  );

  return {
    id: "what-if-preview",
    name: "What-if preview",
    expectedReturnAdjustment: inputs.expectedReturn - baseReturn,
    inflationAdjustment: baselineScenario?.inflationAdjustment ?? 0,
    withdrawalRateAdjustment: baselineScenario?.withdrawalRateAdjustment ?? 0,
    monthlySavingAdjustment: inputs.monthlySaving - goal.monthlySaving,
    targetSpendingAdjustment: inputs.targetMonthlySpending - goal.targetMonthlySpending,
    isDefault: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function projectScenarioTiming(
  snapshot: FireSnapshot,
  date = todayIso(),
  scenario?: ProjectionScenario,
): WhatIfTiming {
  const goal = mainGoal(snapshot);
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
  const projectedFireDays = daysToFire(projection, date);

  return {
    projectedFireDays,
    projectedFireDate:
      projectedFireDays === null ? null : addIsoDays(date, Math.round(projectedFireDays)),
  };
}

export function projectWhatIfInputs(
  snapshot: FireSnapshot,
  date: string,
  baselineScenario: ProjectionScenario | undefined,
  inputs: WhatIfInputs,
) {
  const baselineInputs = scenarioWhatIfInputs(snapshot, baselineScenario);
  const normalizedInputs = normalizeWhatIfInputs(inputs, baselineInputs);
  return projectScenarioTiming(
    snapshot,
    date,
    whatIfScenario(snapshot, baselineScenario, normalizedInputs),
  );
}

export function whatIfTimingImpactDays(baseline: WhatIfTiming, result: WhatIfTiming) {
  if (baseline.projectedFireDays === null && result.projectedFireDays === null) {
    return 0;
  }
  if (baseline.projectedFireDays === null) {
    return Number.NEGATIVE_INFINITY;
  }
  if (result.projectedFireDays === null) {
    return Number.POSITIVE_INFINITY;
  }
  return result.projectedFireDays - baseline.projectedFireDays;
}

export function deriveWhatIfLab(
  snapshot: FireSnapshot,
  date: string,
  baselineScenario: ProjectionScenario | undefined,
  inputs: WhatIfInputs,
): WhatIfLabProjection {
  const baselineInputs = scenarioWhatIfInputs(snapshot, baselineScenario);
  const normalizedInputs = normalizeWhatIfInputs(inputs, baselineInputs);
  const baseline = projectScenarioTiming(snapshot, date, baselineScenario);
  const result = projectWhatIfInputs(snapshot, date, baselineScenario, normalizedInputs);
  const driverKeys: WhatIfDriverKey[] = [
    "monthlySaving",
    "expectedReturn",
    "targetMonthlySpending",
  ];
  const drivers = driverKeys.map((key) => {
    const driverResult = projectWhatIfInputs(snapshot, date, baselineScenario, {
      ...baselineInputs,
      [key]: normalizedInputs[key],
    });
    return {
      key,
      ...driverResult,
      impactDays: whatIfTimingImpactDays(baseline, driverResult),
    };
  });

  return {
    baselineInputs,
    inputs: normalizedInputs,
    baseline,
    result,
    impactDays: whatIfTimingImpactDays(baseline, result),
    drivers,
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
  // Value the assets once and share the result across totals, the weighted
  // return, and both projection series instead of rescanning per call site.
  const valuation = valueAssets(snapshot.assets, snapshot.quoteCache, goal.baseCurrency);
  const projectionInput = {
    assets: snapshot.assets,
    quotes: snapshot.quoteCache,
    goal,
    scenario,
    startDate: date,
    initialFireAssetAdjustment: transactionAdjustment,
    weightedAnnualReturn: valuation.weightedReturn,
  } as const;
  const projection = projectionSeries(projectionInput);
  const chartProjection = projectionSeries({
    ...projectionInput,
    months: 900,
    postFireWithdrawal: true,
  });
  const totalAssetValue = valuation.total + transactionAdjustment;
  const includedAssetValue = valuation.includedTotal + transactionAdjustment;
  const projectedFireDays = daysToFire(projection, date);
  const projectedFireDate =
    projectedFireDays === null ? null : addIsoDays(date, Math.round(projectedFireDays));

  return {
    goal,
    scenario,
    target: fireTarget(goal, scenario),
    totalAssets: totalAssetValue,
    includedAssets: includedAssetValue,
    weightedReturn: valuation.weightedReturn,
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
    projectedFireDays,
    projectedFireDate,
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

// Lightweight variant for callers that only need the projected days-to-FIRE.
// Runs one projection series (default horizon) instead of the full view, which
// also skips chart data, milestone ETAs, and month summaries.
export function deriveProjectedFireDays(
  snapshot: FireSnapshot,
  date = todayIso(),
  scenarioOverride?: ProjectionScenario,
) {
  const goal = mainGoal(snapshot);
  const scenario = scenarioOverride ?? defaultScenario(snapshot);

  if (!goal) {
    throw new Error("Missing main FIRE goal");
  }

  const projection = projectionSeries({
    assets: snapshot.assets,
    quotes: snapshot.quoteCache,
    goal,
    scenario,
    startDate: date,
    initialFireAssetAdjustment: transactionCashflowNet(
      snapshot.transactions,
      date,
      goal.baseCurrency,
    ),
  });

  return daysToFire(projection, date);
}
