import type { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { enter } from "../design/motion";
import { tokens } from "../design/tokens";
import { useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function GlassCard({
  children,
  style,
  compact = false,
  tone = "default",
  motionIndex = 0,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  tone?: "default" | "accent";
  motionIndex?: number;
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reducedMotion ? undefined : enter(motionIndex)}
      style={[
        styles.card,
        {
          backgroundColor: tone === "accent" ? colors.primarySoft : colors.surface,
          borderColor: tone === "accent" ? `${colors.primary}42` : colors.surfaceBorder,
          padding: compact ? tokens.spacing.md : tokens.spacing.lg,
          boxShadow:
            colors.mode === "dark"
              ? "0 1px 0 rgba(255,255,255,0.015)"
              : "0 1px 2px rgba(34,57,51,0.035)",
        },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
  },
  content: {
    gap: tokens.spacing.md,
  },
});
