export function calendarLayout({ fontScale, width }: { fontScale: number; width: number }) {
  return {
    compactDayMetrics: width < 375 || fontScale > 1.15,
    stackSummary: width < 360 || fontScale > 1.15,
    stackTransactions: width < 390 || fontScale > 1.15,
  };
}

export type CalendarItemInteraction =
  { kind: "transaction"; transactionId: string } | { kind: "recurring"; scheduleId: string };

export function recurringScheduleRoute(scheduleId: string) {
  return {
    pathname: "/recurring" as const,
    params: { scheduleId },
  };
}

export function calendarItemInteraction(item: {
  id: string;
  isProjected: boolean;
  recurringTransactionId?: string | null;
}): CalendarItemInteraction {
  if (item.isProjected && item.recurringTransactionId) {
    return { kind: "recurring", scheduleId: item.recurringTransactionId };
  }

  return { kind: "transaction", transactionId: item.id };
}

export function calendarSummaryColorRole({
  amount,
  kind,
}: {
  amount: number;
  kind: "income" | "expense";
}): "text" | "positive" | "negative" {
  if (amount === 0) return "text";
  return kind === "income" ? "positive" : "negative";
}

export function calendarNetColorRole(amount: number): "textMuted" | "positive" | "negative" {
  if (amount === 0) return "textMuted";
  return amount > 0 ? "positive" : "negative";
}

export function calendarActivityColorRole({
  hasExpense,
  hasIncome,
  isFuture,
}: {
  hasExpense: boolean;
  hasIncome: boolean;
  isFuture: boolean;
}): "textTertiary" | "primary" | "positive" | "negative" {
  if (isFuture) return "textTertiary";
  if (hasIncome && hasExpense) return "primary";
  return hasIncome ? "positive" : "negative";
}

export function calendarTransactionColorRole({
  isPendingFireImpact,
  type,
}: {
  isPendingFireImpact: boolean;
  type: "income" | "expense";
}): "textMuted" | "positive" | "negative" {
  if (isPendingFireImpact) return "textMuted";
  return type === "income" ? "positive" : "negative";
}
