export function money(value: number, currency = "HKD") {
  return `${currency} ${Math.round(value).toLocaleString()}`;
}

export function percent(value: number, digits = 1) {
  const scaled = value * 100;
  const threshold = 0.5 * 10 ** -digits;
  const normalized = Math.abs(scaled) < threshold ? 0 : scaled;
  return `${normalized.toFixed(digits)}%`;
}

// Cached formatters: creating an Intl.DateTimeFormat per call is expensive,
// and these helpers run inside list rows and calendar cells on every render.
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

function cachedFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = dateTimeFormatCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale || "en-US", options);
    dateTimeFormatCache.set(key, formatter);
  }
  return formatter;
}

export function shortDateTime(value: string | null | undefined, locale = "en-US") {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "";
  }
  return cachedFormatter(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function signedMoney(value: number, currency = "HKD") {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
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

export function formatMonthYear(date: string, locale?: string) {
  const parts = isoDateParts(date);
  return cachedFormatter(locale ?? "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(parts.year, parts.month - 1, 1));
}

export function formatShortMonthYear(date: string, locale?: string) {
  const parts = isoDateParts(date);
  return cachedFormatter(locale ?? "en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(parts.year, parts.month - 1, 1));
}

export function formatFullDate(date: string, locale?: string) {
  const parts = isoDateParts(date);
  return cachedFormatter(locale ?? "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(parts.year, parts.month - 1, parts.day));
}

export function formatLogDateLabel(date: string, today = todayIso()) {
  if (date === today) {
    return "Today";
  }

  if (date === addIsoDays(today, -1)) {
    return "Yesterday";
  }

  return cachedFormatter("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatLogDateChipLabel(date: string, today = todayIso()) {
  if (date === today) {
    return "Today";
  }

  if (date === addIsoDays(today, -1)) {
    return "Yday";
  }

  return cachedFormatter("en-US", {
    weekday: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatShortDate(date: string) {
  return cachedFormatter("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatDateInputLabel(date: string, locale?: string) {
  const { year, month, day } = isoDateParts(date);
  return cachedFormatter(locale ?? "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(year, month - 1, day));
}

export function formatCompactDateInputLabel(
  date: string,
  locale?: string,
  referenceDate = todayIso(),
) {
  const { year, month, day } = isoDateParts(date);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    ...(date === referenceDate ? {} : { year: "numeric" as const }),
    month: "short",
    day: "numeric",
  });
}
