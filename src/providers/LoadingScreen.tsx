import { ActivityIndicator, StyleSheet, Text, View, type ColorSchemeName } from "react-native";

import { tokens } from "../design/tokens";

export type LoadingScreenProps = {
  colorScheme: ColorSchemeName;
  locale: string;
};

function usesTraditionalChinese(locale: string) {
  const normalized = locale.trim().replaceAll("_", "-").toLowerCase();
  return (
    normalized.startsWith("zh-hant") ||
    normalized.startsWith("zh-hk") ||
    normalized.startsWith("zh-mo") ||
    normalized.startsWith("zh-tw")
  );
}

export function systemLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || "en";
  } catch {
    return "en";
  }
}

export function loadingScreenPresentation(colorScheme: ColorSchemeName, locale: string) {
  const dark = colorScheme === "dark";
  return {
    backgroundColor: dark ? tokens.color.obsidian : tokens.color.offWhite,
    indicatorColor: dark ? tokens.color.cyan : tokens.color.lightCyan,
    titleColor: dark ? "#F5F8F6" : tokens.color.ink,
    metaColor: dark ? "#A8B3B0" : "#687773",
    loadingLabel: usesTraditionalChinese(locale) ? "載入中…" : "Loading…",
  };
}

export function LoadingScreen({ colorScheme, locale }: LoadingScreenProps) {
  const presentation = loadingScreenPresentation(colorScheme, locale);

  return (
    <View
      testID="loading-screen"
      style={[styles.screen, { backgroundColor: presentation.backgroundColor }]}
    >
      <ActivityIndicator
        testID="loading-indicator"
        accessibilityLabel={presentation.loadingLabel}
        accessibilityRole="progressbar"
        color={presentation.indicatorColor}
        size="small"
      />
      <Text testID="loading-title" style={[styles.title, { color: presentation.titleColor }]}>
        Fire Countdown
      </Text>
      <Text
        testID="loading-meta"
        accessibilityLiveRegion="polite"
        style={[styles.meta, { color: presentation.metaColor }]}
      >
        {presentation.loadingLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  title: {
    marginTop: tokens.spacing.sm,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 13,
  },
});
