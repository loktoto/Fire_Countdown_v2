import { useMemo, useState } from "react";

import { dailyNet, monthlySummary } from "../engine/fireEngine";
import { useFireStore } from "../data/fireStore";
import { getI18n } from "../i18n";
import type { Transaction } from "../features/types";
import {
  addIsoDays,
  addIsoMonths,
  daysInIsoMonth,
  formatMonthYear,
  isoDateParts,
  todayIso,
  toIsoDate,
} from "../utils/format";

export const calendarWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type EditableTransactionPatch = Partial<
  Pick<Transaction, "amount" | "categoryId" | "currency" | "date" | "note" | "type">
>;

function monthStart(date: string) {
  const parts = isoDateParts(date);
  return toIsoDate(new Date(parts.year, parts.month - 1, 1));
}

export function useCalendarViewModel() {
  const { snapshot, updateTransaction, archiveTransaction } = useFireStore();
  const [selectedDate, setSelectedDateState] = useState(() => todayIso());
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(todayIso()));
  const visibleParts = isoDateParts(visibleMonth);
  const t = getI18n(snapshot.language);
  const categoriesById = useMemo(
    () => new Map(snapshot.categories.map((category) => [category.id, category])),
    [snapshot.categories],
  );
  const calendarCells = useMemo(() => {
    const monthPrefix = `${visibleParts.year}-${String(visibleParts.month).padStart(2, "0")}`;
    const firstDate = `${monthPrefix}-01`;
    const leadingDays = (new Date(`${firstDate}T00:00:00`).getDay() + 6) % 7;
    const currentMonthDays = daysInIsoMonth(visibleMonth);
    const totalCells = Math.ceil((leadingDays + currentMonthDays) / 7) * 7;
    const startDate = addIsoDays(firstDate, -leadingDays);
    const today = todayIso();

    return Array.from({ length: totalCells }, (_, index) => {
      const date = addIsoDays(startDate, index);
      const parts = isoDateParts(date);
      return {
        key: date,
        date,
        day: parts.day,
        net: dailyNet(snapshot.transactions, date),
        isCurrentMonth: parts.year === visibleParts.year && parts.month === visibleParts.month,
        isToday: date === today,
      };
    });
  }, [snapshot.transactions, visibleMonth, visibleParts.month, visibleParts.year]);
  const selectedTransactions = snapshot.transactions.filter(
    (transaction) => transaction.date === selectedDate && !transaction.archivedAt,
  );
  const selectedTransactionDetails = selectedTransactions.map((transaction) => ({
    ...transaction,
    category: categoriesById.get(transaction.categoryId) ?? null,
  }));

  function saveTransactionEdit(id: string, patch: EditableTransactionPatch) {
    const nextPatch = { ...patch };
    if (typeof nextPatch.note === "string" && nextPatch.note.trim().length === 0) {
      nextPatch.note = null;
    }
    updateTransaction(id, nextPatch);
    if (nextPatch.date) {
      selectDate(nextPatch.date);
    }
  }

  function selectDate(date: string) {
    setSelectedDateState(date);
    setVisibleMonth(monthStart(date));
  }

  function goToToday() {
    selectDate(todayIso());
  }

  return {
    monthLabel: formatMonthYear(visibleMonth, t.locale),
    currency: snapshot.currency,
    summary: monthlySummary(snapshot.transactions, visibleParts.year, visibleParts.month),
    weekdays: snapshot.language === "zhHant" ? t.dates.weekdays : calendarWeekdays,
    calendarCells,
    selectedDate,
    selectedTransactions: selectedTransactionDetails,
    categories: snapshot.categories.filter(
      (category) => !category.isHidden && !category.archivedAt,
    ),
    setSelectedDate: selectDate,
    goToPreviousMonth: () => setVisibleMonth((current) => addIsoMonths(current, -1)),
    goToNextMonth: () => setVisibleMonth((current) => addIsoMonths(current, 1)),
    goToPreviousYear: () => setVisibleMonth((current) => addIsoMonths(current, -12)),
    goToNextYear: () => setVisibleMonth((current) => addIsoMonths(current, 12)),
    goToToday,
    saveTransactionEdit,
    moveTransactionToToday: (id: string) => updateTransaction(id, { date: todayIso() }),
    archiveTransaction,
  };
}
