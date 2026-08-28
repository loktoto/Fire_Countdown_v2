import { useMemo, useState } from "react";

import { dailyNet, monthlySummary } from "../engine/fireEngine";
import { useFireStore } from "../data/fireStore";
import { projectRecurringOccurrences } from "../features/recurring/recurringEngine";
import { getI18n } from "../i18n";
import type { Category, Transaction } from "../features/types";
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

export type CalendarTransactionDetail = Transaction & {
  category: Category | null;
  isPendingFireImpact: boolean;
  isProjected: boolean;
};

type CalendarActivity = {
  hasExpense: boolean;
  hasIncome: boolean;
  hasProjectedExpense: boolean;
  hasProjectedIncome: boolean;
};

function monthStart(date: string) {
  const parts = isoDateParts(date);
  return toIsoDate(new Date(parts.year, parts.month - 1, 1));
}

export function useCalendarViewModel() {
  const { snapshot, updateTransaction, archiveTransaction } = useFireStore();
  const [selectedDate, setSelectedDateState] = useState(() => todayIso());
  const today = todayIso();
  const visibleMonth = monthStart(selectedDate);
  const visibleParts = isoDateParts(visibleMonth);
  const t = getI18n(snapshot.language);
  const categoriesById = useMemo(
    () => new Map(snapshot.categories.map((category) => [category.id, category])),
    [snapshot.categories],
  );
  const calendarRange = useMemo(() => {
    const monthPrefix = `${visibleParts.year}-${String(visibleParts.month).padStart(2, "0")}`;
    const firstDate = `${monthPrefix}-01`;
    const leadingDays = (new Date(`${firstDate}T00:00:00`).getDay() + 6) % 7;
    const currentMonthDays = daysInIsoMonth(visibleMonth);
    const totalCells = Math.ceil((leadingDays + currentMonthDays) / 7) * 7;
    const startDate = addIsoDays(firstDate, -leadingDays);

    return {
      startDate,
      endDate: addIsoDays(startDate, totalCells - 1),
      totalCells,
    };
  }, [visibleMonth, visibleParts.month, visibleParts.year]);
  const projectedTransactions = useMemo(
    () =>
      projectRecurringOccurrences({
        schedules: snapshot.recurringTransactions,
        transactions: snapshot.transactions,
        fromDate: calendarRange.startDate,
        throughDate: calendarRange.endDate,
        todayDate: today,
      }),
    [
      calendarRange.endDate,
      calendarRange.startDate,
      snapshot.recurringTransactions,
      snapshot.transactions,
      today,
    ],
  );
  const calendarCells = useMemo(() => {
    const activityByDate = new Map<string, CalendarActivity>();

    snapshot.transactions.forEach((transaction) => {
      if (transaction.archivedAt) return;
      const activity = activityByDate.get(transaction.date) ?? {
        hasExpense: false,
        hasIncome: false,
        hasProjectedExpense: false,
        hasProjectedIncome: false,
      };
      if (transaction.type === "income") activity.hasIncome = true;
      if (transaction.type === "expense") activity.hasExpense = true;
      activityByDate.set(transaction.date, activity);
    });

    projectedTransactions.forEach((transaction) => {
      const activity = activityByDate.get(transaction.date) ?? {
        hasExpense: false,
        hasIncome: false,
        hasProjectedExpense: false,
        hasProjectedIncome: false,
      };
      if (transaction.type === "income") activity.hasProjectedIncome = true;
      if (transaction.type === "expense") activity.hasProjectedExpense = true;
      activityByDate.set(transaction.date, activity);
    });

    return Array.from({ length: calendarRange.totalCells }, (_, index) => {
      const date = addIsoDays(calendarRange.startDate, index);
      const parts = isoDateParts(date);
      const activity = activityByDate.get(date);
      return {
        key: date,
        date,
        day: parts.day,
        net: dailyNet(snapshot.transactions, date, snapshot.currency),
        hasIncome: activity?.hasIncome ?? false,
        hasExpense: activity?.hasExpense ?? false,
        hasProjectedIncome: activity?.hasProjectedIncome ?? false,
        hasProjectedExpense: activity?.hasProjectedExpense ?? false,
        isCurrentMonth: parts.year === visibleParts.year && parts.month === visibleParts.month,
        isToday: date === today,
        isFuture: date > today,
      };
    });
  }, [
    snapshot.currency,
    snapshot.transactions,
    calendarRange.startDate,
    calendarRange.totalCells,
    projectedTransactions,
    today,
    visibleParts.month,
    visibleParts.year,
  ]);
  const selectedTransactionDetails = useMemo<CalendarTransactionDetail[]>(() => {
    const actualTransactions: CalendarTransactionDetail[] = snapshot.transactions
      .filter((transaction) => transaction.date === selectedDate && !transaction.archivedAt)
      .map((transaction) => ({
        ...transaction,
        category: categoriesById.get(transaction.categoryId) ?? null,
        isPendingFireImpact: transaction.date > today,
        isProjected: false,
      }));
    const scheduledTransactions: CalendarTransactionDetail[] = projectedTransactions
      .filter((transaction) => transaction.date === selectedDate)
      .map((transaction) => ({
        ...transaction,
        category: categoriesById.get(transaction.categoryId) ?? null,
        isPendingFireImpact: true,
      }));

    return [...actualTransactions, ...scheduledTransactions];
  }, [categoriesById, projectedTransactions, selectedDate, snapshot.transactions, today]);
  const activeRecurringTransactions = useMemo(
    () =>
      [...snapshot.recurringTransactions]
        .filter((schedule) => schedule.isActive && !schedule.archivedAt)
        .sort((left, right) => left.nextDate.localeCompare(right.nextDate)),
    [snapshot.recurringTransactions],
  );

  function saveTransactionEdit(id: string, patch: EditableTransactionPatch) {
    const nextPatch = { ...patch };
    if (typeof nextPatch.note === "string" && nextPatch.note.trim().length === 0) {
      nextPatch.note = null;
    }
    const persisted = updateTransaction(id, nextPatch);
    if (persisted && nextPatch.date) {
      selectDate(nextPatch.date);
    }
    return persisted;
  }

  function selectDate(date: string) {
    setSelectedDateState(date);
  }

  function goToToday() {
    selectDate(todayIso());
  }

  function selectMonth(year: number, month: number) {
    selectDate(toIsoDate(new Date(year, month - 1, 1)));
  }

  return {
    monthLabel: formatMonthYear(visibleMonth, t.locale),
    visibleYear: visibleParts.year,
    visibleMonthNumber: visibleParts.month,
    currency: snapshot.currency,
    summary: monthlySummary(
      snapshot.transactions,
      visibleParts.year,
      visibleParts.month,
      snapshot.currency,
    ),
    weekdays: snapshot.language === "zhHant" ? t.dates.weekdays : calendarWeekdays,
    calendarCells,
    selectedDate,
    selectedTransactions: selectedTransactionDetails,
    projectedTransactions,
    recurring: {
      activeCount: activeRecurringTransactions.length,
      nextDate: activeRecurringTransactions[0]?.nextDate ?? null,
    },
    categories: snapshot.categories.filter(
      (category) => !category.isHidden && !category.archivedAt,
    ),
    setSelectedDate: selectDate,
    goToPreviousMonth: () => selectDate(addIsoMonths(visibleMonth, -1)),
    goToNextMonth: () => selectDate(addIsoMonths(visibleMonth, 1)),
    goToPreviousYear: () => selectDate(addIsoMonths(visibleMonth, -12)),
    goToNextYear: () => selectDate(addIsoMonths(visibleMonth, 12)),
    goToToday,
    selectMonth,
    saveTransactionEdit,
    moveTransactionToToday: (id: string) => updateTransaction(id, { date: todayIso() }),
    deleteTransaction: archiveTransaction,
  };
}
