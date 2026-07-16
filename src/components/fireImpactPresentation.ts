export const FIRE_IMPACT_SCALE_MAX_PERCENT = 5;

export type FireImpactInput = {
  impactDays: number;
  baseDays: number | null;
  simulatedDays: number | null;
};

export type FireImpactPresentation = {
  absoluteDays: number;
  direction: -1 | 0 | 1;
  rawPercent: number;
  meterValue: number;
  moving: boolean;
};

export function fireImpactPresentation(
  amount: number,
  impact: FireImpactInput,
): FireImpactPresentation {
  const direction: -1 | 0 | 1 = impact.impactDays < 0 ? 1 : impact.impactDays > 0 ? -1 : 0;
  const rawPercent =
    impact.baseDays && impact.baseDays > 0 ? (-impact.impactDays / impact.baseDays) * 100 : 0;
  const moving = amount > 0 && direction !== 0;
  const percentDirection = rawPercent > 0 ? 1 : rawPercent < 0 ? -1 : 0;
  const normalizedPercent = Math.min(1, Math.abs(rawPercent) / FIRE_IMPACT_SCALE_MAX_PERCENT);
  const strength = Number.isFinite(rawPercent) ? Math.sqrt(normalizedPercent) : 1;

  return {
    absoluteDays: Number.isFinite(impact.impactDays)
      ? Math.abs(impact.impactDays)
      : Number.POSITIVE_INFINITY,
    direction,
    rawPercent,
    meterValue: moving ? percentDirection * strength : 0,
    moving,
  };
}

export function formatImpactDayValue(days: number, locale = "en-US") {
  const decimals = days < 0.01 ? 4 : days < 10 ? 2 : 1;
  return days.toLocaleString(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

export function formatImpactPercent(percent: number) {
  if (!Number.isFinite(percent)) {
    return percent > 0 ? ">100%" : "<-100%";
  }

  if (percent === 0) {
    return "0%";
  }

  const absolutePercent = Math.abs(percent);
  const decimals =
    absolutePercent < 0.0001 ? 6 : absolutePercent < 0.01 ? 4 : absolutePercent < 1 ? 3 : 2;
  const sign = percent > 0 ? "+" : "-";
  return `${sign}${absolutePercent.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  })}%`;
}
