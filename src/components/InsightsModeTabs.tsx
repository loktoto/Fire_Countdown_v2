import { StyleSheet, Text, View } from "react-native";

import { MotionPressable } from "./MotionPressable";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useI18n } from "../i18n";

export type InsightsMode = "overview" | "what-if";

export const defaultInsightsMode: InsightsMode = "overview";

export function InsightsModeTabs({
  value,
  onChange,
}: {
  value: InsightsMode;
  onChange: (value: InsightsMode) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const tabs: { value: InsightsMode; label: string }[] = [
    { value: "overview", label: t.dashboard.overview },
    { value: "what-if", label: t.dashboard.whatIf },
  ];

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
      ]}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <MotionPressable
            key={tab.value}
            testID={`insights-mode-${tab.value}`}
            onPress={() => onChange(tab.value)}
            haptic="selection"
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            style={[
              styles.tab,
              selected
                ? { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }
                : undefined,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                typography.button,
                { color: selected ? colors.primary : colors.textMuted },
              ]}
            >
              {tab.label}
            </Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    minHeight: 52,
    flexDirection: "row",
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
    padding: 4,
  },
  tab: {
    minHeight: 44,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
  },
  label: { fontSize: 15, lineHeight: 20 },
});
