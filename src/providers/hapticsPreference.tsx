import { createContext, useContext, useMemo, type ReactNode } from "react";

// Lightweight preference channel for leaf components (pressables, toggles).
// Subscribing to the full FireSnapshot store re-renders every button in the
// app on any data change; this context only carries what those leaves need.
const HapticsPreferenceContext = createContext<boolean | null>(null);

export function HapticsPreferenceProvider({
  hapticsEnabled,
  children,
}: {
  hapticsEnabled: boolean;
  children: ReactNode;
}) {
  const value = useMemo(() => hapticsEnabled, [hapticsEnabled]);
  return (
    <HapticsPreferenceContext.Provider value={value}>{children}</HapticsPreferenceContext.Provider>
  );
}

/** Returns the stored haptics preference, or null when no provider is mounted. */
export function useStoredHapticsEnabled() {
  return useContext(HapticsPreferenceContext);
}
