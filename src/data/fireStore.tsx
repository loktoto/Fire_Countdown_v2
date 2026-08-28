import "expo-sqlite/localStorage/install";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { initializeDatabase } from "./database";
import { mergeQuoteCache } from "./quoteCache";
import { seedSnapshot } from "./seed";
import {
  readSnapshotFromStorage,
  type SnapshotStorage,
  writeSnapshotToStorage,
} from "./snapshotStorage";
import {
  materializeDueRecurringTransactions,
  recurringDateOnOrAfter,
  recurringScheduleFromTransaction,
} from "../features/recurring/recurringEngine";
import type {
  Asset,
  AssetQuoteCache,
  Category,
  FireGoal,
  FireSnapshot,
  Milestone,
  ProjectionScenario,
  QuoteBridgeSettings,
  RecurrenceFrequency,
  RecurringTransaction,
  Transaction,
} from "../features/types";

type FireStoreContextValue = {
  snapshot: FireSnapshot;
  persistenceError: { occurredAt: string } | null;
  dismissPersistenceError: () => void;
  resetSeed: () => boolean;
  createTransaction: (
    input: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
    recurrence?: { frequency: RecurrenceFrequency },
  ) => boolean;
  updateTransaction: (id: string, patch: Partial<Transaction>) => boolean;
  archiveTransaction: (id: string) => boolean;
  updateRecurringTransaction: (
    id: string,
    patch: Partial<Omit<RecurringTransaction, "id" | "createdAt" | "updatedAt">>,
  ) => boolean;
  archiveRecurringTransaction: (id: string) => boolean;
  createCategory: (input: Omit<Category, "id" | "createdAt" | "updatedAt">) => Category | null;
  archiveCategory: (id: string) => boolean;
  createAsset: (input: Omit<Asset, "id" | "createdAt" | "updatedAt">) => boolean;
  createMilestone: (input: Omit<Milestone, "id" | "createdAt" | "updatedAt">) => Milestone | null;
  createScenario: (
    input: Omit<ProjectionScenario, "id" | "createdAt" | "updatedAt">,
  ) => ProjectionScenario | null;
  archiveMilestone: (id: string) => boolean;
  archiveScenario: (id: string) => boolean;
  archiveAsset: (id: string) => boolean;
  updateAsset: (id: string, patch: Partial<Asset>) => boolean;
  updateCategory: (id: string, patch: Partial<Category>) => boolean;
  updateGoal: (id: string, patch: Partial<FireGoal>) => boolean;
  updateMilestone: (id: string, patch: Partial<Milestone>) => boolean;
  updateScenario: (id: string, patch: Partial<ProjectionScenario>) => boolean;
  updateQuoteSettings: (patch: Partial<QuoteBridgeSettings>) => boolean;
  saveQuotes: (quotes: AssetQuoteCache[]) => boolean;
  setThemeMode: (mode: FireSnapshot["themeMode"]) => boolean;
  setHapticsEnabled: (enabled: boolean) => boolean;
  setFireCompanion: (id: FireSnapshot["fireCompanionId"]) => boolean;
  setFireDestination: (id: FireSnapshot["fireDestinationId"]) => boolean;
  setCurrency: (currency: string) => boolean;
  setLanguage: (language: FireSnapshot["language"]) => boolean;
};

const FireStoreContext = createContext<FireStoreContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readMaterializedSnapshot(storage: SnapshotStorage) {
  const stored = readSnapshotFromStorage(storage);
  const materialized = materializeDueRecurringTransactions(stored, todayIso(), nowIso());
  if (materialized === stored) {
    return { snapshot: stored, persistenceError: null };
  }

  if (writeSnapshotToStorage(storage, materialized)) {
    return { snapshot: materialized, persistenceError: null };
  }

  return {
    snapshot: stored,
    persistenceError: { occurredAt: nowIso() },
  };
}

export function FireStoreProvider({
  children,
  storage = localStorage,
}: {
  children: React.ReactNode;
  storage?: SnapshotStorage;
}) {
  const [initialState] = useState(() => readMaterializedSnapshot(storage));
  const [snapshot, setSnapshot] = useState<FireSnapshot>(initialState.snapshot);
  const snapshotRef = useRef(initialState.snapshot);
  const [persistenceError, setPersistenceError] = useState<{ occurredAt: string } | null>(
    initialState.persistenceError,
  );

  useEffect(() => {
    void initializeDatabase().catch(() => {
      // The localStorage polyfill remains the source of truth if optional schema setup fails.
    });
  }, []);

  const commit = useCallback(
    (updater: (current: FireSnapshot) => FireSnapshot) => {
      const current = snapshotRef.current;
      const updated = updater(current);
      const next = materializeDueRecurringTransactions(updated, todayIso(), nowIso());
      if (next === current) {
        return true;
      }
      if (!writeSnapshotToStorage(storage, next)) {
        setPersistenceError({ occurredAt: nowIso() });
        return false;
      }

      snapshotRef.current = next;
      setSnapshot(next);
      setPersistenceError(null);
      return true;
    },
    [storage],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        commit((current) => current);
      }
    });
    return () => subscription.remove();
  }, [commit]);

  const value = useMemo<FireStoreContextValue>(
    () => ({
      snapshot,
      persistenceError,
      dismissPersistenceError: () => setPersistenceError(null),
      resetSeed: () => {
        if (!writeSnapshotToStorage(storage, seedSnapshot)) {
          setPersistenceError({ occurredAt: nowIso() });
          return false;
        }
        snapshotRef.current = seedSnapshot;
        setSnapshot(seedSnapshot);
        setPersistenceError(null);
        return true;
      },
      createTransaction: (input, recurrence) =>
        commit((current) => {
          const timestamp = nowIso();
          const transactionId = id("txn");
          const scheduleId = recurrence ? id("rec") : null;
          const transaction: Transaction = {
            ...input,
            id: transactionId,
            recurringTransactionId: scheduleId,
            recurrenceDate: scheduleId ? input.date : null,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          const recurringTransaction: RecurringTransaction | null = recurrence
            ? recurringScheduleFromTransaction({
                id: scheduleId!,
                transaction: input,
                frequency: recurrence.frequency,
                throughDate: todayIso(),
                createdAt: timestamp,
              })
            : null;

          return {
            ...current,
            transactions: [transaction, ...current.transactions],
            recurringTransactions: recurringTransaction
              ? [recurringTransaction, ...current.recurringTransactions]
              : current.recurringTransactions,
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
      updateRecurringTransaction: (recurringTransactionId, patch) =>
        commit((current) => ({
          ...current,
          recurringTransactions: current.recurringTransactions.map((schedule) => {
            if (schedule.id !== recurringTransactionId) {
              return schedule;
            }

            const timestamp = nowIso();
            const updated = { ...schedule, ...patch, updatedAt: timestamp };
            const timingChanged =
              patch.startDate !== undefined ||
              patch.frequency !== undefined ||
              (patch.isActive === true && !schedule.isActive);

            return timingChanged && updated.isActive
              ? {
                  ...updated,
                  nextDate: recurringDateOnOrAfter(
                    updated.startDate,
                    updated.frequency,
                    todayIso(),
                  ),
                }
              : updated;
          }),
        })),
      archiveRecurringTransaction: (recurringTransactionId) =>
        commit((current) => ({
          ...current,
          recurringTransactions: current.recurringTransactions.map((schedule) =>
            schedule.id === recurringTransactionId
              ? {
                  ...schedule,
                  isActive: false,
                  archivedAt: nowIso(),
                  updatedAt: nowIso(),
                }
              : schedule,
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
        const persisted = commit((current) => ({
          ...current,
          categories: [...current.categories, category],
        }));
        return persisted ? category : null;
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
        const persisted = commit((current) => ({
          ...current,
          milestones: [...current.milestones, milestone],
        }));
        return persisted ? milestone : null;
      },
      createScenario: (input) => {
        const timestamp = nowIso();
        const scenario = {
          ...input,
          id: id("scenario"),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const persisted = commit((current) => ({
          ...current,
          scenarios: [
            ...current.scenarios.map((entry) =>
              scenario.isDefault ? { ...entry, isDefault: false, updatedAt: timestamp } : entry,
            ),
            scenario,
          ],
        }));
        return persisted ? scenario : null;
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
      archiveAsset: (assetId) =>
        commit((current) => ({
          ...current,
          assets: current.assets.map((asset) =>
            asset.id === assetId ? { ...asset, archivedAt: nowIso(), updatedAt: nowIso() } : asset,
          ),
        })),
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
        commit((current) => {
          return {
            ...current,
            quoteCache: mergeQuoteCache(current.quoteCache, quotes),
            quoteSettings: {
              ...current.quoteSettings,
              lastRefreshAt: nowIso(),
              updatedAt: nowIso(),
            },
          };
        }),
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
      setFireCompanion: (fireCompanionId) =>
        commit((current) => ({
          ...current,
          fireCompanionId,
        })),
      setFireDestination: (fireDestinationId) =>
        commit((current) => ({
          ...current,
          fireDestinationId,
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
    [commit, persistenceError, snapshot, storage],
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
