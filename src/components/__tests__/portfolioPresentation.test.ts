import { getPortfolioLayout, portfolioAssetColorRole } from "../portfolioPresentation";

describe("getPortfolioLayout", () => {
  it("stacks each asset's details and controls on a 393dp iPhone", () => {
    expect(getPortfolioLayout(393, 1)).toEqual({
      stackAssetRows: true,
      stackSectionHeaders: false,
      stackQuickActions: false,
    });
  });

  it("uses the same readable asset layout on a 411dp Android phone", () => {
    expect(getPortfolioLayout(411, 1)).toEqual({
      stackAssetRows: true,
      stackSectionHeaders: false,
      stackQuickActions: false,
    });
  });

  it("keeps the compact side-by-side layout on a tablet", () => {
    expect(getPortfolioLayout(768, 1)).toEqual({
      stackAssetRows: false,
      stackSectionHeaders: false,
      stackQuickActions: false,
    });
  });

  it("stacks dense controls for large text without changing the asset data", () => {
    expect(getPortfolioLayout(768, 1.3)).toEqual({
      stackAssetRows: true,
      stackSectionHeaders: true,
      stackQuickActions: true,
    });
  });

  it("keeps allocation colours separate from financial positive and negative semantics", () => {
    expect(portfolioAssetColorRole("etf")).toBe("chartEtf");
    expect(portfolioAssetColorRole("cash")).toBe("chartCash");
    expect(portfolioAssetColorRole("real_estate")).toBe("chartRealEstate");
    expect(portfolioAssetColorRole("stock")).toBe("chartBlue");
    expect(portfolioAssetColorRole("crypto")).toBe("chartCoral");
  });
});
