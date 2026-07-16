export type TransactionType = "expense" | "income";
export type UpdateMethod = "manual" | "google_sheet_quote" | "hybrid";
export type QuoteStatus = "ok" | "delayed" | "stale" | "failed" | "unsupported" | "manual";
export type QuoteProvider = "free_market" | "custom_bridge";
export type FireCompanionId = "traveler_m" | "traveler_f";
export type FireDestinationId = "camp" | "home" | "beach" | "mountain" | "travel" | "sunrise";

export type BaseEntity = {
  id: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type Transaction = BaseEntity & {
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string;
  date: string;
  note?: string | null;
};

export type Category = BaseEntity & {
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
  isHidden: boolean;
  order: number;
};

export type AssetClass =
  | "stock"
  | "etf"
  | "crypto"
  | "cash"
  | "bond"
  | "real_estate"
  | "pension"
  | "private_investment"
  | "business"
  | "custom";

export type AssetType = BaseEntity & {
  name: string;
  icon?: string | null;
  defaultExpectedReturn: number;
  defaultCurrency: string;
  includeInFireByDefault: boolean;
  isCustom: boolean;
  isHidden: boolean;
};

export type Asset = BaseEntity & {
  typeId: string;
  name: string;
  assetClass: AssetClass;
  ticker?: string | null;
  exchange?: string | null;
  googleFinanceSymbol?: string | null;
  quantity?: number | null;
  manualValue?: number | null;
  currency: string;
  expectedAnnualReturn: number;
  includeInFire: boolean;
  updateMethod: UpdateMethod;
  notes?: string | null;
};

export type AssetQuoteCache = {
  id: string;
  assetId: string;
  symbol: string;
  price: number;
  currency: string;
  convertedPrice?: number | null;
  convertedCurrency?: string | null;
  fxRate?: number | null;
  asOf?: string | null;
  receivedAt: string;
  source: "FREE_MARKET" | "COINBASE" | "TWELVE_DATA" | "GOOGLEFINANCE" | "MANUAL" | "CACHE";
  status: QuoteStatus;
  delayMinutes?: number | null;
  change?: number | null;
  changePercent?: number | null;
  marketOpen?: boolean | null;
  raw?: string | null;
};

export type FireGoal = BaseEntity & {
  name: string;
  currentAge?: number | null;
  targetAmount?: number | null;
  targetMonthlySpending: number;
  withdrawalRate: number;
  inflationRate: number;
  monthlySaving: number;
  baseCurrency: string;
  isMain: boolean;
};

export type Milestone = BaseEntity & {
  goalId: string;
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  expectedReturnOverride?: number | null;
  isActive: boolean;
  isHidden: boolean;
  order: number;
};

export type ProjectionScenario = BaseEntity & {
  name: string;
  expectedReturnAdjustment: number;
  inflationAdjustment: number;
  withdrawalRateAdjustment?: number;
  monthlySavingAdjustment: number;
  targetSpendingAdjustment: number;
  isDefault: boolean;
};

export type QuoteBridgeSettings = {
  id: string;
  enabled: boolean;
  provider: QuoteProvider;
  scriptUrl?: string | null;
  refreshIntervalMinutes: number;
  lastRefreshAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FireSnapshot = {
  transactions: Transaction[];
  categories: Category[];
  assetTypes: AssetType[];
  assets: Asset[];
  quoteCache: AssetQuoteCache[];
  goals: FireGoal[];
  milestones: Milestone[];
  scenarios: ProjectionScenario[];
  quoteSettings: QuoteBridgeSettings;
  themeMode: "dark" | "light";
  hapticsEnabled: boolean;
  fireCompanionId: FireCompanionId;
  fireDestinationId: FireDestinationId;
  currency: string;
  language: "en" | "zhHant";
};
