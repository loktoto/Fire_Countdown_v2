export function money(value: number, currency = "HKD") {
  return `${currency} ${Math.round(value).toLocaleString()}`;
}

export function percent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function signedMoney(value: number, currency = "HKD") {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${money(Math.abs(value), currency)}`;
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

const dayMs = 24 * 60 * 60 * 1000;

export function isoDateParts(date: string) {
  const [year = "0", month = "1", day = "1"] = date.split("-");
  return {
    year: Number.parseInt(year, 10),
    month: Number.parseInt(month, 10),
    day: Number.parseInt(day, 10),
  };
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function addIsoDays(date: string, days: number) {
  const parts = isoDateParts(date);
  return toIsoDate(new Date(parts.year, parts.month - 1, parts.day + days));
}

export function addIsoMonths(date: string, months: number) {
  const parts = isoDateParts(date);
  const targetMonthStart = new Date(parts.year, parts.month - 1 + months, 1);
  const targetYear = targetMonthStart.getFullYear();
  const targetMonth = targetMonthStart.getMonth();
  const targetMonthDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  return toIsoDate(new Date(targetYear, targetMonth, Math.min(parts.day, targetMonthDays)));
}

export function daysBetweenIso(start: string, end: string) {
  const startParts = isoDateParts(start);
  const endParts = isoDateParts(end);
  const startUtc = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
  const endUtc = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
  return Math.round((endUtc - startUtc) / dayMs);
}

export function daysInIsoMonth(date: string) {
  const parts = isoDateParts(date);
  return new Date(parts.year, parts.month, 0).getDate();
}

export function formatMonthYear(date: string) {
  const parts = isoDateParts(date);
  return new Date(parts.year, parts.month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function formatLogDateLabel(date: string, today = todayIso()) {
  if (date === today) {
    return "Today";
  }

  if (date === addIsoDays(today, -1)) {
    return "Yesterday";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatLogDateChipLabel(date: string, today = todayIso()) {
  if (date === today) {
    return "Today";
  }

  if (date === addIsoDays(today, -1)) {
    return "Yday";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
}

export function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
