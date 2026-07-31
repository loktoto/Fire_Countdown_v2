export type DashboardLayout = {
  stackForecast: boolean;
  stackForecastStats: boolean;
  stackCashflowStats: boolean;
  stackSectionHeader: boolean;
  stackAssumptions: boolean;
};

export type FireDuration = {
  years: number;
  months: number;
};

export function getDashboardLayout(width: number, fontScale: number): DashboardLayout {
  return {
    stackForecast: width < 430 || fontScale > 1.2,
    stackForecastStats: width < 430 || fontScale > 1.18,
    stackCashflowStats: width < 350 || fontScale > 1.18,
    stackSectionHeader: width < 340 || fontScale > 1.25,
    stackAssumptions: width < 360 || fontScale > 1.18,
  };
}

export function fireDurationFromDays(days: number | null): FireDuration | null {
  if (days === null || !Number.isFinite(days)) {
    return null;
  }

  const totalMonths = Math.max(0, Math.round((days * 12) / 365.25));

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}
