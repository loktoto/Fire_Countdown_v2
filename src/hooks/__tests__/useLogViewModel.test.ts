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
