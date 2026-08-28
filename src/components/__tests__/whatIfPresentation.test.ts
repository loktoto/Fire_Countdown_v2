import { signedPercentChange, whatIfOutcome } from "../whatIfPresentation";

describe("whatIfOutcome", () => {
  it("distinguishes earlier, later, and unchanged projections", () => {
    expect(whatIfOutcome(-365, "2061-07-01", "2060-07-01")).toEqual({
      state: "earlier",
      tone: "positive",
      durationDays: 365,
    });
    expect(whatIfOutcome(31, "2061-07-01", "2061-08-01")).toEqual({
      state: "later",
      tone: "negative",
      durationDays: 31,
    });
    expect(whatIfOutcome(0.1, "2061-07-01", "2061-07-01").state).toBe("unchanged");
  });

  it("handles projections entering or leaving the forecast range", () => {
    expect(whatIfOutcome(Number.NEGATIVE_INFINITY, null, "2061-07-01").state).toBe("reachable");
    expect(whatIfOutcome(Number.POSITIVE_INFINITY, "2061-07-01", null).state).toBe("out-of-range");
    expect(whatIfOutcome(Number.NaN, null, null).state).toBe("unavailable");
  });
});

describe("signedPercentChange", () => {
  it("uses an explicit sign and normalizes tiny values", () => {
    expect(signedPercentChange(0.03)).toBe("+3.0%");
    expect(signedPercentChange(-0.02)).toBe("\u22122.0%");
    expect(signedPercentChange(-0.00001)).toBe("0.0%");
  });
});
