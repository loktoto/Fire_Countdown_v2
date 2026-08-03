import { fieldLabelWithUnit, optionalCurrentAgeFromText } from "../firePlanPresentation";

describe("FIRE plan presentation", () => {
  it("keeps numeric field units visible after a value replaces its placeholder", () => {
    expect(fieldLabelWithUnit("Monthly savings", "HKD")).toBe("Monthly savings (HKD)");
    expect(fieldLabelWithUnit("Inflation", "%")).toBe("Inflation (%)");
  });

  it("does not add empty unit punctuation", () => {
    expect(fieldLabelWithUnit("Method name")).toBe("Method name");
  });

  it.each([
    ["", null],
    ["   ", null],
    ["0", undefined],
    ["1", 1],
    ["120", 120],
    ["121", undefined],
  ])("parses optional current age %p as %p", (value, expected) => {
    expect(optionalCurrentAgeFromText(value)).toBe(expected);
  });

  it("preserves the existing whole-year normalization for decimal ages", () => {
    expect(optionalCurrentAgeFromText("31.9")).toBe(31);
  });
});
