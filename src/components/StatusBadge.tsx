import { StyleSheet, Text } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";

import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "positive" | "negative" | "primary" | "warning";
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const toneColor =
    tone === "positive"
      ? colors.positive
      : tone === "negative"
        ? colors.negative
        : tone === "warning"
          ? colors.warning
          : tone === "primary"
            ? colors.primary
            : colors.textMuted;
  const toneBackground =
    tone === "positive"
      ? colors.positiveSoft
      : tone === "negative"
        ? colors.negativeSoft
        : tone === "warning"
          ? colors.warningSoft
          : tone === "primary"
            ? colors.primarySoft
            : colors.surfaceElevated;

  return (
    <Animated.View
      key={`${tone}-${label}`}
      entering={reducedMotion ? undefined : FadeIn.duration(180).easing(Easing.out(Easing.cubic))}
      style={[styles.badge, { borderColor: `${toneColor}44`, backgroundColor: toneBackground }]}
    >
      <Text style={[styles.text, typography.button, { color: toneColor }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
