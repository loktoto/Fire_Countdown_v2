export function calendarLayout({ fontScale, width }: { fontScale: number; width: number }) {
  return {
    compactDayMetrics: width < 375 || fontScale > 1.15,
    stackSummary: width < 360 || fontScale > 1.15,
    stackTransactions: width < 390 || fontScale > 1.15,
  };
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
