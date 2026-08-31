import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { RecurrenceFrequency, TransactionType } from "../types";

export type LogEntrySaveResult = {
  saved: boolean;
  message?: string;
};

export type PersistedLogDraft = {
  amountText: string;
  noteText: string;
  type: TransactionType;
  selectedDate: string;
  recurringEnabled: boolean;
  recurringFrequency: RecurrenceFrequency;
  categoryId: string;
};

type LogEntryController = {
  save: () => LogEntrySaveResult;
  showValidation: () => void;
  reset: () => void;
};

type LogEntryStatus = {
  canSave: boolean;
  hasDraft: boolean;
};

type LogEntryFlowValue = LogEntryStatus & {
  registerController: (controller: LogEntryController | null) => void;
  updateStatus: (status: LogEntryStatus) => void;
  save: () => LogEntrySaveResult;
  showValidation: () => void;
  reset: () => void;
  registerExitHandler: (handler: (() => void) | null) => void;
  requestExit: () => void;
  getPersistedDraft: () => PersistedLogDraft | null;
  persistDraft: (draft: PersistedLogDraft) => void;
  clearPersistedDraft: () => void;
};

const LogEntryFlowContext = createContext<LogEntryFlowValue | null>(null);

export function LogEntryFlowProvider({ children }: { children: ReactNode }) {
  const controllerRef = useRef<LogEntryController | null>(null);
  const exitHandlerRef = useRef<(() => void) | null>(null);
  const draftRef = useRef<PersistedLogDraft | null>(null);
  const [status, setStatus] = useState<LogEntryStatus>({ canSave: false, hasDraft: false });

  const registerController = useCallback((controller: LogEntryController | null) => {
    controllerRef.current = controller;
  }, []);

  const updateStatus = useCallback((next: LogEntryStatus) => {
    setStatus((current) =>
      current.canSave === next.canSave && current.hasDraft === next.hasDraft ? current : next,
    );
  }, []);

  const save = useCallback(() => controllerRef.current?.save() ?? { saved: false }, []);
  const showValidation = useCallback(() => controllerRef.current?.showValidation(), []);
  const reset = useCallback(() => controllerRef.current?.reset(), []);
  const registerExitHandler = useCallback((handler: (() => void) | null) => {
    exitHandlerRef.current = handler;
  }, []);
  const requestExit = useCallback(() => exitHandlerRef.current?.(), []);
  const getPersistedDraft = useCallback(() => draftRef.current, []);
  const persistDraft = useCallback((draft: PersistedLogDraft) => {
    draftRef.current = draft;
  }, []);
  const clearPersistedDraft = useCallback(() => {
    draftRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      ...status,
      registerController,
      updateStatus,
      save,
      showValidation,
      reset,
      registerExitHandler,
      requestExit,
      getPersistedDraft,
      persistDraft,
      clearPersistedDraft,
    }),
    [
      registerController,
      clearPersistedDraft,
      getPersistedDraft,
      persistDraft,
      registerExitHandler,
      requestExit,
      reset,
      save,
      showValidation,
      status,
      updateStatus,
    ],
  );

  return <LogEntryFlowContext.Provider value={value}>{children}</LogEntryFlowContext.Provider>;
}

export function useLogEntryFlow() {
  const value = useContext(LogEntryFlowContext);
  if (!value) {
    throw new Error("useLogEntryFlow must be used inside LogEntryFlowProvider");
  }
  return value;
}

export function useOptionalLogEntryFlow() {
  return useContext(LogEntryFlowContext);
}
