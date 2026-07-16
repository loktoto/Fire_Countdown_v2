export type AllocationInput = {
  label: string;
  value: number;
};

export function allocationPresentation(segments: AllocationInput[]) {
  const visible = segments.filter((segment) => Number.isFinite(segment.value) && segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  return {
    total,
    rows: visible.map((segment) => ({
      ...segment,
      percent: total > 0 ? segment.value / total : 0,
    })),
  };
}
