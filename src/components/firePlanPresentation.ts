export function fieldLabelWithUnit(label: string, unit?: string | null) {
  const normalizedUnit = unit?.trim();
  return normalizedUnit ? `${label} (${normalizedUnit})` : label;
}

export function optionalCurrentAgeFromText(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const age = Number.parseFloat(normalized);
  if (!Number.isFinite(age) || age <= 0 || age > 120) {
    return undefined;
  }

  return Math.max(1, Math.min(120, Math.floor(age)));
}
