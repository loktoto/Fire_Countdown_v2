import { getThemeColors, resolveThemeMode } from "../theme";

describe("semantic theme colours", () => {
  it("uses the restrained neutral-first light palette", () => {
    const colors = getThemeColors("light");

    expect(colors.background).toBe("#F7F7F3");
    expect(colors.surface).toBe("#FCFDFB");
    expect(colors.surfaceElevated).toBe("#F0F3F0");
    expect(colors.surfaceBorder).toBe("#DDE3DF");
    expect(colors.text).toBe("#14211F");
    expect(colors.textMuted).toBe("#687773");
    expect(colors.textTertiary).toBe("#8D9995");
    expect(colors.disabled).toBe("#B8C0BD");
  });

  it("keeps brand, positive, negative, warning, and chart roles distinct in light mode", () => {
    const colors = getThemeColors("light");

    expect(colors.primary).toBe("#0B7F79");
    expect(colors.positive).toBe("#16865C");
    expect(colors.negative).toBe("#C94263");
    expect(colors.warning).toBe("#A76518");
    expect(colors.chartCash).toBe("#8091A7");
    expect(colors.chartRealEstate).toBe("#AE702A");
    expect(new Set([colors.primary, colors.positive, colors.negative, colors.warning]).size).toBe(
      4,
    );
  });

  it("uses layered navy neutrals instead of black and neon in dark mode", () => {
    const colors = getThemeColors("dark");

    expect(colors.background).toBe("#091117");
    expect(colors.surface).toBe("#111B23");
    expect(colors.surfaceElevated).toBe("#17232C");
    expect(colors.surfacePressed).toBe("#1D2B35");
    expect(colors.surfaceBorder).toBe("#28363F");
    expect(colors.primary).toBe("#59D4CD");
    expect(colors.positive).toBe("#63D6A4");
    expect(colors.negative).toBe("#FF718E");
    expect(colors.warning).toBe("#E6A653");
  });

  it("resolves System appearance without overriding explicit choices", () => {
    expect(resolveThemeMode("system", "dark")).toBe("dark");
    expect(resolveThemeMode("system", "light")).toBe("light");
    expect(resolveThemeMode("dark", "light")).toBe("dark");
    expect(resolveThemeMode("light", "dark")).toBe("light");
  });
});
