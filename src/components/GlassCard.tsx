import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { tokens } from "../design/tokens";
import { useThemeColors } from "../design/theme";

export function GlassCard({
  children,
  style,
  compact = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <BlurView
      tint={colors.mode === "dark" ? "dark" : "default"}
      intensity={colors.mode === "dark" ? 36 : 0}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          padding: compact ? tokens.spacing.md : tokens.spacing.lg,
        },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: tokens.radius.card,
  },
  content: {
    gap: 18,
  },
});
