import {
  addIsoDays,
  addIsoMonths,
  daysBetweenIso,
  daysInIsoMonth,
  formatLogDateChipLabel,
  formatLogDateLabel,
  formatCompactDateInputLabel,
  formatDateInputLabel,
  formatMonthYear,
  percent,
  signedMoney,
} from "../format";

describe("date formatting helpers", () => {
  it("moves ISO dates across month boundaries", () => {
    expect(addIsoDays("2026-06-30", -1)).toBe("2026-06-29");
    expect(addIsoDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addIsoDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("counts calendar days between ISO dates", () => {
    expect(daysBetweenIso("2026-06-29", "2026-06-30")).toBe(1);
    expect(daysBetweenIso("2026-06-30", "2026-06-29")).toBe(-1);
  });

  it("handles leap-year month lengths", () => {
    expect(daysInIsoMonth("2028-02-15")).toBe(29);
    expect(daysInIsoMonth("2026-02-15")).toBe(28);
  });

  it("moves ISO dates across months and clamps overflow days", () => {
    expect(addIsoMonths("2026-06-15", 1)).toBe("2026-07-15");
    expect(addIsoMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addIsoMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addIsoMonths("2026-01-31", -1)).toBe("2025-12-31");
  });

  it("labels today and yesterday for Log", () => {
    expect(formatLogDateLabel("2026-06-30", "2026-06-30")).toBe("Today");
    expect(formatLogDateLabel("2026-06-29", "2026-06-30")).toBe("Yesterday");
    expect(formatLogDateChipLabel("2026-06-29", "2026-06-30")).toBe("Yday");
  });

  it("keeps zero financial values neutral", () => {
    expect(signedMoney(120, "HKD")).toBe("+HKD 120");
    expect(signedMoney(-120, "HKD")).toBe("-HKD 120");
    expect(signedMoney(0, "HKD")).toBe("HKD 0");
  });

  it("does not display negative zero percentages", () => {
    expect(percent(-0.00001)).toBe("0.0%");
    expect(percent(-0.001)).toBe("-0.1%");
  });

  it("formats projected months for people instead of storage keys", () => {
    expect(formatMonthYear("2027-12-01", "en-US")).toBe("December 2027");
  });

  it("formats editable dates as readable, locale-aware labels", () => {
    expect(formatDateInputLabel("2026-07-23", "en-US")).toBe("Thu, Jul 23, 2026");
    expect(formatDateInputLabel("2026-07-23", "zh-Hant")).toContain("2026");
  });

  it("keeps the Log date compact while retaining years when they matter", () => {
    expect(formatCompactDateInputLabel("2026-08-01", "en-US", "2026-08-01")).toBe("Aug 1");
    expect(formatCompactDateInputLabel("2026-07-31", "en-US", "2026-08-01")).toBe("Jul 31, 2026");
    expect(formatCompactDateInputLabel("2027-01-02", "en-US", "2026-08-01")).toBe("Jan 2, 2027");
  });
});
