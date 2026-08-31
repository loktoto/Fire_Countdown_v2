export type WhatIfOutcome = {
  state: "unchanged" | "earlier" | "later" | "reachable" | "out-of-range" | "unavailable";
  tone: "positive" | "negative" | "neutral";
  durationDays: number | null;
};

export function whatIfOutcome(
  impactDays: number,
  baselineDate: string | null,
  resultDate: string | null,
): WhatIfOutcome {
  if (baselineDate === null && resultDate === null) {
    return { state: "unavailable", tone: "neutral", durationDays: null };
  }
  if (baselineDate === null && resultDate !== null) {
    return { state: "reachable", tone: "positive", durationDays: null };
  }
  if (baselineDate !== null && resultDate === null) {
    return { state: "out-of-range", tone: "negative", durationDays: null };
  }
  if (!Number.isFinite(impactDays)) {
    return { state: "unavailable", tone: "neutral", durationDays: null };
  }
  if (Math.abs(impactDays) < 0.5) {
    return { state: "unchanged", tone: "neutral", durationDays: 0 };
  }
  if (impactDays < 0) {
    return { state: "earlier", tone: "positive", durationDays: Math.abs(impactDays) };
  }
  return { state: "later", tone: "negative", durationDays: impactDays };
}

export function signedPercentChange(value: number, digits = 1) {
  const scaled = value * 100;
  const threshold = 0.5 * 10 ** -digits;
  const normalized = Math.abs(scaled) < threshold ? 0 : scaled;
  const sign = normalized > 0 ? "+" : normalized < 0 ? "\u2212" : "";
  return `${sign}${Math.abs(normalized).toFixed(digits)}%`;
}
