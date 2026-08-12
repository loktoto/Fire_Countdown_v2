import { act, renderHook } from "@testing-library/react-native";

import { useFireStore } from "../../data/fireStore";
import { seedSnapshot } from "../../data/seed";
import { nextRecurringDate } from "../../features/recurring/recurringEngine";
import { todayIso } from "../../utils/format";
import { useCalendarViewModel } from "../useCalendarViewModel";

jest.mock("../../data/fireStore", () => ({ useFireStore: jest.fn() }));

const useFireStoreMock = useFireStore as jest.Mock;

describe("Calendar history workflow", () => {
  it("jumps to the first day of a chosen month", async () => {
    useFireStoreMock.mockReturnValue({
      snapshot: seedSnapshot,
      updateTransaction: jest.fn(),
      archiveTransaction: jest.fn(),
    });
    const { result } = await renderHook(() => useCalendarViewModel());

    await act(() => result.current.setSelectedDate("2026-01-31"));
    await act(() => result.current.selectMonth(2026, 2));

    expect(result.current.selectedDate).toBe("2026-02-01");
    expect(result.current.monthLabel).toContain("February");
  });

  it("keeps the entry log on day one whenever the visible month changes", async () => {
    useFireStoreMock.mockReturnValue({
      snapshot: seedSnapshot,
      updateTransaction: jest.fn(),
      archiveTransaction: jest.fn(),
    });
    const { result } = await renderHook(() => useCalendarViewModel());

    await act(() => result.current.setSelectedDate("2026-09-19"));
    await act(() => result.current.goToNextMonth());
    expect(result.current.selectedDate).toBe("2026-10-01");

    await act(() => result.current.goToPreviousMonth());
    expect(result.current.selectedDate).toBe("2026-09-01");

    await act(() => result.current.goToNextYear());
    expect(result.current.selectedDate).toBe("2027-09-01");
  });

  it("exposes semantic income and expense markers for each active day", async () => {
    const date = todayIso();
    useFireStoreMock.mockReturnValue({
      snapshot: {
        ...seedSnapshot,
        transactions: [
          { ...seedSnapshot.transactions[0], id: "expense-marker", date, type: "expense" },
          { ...seedSnapshot.transactions[1], id: "income-marker", date, type: "income" },
          {
            ...seedSnapshot.transactions[2],
            id: "archived-marker",
            date,
            type: "expense",
            archivedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      updateTransaction: jest.fn(),
      archiveTransaction: jest.fn(),
    });

    const { result } = await renderHook(() => useCalendarViewModel());
    const today = result.current.calendarCells.find((day) => day.date === date);

    expect(today).toMatchObject({ hasExpense: true, hasIncome: true });
  });

  it("shows a future transaction on its Calendar date before FIRE executes it", async () => {
    const tomorrow = new Date(`${todayIso()}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 10);
    useFireStoreMock.mockReturnValue({
      snapshot: {
        ...seedSnapshot,
        transactions: [
          {
            ...seedSnapshot.transactions[1]!,
            id: "future-income",
            amount: 20000,
            type: "income",
            categoryId: "cat-salary",
            date: futureDate,
            archivedAt: undefined,
          },
          ...seedSnapshot.transactions,
        ],
      },
      updateTransaction: jest.fn(),
      archiveTransaction: jest.fn(),
    });

    const { result } = await renderHook(() => useCalendarViewModel());
    await act(() => result.current.setSelectedDate(futureDate));

    expect(result.current.selectedTransactions).toEqual([
      expect.objectContaining({
        id: "future-income",
        amount: 20000,
        date: futureDate,
        isPendingFireImpact: true,
      }),
    ]);
    expect(result.current.calendarCells.find((day) => day.date === futureDate)).toMatchObject({
      hasIncome: true,
      isFuture: true,
      net: 20000,
    });
  });

  it("edits, moves, and archives existing history through store actions", async () => {
    const updateTransaction = jest.fn();
    const archiveTransaction = jest.fn();
    useFireStoreMock.mockReturnValue({
      snapshot: seedSnapshot,
      updateTransaction,
      archiveTransaction,
    });
    const { result } = await renderHook(() => useCalendarViewModel());

    await act(() =>
      result.current.saveTransactionEdit("txn-1", {
        amount: 225,
        date: "2026-07-01",
        note: "   ",
      }),
    );
    expect(updateTransaction).toHaveBeenCalledWith("txn-1", {
      amount: 225,
      date: "2026-07-01",
      note: null,
    });
    expect(result.current.selectedDate).toBe("2026-07-01");

    await act(() => result.current.deleteTransaction("txn-1"));
    expect(archiveTransaction).toHaveBeenCalledWith("txn-1");
  });

  it("surfaces the next active recurring entry without mixing it into day history", async () => {
    useFireStoreMock.mockReturnValue({
      snapshot: {
        ...seedSnapshot,
        recurringTransactions: [
          {
            id: "rec-paused",
            type: "expense",
            amount: 100,
            currency: "HKD",
            categoryId: "cat-food",
            frequency: "weekly",
            startDate: "2026-08-01",
            nextDate: "2026-08-08",
            isActive: false,
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-01T00:00:00.000Z",
          },
          {
            id: "rec-active",
            type: "income",
            amount: 28_000,
            currency: "HKD",
            categoryId: "cat-salary",
            frequency: "monthly",
            startDate: "2026-08-01",
            nextDate: "2026-09-01",
            isActive: true,
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-01T00:00:00.000Z",
          },
        ],
      },
      updateTransaction: jest.fn(),
      archiveTransaction: jest.fn(),
    });

    const { result } = await renderHook(() => useCalendarViewModel());
    expect(result.current.recurring).toEqual({ activeCount: 1, nextDate: "2026-09-01" });
  });

  it("shows virtual future entries and muted markers without changing actual totals or daily net", async () => {
    const today = todayIso();
    const nextDate = nextRecurringDate(today, "monthly", today);
    const actualTransaction = {
      ...seedSnapshot.transactions[0]!,
      id: "txn-salary-today",
      type: "income" as const,
      amount: 28_000,
      categoryId: "cat-salary",
      date: today,
      recurringTransactionId: "rec-salary",
      recurrenceDate: today,
      archivedAt: undefined,
    };

    useFireStoreMock.mockReturnValue({
      snapshot: {
        ...seedSnapshot,
        transactions: [actualTransaction],
        recurringTransactions: [
          {
            id: "rec-salary",
            type: "income",
            amount: 28_000,
            currency: "HKD",
            categoryId: "cat-salary",
            note: "Salary",
            frequency: "monthly",
            startDate: today,
            nextDate,
            isActive: true,
            createdAt: "2026-08-03T00:00:00.000Z",
            updatedAt: "2026-08-03T00:00:00.000Z",
          },
        ],
      },
      updateTransaction: jest.fn(),
      archiveTransaction: jest.fn(),
    });

    const { result } = await renderHook(() => useCalendarViewModel());
    expect(result.current.summary).toEqual({ income: 28_000, expense: 0, net: 28_000 });

    await act(() => result.current.setSelectedDate(nextDate));
    const projectedDay = result.current.calendarCells.find((day) => day.date === nextDate);

    expect(projectedDay).toMatchObject({
      hasIncome: false,
      hasExpense: false,
      hasProjectedIncome: true,
      hasProjectedExpense: false,
      net: 0,
      isFuture: true,
    });
    expect(result.current.summary).toEqual({ income: 0, expense: 0, net: 0 });
    expect(result.current.selectedTransactions).toEqual([
      expect.objectContaining({
        id: `projection-rec-rec-salary-${nextDate}`,
        recurringTransactionId: "rec-salary",
        date: nextDate,
        isProjected: true,
        isPendingFireImpact: true,
      }),
    ]);
  });
});
