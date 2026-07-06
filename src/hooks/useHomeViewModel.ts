import { useMemo } from "react";

import { deriveFireView } from "../engine/selectors";
import { useFireStore } from "../data/fireStore";
import { todayIso } from "../utils/format";

export function useHomeViewModel() {
  const { snapshot } = useFireStore();
  const today = todayIso();
  return useMemo(() => deriveFireView(snapshot, today), [snapshot, today]);
}
