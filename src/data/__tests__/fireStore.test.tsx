import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { FireStoreProvider, useFireStore } from "../fireStore";
import { seedSnapshot } from "../seed";
import {
  SNAPSHOT_SCHEMA_VERSION,
  SNAPSHOT_STORAGE_KEY,
  type SnapshotStorage,
} from "../snapshotStorage";
import type { FireSnapshot } from "../../features/types";

type FireStore = ReturnType<typeof useFireStore>;

function failingStorage(): SnapshotStorage {
  return {
    getItem: jest.fn((key: string) =>
      key === SNAPSHOT_STORAGE_KEY
        ? JSON.stringify({ schemaVersion: SNAPSHOT_SCHEMA_VERSION, snapshot: seedSnapshot })
        : null,
    ),
    setItem: jest.fn(() => {
      throw new Error("disk full");
    }),
    removeItem: jest.fn(),
  };
}

function memoryStorage(initial: FireSnapshot | string = seedSnapshot) {
  const values = new Map<string, string>();
  values.set(
    SNAPSHOT_STORAGE_KEY,
    typeof initial === "string"
      ? initial
      : JSON.stringify({ schemaVersion: SNAPSHOT_SCHEMA_VERSION, snapshot: initial }),
  );
  const storage: SnapshotStorage = {
    getItem: jest.fn((key: string) => values.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => values.set(key, value)),
    removeItem: jest.fn((key: string) => values.delete(key)),
  };
  return { storage, values };
}

async function renderStore(storage: SnapshotStorage) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FireStoreProvider storage={storage}>{children}</FireStoreProvider>
  );
  return renderHook(() => useFireStore(), { wrapper });
}

async function renderFailingStore() {
  const storage = failingStorage();
  return { ...(await renderStore(storage)), storage };
}

async function expectRejectedMutation(mutate: (store: FireStore) => boolean) {
  const { result, storage, unmount } = await renderFailingStore();
  let persisted = true;

  await act(async () => {
    persisted = mutate(result.current);
  });

  expect(persisted).toBe(false);
  expect(result.current.snapshot).toEqual(seedSnapshot);
  expect(result.current.persistenceError).not.toBeNull();
  expect(storage.setItem).toHaveBeenCalled();
  await unmount();
}

describe("FireStore persistence-aware mutations", () => {
  it("rejects a transaction write without exposing unpersisted state", async () => {
    const transaction = seedSnapshot.transactions[0]!;

    await expectRejectedMutation((store) =>
      store.createTransaction({
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        currency: transaction.currency,
        date: transaction.date,
        note: "unsaved transaction",
        type: transaction.type,
      }),
    );
  });

  it("rejects a recurring write without exposing the transaction or schedule", async () => {
    const transaction = seedSnapshot.transactions[0]!;

    await expectRejectedMutation((store) =>
      store.createTransaction(
        {
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          currency: transaction.currency,
          date: transaction.date,
          note: "unsaved recurring transaction",
          type: transaction.type,
        },
        { frequency: "monthly" },
      ),
    );
  });

  it("rejects an asset write without exposing the draft asset", async () => {
    const asset = seedSnapshot.assets[0]!;

    await expectRejectedMutation((store) =>
      store.createAsset({
        archivedAt: null,
        assetClass: asset.assetClass,
        currency: asset.currency,
        exchange: asset.exchange ?? null,
        expectedAnnualReturn: asset.expectedAnnualReturn,
        googleFinanceSymbol: asset.googleFinanceSymbol ?? null,
        includeInFire: asset.includeInFire,
        manualValue: asset.manualValue ?? 0,
        name: "Unsaved asset",
        notes: asset.notes ?? null,
        quantity: asset.quantity ?? null,
        ticker: asset.ticker ?? null,
        typeId: asset.typeId,
        updateMethod: asset.updateMethod,
      }),
    );
  });

  it("rejects a FIRE-plan write without changing its assumptions", async () => {
    const goal = seedSnapshot.goals[0]!;

    await expectRejectedMutation((store) =>
      store.updateGoal(goal.id, { monthlySaving: goal.monthlySaving + 1000 }),
    );
  });

  it("keeps persisted and in-memory state aligned across representative domain actions", async () => {
    const { storage, values } = memoryStorage();
    const { result, unmount } = await renderStore(storage);
    const transaction = seedSnapshot.transactions[0]!;
    const asset = seedSnapshot.assets[0]!;
    const goal = seedSnapshot.goals[0]!;
    let categoryId = "";
    let assetId = "";
    let milestoneId = "";
    let scenarioId = "";
    let recurringId = "";

    await act(async () => {
      expect(
        result.current.createTransaction({
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          currency: transaction.currency,
          date: transaction.date,
          note: "persistence coverage",
          type: transaction.type,
        }),
      ).toBe(true);
    });
    const createdTransaction = result.current.snapshot.transactions.find(
      (entry) => entry.note === "persistence coverage",
    )!;
    await act(async () => {
      expect(result.current.updateTransaction(createdTransaction.id, { amount: 321 })).toBe(true);
      expect(result.current.archiveTransaction(createdTransaction.id)).toBe(true);
    });

    await act(async () => {
      const category = result.current.createCategory({
        color: "#445566",
        icon: "cash",
        isHidden: false,
        name: "Persistence category",
        order: 99,
        type: "expense",
      });
      expect(category).not.toBeNull();
      categoryId = category!.id;
    });
    await act(async () => {
      expect(result.current.updateCategory(categoryId, { name: "Updated category" })).toBe(true);
      expect(result.current.archiveCategory(categoryId)).toBe(true);
    });

    await act(async () => {
      expect(
        result.current.createAsset({
          archivedAt: null,
          assetClass: asset.assetClass,
          currency: asset.currency,
          exchange: asset.exchange ?? null,
          expectedAnnualReturn: asset.expectedAnnualReturn,
          googleFinanceSymbol: asset.googleFinanceSymbol ?? null,
          includeInFire: asset.includeInFire,
          manualValue: asset.manualValue ?? 0,
          name: "Persistence asset",
          notes: asset.notes ?? null,
          quantity: asset.quantity ?? null,
          ticker: asset.ticker ?? null,
          typeId: asset.typeId,
          updateMethod: asset.updateMethod,
        }),
      ).toBe(true);
    });
    assetId = result.current.snapshot.assets.find(
      (entry) => entry.name === "Persistence asset",
    )!.id;
    await act(async () => {
      expect(result.current.updateAsset(assetId, { manualValue: 654321 })).toBe(true);
      expect(result.current.archiveAsset(assetId)).toBe(true);
    });

    await act(async () => {
      const milestone = result.current.createMilestone({
        archivedAt: null,
        expectedReturnOverride: null,
        goalId: goal.id,
        isActive: true,
        isHidden: false,
        name: "Persistence milestone",
        order: 99,
        targetAmount: 2_000_000,
        targetDate: null,
      });
      expect(milestone).not.toBeNull();
      milestoneId = milestone!.id;
    });
    await act(async () => {
      expect(result.current.updateMilestone(milestoneId, { targetAmount: 2_100_000 })).toBe(true);
      expect(result.current.archiveMilestone(milestoneId)).toBe(true);
    });

    await act(async () => {
      const scenario = result.current.createScenario({
        archivedAt: null,
        expectedReturnAdjustment: 0,
        inflationAdjustment: 0,
        isDefault: false,
        monthlySavingAdjustment: 0,
        name: "Persistence scenario",
        targetSpendingAdjustment: 0,
        withdrawalRateAdjustment: 0,
      });
      expect(scenario).not.toBeNull();
      scenarioId = scenario!.id;
    });
    await act(async () => {
      expect(result.current.updateScenario(scenarioId, { monthlySavingAdjustment: 500 })).toBe(
        true,
      );
      expect(result.current.archiveScenario(scenarioId)).toBe(true);
      expect(result.current.updateGoal(goal.id, { monthlySaving: goal.monthlySaving + 1 })).toBe(
        true,
      );
    });

    await act(async () => {
      expect(
        result.current.createTransaction(
          {
            amount: 222,
            categoryId: transaction.categoryId,
            currency: transaction.currency,
            date: transaction.date,
            note: "recurring coverage",
            type: transaction.type,
          },
          { frequency: "monthly" },
        ),
      ).toBe(true);
    });
    recurringId = result.current.snapshot.recurringTransactions.find(
      (entry) => entry.note === "recurring coverage",
    )!.id;
    await act(async () => {
      expect(result.current.updateRecurringTransaction(recurringId, { amount: 333 })).toBe(true);
      expect(result.current.archiveRecurringTransaction(recurringId)).toBe(true);
      expect(result.current.updateQuoteSettings({ refreshIntervalMinutes: 60 })).toBe(true);
      expect(result.current.saveQuotes(seedSnapshot.quoteCache)).toBe(true);
      expect(result.current.setThemeMode("light")).toBe(true);
      expect(result.current.setHapticsEnabled(false)).toBe(true);
      expect(result.current.setFireCompanion("traveler_f")).toBe(true);
      expect(result.current.setFireDestination("beach")).toBe(true);
      expect(result.current.setCurrency("USD")).toBe(true);
      expect(result.current.setLanguage("zhHant")).toBe(true);
    });

    const persisted = JSON.parse(values.get(SNAPSHOT_STORAGE_KEY)!);
    expect(persisted.schemaVersion).toBe(SNAPSHOT_SCHEMA_VERSION);
    expect(persisted.snapshot).toEqual(result.current.snapshot);
    expect(
      result.current.snapshot.transactions.find((entry) => entry.id === createdTransaction.id),
    ).toMatchObject({ amount: 321, archivedAt: expect.any(String) });
    expect(
      result.current.snapshot.categories.find((entry) => entry.id === categoryId),
    ).toMatchObject({
      name: "Updated category",
      isHidden: true,
    });
    expect(result.current.snapshot.assets.find((entry) => entry.id === assetId)).toMatchObject({
      manualValue: 654321,
      archivedAt: expect.any(String),
    });
    expect(result.current.snapshot.language).toBe("zhHant");
    expect(result.current.persistenceError).toBeNull();
    await unmount();
  });

  it("does not announce or expose a reset that failed to persist", async () => {
    const { result, unmount } = await renderFailingStore();
    let persisted = true;

    await act(async () => {
      persisted = result.current.resetSeed();
    });

    expect(persisted).toBe(false);
    expect(result.current.snapshot).toEqual(seedSnapshot);
    expect(result.current.persistenceError).not.toBeNull();
    await unmount();
  });

  it("blocks mutations during recovery and resets only after the original payload is retained", async () => {
    const original = "{bad json";
    const { storage, values } = memoryStorage(original);
    const { result, unmount } = await renderStore(storage);

    expect(result.current.snapshotRecovery).toMatchObject({
      reason: "malformed_json",
      rawPayload: original,
      quarantinePersisted: true,
    });
    await act(async () => {
      expect(result.current.updateGoal(seedSnapshot.goals[0]!.id, { monthlySaving: 1 })).toBe(
        false,
      );
    });
    expect(values.get(SNAPSHOT_STORAGE_KEY)).toBe(original);

    await act(async () => {
      expect(result.current.resetSeed()).toBe(true);
    });
    expect(result.current.snapshotRecovery).toBeNull();
    expect(JSON.parse(values.get(SNAPSHOT_STORAGE_KEY)!)).toEqual({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      snapshot: seedSnapshot,
    });
    await unmount();
  });

  it("allows an empty corrupt payload to reset after it is quarantined", async () => {
    const { storage, values } = memoryStorage("");
    const { result, unmount } = await renderStore(storage);

    expect(result.current.snapshotRecovery).toMatchObject({
      reason: "malformed_json",
      rawPayload: "",
      quarantinePersisted: true,
    });

    await act(async () => {
      expect(result.current.resetSeed()).toBe(true);
    });

    expect(result.current.snapshotRecovery).toBeNull();
    expect(JSON.parse(values.get(SNAPSHOT_STORAGE_KEY)!)).toEqual({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      snapshot: seedSnapshot,
    });
    await unmount();
  });

  it("materializes newly due recurring entries when the app becomes active", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-29T08:00:00.000Z"));
    let appStateListener: ((state: AppStateStatus) => void) | undefined;
    const appStateSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, listener) => {
        appStateListener = listener;
        return { remove: jest.fn() };
      });
    const recurringSnapshot: FireSnapshot = {
      ...seedSnapshot,
      recurringTransactions: [
        {
          id: "rec-app-state",
          amount: 80,
          categoryId: "cat-food",
          currency: "HKD",
          frequency: "monthly",
          isActive: true,
          nextDate: "2026-08-30",
          note: "Due after resume",
          startDate: "2026-08-30",
          type: "expense",
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
    };
    const { storage } = memoryStorage(recurringSnapshot);
    const { result, unmount } = await renderStore(storage);

    expect(result.current.snapshot.transactions).toHaveLength(seedSnapshot.transactions.length);
    jest.setSystemTime(new Date("2026-08-30T08:00:00.000Z"));
    await act(async () => {
      appStateListener?.("active");
    });

    expect(
      result.current.snapshot.transactions.filter(
        (entry) => entry.recurringTransactionId === "rec-app-state",
      ),
    ).toHaveLength(1);
    expect(result.current.snapshot.recurringTransactions[0]!.nextDate).toBe("2026-09-30");
    await unmount();
    appStateSpy.mockRestore();
    jest.useRealTimers();
  });
});
