import { act, renderHook } from "@testing-library/react-native";

import { useFireStore } from "../../data/fireStore";
import { seedSnapshot } from "../../data/seed";
import { useRecurringViewModel } from "../useRecurringViewModel";

jest.mock("../../data/fireStore", () => ({ useFireStore: jest.fn() }));

const useFireStoreMock = useFireStore as jest.Mock;

describe("recurring cashflow workflow", () => {
  it("sorts active schedules first and derives a base-currency monthly rhythm", async () => {
    useFireStoreMock.mockReturnValue({
      snapshot: {
        ...seedSnapshot,
        recurringTransactions: [
          {
            id: "rec-paused",
            type: "expense",
            amount: 9_999,
            currency: "HKD",
            categoryId: "cat-food",
            frequency: "monthly",
            startDate: "2026-08-01",
            nextDate: "2026-09-01",
            isActive: false,
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-01T00:00:00.000Z",
          },
          {
            id: "rec-income",
            type: "income",
            amount: 6_000,
            currency: "HKD",
            categoryId: "cat-salary",
            frequency: "biweekly",
            startDate: "2026-08-01",
            nextDate: "2026-08-15",
            isActive: true,
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-01T00:00:00.000Z",
          },
          {
            id: "rec-expense",
            type: "expense",
            amount: 1_200,
            currency: "HKD",
            categoryId: "cat-food",
            frequency: "monthly",
            startDate: "2026-08-01",
            nextDate: "2026-08-10",
            isActive: true,
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-01T00:00:00.000Z",
          },
        ],
      },
      updateRecurringTransaction: jest.fn(),
      archiveRecurringTransaction: jest.fn(),
    });

    const { result } = await renderHook(() => useRecurringViewModel());
    expect(result.current.schedules.map((schedule) => schedule.id)).toEqual([
      "rec-expense",
      "rec-income",
      "rec-paused",
    ]);
    expect(result.current.monthlyTotals).toEqual({ income: 13_000, expense: 1_200, net: 11_800 });
    expect(result.current.activeCount).toBe(2);
  });

  it("routes edits and deletion through the store boundary", async () => {
    const updateRecurringTransaction = jest.fn();
    const archiveRecurringTransaction = jest.fn();
    useFireStoreMock.mockReturnValue({
      snapshot: seedSnapshot,
      updateRecurringTransaction,
      archiveRecurringTransaction,
    });
    const { result } = await renderHook(() => useRecurringViewModel());

    await act(() => {
      result.current.updateRecurringTransaction("rec-1", { amount: 500 });
      result.current.archiveRecurringTransaction("rec-1");
    });

    expect(updateRecurringTransaction).toHaveBeenCalledWith("rec-1", { amount: 500 });
    expect(archiveRecurringTransaction).toHaveBeenCalledWith("rec-1");
  });
});
