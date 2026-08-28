import { useEffect, useMemo, useRef, useState } from "react";

import { transactionPreviewImpact } from "../engine/fireEngine";
import { defaultScenario, mainGoal } from "../engine/selectors";
import { useFireStore } from "../data/fireStore";
import type { Category, RecurrenceFrequency, TransactionType } from "../features/types";
import { useOptionalLogEntryFlow } from "../features/logEntryFlow/LogEntryFlowContext";
import { addIsoDays, formatLogDateLabel, formatShortDate, todayIso } from "../utils/format";

export function useLogViewModel() {
  const entryFlow = useOptionalLogEntryFlow();
  const persistedDraft = entryFlow?.getPersistedDraft() ?? null;
  const { snapshot, createTransaction, createCategory, updateCategory, archiveCategory } =
    useFireStore();
  const [amountText, setAmountText] = useState(persistedDraft?.amountText ?? "0");
  const [noteText, setNoteText] = useState(persistedDraft?.noteText ?? "");
  const [type, setType] = useState<TransactionType>(persistedDraft?.type ?? "expense");
  const [selectedDate, setSelectedDate] = useState(persistedDraft?.selectedDate ?? todayIso());
  const [recurringEnabled, setRecurringEnabled] = useState(
    persistedDraft?.recurringEnabled ?? false,
  );
  const [recurringFrequency, setRecurringFrequency] = useState<RecurrenceFrequency>(
    persistedDraft?.recurringFrequency ?? "monthly",
  );
  const categories = useMemo(
    () =>
      snapshot.categories.filter(
        (category) => category.type === type && !category.isHidden && !category.archivedAt,
      ),
    [snapshot.categories, type],
  );
  const [categoryId, setCategoryId] = useState(
    persistedDraft?.categoryId ?? categories[0]?.id ?? "cat-food",
  );
  const lastSubmissionFingerprint = useRef<string | null>(null);
  const activeCategoryId = categories.some((category) => category.id === categoryId)
    ? categoryId
    : "";
  const amount = Number.parseFloat(amountText) || 0;
  const goal = mainGoal(snapshot);
  const scenario = defaultScenario(snapshot);
  const today = todayIso();
  const isTodaySelected = selectedDate === today;
  const hasValidDate = Number.isFinite(new Date(`${selectedDate}T00:00:00`).getTime());

  const selectedCategory = categories.find((category) => category.id === activeCategoryId) ?? null;
  const canConfirm = amount > 0 && selectedCategory !== null && hasValidDate;
  const hasDraft =
    amount > 0 ||
    noteText.trim().length > 0 ||
    type !== "expense" ||
    !isTodaySelected ||
    recurringEnabled;

  useEffect(() => {
    entryFlow?.persistDraft({
      amountText,
      noteText,
      type,
      selectedDate,
      recurringEnabled,
      recurringFrequency,
      categoryId,
    });
  }, [
    amountText,
    categoryId,
    entryFlow,
    noteText,
    recurringEnabled,
    recurringFrequency,
    selectedDate,
    type,
  ]);
  const impact = useMemo(
    () =>
      !goal || amount <= 0
        ? { impactDays: 0, baseDays: null, simulatedDays: null }
        : transactionPreviewImpact({
            transactions: snapshot.transactions,
            draft: {
              amount,
              type,
              categoryId: activeCategoryId,
              currency: snapshot.currency,
              date: selectedDate,
            },
            assets: snapshot.assets,
            quotes: snapshot.quoteCache,
            goal,
            scenario,
            startDate: today,
          }),
    [
      activeCategoryId,
      amount,
      goal,
      scenario,
      selectedDate,
      snapshot.assets,
      snapshot.currency,
      snapshot.quoteCache,
      snapshot.transactions,
      today,
      type,
    ],
  );

  function setAmountFromInput(raw: string) {
    lastSubmissionFingerprint.current = null;
    const decimalParts = raw
      .replace(",", ".")
      .replace(/[^\d.]/g, "")
      .split(".");
    const whole = decimalParts[0] ?? "";
    const decimals = decimalParts.slice(1).join("").slice(0, 2);
    const normalized = decimals.length > 0 ? `${whole}.${decimals}` : whole;
    const next = normalized.slice(0, 12);
    setAmountText(next.length > 0 ? next : "0");
  }

  function selectType(nextType: TransactionType) {
    if (nextType === type) {
      return;
    }
    lastSubmissionFingerprint.current = null;
    setType(nextType);
    setCategoryId("");
  }

  function clearDraft(preserveSubmissionFingerprint: boolean) {
    const defaultExpenseCategory = snapshot.categories.find(
      (category) => category.type === "expense" && !category.isHidden && !category.archivedAt,
    );
    if (!preserveSubmissionFingerprint) {
      lastSubmissionFingerprint.current = null;
    }
    entryFlow?.clearPersistedDraft();
    setAmountText("0");
    setNoteText("");
    setType("expense");
    setCategoryId(defaultExpenseCategory?.id ?? "");
    setSelectedDate(todayIso());
    setRecurringEnabled(false);
    setRecurringFrequency("monthly");
  }

  function resetDraft() {
    clearDraft(false);
  }

  function confirm() {
    if (!canConfirm || !selectedCategory) {
      return false;
    }
    const trimmedNote = noteText.trim();
    const fingerprint = [
      amount,
      type,
      selectedCategory.id,
      snapshot.currency,
      selectedDate,
      trimmedNote,
      recurringEnabled,
      recurringFrequency,
    ].join("|");
    if (lastSubmissionFingerprint.current === fingerprint) {
      return false;
    }
    lastSubmissionFingerprint.current = fingerprint;
    const input = {
      amount,
      type,
      categoryId: selectedCategory.id,
      currency: snapshot.currency,
      date: selectedDate,
      note: trimmedNote.length > 0 ? trimmedNote : null,
    };
    const persisted = recurringEnabled
      ? createTransaction(input, { frequency: recurringFrequency })
      : createTransaction(input);
    if (persisted === false) {
      lastSubmissionFingerprint.current = null;
      return false;
    }
    clearDraft(true);
    return true;
  }

  function moveSelectedDate(days: number) {
    setSelectedDate(addIsoDays(selectedDate, days));
  }

  function resetSelectedDate() {
    setSelectedDate(todayIso());
  }

  function createLogCategory(input: Pick<Category, "name" | "icon" | "color">) {
    const category = createCategory({
      ...input,
      type,
      isHidden: false,
      order: categories.reduce((highest, item) => Math.max(highest, item.order), 0) + 1,
    });
    if (!category) {
      return false;
    }
    setCategoryId(category.id);
    return true;
  }

  function updateLogCategory(
    categoryIdToUpdate: string,
    patch: Pick<Category, "name" | "icon" | "color">,
  ) {
    return updateCategory(categoryIdToUpdate, patch);
  }

  return {
    amountText,
    setAmountText: setAmountFromInput,
    noteText,
    setNoteText,
    amount,
    type,
    setType: selectType,
    categories,
    selectedCategory,
    categoryId: activeCategoryId,
    setCategoryId,
    selectedDate,
    selectedDateLabel: formatLogDateLabel(selectedDate, today),
    selectedDateShortLabel: formatShortDate(selectedDate),
    isTodaySelected,
    setSelectedDate,
    moveSelectedDate,
    resetSelectedDate,
    recurringEnabled,
    setRecurringEnabled,
    recurringFrequency,
    setRecurringFrequency,
    impact,
    canConfirm,
    hasDraft,
    hasValidDate,
    confirm,
    resetDraft,
    createCategory: createLogCategory,
    updateCategory: updateLogCategory,
    archiveCategory,
    currency: snapshot.currency,
    hapticsEnabled: snapshot.hapticsEnabled,
  };
}
