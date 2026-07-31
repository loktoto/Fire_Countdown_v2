import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { tokens } from "./tokens";
import { useFireStore } from "../data/fireStore";
import type { FireSnapshot } from "../features/types";

export type ThemeColors = ReturnType<typeof getThemeColors>;

export function getThemeColors(mode: "dark" | "light") {
  const isDark = mode === "dark";

  return {
    mode,
    background: isDark ? tokens.color.obsidian : tokens.color.offWhite,
    backgroundAlt: isDark ? tokens.color.obsidianSurface : tokens.color.offWhitePanel,
    surface: isDark ? tokens.color.obsidianSurface : tokens.color.offWhiteRaised,
    surfaceSolid: isDark ? tokens.color.obsidianRaised : tokens.color.offWhiteRaised,
    surfaceElevated: isDark ? tokens.color.obsidianRaised : tokens.color.offWhitePanel,
    surfacePressed: isDark ? tokens.color.obsidianPressed : tokens.color.lightPressed,
    surfaceBorder: isDark ? tokens.color.darkBorder : tokens.color.lightBorder,
    divider: isDark ? "#223039" : "#E3E8E4",
    text: isDark ? "#F4F7F6" : tokens.color.ink,
    textMuted: isDark ? "#A8B3B0" : "#687773",
    textSubtle: isDark ? "#C7D0CE" : "#455752",
    textTertiary: isDark ? "#788580" : "#8D9995",
    disabled: isDark ? "#4E5A60" : "#B8C0BD",
    primary: isDark ? tokens.color.cyan : tokens.color.lightCyan,
    primaryFill: isDark ? tokens.color.cyan : tokens.color.lightCyanFill,
    primaryPressed: isDark ? "#39BDB6" : tokens.color.lightCyanPressed,
    primarySoft: isDark ? "#153936" : "#E3F2F0",
    primaryBorder: isDark ? "#2A6D68" : "#A9D9D5",
    onPrimary: isDark ? "#091117" : "#F7F7F3",
    projection: isDark ? tokens.color.indigo : tokens.color.lightIndigo,
    projectionSoft: isDark ? "#202D4A" : "#E9EDFA",
    target: isDark ? tokens.color.ochre : tokens.color.lightOchre,
    targetSoft: isDark ? "#382C1F" : "#F4E9DA",
    positive: isDark ? tokens.color.emerald : tokens.color.lightEmerald,
    positiveSoft: isDark ? "#17382C" : "#E5F5ED",
    negative: isDark ? tokens.color.red : tokens.color.lightRed,
    negativeSoft: isDark ? "#40202A" : "#FBE8EC",
    warning: isDark ? tokens.color.amber : tokens.color.lightAmber,
    warningSoft: isDark ? "#3C2D18" : "#F8EEDC",
    information: isDark ? tokens.color.indigo : tokens.color.lightIndigo,
    chartEtf: isDark ? "#55CCC5" : "#198F89",
    chartCash: isDark ? "#9DACC0" : "#8091A7",
    chartRealEstate: isDark ? "#D7A15A" : "#AE702A",
    chartBlue: isDark ? "#91A6EF" : "#4765B3",
    chartCoral: isDark ? "#D8897D" : "#A65F58",
    chartSage: isDark ? "#86A096" : "#657E72",
    nav: isDark ? "rgba(17,27,35,0.97)" : "rgba(252,253,251,0.97)",
    shadow: isDark ? "rgba(0,0,0,0.38)" : "rgba(20,33,31,0.10)",
    scrim: isDark ? "rgba(3,7,10,0.68)" : "rgba(22,34,31,0.24)",
  };
}

export function resolveThemeMode(
  preference: FireSnapshot["themeMode"] | null | undefined,
  system: ReturnType<typeof useColorScheme>,
): "dark" | "light" {
  if (preference === "dark" || preference === "light") {
    return preference;
  }
  return system === "dark" ? "dark" : "light";
}

export function useThemeColors() {
  const system = useColorScheme();
  const { snapshot } = useFireStore();
  const mode = resolveThemeMode(snapshot.themeMode, system);
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
