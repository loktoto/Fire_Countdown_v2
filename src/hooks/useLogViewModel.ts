import { useMemo, useRef, useState } from "react";

import { transactionPreviewImpact } from "../engine/fireEngine";
import { defaultScenario, mainGoal } from "../engine/selectors";
import { useFireStore } from "../data/fireStore";
import type { Category, TransactionType } from "../features/types";
import { addIsoDays, formatLogDateLabel, formatShortDate, todayIso } from "../utils/format";

export function useLogViewModel() {
  const { snapshot, createTransaction, createCategory, updateCategory, archiveCategory } =
    useFireStore();
  const [amountText, setAmountText] = useState("0");
  const [noteText, setNoteText] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [selectedDate, setSelectedDate] = useState(() => todayIso());
  const categories = snapshot.categories.filter(
    (category) => category.type === type && !category.isHidden && !category.archivedAt,
  );
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "cat-food");
  const lastSubmissionFingerprint = useRef<string | null>(null);
  const activeCategoryId = categories.some((category) => category.id === categoryId)
    ? categoryId
    : (categories[0]?.id ?? "");
  const amount = Number.parseFloat(amountText) || 0;
  const goal = mainGoal(snapshot);
  const scenario = defaultScenario(snapshot);
  const today = todayIso();
  const isTodaySelected = selectedDate === today;

  const selectedCategory =
    categories.find((category) => category.id === activeCategoryId) ?? categories[0] ?? null;
  const canConfirm = amount > 0 && selectedCategory !== null;
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
    ].join("|");
    if (lastSubmissionFingerprint.current === fingerprint) {
      return false;
    }
    lastSubmissionFingerprint.current = fingerprint;
    createTransaction({
      amount,
      type,
      categoryId: selectedCategory.id,
      currency: snapshot.currency,
      date: selectedDate,
      note: trimmedNote.length > 0 ? trimmedNote : null,
    });
    setAmountText("0");
    setNoteText("");
    setSelectedDate(todayIso());
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
    setCategoryId(category.id);
  }

  function updateLogCategory(
    categoryIdToUpdate: string,
    patch: Pick<Category, "name" | "icon" | "color">,
  ) {
    updateCategory(categoryIdToUpdate, patch);
  }

  return {
    amountText,
    setAmountText: setAmountFromInput,
    noteText,
    setNoteText,
    amount,
    type,
    setType,
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
    impact,
    canConfirm,
    confirm,
    createCategory: createLogCategory,
    updateCategory: updateLogCategory,
    archiveCategory,
    currency: snapshot.currency,
  };
}
