import { useMemo } from "react";

import { deriveFireView } from "../engine/selectors";
import { useFireStore } from "../data/fireStore";
import { daysBetweenIso, todayIso } from "../utils/format";

export function useHomeViewModel() {
  const { snapshot } = useFireStore();
  const today = todayIso();
  return useMemo(() => {
    const current = deriveFireView(snapshot, today);
    const monthStart = `${today.slice(0, 8)}01`;
    const monthStartView = deriveFireView(snapshot, monthStart);
    const calendarDays = Math.max(0, daysBetweenIso(monthStart, today));
    const netDays =
      monthStartView.projectedFireDays == null || current.projectedFireDays == null
        ? null
        : monthStartView.projectedFireDays - current.projectedFireDays;
    return {
      ...current,
      acceleration: {
        calendarDays,
        projectionDays: netDays == null ? null : netDays - calendarDays,
        netDays,
      },
    };
  }, [snapshot, today]);
}
