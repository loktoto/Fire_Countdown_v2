import { seedSnapshot } from "./seed";
import type {
  Asset,
  AssetQuoteCache,
  AssetType,
  Category,
  FireGoal,
  FireSnapshot,
  Milestone,
  ProjectionScenario,
  QuoteBridgeSettings,
  Transaction,
} from "../features/types";

type UnknownRecord = Record<string, unknown>;

const assetClasses = new Set<Asset["assetClass"]>([
  "stock",
  "etf",
  "crypto",
  "cash",
  "bond",
  "real_estate",
  "pension",
  "private_investment",
  "business",
  "custom",
]);
const updateMethods = new Set<Asset["updateMethod"]>(["manual", "google_sheet_quote", "hybrid"]);
const quoteStatuses = new Set<AssetQuoteCache["status"]>([
  "ok",
  "delayed",
  "stale",
  "failed",
  "unsupported",
  "manual",
]);
const quoteSources = new Set<AssetQuoteCache["source"]>([
  "FREE_MARKET",
  "COINBASE",
  "TWELVE_DATA",
  "GOOGLEFINANCE",
  "MANUAL",
  "CACHE",
]);
const companionIds = new Set<FireSnapshot["fireCompanionId"]>(["traveler_m", "traveler_f"]);
const destinationIds = new Set<FireSnapshot["fireDestinationId"]>([
  "camp",
  "home",
  "beach",
  "mountain",
  "travel",
  "sunrise",
]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBaseEntity(value: UnknownRecord) {
  return isString(value.id) && isString(value.createdAt) && isString(value.updatedAt);
}

function isTransaction(value: unknown): value is Transaction {
  return (
    isRecord(value) &&
    isBaseEntity(value) &&
    (value.type === "expense" || value.type === "income") &&
    isFiniteNumber(value.amount) &&
    value.amount >= 0 &&
    isString(value.currency) &&
    isString(value.categoryId) &&
    isString(value.date) &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date)
  );
}

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    isBaseEntity(value) &&
    isString(value.name) &&
    (value.type === "expense" || value.type === "income") &&
    typeof value.isHidden === "boolean" &&
    isFiniteNumber(value.order)
  );
}

function isAssetType(value: unknown): value is AssetType {
  return (
    isRecord(value) &&
    isBaseEntity(value) &&
    isString(value.name) &&
    isFiniteNumber(value.defaultExpectedReturn) &&
    isString(value.defaultCurrency) &&
    typeof value.includeInFireByDefault === "boolean" &&
    typeof value.isCustom === "boolean" &&
    typeof value.isHidden === "boolean"
  );
}

function isAsset(value: unknown): value is Asset {
  return (
    isRecord(value) &&
    isBaseEntity(value) &&
    isString(value.typeId) &&
    isString(value.name) &&
    assetClasses.has(value.assetClass as Asset["assetClass"]) &&
    isString(value.currency) &&
    isFiniteNumber(value.expectedAnnualReturn) &&
    typeof value.includeInFire === "boolean" &&
    updateMethods.has(value.updateMethod as Asset["updateMethod"])
  );
}

function isQuote(value: unknown): value is AssetQuoteCache {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.assetId) &&
    isString(value.symbol) &&
    isFiniteNumber(value.price) &&
    value.price >= 0 &&
    isString(value.currency) &&
    isString(value.receivedAt) &&
    quoteSources.has(value.source as AssetQuoteCache["source"]) &&
    quoteStatuses.has(value.status as AssetQuoteCache["status"])
  );
}

function isGoal(value: unknown): value is FireGoal {
  return (
    isRecord(value) &&
    isBaseEntity(value) &&
    isString(value.name) &&
    isFiniteNumber(value.targetMonthlySpending) &&
    value.targetMonthlySpending >= 0 &&
    isFiniteNumber(value.withdrawalRate) &&
    value.withdrawalRate > 0 &&
    isFiniteNumber(value.inflationRate) &&
    value.inflationRate > -1 &&
    isFiniteNumber(value.monthlySaving) &&
    value.monthlySaving >= 0 &&
    isString(value.baseCurrency) &&
    typeof value.isMain === "boolean"
  );
}

function isMilestone(value: unknown): value is Milestone {
  return (
    isRecord(value) &&
    isBaseEntity(value) &&
    isString(value.goalId) &&
    isString(value.name) &&
    isFiniteNumber(value.targetAmount) &&
    value.targetAmount > 0 &&
    typeof value.isActive === "boolean" &&
    typeof value.isHidden === "boolean" &&
    isFiniteNumber(value.order)
  );
}

function isScenario(value: unknown): value is ProjectionScenario {
  return (
    isRecord(value) &&
    isBaseEntity(value) &&
    isString(value.name) &&
    isFiniteNumber(value.expectedReturnAdjustment) &&
    isFiniteNumber(value.inflationAdjustment) &&
    isFiniteNumber(value.monthlySavingAdjustment) &&
    isFiniteNumber(value.targetSpendingAdjustment) &&
    typeof value.isDefault === "boolean"
  );
}

function isQuoteSettings(value: unknown): value is UnknownRecord {
  return (
    isRecord(value) &&
    isString(value.id) &&
    typeof value.enabled === "boolean" &&
    isFiniteNumber(value.refreshIntervalMinutes) &&
    value.refreshIntervalMinutes > 0 &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function hydrateQuoteSettings(value: unknown): QuoteBridgeSettings {
  if (!isQuoteSettings(value)) {
    return seedSnapshot.quoteSettings;
  }

  const provider =
    value.provider === "custom_bridge"
      ? "custom_bridge"
      : value.provider === "free_market" || value.provider === "twelve_data"
        ? "free_market"
        : isString(value.scriptUrl) && value.scriptUrl.trim()
          ? "custom_bridge"
          : "free_market";

  return {
    id: String(value.id),
    enabled: value.enabled === true,
    provider,
    scriptUrl: isString(value.scriptUrl) ? value.scriptUrl : null,
    refreshIntervalMinutes: Number(value.refreshIntervalMinutes),
    lastRefreshAt: isString(value.lastRefreshAt) ? value.lastRefreshAt : null,
    createdAt: String(value.createdAt),
    updatedAt: String(value.updatedAt),
  };
}

function validItems<T>(value: unknown, guard: (item: unknown) => item is T, fallback: T[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.filter(guard);
}

function requiredItems<T>(value: unknown, guard: (item: unknown) => item is T, fallback: T[]) {
  const items = validItems(value, guard, fallback);
  return items.length > 0 ? items : fallback;
}

export function hydrateSnapshotPreferences(parsed: Partial<FireSnapshot>): FireSnapshot {
  const raw = isRecord(parsed) ? parsed : {};
  const currency =
    isString(raw.currency) && /^[A-Za-z]{3}$/.test(raw.currency.trim())
      ? raw.currency.trim().toUpperCase()
      : seedSnapshot.currency;

  return {
    transactions: validItems(raw.transactions, isTransaction, seedSnapshot.transactions),
    categories: validItems(raw.categories, isCategory, seedSnapshot.categories),
    assetTypes: requiredItems(raw.assetTypes, isAssetType, seedSnapshot.assetTypes),
    assets: validItems(raw.assets, isAsset, seedSnapshot.assets),
    quoteCache: validItems(raw.quoteCache, isQuote, seedSnapshot.quoteCache),
    goals: requiredItems(raw.goals, isGoal, seedSnapshot.goals),
    milestones: validItems(raw.milestones, isMilestone, seedSnapshot.milestones),
    scenarios: requiredItems(raw.scenarios, isScenario, seedSnapshot.scenarios),
    quoteSettings: hydrateQuoteSettings(raw.quoteSettings),
    themeMode: raw.themeMode === "light" || raw.themeMode === "dark" ? raw.themeMode : "dark",
    hapticsEnabled: typeof raw.hapticsEnabled === "boolean" ? raw.hapticsEnabled : true,
    fireCompanionId: companionIds.has(raw.fireCompanionId as FireSnapshot["fireCompanionId"])
      ? (raw.fireCompanionId as FireSnapshot["fireCompanionId"])
      : "traveler_m",
    fireDestinationId: destinationIds.has(
      raw.fireDestinationId as FireSnapshot["fireDestinationId"],
    )
      ? (raw.fireDestinationId as FireSnapshot["fireDestinationId"])
      : "camp",
    currency,
    language: raw.language === "zhHant" ? "zhHant" : "en",
  };
}
