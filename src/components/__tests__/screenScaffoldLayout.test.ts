import {
  bottomNavigationPillHeight,
  getScreenBottomClearance,
  getKeyboardAwareBottomClearance,
  minimumBottomNavigationInset,
} from "../screenScaffoldLayout";
import { tokens } from "../../design/tokens";

describe("ScreenScaffold bottom clearance", () => {
  it("keeps tab screen content above the floating bar when gesture navigation has no inset", () => {
    expect(getScreenBottomClearance({ systemBottomInset: 0, hasBottomNavigation: true })).toBe(
      bottomNavigationPillHeight + minimumBottomNavigationInset + tokens.spacing.md,
    );
  });

  it("uses the larger system navigation inset when it is present", () => {
    expect(getScreenBottomClearance({ systemBottomInset: 24, hasBottomNavigation: true })).toBe(
      bottomNavigationPillHeight + 24 + tokens.spacing.md,
    );
  });

  it("leaves only the system inset and design spacing for non-tab screens", () => {
    expect(getScreenBottomClearance({ systemBottomInset: 24, hasBottomNavigation: false })).toBe(
      24 + tokens.spacing.md,
    );
  });

  it("uses the live IME inset when the keyboard needs more room than the tab bar", () => {
    expect(
      getKeyboardAwareBottomClearance({
        systemBottomInset: 24,
        hasBottomNavigation: true,
        imeInset: 280,
      }),
    ).toBe(280 + tokens.spacing.md);
  });

  it("keeps the normal tab clearance after the keyboard closes", () => {
    expect(
      getKeyboardAwareBottomClearance({
        systemBottomInset: 24,
        hasBottomNavigation: true,
        imeInset: 0,
      }),
    ).toBe(bottomNavigationPillHeight + 24 + tokens.spacing.md);
  });
});
