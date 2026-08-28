import { formatImpactDayValue } from "./fireImpactPresentation";
import type { MoneyTimeConversion } from "../engine/selectors";

export type MoneyTimeImpactPresentation = {
  tone: "positive" | "negative" | "neutral";
  value: string | null;
  state: "days" | "unavailable" | "in-range" | "out-of-range";
};

export function moneyTimeImpactPresentation(
  entry: Pick<MoneyTimeConversion, "baseDays" | "impactDays" | "simulatedDays">,
  locale: string,
): MoneyTimeImpactPresentation {
  if (entry.baseDays === null && entry.simulatedDays === null) {
    return { tone: "neutral", value: null, state: "unavailable" };
  }

  if (entry.impactDays === Number.NEGATIVE_INFINITY) {
    return { tone: "positive", value: null, state: "in-range" };
  }

  if (entry.impactDays === Number.POSITIVE_INFINITY) {
    return { tone: "negative", value: null, state: "out-of-range" };
  }

  if (!Number.isFinite(entry.impactDays)) {
    return { tone: "neutral", value: null, state: "unavailable" };
  }

  const normalizedDays = Math.abs(entry.impactDays) < 0.00005 ? 0 : entry.impactDays;
  const sign = normalizedDays < 0 ? "−" : normalizedDays > 0 ? "+" : "";

  return {
    tone: normalizedDays < 0 ? "positive" : normalizedDays > 0 ? "negative" : "neutral",
    value: `${sign}${formatImpactDayValue(Math.abs(normalizedDays), locale)}`,
    state: "days",
  };
}
