import { useMemo } from "react";

import { useFireStore } from "../data/fireStore";
import { monthlyEquivalentAmount } from "../features/recurring/recurringEngine";
import type { RecurringTransaction } from "../features/types";

export type RecurringTransactionDetail = RecurringTransaction & {
  category: ReturnType<typeof useFireStore>["snapshot"]["categories"][number] | null;
};

export function useRecurringViewModel() {
  const { snapshot, updateRecurringTransaction, archiveRecurringTransaction } = useFireStore();
  const categoriesById = useMemo(
    () => new Map(snapshot.categories.map((category) => [category.id, category])),
    [snapshot.categories],
  );
  const schedules = useMemo<RecurringTransactionDetail[]>(
    () =>
      snapshot.recurringTransactions
        .filter((schedule) => !schedule.archivedAt)
        .map((schedule) => ({
          ...schedule,
          category: categoriesById.get(schedule.categoryId) ?? null,
        }))
        .sort((left, right) => {
          if (left.isActive !== right.isActive) {
            return left.isActive ? -1 : 1;
          }
          return left.nextDate.localeCompare(right.nextDate);
        }),
    [categoriesById, snapshot.recurringTransactions],
  );
  const activeSchedules = schedules.filter((schedule) => schedule.isActive);
  const monthlyTotals = activeSchedules
    .filter((schedule) => schedule.currency === snapshot.currency)
    .reduce(
      (totals, schedule) => {
        totals[schedule.type] += monthlyEquivalentAmount(schedule);
        return totals;
      },
      { income: 0, expense: 0 },
    );

  return {
    schedules,
    activeCount: activeSchedules.length,
    nextSchedule: activeSchedules[0] ?? null,
    monthlyTotals: {
      ...monthlyTotals,
      net: monthlyTotals.income - monthlyTotals.expense,
    },
    categories: snapshot.categories.filter(
      (category) => !category.isHidden && !category.archivedAt,
    ),
    currency: snapshot.currency,
    updateRecurringTransaction,
    archiveRecurringTransaction,
  };
}
