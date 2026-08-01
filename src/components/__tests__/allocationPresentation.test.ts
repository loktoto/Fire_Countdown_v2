import { allocationPresentation } from "../allocationPresentation";

describe("allocation presentation", () => {
  it("filters empty and invalid values before assigning percentages", () => {
    expect(
      allocationPresentation([
        { label: "Cash", value: 0 },
        { label: "ETF", value: 75 },
        { label: "Broken", value: Number.NaN },
        { label: "Stock", value: 25 },
      ]),
    ).toEqual({
      total: 100,
      rows: [
        { label: "ETF", value: 75, percent: 0.75 },
        { label: "Stock", value: 25, percent: 0.25 },
      ],
    });
  });

  it("returns a genuine empty state rather than a synthetic 100 percent mix", () => {
    expect(allocationPresentation([])).toEqual({ total: 0, rows: [] });
  });
});
