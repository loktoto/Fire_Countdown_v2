import { act, renderHook } from "@testing-library/react-native";

import { useFireStore } from "../../data/fireStore";
import { seedSnapshot } from "../../data/seed";
import { useLogViewModel } from "../useLogViewModel";

jest.mock("../../data/fireStore", () => ({ useFireStore: jest.fn() }));

const useFireStoreMock = useFireStore as jest.Mock;

function storeWith(snapshot = seedSnapshot) {
  return {
    snapshot,
    createTransaction: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    archiveCategory: jest.fn(),
  };
}

describe("Log workflow", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates one valid transaction and blocks a rapid duplicate submission", async () => {
    const store = storeWith();
    useFireStoreMock.mockReturnValue(store);
    const { result } = await renderHook(() => useLogViewModel());

    await act(() => {
      result.current.setAmountText("125.50");
      result.current.setNoteText("Lunch");
    });
    expect(result.current.canConfirm).toBe(true);

    await act(() => {
      expect(result.current.confirm()).toBe(true);
      expect(result.current.confirm()).toBe(false);
    });

    expect(store.createTransaction).toHaveBeenCalledTimes(1);
    expect(store.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 125.5,
        categoryId: "cat-food",
        currency: "HKD",
        note: "Lunch",
        type: "expense",
      }),
    );
  });

  it("cannot create a transaction with an empty category id", async () => {
    const store = storeWith({
      ...seedSnapshot,
      categories: seedSnapshot.categories.map((category) => ({
        ...category,
        isHidden: true,
      })),
    });
    useFireStoreMock.mockReturnValue(store);
    const { result } = await renderHook(() => useLogViewModel());

    await act(() => result.current.setAmountText("50"));
    expect(result.current.categoryId).toBe("");
    expect(result.current.canConfirm).toBe(false);
    expect(result.current.confirm()).toBe(false);
    expect(store.createTransaction).not.toHaveBeenCalled();
  });

  it("creates a recurring schedule atomically with the first logged entry", async () => {
    const store = storeWith();
    useFireStoreMock.mockReturnValue(store);
    const { result } = await renderHook(() => useLogViewModel());

    await act(() => {
      result.current.setAmountText("28000");
      result.current.setType("income");
      result.current.setCategoryId("cat-salary");
      result.current.setRecurringEnabled(true);
      result.current.setRecurringFrequency("monthly");
    });
    await act(() => expect(result.current.confirm()).toBe(true));

    expect(store.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 28_000,
        categoryId: "cat-salary",
        type: "income",
      }),
      { frequency: "monthly" },
    );
    expect(result.current.recurringEnabled).toBe(false);
    expect(result.current.recurringFrequency).toBe("monthly");
  });

  it("clears an incompatible category when type changes and resets a cancelled draft", async () => {
    const store = storeWith();
    useFireStoreMock.mockReturnValue(store);
    const { result } = await renderHook(() => useLogViewModel());

    await act(() => {
      result.current.setAmountText("20000");
      result.current.setType("income");
    });
    expect(result.current.categoryId).toBe("");
    expect(result.current.canConfirm).toBe(false);
    expect(result.current.hasDraft).toBe(true);

    await act(() => {
      result.current.setCategoryId("cat-salary");
    });
    expect(result.current.canConfirm).toBe(true);

    await act(() => result.current.resetDraft());
    expect(result.current.amount).toBe(0);
    expect(result.current.type).toBe("expense");
    expect(result.current.categoryId).toBe("cat-food");
    expect(result.current.hasDraft).toBe(false);
  });

  it("routes category edits and archive actions through the store", async () => {
    const store = storeWith();
    useFireStoreMock.mockReturnValue(store);
    const { result } = await renderHook(() => useLogViewModel());

    await act(() => {
      result.current.updateCategory("cat-food", {
        name: "Meals",
        icon: "🍜",
        color: "#5BD9D0",
      });
      result.current.archiveCategory("cat-food");
    });

    expect(store.updateCategory).toHaveBeenCalledWith("cat-food", {
      name: "Meals",
      icon: "🍜",
      color: "#5BD9D0",
    });
    expect(store.archiveCategory).toHaveBeenCalledWith("cat-food");
  });
});
