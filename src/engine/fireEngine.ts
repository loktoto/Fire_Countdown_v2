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

type ProjectionInput = {
  assets: Asset[];
  quotes: AssetQuoteCache[];
  goal: FireGoal;
  scenario?: ProjectionScenario;
  startDate?: string;
  months?: number;
  initialFireAssetAdjustment?: number;
  postFireWithdrawal?: boolean;
};

type ProjectionRuntime = {
  months: number;
  startDate: string;
  monthlyExpectedReturn: number;
  monthlyInflationRate: number;
  monthlySaving: number;
  monthlyRetirementSpending: number;
  baseTarget: number;
  projectedAssets: number;
  hasReachedFire: boolean;
  postFireWithdrawal: boolean;
};

const dayMs = 24 * 60 * 60 * 1000;

function finiteNumber(value: number | null | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function activeTransactions(transactions: Transaction[]) {
  return transactions.filter((transaction) => !transaction.archivedAt);
}

function latestQuote(assetId: string, quotes: AssetQuoteCache[]) {
  let latest: AssetQuoteCache | undefined;
  let latestTime = Number.NEGATIVE_INFINITY;

  quotes.forEach((quote) => {
    if (quote.assetId !== assetId) {
      return;
    }

    const receivedAt = Date.parse(quote.receivedAt);
    if (receivedAt > latestTime) {
      latest = quote;
      latestTime = receivedAt;
    }
  });

  return latest;
}

function latestQuotesByAsset(quotes: AssetQuoteCache[]) {
  const latest = new Map<string, AssetQuoteCache>();
  const latestTimes = new Map<string, number>();

  quotes.forEach((quote) => {
    const receivedAt = Date.parse(quote.receivedAt);
    const currentTime = latestTimes.get(quote.assetId) ?? Number.NEGATIVE_INFINITY;
    if (receivedAt > currentTime) {
      latest.set(quote.assetId, quote);
      latestTimes.set(quote.assetId, receivedAt);
    }
  });

  return latest;
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

export function isoMonthDate(startDate: string, monthIndex: number) {
  const date = new Date(`${startDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return startDate;
  }

  const anchorDay = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthIndex, 1));
  const lastDayOfTargetMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(anchorDay, lastDayOfTargetMonth));
  return target.toISOString().slice(0, 10);
}

function matchesCurrency(transaction: Transaction, currency?: string) {
  return !currency || normalizeCurrency(transaction.currency) === normalizeCurrency(currency);
}

export function dailyNet(transactions: Transaction[], date: string, currency?: string) {
  return activeTransactions(transactions)
    .filter((transaction) => transaction.date === date && matchesCurrency(transaction, currency))
    .reduce(
      (total, transaction) =>
        transaction.type === "income" ? total + transaction.amount : total - transaction.amount,
      0,
    );
}

export function monthlySummary(
  transactions: Transaction[],
  year: number,
  month: number,
  currency?: string,
) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return activeTransactions(transactions)
    .filter(
      (transaction) =>
        transaction.date.startsWith(prefix) && matchesCurrency(transaction, currency),
    )
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

function resolveAssetValueFromQuote(
  asset: Asset,
  quote: AssetQuoteCache | undefined,
  baseCurrency = asset.currency,
): AssetValueResolution {
  const manualValue = Math.max(0, finiteNumber(asset.manualValue));
  const quantity = finiteNumber(asset.quantity);
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

  if (quote && Number.isFinite(quote.price) && quote.price > 0 && quantity > 0) {
    const price = convertedQuotePrice(quote, resolvedCurrency);

    if (price) {
      return {
        assetId: asset.id,
        value: price * quantity,
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

export function resolveAssetValue(
  asset: Asset,
  quotes: AssetQuoteCache[],
  baseCurrency = asset.currency,
): AssetValueResolution {
  return resolveAssetValueFromQuote(asset, latestQuote(asset.id, quotes), baseCurrency);
}

export function totalAssets(assets: Asset[], quotes: AssetQuoteCache[], baseCurrency?: string) {
  const latestQuotes = latestQuotesByAsset(quotes);
  let total = 0;

  assets.forEach((asset) => {
    if (asset.archivedAt) {
      return;
    }

    const resolution = resolveAssetValueFromQuote(asset, latestQuotes.get(asset.id), baseCurrency);
    if (
      !baseCurrency ||
      normalizeCurrency(resolution.currency) === normalizeCurrency(baseCurrency)
    ) {
      total += resolution.value;
    }
  });

  return total;
}

export function includedFireAssets(
  assets: Asset[],
  quotes: AssetQuoteCache[],
  baseCurrency?: string,
) {
  const latestQuotes = latestQuotesByAsset(quotes);
  let total = 0;

  assets.forEach((asset) => {
    if (asset.archivedAt || !asset.includeInFire) {
      return;
    }

    const resolution = resolveAssetValueFromQuote(asset, latestQuotes.get(asset.id), baseCurrency);
    if (
      !baseCurrency ||
      normalizeCurrency(resolution.currency) === normalizeCurrency(baseCurrency)
    ) {
      total += resolution.value;
    }
  });

  return total;
}

export function transactionCashflowNet(
  transactions: Transaction[],
  throughDate?: string,
  currency?: string,
) {
  return activeTransactions(transactions)
    .filter(
      (transaction) =>
        (!throughDate || transaction.date <= throughDate) && matchesCurrency(transaction, currency),
    )
    .reduce(
      (total, transaction) =>
        transaction.type === "income"
          ? total + finiteNumber(transaction.amount)
          : total - finiteNumber(transaction.amount),
      0,
    );
}

export function weightedExpectedReturn(
  assets: Asset[],
  quotes: AssetQuoteCache[],
  baseCurrency?: string,
) {
  const latestQuotes = latestQuotesByAsset(quotes);
  let denominator = 0;
  let weightedTotal = 0;

  assets.forEach((asset) => {
    if (asset.archivedAt || !asset.includeInFire) {
      return;
    }

    const resolution = resolveAssetValueFromQuote(asset, latestQuotes.get(asset.id), baseCurrency);
    if (
      baseCurrency &&
      normalizeCurrency(resolution.currency) !== normalizeCurrency(baseCurrency)
    ) {
      return;
    }
    const value = resolution.value;
    denominator += value;
    weightedTotal += value * finiteNumber(asset.expectedAnnualReturn);
  });

  if (denominator <= 0) {
    return 0;
  }

  return weightedTotal / denominator;
}

export function fireTarget(goal: FireGoal, scenario?: ProjectionScenario) {
  const spending = Math.max(
    0,
    finiteNumber(goal.targetMonthlySpending) + finiteNumber(scenario?.targetSpendingAdjustment),
  );
  const withdrawalRate =
    finiteNumber(goal.withdrawalRate) + finiteNumber(scenario?.withdrawalRateAdjustment);
  return (spending * 12) / Math.max(withdrawalRate, 0.001);
}

function createProjectionRuntime(input: ProjectionInput): ProjectionRuntime {
  const months = input.months ?? 600;
  const startDate = input.startDate ?? new Date().toISOString().slice(0, 10);
  const scenario = input.scenario;
  const annualReturn = Math.min(
    10,
    Math.max(
      -0.95,
      weightedExpectedReturn(input.assets, input.quotes, input.goal.baseCurrency) +
        finiteNumber(scenario?.expectedReturnAdjustment),
    ),
  );
  const monthlyExpectedReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const annualInflation = Math.min(
    10,
    Math.max(
      -0.95,
      finiteNumber(input.goal.inflationRate) + finiteNumber(scenario?.inflationAdjustment),
    ),
  );
  const monthlyInflationRate = Math.pow(1 + annualInflation, 1 / 12) - 1;
  const monthlySaving = Math.max(
    0,
    finiteNumber(input.goal.monthlySaving) + finiteNumber(scenario?.monthlySavingAdjustment),
  );
  const monthlyRetirementSpending = Math.max(
    0,
    finiteNumber(input.goal.targetMonthlySpending) +
      finiteNumber(scenario?.targetSpendingAdjustment),
  );
  const baseTarget = fireTarget(input.goal, scenario);
  const projectedAssets =
    includedFireAssets(input.assets, input.quotes, input.goal.baseCurrency) +
    (input.initialFireAssetAdjustment ?? 0);

  return {
    months,
    startDate,
    monthlyExpectedReturn,
    monthlyInflationRate,
    monthlySaving,
    monthlyRetirementSpending,
    baseTarget,
    projectedAssets,
    hasReachedFire: projectedAssets >= baseTarget,
    postFireWithdrawal: Boolean(input.postFireWithdrawal),
  };
}

function nextProjectionPoint(runtime: ProjectionRuntime, monthIndex: number): ProjectionPoint {
  const target = runtime.baseTarget * Math.pow(1 + runtime.monthlyInflationRate, monthIndex);

  if (monthIndex > 0) {
    if (runtime.postFireWithdrawal && runtime.hasReachedFire) {
      const growthBase = Math.max(0, runtime.projectedAssets);
      const balanceAfterGrowth = growthBase + growthBase * runtime.monthlyExpectedReturn;
      const inflatedWithdrawal =
        runtime.monthlyRetirementSpending * Math.pow(1 + runtime.monthlyInflationRate, monthIndex);
      runtime.projectedAssets = Math.max(0, balanceAfterGrowth - inflatedWithdrawal);
    } else {
      const growthBase = Math.max(0, runtime.projectedAssets);
      runtime.projectedAssets =
        runtime.projectedAssets +
        growthBase * runtime.monthlyExpectedReturn +
        runtime.monthlySaving;
    }
  }

  const reached = runtime.projectedAssets >= target;
  if (reached) {
    runtime.hasReachedFire = true;
  }

  return {
    monthIndex,
    date: isoMonthDate(runtime.startDate, monthIndex),
    projectedAssets: runtime.projectedAssets,
    fireTarget: target,
    reached,
  };
}

export function projectionSeries(input: ProjectionInput): ProjectionPoint[] {
  const runtime = createProjectionRuntime(input);
  return Array.from({ length: runtime.months + 1 }, (_, monthIndex) =>
    nextProjectionPoint(runtime, monthIndex),
  );
}

function interpolateDaysToFire(
  previous: ProjectionPoint,
  reached: ProjectionPoint,
  startDate: string,
) {
  const previousGap = previous.projectedAssets - previous.fireTarget;
  const reachedGap = reached.projectedAssets - reached.fireTarget;
  const gapClosed = reachedGap - previousGap;
  const crossingRatio = gapClosed === 0 ? 1 : Math.min(1, Math.max(0, -previousGap / gapClosed));
  const previousTime = Date.parse(previous.date);
  const reachedTime = Date.parse(reached.date);
  const crossingTime = previousTime + (reachedTime - previousTime) * crossingRatio;

  return Math.max(0, (crossingTime - Date.parse(startDate)) / dayMs);
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
  return interpolateDaysToFire(previous, reached, startDate);
}

function gapClosurePerDay(previous: ProjectionPoint, reached: ProjectionPoint) {
  const previousGap = previous.projectedAssets - previous.fireTarget;
  const reachedGap = reached.projectedAssets - reached.fireTarget;
  const gapClosed = reachedGap - previousGap;
  const days = (Date.parse(reached.date) - Date.parse(previous.date)) / dayMs;

  if (gapClosed <= 0 || days <= 0) {
    return null;
  }

  return gapClosed / days;
}

function estimateDaysToFire(input: ProjectionInput) {
  const runtime = createProjectionRuntime(input);
  let previous: ProjectionPoint | null = null;
  const trailingWindow: ProjectionPoint[] = [];

  for (let monthIndex = 0; monthIndex <= runtime.months; monthIndex += 1) {
    const point = nextProjectionPoint(runtime, monthIndex);
    trailingWindow.push(point);
    if (trailingWindow.length > 25) {
      trailingWindow.shift();
    }

    if (point.reached) {
      if (!previous) {
        return {
          days: Math.max(0, (Date.parse(point.date) - Date.parse(runtime.startDate)) / dayMs),
          crossingGapClosurePerDay: null,
        };
      }

      return {
        days: interpolateDaysToFire(previous, point, runtime.startDate),
        crossingGapClosurePerDay: gapClosurePerDay(previous, point),
      };
    }

    previous = point;
  }

  if (trailingWindow.length < 2) {
    return { days: null, crossingGapClosurePerDay: null };
  }

  const first = trailingWindow[0]!;
  const last = trailingWindow[trailingWindow.length - 1]!;
  const monthSpan = last.monthIndex - first.monthIndex;
  if (monthSpan <= 0) {
    return { days: null, crossingGapClosurePerDay: null };
  }

  const firstGap = first.projectedAssets - first.fireTarget;
  const lastGap = last.projectedAssets - last.fireTarget;
  const monthlyGapChange = (lastGap - firstGap) / monthSpan;
  if (lastGap >= 0 || monthlyGapChange <= 0) {
    return { days: null, crossingGapClosurePerDay: null };
  }

  const extraMonths = Math.abs(lastGap) / monthlyGapChange;
  const projectedDays = (Date.parse(last.date) - Date.parse(runtime.startDate)) / dayMs;

  return {
    days: Math.max(0, projectedDays + extraMonths * (365.2425 / 12)),
    crossingGapClosurePerDay: null,
  };
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

export function todayActualImpact(transactions: Transaction[], today: string, currency?: string) {
  return dailyNet(transactions, today, currency);
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
  const savedTransactionDelta = transactionCashflowNet(
    input.transactions,
    startDate,
    input.goal.baseCurrency,
  );
  const draftAmount = finiteNumber(input.draft.amount);
  const draftDelta =
    input.draft.date <= startDate &&
    normalizeCurrency(input.draft.currency) === normalizeCurrency(input.goal.baseCurrency)
      ? input.draft.type === "income"
        ? draftAmount
        : -draftAmount
      : 0;
  const baseEstimate = estimateDaysToFire({
    assets: input.assets,
    quotes: input.quotes,
    goal: input.goal,
    scenario: input.scenario,
    startDate,
    initialFireAssetAdjustment: savedTransactionDelta,
    months,
  });

  const simulatedEstimate = estimateDaysToFire({
    assets: input.assets,
    quotes: input.quotes,
    goal: input.goal,
    scenario: input.scenario,
    startDate,
    initialFireAssetAdjustment: savedTransactionDelta + draftDelta,
    months,
  });

  const baseDays = baseEstimate.days;
  let simulatedDays = simulatedEstimate.days;

  if (baseDays !== null && simulatedDays === null && draftDelta < 0) {
    const dailyGapClosure = baseEstimate.crossingGapClosurePerDay;
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
