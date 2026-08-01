import { act, renderHook } from "@testing-library/react-native";

import { useFireStore } from "../../data/fireStore";
import { seedSnapshot } from "../../data/seed";
import { useCalendarViewModel } from "../useCalendarViewModel";

jest.mock("../../data/fireStore", () => ({ useFireStore: jest.fn() }));

const useFireStoreMock = useFireStore as jest.Mock;

describe("Calendar history workflow", () => {
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
});
