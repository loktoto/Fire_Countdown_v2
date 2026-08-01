import { categoryColorPresentation, contrastRatio } from "../categoryColorPresentation";

describe("categoryColorPresentation", () => {
  it.each([
    ["#FF6B88", "#FAFAF6"],
    ["#57D49B", "#FAFAF6"],
    ["#F8C94E", "#FAFAF6"],
    ["#8777E8", "#182028"],
  ])("keeps category symbols and selected labels legible for %s", (color, surface) => {
    const presentation = categoryColorPresentation(color, surface);

    expect(
      contrastRatio(presentation.foregroundColor, presentation.backgroundColor),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(presentation.foregroundColor, surface)).toBeGreaterThanOrEqual(3);
  });

  it("keeps an already legible accent unchanged", () => {
    expect(categoryColorPresentation("#57D49B", "#182028").foregroundColor).toBe("#57D49B");
  });
});
