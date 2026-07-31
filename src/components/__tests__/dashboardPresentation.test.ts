import { fireDurationFromDays, getDashboardLayout } from "../dashboardPresentation";

describe("getDashboardLayout", () => {
  it("stacks the forecast and primary stats on a 393dp iPhone", () => {
    expect(getDashboardLayout(393, 1)).toEqual({
      stackForecast: true,
      stackForecastStats: true,
      stackCashflowStats: false,
      stackSectionHeader: false,
      stackAssumptions: false,
    });
  });

  it("keeps secondary content compact on a 411dp Android phone", () => {
    expect(getDashboardLayout(411, 1)).toEqual({
      stackForecast: true,
      stackForecastStats: true,
      stackCashflowStats: false,
      stackSectionHeader: false,
      stackAssumptions: false,
    });
  });

  it("uses the wide layout on a tablet", () => {
    expect(getDashboardLayout(768, 1)).toEqual({
      stackForecast: false,
      stackForecastStats: false,
      stackCashflowStats: false,
      stackSectionHeader: false,
      stackAssumptions: false,
    });
  });

  it("stacks dense regions when the user increases text size", () => {
    expect(getDashboardLayout(768, 1.3)).toEqual({
      stackForecast: true,
      stackForecastStats: true,
      stackCashflowStats: true,
      stackSectionHeader: true,
      stackAssumptions: true,
    });
  });
});

describe("fireDurationFromDays", () => {
  it("turns a decimal-year forecast into calendar-like years and months", () => {
    expect(fireDurationFromDays(36.3 * 365.25)).toEqual({ years: 36, months: 4 });
  });

  it("handles forecasts shorter than one year", () => {
    expect(fireDurationFromDays((8 / 12) * 365.25)).toEqual({ years: 0, months: 8 });
  });

  it("clamps past forecasts and preserves a missing forecast", () => {
    expect(fireDurationFromDays(-30)).toEqual({ years: 0, months: 0 });
    expect(fireDurationFromDays(null)).toBeNull();
  });
});
