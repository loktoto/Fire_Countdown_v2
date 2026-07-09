import "expo-sqlite/localStorage/install";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { initializeDatabase } from "./database";
import { seedSnapshot } from "./seed";
import type {
  Asset,
  AssetQuoteCache,
  Category,
  FireGoal,
  FireSnapshot,
  Milestone,
  ProjectionScenario,
  QuoteBridgeSettings,
  Transaction,
} from "../features/types";

const STORAGE_KEY = "fire-countdown-v2:snapshot";

type FireStoreContextValue = {
  snapshot: FireSnapshot;
  resetSeed: () => void;
  createTransaction: (input: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  archiveTransaction: (id: string) => void;
  createCategory: (input: Omit<Category, "id" | "createdAt" | "updatedAt">) => Category;
  archiveCategory: (id: string) => void;
  createAsset: (input: Omit<Asset, "id" | "createdAt" | "updatedAt">) => void;
  createMilestone: (input: Omit<Milestone, "id" | "createdAt" | "updatedAt">) => Milestone;
  createScenario: (
    input: Omit<ProjectionScenario, "id" | "createdAt" | "updatedAt">,
  ) => ProjectionScenario;
  archiveMilestone: (id: string) => void;
  archiveScenario: (id: string) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  updateGoal: (id: string, patch: Partial<FireGoal>) => void;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  updateScenario: (id: string, patch: Partial<ProjectionScenario>) => void;
  updateQuoteSettings: (patch: Partial<QuoteBridgeSettings>) => void;
  saveQuotes: (quotes: AssetQuoteCache[]) => void;
  setThemeMode: (mode: FireSnapshot["themeMode"]) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setCurrency: (currency: string) => void;
  setLanguage: (language: FireSnapshot["language"]) => void;
};

const FireStoreContext = createContext<FireStoreContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readSnapshot(): FireSnapshot {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return seedSnapshot;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<FireSnapshot>;
    return {
      ...seedSnapshot,
      ...parsed,
      hapticsEnabled: parsed.hapticsEnabled ?? true,
    } as FireSnapshot;
  } catch {
    return seedSnapshot;
  }
}

export function FireStoreProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<FireSnapshot>(() => readSnapshot());

  useEffect(() => {
    void initializeDatabase();
  }, []);

  const commit = useCallback((updater: (current: FireSnapshot) => FireSnapshot) => {
    setSnapshot((current) => {
      const next = updater(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<FireStoreContextValue>(
    () => ({
      snapshot,
      resetSeed: () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSnapshot));
        setSnapshot(seedSnapshot);
      },
      createTransaction: (input) =>
        commit((current) => {
          const timestamp = nowIso();
          return {
            ...current,
            transactions: [
              {
                ...input,
                id: id("txn"),
                createdAt: timestamp,
                updatedAt: timestamp,
              },
              ...current.transactions,
            ],
          };
        }),
      updateTransaction: (transactionId, patch) =>
        commit((current) => ({
          ...current,
          transactions: current.transactions.map((transaction) =>
            transaction.id === transactionId
              ? { ...transaction, ...patch, updatedAt: nowIso() }
              : transaction,
          ),
        })),
      archiveTransaction: (transactionId) =>
        commit((current) => ({
          ...current,
          transactions: current.transactions.map((transaction) =>
            transaction.id === transactionId
              ? { ...transaction, archivedAt: nowIso(), updatedAt: nowIso() }
              : transaction,
          ),
        })),
      createCategory: (input) => {
        const timestamp = nowIso();
        const category = {
          ...input,
          id: id("cat"),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        commit((current) => ({
          ...current,
          categories: [...current.categories, category],
        }));
        return category;
      },
      archiveCategory: (categoryId) =>
        commit((current) => ({
          ...current,
          categories: current.categories.map((category) =>
            category.id === categoryId
              ? { ...category, isHidden: true, archivedAt: nowIso(), updatedAt: nowIso() }
              : category,
          ),
        })),
      createAsset: (input) =>
        commit((current) => {
          const timestamp = nowIso();
          return {
            ...current,
            assets: [
              {
                ...input,
                id: id("asset"),
                createdAt: timestamp,
                updatedAt: timestamp,
              },
              ...current.assets,
            ],
          };
        }),
      createMilestone: (input) => {
        const timestamp = nowIso();
        const milestone = {
          ...input,
          id: id("milestone"),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        commit((current) => ({
          ...current,
          milestones: [...current.milestones, milestone],
        }));
        return milestone;
      },
      createScenario: (input) => {
        const timestamp = nowIso();
        const scenario = {
          ...input,
          id: id("scenario"),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        commit((current) => ({
          ...current,
          scenarios: [
            ...current.scenarios.map((entry) =>
              scenario.isDefault ? { ...entry, isDefault: false, updatedAt: timestamp } : entry,
            ),
            scenario,
          ],
        }));
        return scenario;
      },
      archiveMilestone: (milestoneId) =>
        commit((current) => ({
          ...current,
          milestones: current.milestones.map((milestone) =>
            milestone.id === milestoneId
              ? { ...milestone, isActive: false, archivedAt: nowIso(), updatedAt: nowIso() }
              : milestone,
          ),
        })),
      archiveScenario: (scenarioId) =>
        commit((current) => {
          const timestamp = nowIso();
          const scenario = current.scenarios.find((entry) => entry.id === scenarioId);
          const remaining = current.scenarios.filter(
            (entry) => entry.id !== scenarioId && !entry.archivedAt,
          );
          const nextDefaultId =
            scenario?.isDefault && remaining.length > 0
              ? (remaining.find((entry) => entry.isDefault)?.id ?? remaining[0]?.id)
              : null;

          return {
            ...current,
            scenarios: current.scenarios.map((entry) => {
              if (entry.id === scenarioId) {
                return {
                  ...entry,
                  archivedAt: timestamp,
                  isDefault: false,
                  updatedAt: timestamp,
                };
              }

              if (nextDefaultId && entry.id === nextDefaultId) {
                return { ...entry, isDefault: true, updatedAt: timestamp };
              }

              return entry;
            }),
          };
        }),
      updateAsset: (assetId, patch) =>
        commit((current) => ({
          ...current,
          assets: current.assets.map((asset) =>
            asset.id === assetId ? { ...asset, ...patch, updatedAt: nowIso() } : asset,
          ),
        })),
      updateCategory: (categoryId, patch) =>
        commit((current) => ({
          ...current,
          categories: current.categories.map((category) =>
            category.id === categoryId ? { ...category, ...patch, updatedAt: nowIso() } : category,
          ),
        })),
      updateGoal: (goalId, patch) =>
        commit((current) => ({
          ...current,
          goals: current.goals.map((goal) =>
            goal.id === goalId ? { ...goal, ...patch, updatedAt: nowIso() } : goal,
          ),
        })),
      updateMilestone: (milestoneId, patch) =>
        commit((current) => ({
          ...current,
          milestones: current.milestones.map((milestone) =>
            milestone.id === milestoneId
              ? { ...milestone, ...patch, updatedAt: nowIso() }
              : milestone,
          ),
        })),
      updateScenario: (scenarioId, patch) =>
        commit((current) => {
          const timestamp = nowIso();
          const targetScenario = current.scenarios.find((scenario) => scenario.id === scenarioId);
          const activeAlternatives = current.scenarios.filter(
            (scenario) => scenario.id !== scenarioId && !scenario.archivedAt,
          );
          const fallbackDefaultId =
            patch.isDefault === false && targetScenario?.isDefault
              ? (activeAlternatives.find((scenario) => scenario.isDefault)?.id ??
                activeAlternatives[0]?.id)
              : null;

          return {
            ...current,
            scenarios: current.scenarios.map((scenario) => {
              if (scenario.id === scenarioId) {
                return {
                  ...scenario,
                  ...patch,
                  isDefault:
                    patch.isDefault === false && targetScenario?.isDefault && !fallbackDefaultId
                      ? true
                      : (patch.isDefault ?? scenario.isDefault),
                  updatedAt: timestamp,
                };
              }

              if (patch.isDefault) {
                return { ...scenario, isDefault: false, updatedAt: timestamp };
              }

              if (fallbackDefaultId && scenario.id === fallbackDefaultId) {
                return { ...scenario, isDefault: true, updatedAt: timestamp };
              }

              return scenario;
            }),
          };
        }),
      updateQuoteSettings: (patch) =>
        commit((current) => ({
          ...current,
          quoteSettings: {
            ...current.quoteSettings,
            ...patch,
            updatedAt: nowIso(),
          },
        })),
      saveQuotes: (quotes) =>
        commit((current) => ({
          ...current,
          quoteCache: [
            ...quotes,
            ...current.quoteCache.filter((quote) => quote.source !== "CACHE"),
          ],
          quoteSettings: {
            ...current.quoteSettings,
            lastRefreshAt: nowIso(),
            updatedAt: nowIso(),
          },
        })),
      setThemeMode: (mode) =>
        commit((current) => ({
          ...current,
          themeMode: mode,
        })),
      setHapticsEnabled: (enabled) =>
        commit((current) => ({
          ...current,
          hapticsEnabled: enabled,
        })),
      setCurrency: (currency) =>
        commit((current) => {
          const nextCurrency = currency.trim().toUpperCase().slice(0, 3) || current.currency;
          const timestamp = nowIso();

          return {
            ...current,
            currency: nextCurrency,
            goals: current.goals.map((goal) => ({
              ...goal,
              baseCurrency: nextCurrency,
              updatedAt: timestamp,
            })),
          };
        }),
      setLanguage: (language) =>
        commit((current) => ({
          ...current,
          language,
        })),
    }),
    [commit, snapshot],
  );

  return <FireStoreContext.Provider value={value}>{children}</FireStoreContext.Provider>;
}

export function useFireStore() {
  const context = useContext(FireStoreContext);
  if (!context) {
    throw new Error("useFireStore must be used inside FireStoreProvider");
  }
  return context;
}
