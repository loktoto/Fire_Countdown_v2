import { seedSnapshot } from "../../../data/seed";
import {
  materializeDueRecurringTransactions,
  monthlyEquivalentAmount,
  nextRecurringDate,
  projectRecurringOccurrences,
  recurringDateOnOrAfter,
  recurringScheduleFromTransaction,
} from "../recurringEngine";
import type { RecurringTransaction, Transaction } from "../../types";

const timestamp = "2026-08-01T08:00:00.000Z";

function schedule(patch: Partial<RecurringTransaction> = {}): RecurringTransaction {
  return {
    id: "rec-rent",
    type: "expense",
    amount: 12_000,
    currency: "HKD",
    categoryId: "cat-food",
    note: "Rent",
    frequency: "monthly",
    startDate: "2026-01-31",
    nextDate: "2026-07-31",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...patch,
  };
}

describe("recurring transaction dates", () => {
  it("preserves the original day across short months instead of drifting", () => {
    expect(nextRecurringDate("2024-01-31", "monthly", "2024-01-31")).toBe("2024-02-29");
    expect(nextRecurringDate("2024-01-31", "monthly", "2024-02-29")).toBe("2024-03-31");
    expect(nextRecurringDate("2023-01-31", "monthly", "2023-01-31")).toBe("2023-02-28");
    expect(nextRecurringDate("2023-01-31", "monthly", "2023-02-28")).toBe("2023-03-31");
  });

  it("handles weekly, biweekly, and leap-day yearly anchors", () => {
    expect(recurringDateOnOrAfter("2026-07-01", "weekly", "2026-07-09")).toBe("2026-07-15");
    expect(nextRecurringDate("2026-07-01", "biweekly", "2026-07-01")).toBe("2026-07-15");
    expect(nextRecurringDate("2024-02-29", "yearly", "2024-02-29")).toBe("2025-02-28");
    expect(nextRecurringDate("2024-02-29", "yearly", "2025-02-28")).toBe("2026-02-28");
  });
});

describe("recurring transaction materialization", () => {
  it("starts after today without backfilling when an older entry becomes recurring", () => {
    const result = recurringScheduleFromTransaction({
      id: "rec-salary",
      transaction: {
        type: "income",
        amount: 28_000,
        currency: "HKD",
        categoryId: "cat-salary",
        date: "2026-05-31",
        note: "Salary",
      },
      frequency: "monthly",
      throughDate: "2026-08-01",
      createdAt: timestamp,
    });

    expect(result).toMatchObject({
      startDate: "2026-05-31",
      nextDate: "2026-08-31",
      isActive: true,
    });
  });

  it("adds a due entry with the due date and the real generation timestamp", () => {
    const result = materializeDueRecurringTransactions(
      {
        ...seedSnapshot,
        transactions: [],
        recurringTransactions: [schedule()],
      },
      "2026-08-01",
      timestamp,
    );

    expect(result.transactions).toEqual([
      expect.objectContaining({
        id: "txn-rec-rec-rent-2026-07-31",
        date: "2026-07-31",
        recurrenceDate: "2026-07-31",
        recurringTransactionId: "rec-rent",
        createdAt: timestamp,
      }),
    ]);
    expect(result.recurringTransactions[0]?.nextDate).toBe("2026-08-31");
  });

  it("is idempotent and treats an archived occurrence as intentionally skipped", () => {
    const archivedOccurrence: Transaction = {
      id: "txn-skipped",
      type: "expense",
      amount: 12_000,
      currency: "HKD",
      categoryId: "cat-food",
      date: "2026-07-31",
      recurringTransactionId: "rec-rent",
      recurrenceDate: "2026-07-31",
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: timestamp,
    };
    const first = materializeDueRecurringTransactions(
      {
        ...seedSnapshot,
        transactions: [archivedOccurrence],
        recurringTransactions: [schedule()],
      },
      "2026-08-01",
      timestamp,
    );
    const second = materializeDueRecurringTransactions(first, "2026-08-01", timestamp);

    expect(first.transactions).toEqual([archivedOccurrence]);
    expect(first.recurringTransactions[0]?.nextDate).toBe("2026-08-31");
    expect(second).toBe(first);
  });

  it("does nothing while a schedule is paused", () => {
    const snapshot = {
      ...seedSnapshot,
      transactions: [],
      recurringTransactions: [schedule({ isActive: false })],
    };
    expect(materializeDueRecurringTransactions(snapshot, "2026-08-01", timestamp)).toBe(snapshot);
  });

  it("converts active schedules to a comparable monthly estimate", () => {
    expect(monthlyEquivalentAmount(schedule({ amount: 120, frequency: "weekly" }))).toBe(520);
    expect(monthlyEquivalentAmount(schedule({ amount: 120, frequency: "biweekly" }))).toBe(260);
    expect(monthlyEquivalentAmount(schedule({ amount: 120, frequency: "monthly" }))).toBe(120);
    expect(monthlyEquivalentAmount(schedule({ amount: 120, frequency: "yearly" }))).toBe(10);
  });
});

describe("recurring Calendar projections", () => {
  it("projects the next monthly occurrence and additional future months", () => {
    const projections = projectRecurringOccurrences({
      schedules: [
        schedule({
          id: "rec-salary",
          type: "income",
          amount: 28_000,
          categoryId: "cat-salary",
          note: "Salary",
          startDate: "2026-08-03",
          nextDate: "2026-09-03",
        }),
      ],
      transactions: [],
      fromDate: "2026-08-01",
      throughDate: "2026-11-30",
      todayDate: "2026-08-03",
    });

    expect(projections.map((projection) => projection.date)).toEqual([
      "2026-09-03",
      "2026-10-03",
      "2026-11-03",
    ]);
    expect(projections.every((projection) => projection.isProjected)).toBe(true);
    expect(projections[0]).toMatchObject({
      id: "projection-rec-rec-salary-2026-09-03",
      recurringTransactionId: "rec-salary",
      recurrenceDate: "2026-09-03",
      amount: 28_000,
      type: "income",
    });
  });

  it("keeps month-end anchors through February instead of drifting", () => {
    const projections = projectRecurringOccurrences({
      schedules: [
        schedule({
          startDate: "2026-01-31",
          nextDate: "2026-02-28",
        }),
      ],
      transactions: [],
      fromDate: "2026-02-01",
      throughDate: "2026-03-31",
      todayDate: "2026-02-01",
    });

    expect(projections.map((projection) => projection.date)).toEqual(["2026-02-28", "2026-03-31"]);
  });

  it("projects weekly, biweekly, and yearly schedules from their original anchors", () => {
    const shortTermProjections = projectRecurringOccurrences({
      schedules: [
        schedule({
          id: "rec-weekly",
          frequency: "weekly",
          startDate: "2026-08-03",
          nextDate: "2026-08-10",
        }),
        schedule({
          id: "rec-biweekly",
          frequency: "biweekly",
          startDate: "2026-08-03",
          nextDate: "2026-08-17",
        }),
      ],
      transactions: [],
      fromDate: "2026-08-01",
      throughDate: "2026-08-31",
      todayDate: "2026-08-03",
    });

    expect(
      shortTermProjections.map((projection) => [
        projection.recurringTransactionId,
        projection.date,
      ]),
    ).toEqual([
      ["rec-weekly", "2026-08-10"],
      ["rec-biweekly", "2026-08-17"],
      ["rec-weekly", "2026-08-17"],
      ["rec-weekly", "2026-08-24"],
      ["rec-biweekly", "2026-08-31"],
      ["rec-weekly", "2026-08-31"],
    ]);

    const yearlyProjections = projectRecurringOccurrences({
      schedules: [
        schedule({
          id: "rec-yearly",
          frequency: "yearly",
          startDate: "2024-02-29",
          nextDate: "2025-02-28",
        }),
      ],
      transactions: [],
      fromDate: "2025-01-01",
      throughDate: "2026-03-01",
      todayDate: "2024-03-01",
    });

    expect(yearlyProjections.map((projection) => projection.date)).toEqual([
      "2025-02-28",
      "2026-02-28",
    ]);
  });

  it("does not project paused or archived schedules", () => {
    expect(
      projectRecurringOccurrences({
        schedules: [
          schedule({ id: "rec-paused", isActive: false, nextDate: "2026-09-03" }),
          schedule({
            id: "rec-archived",
            nextDate: "2026-09-03",
            archivedAt: timestamp,
          }),
        ],
        transactions: [],
        fromDate: "2026-08-01",
        throughDate: "2026-09-30",
        todayDate: "2026-08-03",
      }),
    ).toEqual([]);
  });

  it("suppresses an occurrence already materialized in local history", () => {
    const materializedOccurrence: Transaction = {
      id: "txn-rec-salary-2026-09-03",
      type: "income",
      amount: 28_000,
      currency: "HKD",
      categoryId: "cat-salary",
      date: "2026-09-03",
      note: "Salary",
      recurringTransactionId: "rec-salary",
      recurrenceDate: "2026-09-03",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const projections = projectRecurringOccurrences({
      schedules: [
        schedule({
          id: "rec-salary",
          type: "income",
          amount: 28_000,
          categoryId: "cat-salary",
          startDate: "2026-08-03",
          nextDate: "2026-09-03",
        }),
      ],
      transactions: [materializedOccurrence],
      fromDate: "2026-09-01",
      throughDate: "2026-10-31",
      todayDate: "2026-08-03",
    });

    expect(projections.map((projection) => projection.date)).toEqual(["2026-10-03"]);
  });
});
