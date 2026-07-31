function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function milestoneProgressValues({
  activeTarget,
  currentAmount,
  maxTarget,
  previousTarget,
}: {
  activeTarget: number;
  currentAmount: number;
  maxTarget: number;
  previousTarget: number;
}) {
  const safeActiveTarget = Math.max(1, activeTarget);
  const stageRange = Math.max(1, safeActiveTarget - previousTarget);

  return {
    active: clamp01(currentAmount / safeActiveTarget),
    journey: clamp01(currentAmount / Math.max(1, maxTarget)),
    stage: clamp01((currentAmount - previousTarget) / stageRange),
  };
}

export function shouldStackMilestoneSummary(width: number, fontScale: number) {
  return width < 400 || fontScale > 1.1;
}

export function shouldStackMilestoneCards(width: number, fontScale: number) {
  return width < 360 || fontScale > 1.2;
}
