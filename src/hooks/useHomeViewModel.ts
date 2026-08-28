import { useMemo } from "react";

import {
  deriveFireView,
  deriveProjectedFireDays,
  monthlyMoneyTimeConversions,
} from "../engine/selectors";
import { useFireStore } from "../data/fireStore";
import { daysBetweenIso, todayIso } from "../utils/format";

export function useHomeViewModel() {
  const { snapshot } = useFireStore();
  const today = todayIso();
  return useMemo(() => {
    const current = deriveFireView(snapshot, today);
    const monthStart = `${today.slice(0, 8)}01`;
    // Only the days-to-FIRE delta is needed from the month-start view; the
    // lightweight selector avoids a second full FIRE view derivation.
    const monthStartDays = deriveProjectedFireDays(snapshot, monthStart);
    const calendarDays = Math.max(0, daysBetweenIso(monthStart, today));
    const netDays =
      monthStartDays == null || current.projectedFireDays == null
        ? null
        : monthStartDays - current.projectedFireDays;
    return {
      ...current,
      moneyTimeConversions: monthlyMoneyTimeConversions(snapshot, today),
      acceleration: {
        calendarDays,
        projectionDays: netDays == null ? null : netDays - calendarDays,
        netDays,
      },
    };
  }, [snapshot, today]);
}
