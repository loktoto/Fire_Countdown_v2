import { shouldShowAssetNameError } from "../assetEditorPresentation";

describe("asset editor presentation", () => {
  it("keeps a new untouched name field neutral", () => {
    expect(shouldShowAssetNameError("", false)).toBe(false);
  });

  it("shows an error after an empty name field has been touched", () => {
    expect(shouldShowAssetNameError("   ", true)).toBe(true);
  });

  it("clears the error as soon as the user enters a name", () => {
    expect(shouldShowAssetNameError("Index fund", true)).toBe(false);
  });
});
