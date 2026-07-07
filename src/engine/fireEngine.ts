import type {
  Asset,
  AssetQuoteCache,
  FireGoal,
  Milestone,
  ProjectionScenario,
  Transaction,
} from "../features/types";

export type AssetValueResolution = {
  assetId: string;
  value: number;
  currency: string;
  source: "quote" | "manual" | "manual_fallback" | "none";
  status: string;
};

export type ProjectionPoint = {
  monthIndex: number;
  date: string;
  projectedAssets: number;
  fireTarget: number;
  reached: boolean;
};

const dayMs = 24 * 60 * 60 * 1000;

function activeTransactions(transactions: Transaction[]) {
  return transactions.filter((transaction) => !transaction.archivedAt);
}

function latestQuote(assetId: string, quotes: AssetQuoteCache[]) {
  return quotes
    .filter((quote) => quote.assetId === assetId)
    .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))[0];
}

function normalizeCurrency(currency?: string | null) {
  return (currency ?? "").trim().toUpperCase();
}

function convertedQuotePrice(quote: AssetQuoteCache, baseCurrency: string) {
  const base = normalizeCurrency(baseCurrency);
  const quoteCurrency = normalizeCurrency(quote.currency);
  const convertedCurrency = normalizeCurrency(quote.convertedCurrency);

  if (quote.convertedPrice && convertedCurrency === base) {
    return quote.convertedPrice;
  }

  if (quote.fxRate && quote.fxRate > 0 && quoteCurrency !== base) {
    return quote.price * quote.fxRate;
  }

  if (quoteCurrency === base) {
    return quote.price;
  }

  return null;
}

function isoMonthDate(startDate: string, monthIndex: number) {
  const date = new Date(`${startDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + monthIndex);
  return date.toISOString().slice(0, 10);
}

export function dailyNet(transactions: Transaction[], date: string) {
  return activeTransactions(transactions)
    .filter((transaction) => transaction.date === date)
    .reduce(
      (total, transaction) =>
        transaction.type === "income" ? total + transaction.amount : total - transaction.amount,
      0,
    );
}

export function monthlySummary(transactions: Transaction[], year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return activeTransactions(transactions)
    .filter((transaction) => transaction.date.startsWith(prefix))
    .reduce(
      (summary, transaction) => {
        if (transaction.type === "income") {
          summary.income += transaction.amount;
        } else {
          summary.expense += transaction.amount;
        }
        summary.net = summary.income - summary.expense;
        return summary;
      },
      { income: 0, expense: 0, net: 0 },
    );
}

export function resolveAssetValue(
  asset: Asset,
  quotes: AssetQuoteCache[],
  baseCurrency = asset.currency,
): AssetValueResolution {
  const quote = latestQuote(asset.id, quotes);
  const manualValue = asset.manualValue ?? 0;
  const resolvedCurrency = normalizeCurrency(baseCurrency) || normalizeCurrency(asset.currency);

  if (asset.updateMethod === "manual") {
    return {
      assetId: asset.id,
      value: manualValue,
      currency: normalizeCurrency(asset.currency) || resolvedCurrency,
      source: "manual",
      status: "manual",
    };
  }

  if (quote?.price && asset.quantity) {
    const price = convertedQuotePrice(quote, resolvedCurrency);

    if (price) {
      return {
        assetId: asset.id,
        value: price * asset.quantity,
        currency: resolvedCurrency,
        source: "quote",
        status: quote.status,
      };
    }

    if (manualValue > 0) {
      return {
        assetId: asset.id,
        value: manualValue,
        currency: normalizeCurrency(asset.currency) || resolvedCurrency,
        source: "manual_fallback",
        status: "fx_missing",
      };
    }

    return {
      assetId: asset.id,
      value: 0,
      currency: resolvedCurrency,
      source: "none",
      status: "fx_missing",
    };
  }

  if (manualValue > 0) {
    return {
      assetId: asset.id,
      value: manualValue,
      currency: normalizeCurrency(asset.currency) || resolvedCurrency,
      source: "manual_fallback",
      status: "manual",
    };
  }

  return {
    assetId: asset.id,
    value: 0,
    currency: resolvedCurrency,
    source: "none",
    status: "missing",
  };
}

export function totalAssets(assets: Asset[], quotes: AssetQuoteCache[], baseCurrency?: string) {
  return assets
    .filter((asset) => !asset.archivedAt)
    .reduce((total, asset) => total + resolveAssetValue(asset, quotes, baseCurrency).value, 0);
}

export function includedFireAssets(
  assets: Asset[],
  quotes: AssetQuoteCache[],
  baseCurrency?: string,
) {
  return assets
    .filter((asset) => !asset.archivedAt && asset.includeInFire)
    .reduce((total, asset) => total + resolveAssetValue(asset, quotes, baseCurrency).value, 0);
}

export function transactionCashflowNet(transactions: Transaction[]) {
  return activeTransactions(transactions).reduce(
    (total, transaction) =>
      transaction.type === "income" ? total + transaction.amount : total - transaction.amount,
    0,
  );
}

export function weightedExpectedReturn(
  assets: Asset[],
  quotes: AssetQuoteCache[],
  baseCurrency?: string,
) {
  const included = assets.filter((asset) => !asset.archivedAt && asset.includeInFire);
  const denominator = included.reduce(
    (total, asset) => total + resolveAssetValue(asset, quotes, baseCurrency).value,
    0,
  );

  if (denominator <= 0) {
    return 0;
  }

  return (
    included.reduce((total, asset) => {
      const value = resolveAssetValue(asset, quotes, baseCurrency).value;
      return total + value * asset.expectedAnnualReturn;
    }, 0) / denominator
  );
}

export function fireTarget(goal: FireGoal, scenario?: ProjectionScenario) {
  const spending = goal.targetMonthlySpending + (scenario?.targetSpendingAdjustment ?? 0);
  const withdrawalRate = goal.withdrawalRate + (scenario?.withdrawalRateAdjustment ?? 0);
  return (spending * 12) / Math.max(withdrawalRate, 0.001);
}

export function projectionSeries(input: {
  assets: Asset[];
  quotes: AssetQuoteCache[];
  goal: FireGoal;
  scenario?: ProjectionScenario;
  startDate?: string;
  months?: number;
  initialFireAssetAdjustment?: number;
  postFireWithdrawal?: boolean;
}): ProjectionPoint[] {
  const months = input.months ?? 600;
  const startDate = input.startDate ?? new Date().toISOString().slice(0, 10);
  const scenario = input.scenario;
  const annualReturn = Math.max(
    -0.95,
    weightedExpectedReturn(input.assets, input.quotes, input.goal.baseCurrency) +
      (scenario?.expectedReturnAdjustment ?? 0),
  );
  const monthlyExpectedReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const monthlyInflationRate =
    Math.pow(1 + input.goal.inflationRate + (scenario?.inflationAdjustment ?? 0), 1 / 12) - 1;
  const monthlySaving = Math.max(
    0,
    input.goal.monthlySaving + (scenario?.monthlySavingAdjustment ?? 0),
  );
  const monthlyRetirementSpending = Math.max(
    0,
    input.goal.targetMonthlySpending + (scenario?.targetSpendingAdjustment ?? 0),
  );
  const baseTarget = fireTarget(input.goal, scenario);
  let projectedAssets =
    includedFireAssets(input.assets, input.quotes, input.goal.baseCurrency) +
    (input.initialFireAssetAdjustment ?? 0);
  let hasReachedFire = projectedAssets >= baseTarget;

  return Array.from({ length: months + 1 }, (_, monthIndex) => {
    const target = baseTarget * Math.pow(1 + monthlyInflationRate, monthIndex);

    if (monthIndex > 0) {
      if (input.postFireWithdrawal && hasReachedFire) {
        const growthBase = Math.max(0, projectedAssets);
        const balanceAfterGrowth = growthBase + growthBase * monthlyExpectedReturn;
        const inflatedWithdrawal =
          monthlyRetirementSpending * Math.pow(1 + monthlyInflationRate, monthIndex);
        projectedAssets = Math.max(0, balanceAfterGrowth - inflatedWithdrawal);
      } else {
        const growthBase = Math.max(0, projectedAssets);
        projectedAssets = projectedAssets + growthBase * monthlyExpectedReturn + monthlySaving;
      }
    }

    const reached = projectedAssets >= target;
    if (reached) {
      hasReachedFire = true;
    }

    return {
      monthIndex,
      date: isoMonthDate(startDate, monthIndex),
      projectedAssets,
      fireTarget: target,
      reached,
    };
  });
}

export function daysToFire(series: ProjectionPoint[], startDate: string) {
  const reached = series.find((point) => point.reached);
  if (!reached) {
    return null;
  }

  const reachedIndex = series.indexOf(reached);
  if (reachedIndex <= 0) {
    return Math.max(0, (Date.parse(reached.date) - Date.parse(startDate)) / dayMs);
  }

  const previous = series[reachedIndex - 1]!;
  const previousGap = previous.projectedAssets - previous.fireTarget;
  const reachedGap = reached.projectedAssets - reached.fireTarget;
  const gapClosed = reachedGap - previousGap;
  const crossingRatio = gapClosed === 0 ? 1 : Math.min(1, Math.max(0, -previousGap / gapClosed));
  const previousTime = Date.parse(previous.date);
  const reachedTime = Date.parse(reached.date);
  const crossingTime = previousTime + (reachedTime - previousTime) * crossingRatio;

  return Math.max(0, (crossingTime - Date.parse(startDate)) / dayMs);
}

function estimatedDaysToFire(series: ProjectionPoint[], startDate: string) {
  const exactDays = daysToFire(series, startDate);
  if (exactDays !== null) {
    return exactDays;
  }

  if (series.length < 2) {
    return null;
  }

  const last = series[series.length - 1]!;
  const windowStartIndex = Math.max(0, series.length - 25);
  const first = series[windowStartIndex]!;
  const monthSpan = last.monthIndex - first.monthIndex;
  if (monthSpan <= 0) {
    return null;
  }

  const firstGap = first.projectedAssets - first.fireTarget;
  const lastGap = last.projectedAssets - last.fireTarget;
  const monthlyGapChange = (lastGap - firstGap) / monthSpan;
  if (lastGap >= 0 || monthlyGapChange <= 0) {
    return null;
  }

  const extraMonths = Math.abs(lastGap) / monthlyGapChange;
  const projectedDays = (Date.parse(last.date) - Date.parse(startDate)) / dayMs;
  return Math.max(0, projectedDays + extraMonths * (365.2425 / 12));
}

function crossingGapClosurePerDay(series: ProjectionPoint[]) {
  const reached = series.find((point) => point.reached);
  if (!reached) {
    return null;
  }

  const reachedIndex = series.indexOf(reached);
  if (reachedIndex <= 0) {
    return null;
  }

  const previous = series[reachedIndex - 1]!;
  const previousGap = previous.projectedAssets - previous.fireTarget;
  const reachedGap = reached.projectedAssets - reached.fireTarget;
  const gapClosed = reachedGap - previousGap;
  const days = (Date.parse(reached.date) - Date.parse(previous.date)) / dayMs;

  if (gapClosed <= 0 || days <= 0) {
    return null;
  }

  return gapClosed / days;
}

export function milestoneETAs(input: { milestones: Milestone[]; projection: ProjectionPoint[] }) {
  return input.milestones
    .filter((milestone) => milestone.isActive && !milestone.isHidden && !milestone.archivedAt)
    .sort((a, b) => a.order - b.order)
    .map((milestone) => {
      const reached = input.projection.find(
        (point) => point.projectedAssets >= milestone.targetAmount,
      );
      return {
        ...milestone,
        estimatedDate: reached?.date ?? null,
        isReached: Boolean(reached && reached.monthIndex === 0),
      };
    });
}

export function progressPercent(
  assets: Asset[],
  quotes: AssetQuoteCache[],
  goal: FireGoal,
  initialFireAssetAdjustment = 0,
  scenario?: ProjectionScenario,
) {
  const target = fireTarget(goal, scenario);
  if (target <= 0) {
    return 0;
  }
  return Math.min(
    1,
    Math.max(
      0,
      includedFireAssets(assets, quotes, goal.baseCurrency) + initialFireAssetAdjustment,
    ) / target,
  );
}

export function todayActualImpact(transactions: Transaction[], today: string) {
  return dailyNet(transactions, today);
}

export function transactionPreviewImpact(input: {
  transactions: Transaction[];
  draft: Pick<Transaction, "amount" | "categoryId" | "currency" | "date" | "type">;
  assets: Asset[];
  quotes: AssetQuoteCache[];
  goal: FireGoal;
  scenario?: ProjectionScenario;
  startDate?: string;
  months?: number;
}) {
  const startDate = input.startDate ?? new Date().toISOString().slice(0, 10);
  const months = input.months ?? 2400;
  const savedTransactionDelta = transactionCashflowNet(input.transactions);
  const draftDelta = input.draft.type === "income" ? input.draft.amount : -input.draft.amount;
  const baseSeries = projectionSeries({
    assets: input.assets,
    quotes: input.quotes,
    goal: input.goal,
    scenario: input.scenario,
    startDate,
    initialFireAssetAdjustment: savedTransactionDelta,
    months,
  });

  const simulatedSeries = projectionSeries({
    assets: input.assets,
    quotes: input.quotes,
    goal: input.goal,
    scenario: input.scenario,
    startDate,
    initialFireAssetAdjustment: savedTransactionDelta + draftDelta,
    months,
  });

  const baseDays = estimatedDaysToFire(baseSeries, startDate);
  let simulatedDays = estimatedDaysToFire(simulatedSeries, startDate);

  if (baseDays !== null && simulatedDays === null && draftDelta < 0) {
    const dailyGapClosure = crossingGapClosurePerDay(baseSeries);
    if (dailyGapClosure !== null) {
      simulatedDays = baseDays + Math.abs(draftDelta) / dailyGapClosure;
    }
  }

  if (baseDays === null && simulatedDays === null) {
    return { impactDays: 0, baseDays, simulatedDays };
  }

  if (baseDays === null) {
    return { impactDays: Number.NEGATIVE_INFINITY, baseDays, simulatedDays };
  }

  if (simulatedDays === null) {
    return { impactDays: Number.POSITIVE_INFINITY, baseDays, simulatedDays };
  }

  return {
    impactDays: simulatedDays - baseDays,
    baseDays,
    simulatedDays,
  };
}
