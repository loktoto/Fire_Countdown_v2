import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInUp } from "react-native-reanimated";

import { typography, useThemeColors } from "../design/theme";
import { tokens } from "../design/tokens";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function AppHeader({
  eyebrow,
  title,
  subtitle,
  action,
  accentColor,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  accentColor?: string;
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const titleEnter = FadeInUp.duration(260).easing(Easing.bezier(0.16, 1, 0.3, 1));

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        {eyebrow ? (
          <Animated.Text
            entering={reducedMotion ? undefined : FadeIn.duration(180)}
            style={[styles.eyebrow, typography.button, { color: accentColor ?? colors.primary }]}
          >
            {eyebrow}
          </Animated.Text>
        ) : null}
        <Animated.Text
          entering={reducedMotion ? undefined : titleEnter.delay(35)}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={[styles.title, typography.display, { color: colors.text }]}
        >
          {title}
        </Animated.Text>
        {subtitle ? (
          <Animated.Text
            entering={reducedMotion ? undefined : titleEnter.delay(75)}
            style={[styles.subtitle, typography.body, { color: colors.textMuted }]}
          >
            {subtitle}
          </Animated.Text>
        ) : null}
      </View>
      {action ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(200).delay(100)}
          style={styles.action}
        >
          {action}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 440,
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
