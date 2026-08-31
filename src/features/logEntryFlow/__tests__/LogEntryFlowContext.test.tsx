import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { LogEntryFlowProvider, useLogEntryFlow } from "../LogEntryFlowContext";

function wrapper({ children }: PropsWithChildren) {
  return <LogEntryFlowProvider>{children}</LogEntryFlowProvider>;
}

describe("Log entry flow controller", () => {
  it("exposes validation and save actions to the persistent center control", async () => {
    const save = jest.fn(() => ({ saved: true, message: "Income of HKD 20,000 added" }));
    const showValidation = jest.fn();
    const reset = jest.fn();
    const { result } = await renderHook(() => useLogEntryFlow(), { wrapper });

    await act(() => {
      result.current.registerController({ save, showValidation, reset });
      result.current.updateStatus({ canSave: true, hasDraft: true });
    });

    expect(result.current.canSave).toBe(true);
    expect(result.current.hasDraft).toBe(true);
    expect(result.current.save()).toEqual({
      saved: true,
      message: "Income of HKD 20,000 added",
    });
    await act(() => result.current.showValidation());
    expect(showValidation).toHaveBeenCalledTimes(1);
  });

  it("lets Cancel request a return to the previous tab", async () => {
    const exit = jest.fn();
    const { result } = await renderHook(() => useLogEntryFlow(), { wrapper });

    await act(() => result.current.registerExitHandler(exit));
    await act(() => result.current.requestExit());

    expect(exit).toHaveBeenCalledTimes(1);
  });

  it("keeps an unfinished draft while screens change", async () => {
    const { result } = await renderHook(() => useLogEntryFlow(), { wrapper });
    const draft = {
      amountText: "20000",
      noteText: "",
      type: "income" as const,
      selectedDate: "2026-08-01",
      recurringEnabled: false,
      recurringFrequency: "monthly" as const,
      categoryId: "cat-salary",
    };

    await act(() => result.current.persistDraft(draft));
    expect(result.current.getPersistedDraft()).toEqual(draft);

    await act(() => result.current.clearPersistedDraft());
    expect(result.current.getPersistedDraft()).toBeNull();
  });
});
