import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { tokens } from "./tokens";
import { useFireStore } from "../data/fireStore";

export type ThemeColors = ReturnType<typeof getThemeColors>;

export function getThemeColors(mode: "dark" | "light") {
  const isDark = mode === "dark";

  return {
    mode,
    background: isDark ? tokens.color.obsidian : tokens.color.offWhite,
    backgroundAlt: isDark ? tokens.color.obsidianSurface : tokens.color.offWhitePanel,
    surface: isDark ? "#131A21" : tokens.color.offWhiteRaised,
    surfaceSolid: isDark ? tokens.color.obsidianRaised : tokens.color.offWhiteRaised,
    surfaceElevated: isDark ? "#1A232C" : "#EFF1EC",
    surfaceBorder: isDark ? "rgba(198,216,212,0.10)" : "rgba(33,75,70,0.11)",
    divider: isDark ? "rgba(198,216,212,0.08)" : "rgba(33,75,70,0.09)",
    text: isDark ? "#F5F8F6" : tokens.color.ink,
    textMuted: isDark ? "#91A09F" : "#60706B",
    textSubtle: isDark ? "#C1CDCA" : "#334842",
    primary: isDark ? tokens.color.cyan : tokens.color.lightCyan,
    primaryFill: isDark ? tokens.color.cyan : tokens.color.lightCyanFill,
    primarySoft: isDark ? "rgba(89,209,197,0.11)" : "#DDEEEA",
    onPrimary: isDark ? "#071311" : "#F7FBF8",
    projection: isDark ? tokens.color.indigo : tokens.color.lightIndigo,
    projectionSoft: isDark ? "rgba(152,169,255,0.11)" : "#E7EAF7",
    target: isDark ? tokens.color.ochre : tokens.color.lightOchre,
    targetSoft: isDark ? "rgba(217,166,111,0.11)" : "#F2E6D9",
    positive: isDark ? tokens.color.emerald : tokens.color.lightEmerald,
    positiveSoft: isDark ? "rgba(87,212,155,0.12)" : "#DFF1E7",
    negative: isDark ? tokens.color.red : tokens.color.lightRed,
    negativeSoft: isDark ? "rgba(255,107,136,0.12)" : "#F7E2E8",
    warning: isDark ? tokens.color.amber : tokens.color.lightAmber,
    warningSoft: isDark ? "rgba(242,201,76,0.12)" : "#F4EFD4",
    nav: isDark ? "rgba(17,22,29,0.97)" : "rgba(251,251,247,0.97)",
    shadow: isDark ? "rgba(0,0,0,0.38)" : "rgba(28,58,52,0.12)",
    scrim: isDark ? "rgba(3,7,10,0.68)" : "rgba(22,34,31,0.24)",
  };
}

export function useThemeColors() {
  const system = useColorScheme();
  const { snapshot } = useFireStore();
  const mode = snapshot.themeMode ?? (system === "light" ? "light" : "dark");
  return useMemo(() => getThemeColors(mode), [mode]);
}

export const typography = {
  display: {
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: 0,
  },
  title: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    letterSpacing: 0,
  },
  button: {
    fontFamily: "SpaceGrotesk_500Medium",
    letterSpacing: 0,
  },
  body: {
    fontFamily: "Outfit_400Regular",
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: "Outfit_500Medium",
    letterSpacing: 0,
  },
};
