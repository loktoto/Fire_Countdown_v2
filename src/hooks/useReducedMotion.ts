import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// One shared AccessibilityInfo subscription for the whole app: previously every
// component calling useReducedMotion (40+ call sites) registered its own
// listener and ran its own async check at mount.
let sharedReducedMotion = false;
const subscribers = new Set<(value: boolean) => void>();
let globalListenerReady = false;

function notify(value: boolean) {
  sharedReducedMotion = value;
  subscribers.forEach((subscriber) => subscriber(value));
}

function ensureGlobalListener() {
  if (globalListenerReady) {
    return;
  }
  globalListenerReady = true;

  void AccessibilityInfo.isReduceMotionEnabled().then(notify);
  AccessibilityInfo.addEventListener("reduceMotionChanged", notify);
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(sharedReducedMotion);

  useEffect(() => {
    ensureGlobalListener();

    subscribers.add(setReducedMotion);
    return () => {
      subscribers.delete(setReducedMotion);
    };
  }, []);

  return reducedMotion;
}
