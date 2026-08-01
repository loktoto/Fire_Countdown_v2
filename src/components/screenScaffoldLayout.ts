import { tokens } from "../design/tokens";

export const bottomNavigationPillHeight = 66;
export const minimumBottomNavigationInset = 10;

/**
 * Mirrors the floating tab bar's bottom offset so scrollable screen content
 * always finishes above both the tab pill and Android's system navigation area.
 */
export function getBottomNavigationClearance(systemBottomInset: number) {
  return (
    bottomNavigationPillHeight +
    Math.max(systemBottomInset, minimumBottomNavigationInset) +
    tokens.spacing.md
  );
}

export function getScreenBottomClearance({
  systemBottomInset,
  hasBottomNavigation,
}: {
  systemBottomInset: number;
  hasBottomNavigation: boolean;
}) {
  return hasBottomNavigation
    ? getBottomNavigationClearance(systemBottomInset)
    : systemBottomInset + tokens.spacing.md;
}

export function getKeyboardAwareBottomClearance({
  systemBottomInset,
  hasBottomNavigation,
  imeInset,
}: {
  systemBottomInset: number;
  hasBottomNavigation: boolean;
  imeInset: number;
}) {
  const screenClearance = getScreenBottomClearance({ systemBottomInset, hasBottomNavigation });

  return imeInset > 0 ? Math.max(screenClearance, imeInset + tokens.spacing.md) : screenClearance;
}
