import { moneyTimeImpactPresentation } from "../moneyTimePresentation";

describe("moneyTimeImpactPresentation", () => {
  it("shows income-like FIRE time removed as a favorable negative day value", () => {
    expect(
      moneyTimeImpactPresentation(
        { impactDays: -41.24, baseDays: 1200, simulatedDays: 1158.76 },
        "en-US",
      ),
    ).toEqual({ tone: "positive", value: "−41", state: "days" });
  });

  it("shows expense-like FIRE time added as an unfavorable positive day value", () => {
    expect(
      moneyTimeImpactPresentation(
        { impactDays: 0.54, baseDays: 1200, simulatedDays: 1200.54 },
        "en-US",
      ),
    ).toEqual({ tone: "negative", value: "+0.54", state: "days" });
  });

  it("keeps a negligible impact neutral", () => {
    expect(
      moneyTimeImpactPresentation(
        { impactDays: -0.00001, baseDays: 1200, simulatedDays: 1200 },
        "en-US",
      ),
    ).toEqual({ tone: "neutral", value: "0", state: "days" });
  });

  it("distinguishes unavailable and out-of-range projections", () => {
    expect(
      moneyTimeImpactPresentation({ impactDays: 0, baseDays: null, simulatedDays: null }, "en-US")
        .state,
    ).toBe("unavailable");
    expect(
      moneyTimeImpactPresentation(
        { impactDays: Number.NEGATIVE_INFINITY, baseDays: null, simulatedDays: 800 },
        "en-US",
      ).state,
    ).toBe("in-range");
    expect(
      moneyTimeImpactPresentation(
        { impactDays: Number.POSITIVE_INFINITY, baseDays: 800, simulatedDays: null },
        "en-US",
      ).state,
    ).toBe("out-of-range");
    expect(
      moneyTimeImpactPresentation(
        { impactDays: Number.NaN, baseDays: 800, simulatedDays: 800 },
        "en-US",
      ),
    ).toEqual({ tone: "neutral", value: null, state: "unavailable" });
  });
});
