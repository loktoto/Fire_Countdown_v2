import {
  calendarActivityColorRole,
  calendarItemInteraction,
  calendarLayout,
  calendarNetColorRole,
  calendarSummaryColorRole,
  calendarTransactionColorRole,
  recurringScheduleRoute,
} from "../calendarPresentation";

describe("calendar presentation", () => {
  it("stacks transaction rows before content competes on narrow iPhones", () => {
    expect(calendarLayout({ width: 375, fontScale: 1 })).toEqual({
      compactDayMetrics: false,
      stackSummary: false,
      stackTransactions: true,
    });
    expect(calendarLayout({ width: 393, fontScale: 1 }).stackTransactions).toBe(false);
  });

  it("adapts the grid and summaries when the user chooses larger text", () => {
    expect(calendarLayout({ width: 430, fontScale: 1.2 })).toEqual({
      compactDayMetrics: true,
      stackSummary: true,
      stackTransactions: true,
    });
  });

  it("keeps zero-value summaries neutral until there is activity", () => {
    expect(calendarSummaryColorRole({ amount: 0, kind: "income" })).toBe("text");
    expect(calendarSummaryColorRole({ amount: 0, kind: "expense" })).toBe("text");
    expect(calendarSummaryColorRole({ amount: 5_000, kind: "income" })).toBe("positive");
    expect(calendarSummaryColorRole({ amount: 168, kind: "expense" })).toBe("negative");
    expect(calendarNetColorRole(0)).toBe("textMuted");
    expect(calendarNetColorRole(4_832)).toBe("positive");
    expect(calendarNetColorRole(-1_200)).toBe("negative");
  });

  it("keeps future transactions neutral until their FIRE execution date", () => {
    expect(calendarActivityColorRole({ hasIncome: true, hasExpense: false, isFuture: true })).toBe(
      "textTertiary",
    );
    expect(calendarActivityColorRole({ hasIncome: false, hasExpense: true, isFuture: true })).toBe(
      "textTertiary",
    );
    expect(calendarActivityColorRole({ hasIncome: true, hasExpense: true, isFuture: false })).toBe(
      "primary",
    );
    expect(calendarTransactionColorRole({ type: "income", isPendingFireImpact: true })).toBe(
      "textMuted",
    );
    expect(calendarTransactionColorRole({ type: "expense", isPendingFireImpact: true })).toBe(
      "textMuted",
    );
    expect(calendarTransactionColorRole({ type: "income", isPendingFireImpact: false })).toBe(
      "positive",
    );
    expect(calendarTransactionColorRole({ type: "expense", isPendingFireImpact: false })).toBe(
      "negative",
    );
  });

  it("routes projected rows to their recurring schedule and real rows to history editing", () => {
    expect(
      calendarItemInteraction({
        id: "projection-rec-salary-2026-09-03",
        isProjected: true,
        recurringTransactionId: "rec-salary",
      }),
    ).toEqual({ kind: "recurring", scheduleId: "rec-salary" });
    expect(
      calendarItemInteraction({
        id: "txn-rec-salary-2026-08-03",
        isProjected: false,
        recurringTransactionId: "rec-salary",
      }),
    ).toEqual({ kind: "transaction", transactionId: "txn-rec-salary-2026-08-03" });
    expect(recurringScheduleRoute("rec-salary")).toEqual({
      pathname: "/recurring",
      params: { scheduleId: "rec-salary" },
    });
  });
});
