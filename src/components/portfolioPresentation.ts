import type { Asset } from "../features/types";

export type PortfolioLayout = {
  stackAssetRows: boolean;
  stackSectionHeaders: boolean;
  stackQuickActions: boolean;
};

export type AssetChartColorRole =
  | "chartEtf"
  | "chartCash"
  | "chartRealEstate"
  | "chartBlue"
  | "chartCoral"
  | "chartSage"
  | "textTertiary";

export function portfolioAssetColorRole(assetClass: Asset["assetClass"]): AssetChartColorRole {
  switch (assetClass) {
    case "cash":
      return "chartCash";
    case "etf":
      return "chartEtf";
    case "real_estate":
      return "chartRealEstate";
    case "stock":
    case "bond":
      return "chartBlue";
    case "crypto":
    case "private_investment":
      return "chartCoral";
    case "pension":
    case "business":
      return "chartSage";
    case "custom":
      return "textTertiary";
  }
}

export function getPortfolioLayout(width: number, fontScale: number): PortfolioLayout {
  return {
    stackAssetRows: width < 430 || fontScale > 1.15,
    stackSectionHeaders: width < 340 || fontScale > 1.25,
    stackQuickActions: width < 340 || fontScale > 1.18,
  };
}
