import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { FireStoreProvider, useFireStore } from "../fireStore";
import { seedSnapshot } from "../seed";
import type { SnapshotStorage } from "../snapshotStorage";

type FireStore = ReturnType<typeof useFireStore>;

function failingStorage(): SnapshotStorage {
  return {
    getItem: jest.fn(() => JSON.stringify(seedSnapshot)),
    setItem: jest.fn(() => {
      throw new Error("disk full");
    }),
  };
}

async function renderFailingStore() {
  const storage = failingStorage();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FireStoreProvider storage={storage}>{children}</FireStoreProvider>
  );
  return { ...(await renderHook(() => useFireStore(), { wrapper })), storage };
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
});
