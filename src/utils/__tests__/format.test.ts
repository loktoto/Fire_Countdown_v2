import {
  addIsoDays,
  addIsoMonths,
  daysBetweenIso,
  daysInIsoMonth,
  formatLogDateChipLabel,
  formatLogDateLabel,
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
});
