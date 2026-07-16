import { fireImpactPresentation, formatImpactPercent } from "../fireImpactPresentation";

const baseImpact = {
  baseDays: 1000,
  simulatedDays: 1000,
};

describe("fireImpactPresentation", () => {
  it("keeps the companion centered without an amount", () => {
    expect(fireImpactPresentation(0, { ...baseImpact, impactDays: -50 }).meterValue).toBe(0);
  });

  it.each([
    { days: -25, expected: Math.SQRT1_2 },
    { days: 25, expected: -Math.SQRT1_2 },
    { days: -50, expected: 1 },
    { days: 50, expected: -1 },
    { days: -1000, expected: 1 },
    { days: 1000, expected: -1 },
  ])("maps $days days to $expected on the perceptual five-percent track", ({ days, expected }) => {
    expect(fireImpactPresentation(100, { ...baseImpact, impactDays: days }).meterValue).toBe(
      expected,
    );
  });

  it("keeps a very small non-zero impact visually legible", () => {
    const result = fireImpactPresentation(100, { ...baseImpact, impactDays: -0.2 });

    expect(result.rawPercent).toBeCloseTo(0.02);
    expect(result.meterValue).toBeCloseTo(Math.sqrt(0.02 / 5));
  });

  it("preserves the exact percentage label above the clamped track", () => {
    const result = fireImpactPresentation(100, { ...baseImpact, impactDays: -250 });
    expect(result.meterValue).toBe(1);
    expect(formatImpactPercent(result.rawPercent)).toBe("+25.00%");
  });
});
