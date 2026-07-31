const AVERAGE_DAYS_PER_MONTH = 365.25 / 12;

export type TimeLensInputs = {
  monthlySaving: number;
  targetMonthlySpending: number;
};

export function monthsOfRequiredWork(amount: number, monthlySaving: number) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(monthlySaving) ||
    monthlySaving <= 0
  ) {
    return null;
  }

  return amount / monthlySaving;
}

export function freedomDaysFunded(amount: number, targetMonthlySpending: number) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(targetMonthlySpending) ||
    targetMonthlySpending <= 0
  ) {
    return null;
  }

  return (amount / targetMonthlySpending) * AVERAGE_DAYS_PER_MONTH;
}

export function requiredWorkDaysForExpense(amount: number, monthlySaving: number) {
  const months = monthsOfRequiredWork(amount, monthlySaving);
  return months === null ? null : months * AVERAGE_DAYS_PER_MONTH;
}

export function requiredWorkDaysReducedPerMonth(
  monthlySaving: number,
  targetMonthlySpending: number,
) {
  return freedomDaysFunded(monthlySaving, targetMonthlySpending);
}
