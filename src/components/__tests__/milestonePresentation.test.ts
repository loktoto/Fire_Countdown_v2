import {
  milestoneProgressValues,
  shouldStackMilestoneCards,
  shouldStackMilestoneSummary,
} from "../milestonePresentation";

describe("milestone presentation", () => {
  it("shows progress against the active milestone while retaining segment and full-path progress", () => {
    expect(
      milestoneProgressValues({
        activeTarget: 900_000,
        currentAmount: 561_395,
        maxTarget: 1_700_000,
        previousTarget: 450_000,
      }),
    ).toEqual({
      active: 561_395 / 900_000,
      journey: 561_395 / 1_700_000,
      stage: (561_395 - 450_000) / (900_000 - 450_000),
    });
  });

  it("gives iPhone-width summaries and larger text a readable stacked layout", () => {
    expect(shouldStackMilestoneSummary(393, 1)).toBe(true);
    expect(shouldStackMilestoneSummary(430, 1)).toBe(false);
    expect(shouldStackMilestoneSummary(430, 1.2)).toBe(true);
    expect(shouldStackMilestoneCards(393, 1)).toBe(false);
    expect(shouldStackMilestoneCards(350, 1)).toBe(true);
  });
});
