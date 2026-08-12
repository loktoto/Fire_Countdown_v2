import type {
  FireSnapshot,
  RecurrenceFrequency,
  RecurringTransaction,
  Transaction,
} from "../types";
import { addIsoDays, daysBetweenIso, isoDateParts, toIsoDate } from "../../utils/format";

const MAX_MATERIALIZED_OCCURRENCES = 10_000;

export type RecurringOccurrenceProjection = Transaction & {
  isProjected: true;
};

function occurrenceAtIndex(startDate: string, frequency: RecurrenceFrequency, index: number) {
  if (frequency === "weekly" || frequency === "biweekly") {
    return addIsoDays(startDate, index * (frequency === "weekly" ? 7 : 14));
  }

  const start = isoDateParts(startDate);
  const monthStep = frequency === "yearly" ? 12 : 1;
  const targetMonthStart = new Date(start.year, start.month - 1 + index * monthStep, 1);
  const targetYear = targetMonthStart.getFullYear();
  const targetMonth = targetMonthStart.getMonth();
  const targetMonthDays = new Date(targetYear, targetMonth + 1, 0).getDate();

  return toIsoDate(new Date(targetYear, targetMonth, Math.min(start.day, targetMonthDays)));
}

export function recurringDateOnOrAfter(
  startDate: string,
  frequency: RecurrenceFrequency,
  onOrAfterDate: string,
) {
  if (onOrAfterDate <= startDate) {
    return startDate;
  }

  if (frequency === "weekly" || frequency === "biweekly") {
    const periodDays = frequency === "weekly" ? 7 : 14;
    const elapsedDays = daysBetweenIso(startDate, onOrAfterDate);
    return occurrenceAtIndex(startDate, frequency, Math.ceil(elapsedDays / periodDays));
  }

  const start = isoDateParts(startDate);
  const target = isoDateParts(onOrAfterDate);
  const elapsedMonths = Math.max(0, (target.year - start.year) * 12 + (target.month - start.month));
  const monthStep = frequency === "yearly" ? 12 : 1;
  let index = Math.floor(elapsedMonths / monthStep);
  let candidate = occurrenceAtIndex(startDate, frequency, index);

  if (candidate < onOrAfterDate) {
    index += 1;
    candidate = occurrenceAtIndex(startDate, frequency, index);
  }

  return candidate;
}

export function nextRecurringDate(
  startDate: string,
  frequency: RecurrenceFrequency,
  afterDate: string,
) {
  return recurringDateOnOrAfter(startDate, frequency, addIsoDays(afterDate, 1));
}

export function monthlyEquivalentAmount(schedule: RecurringTransaction) {
  switch (schedule.frequency) {
    case "weekly":
      return (schedule.amount * 52) / 12;
    case "biweekly":
      return (schedule.amount * 26) / 12;
    case "yearly":
      return schedule.amount / 12;
    case "monthly":
    default:
      return schedule.amount;
  }
}

export function recurringScheduleFromTransaction(input: {
  id: string;
  transaction: Pick<Transaction, "type" | "amount" | "currency" | "categoryId" | "date" | "note">;
  frequency: RecurrenceFrequency;
  throughDate: string;
  createdAt: string;
}): RecurringTransaction {
  const { transaction } = input;
  return {
    id: input.id,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    categoryId: transaction.categoryId,
    note: transaction.note ?? null,
    frequency: input.frequency,
    startDate: transaction.date,
    nextDate: nextRecurringDate(
      transaction.date,
      input.frequency,
      transaction.date > input.throughDate ? transaction.date : input.throughDate,
    ),
    isActive: true,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

function occurrenceKey(scheduleId: string, date: string) {
  return `${scheduleId}|${date}`;
}

export function projectRecurringOccurrences({
  schedules,
  transactions,
  fromDate,
  throughDate,
  todayDate,
}: {
  schedules: readonly RecurringTransaction[];
  transactions: readonly Transaction[];
  fromDate: string;
  throughDate: string;
  todayDate: string;
}): RecurringOccurrenceProjection[] {
  if (fromDate > throughDate) {
    return [];
  }

  const existingOccurrences = new Set(
    transactions.flatMap((transaction) =>
      transaction.recurringTransactionId
        ? [
            occurrenceKey(
              transaction.recurringTransactionId,
              transaction.recurrenceDate ?? transaction.date,
            ),
          ]
        : [],
    ),
  );

  return schedules
    .flatMap((schedule) => {
      if (!schedule.isActive || schedule.archivedAt) {
        return [];
      }

      const projections: RecurringOccurrenceProjection[] = [];
      let occurrenceDate = schedule.nextDate;
      let processed = 0;

      while (occurrenceDate <= throughDate && processed < MAX_MATERIALIZED_OCCURRENCES) {
        const occurrence = occurrenceDate;
        const key = occurrenceKey(schedule.id, occurrence);
        if (
          occurrence >= fromDate &&
          occurrence > todayDate &&
          !existingOccurrences.has(key)
        ) {
          projections.push({
            id: `projection-rec-${schedule.id}-${occurrence}`,
            type: schedule.type,
            amount: schedule.amount,
            currency: schedule.currency,
            categoryId: schedule.categoryId,
            date: occurrence,
            note: schedule.note ?? null,
            recurringTransactionId: schedule.id,
            recurrenceDate: occurrence,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
            archivedAt: null,
            isProjected: true,
          });
        }

        const nextDate = nextRecurringDate(schedule.startDate, schedule.frequency, occurrence);
        if (nextDate <= occurrence) {
          break;
        }
        occurrenceDate = nextDate;
        processed += 1;
      }

      return projections;
    })
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.recurringTransactionId!.localeCompare(right.recurringTransactionId!),
    );
}

function generatedTransaction(
  schedule: RecurringTransaction,
  dueDate: string,
  generatedAt: string,
): Transaction {
  return {
    id: `txn-rec-${schedule.id}-${dueDate}`,
    type: schedule.type,
    amount: schedule.amount,
    currency: schedule.currency,
    categoryId: schedule.categoryId,
    date: dueDate,
    note: schedule.note ?? null,
    recurringTransactionId: schedule.id,
    recurrenceDate: dueDate,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
}

export function materializeDueRecurringTransactions(
  snapshot: FireSnapshot,
  throughDate: string,
  generatedAt: string,
) {
  if (snapshot.recurringTransactions.length === 0) {
    return snapshot;
  }

  const existingOccurrences = new Set(
    snapshot.transactions.flatMap((transaction) =>
      transaction.recurringTransactionId
        ? [
            occurrenceKey(
              transaction.recurringTransactionId,
              transaction.recurrenceDate ?? transaction.date,
            ),
          ]
        : [],
    ),
  );
  const generated: Transaction[] = [];
  let schedulesChanged = false;

  const recurringTransactions = snapshot.recurringTransactions.map((schedule) => {
    if (!schedule.isActive || schedule.archivedAt || schedule.nextDate > throughDate) {
      return schedule;
    }

    let nextDate = schedule.nextDate;
    let processed = 0;

    while (nextDate <= throughDate && processed < MAX_MATERIALIZED_OCCURRENCES) {
      const key = occurrenceKey(schedule.id, nextDate);
      if (!existingOccurrences.has(key)) {
        generated.push(generatedTransaction(schedule, nextDate, generatedAt));
        existingOccurrences.add(key);
      }

      nextDate = nextRecurringDate(schedule.startDate, schedule.frequency, nextDate);
      processed += 1;
    }

    if (nextDate === schedule.nextDate) {
      return schedule;
    }

    schedulesChanged = true;
    return { ...schedule, nextDate, updatedAt: generatedAt };
  });

  if (!schedulesChanged && generated.length === 0) {
    return snapshot;
  }

  generated.sort((left, right) => right.date.localeCompare(left.date));
  return {
    ...snapshot,
    recurringTransactions,
    transactions: [...generated, ...snapshot.transactions],
  };
}
