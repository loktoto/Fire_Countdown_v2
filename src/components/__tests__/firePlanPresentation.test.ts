import { fieldLabelWithUnit } from "../firePlanPresentation";

describe("FIRE plan presentation", () => {
  it("keeps numeric field units visible after a value replaces its placeholder", () => {
    expect(fieldLabelWithUnit("Monthly savings", "HKD")).toBe("Monthly savings (HKD)");
    expect(fieldLabelWithUnit("Inflation", "%")).toBe("Inflation (%)");
  });

  it("does not add empty unit punctuation", () => {
    expect(fieldLabelWithUnit("Method name")).toBe("Method name");
  });
});
