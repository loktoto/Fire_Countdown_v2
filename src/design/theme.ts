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
    surface: isDark ? "rgba(255,255,255,0.035)" : "rgba(238,242,239,0.98)",
    surfaceSolid: isDark ? tokens.color.obsidianRaised : tokens.color.offWhiteRaised,
    surfaceBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(31,48,54,0.22)",
    text: isDark ? "#FFFFFF" : "#15191C",
    textMuted: isDark ? tokens.color.muted : "#5A6670",
    textSubtle: isDark ? "#B9CACB" : "#2F3E46",
    primary: isDark ? tokens.color.cyan : tokens.color.lightCyan,
    primaryFill: isDark ? tokens.color.cyan : tokens.color.lightCyanFill,
    onPrimary: isDark ? tokens.color.obsidian : "#FFFFFF",
    positive: isDark ? tokens.color.emerald : tokens.color.lightEmerald,
    negative: isDark ? tokens.color.red : tokens.color.lightRed,
    warning: isDark ? tokens.color.amber : tokens.color.lightAmber,
    nav: isDark ? "rgba(18,19,24,0.92)" : "rgba(245,247,244,0.96)",
    shadow: isDark ? "rgba(0,240,255,0.12)" : "rgba(24,50,56,0.1)",
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
