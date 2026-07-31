export function fieldLabelWithUnit(label: string, unit?: string | null) {
  const normalizedUnit = unit?.trim();
  return normalizedUnit ? `${label} (${normalizedUnit})` : label;
}
