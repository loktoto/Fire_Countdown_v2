import {
  calendarLayout,
  calendarNetColorRole,
  calendarSummaryColorRole,
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
});
