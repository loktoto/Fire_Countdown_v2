import {
  freedomDaysFunded,
  monthsOfRequiredWork,
  requiredWorkDaysForExpense,
  requiredWorkDaysReducedPerMonth,
} from "../timeLens";

describe("timeLens", () => {
  it("turns an asset into months of required work", () => {
    expect(monthsOfRequiredWork(267_910, 5_358.2)).toBeCloseTo(50, 1);
  });

  it("turns an asset into funded freedom days", () => {
    expect(freedomDaysFunded(10_000, 30_000)).toBeCloseTo(10.15, 1);
  });

  it("turns an expense into required-work days", () => {
    expect(requiredWorkDaysForExpense(1_200, 6_087.5)).toBeCloseTo(6, 1);
  });

  it("shows the monthly saving contribution as required-work days reduced", () => {
    expect(requiredWorkDaysReducedPerMonth(18_000, 24_000)).toBeCloseTo(22.83, 1);
  });

  it("does not invent a time meaning when an assumption is unavailable", () => {
    expect(monthsOfRequiredWork(1_000, 0)).toBeNull();
    expect(freedomDaysFunded(1_000, 0)).toBeNull();
    expect(requiredWorkDaysForExpense(Number.NaN, 1_000)).toBeNull();
  });
});
