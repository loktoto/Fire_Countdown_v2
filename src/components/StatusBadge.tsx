import { StyleSheet, Text, View } from "react-native";

import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "positive" | "negative" | "primary" | "warning";
}) {
  const colors = useThemeColors();
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

  return (
    <View
      style={[styles.badge, { borderColor: `${toneColor}55`, backgroundColor: `${toneColor}18` }]}
    >
      <Text style={[styles.text, typography.button, { color: toneColor }]}>{label}</Text>
    </View>
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
