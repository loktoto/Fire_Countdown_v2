import { StyleSheet, Text, View } from "react-native";

import { MotionPressable } from "./MotionPressable";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (next: T) => void;
}) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <MotionPressable
            key={option.value}
            onPress={() => onChange(option.value)}
            haptic="selection"
            style={[
              styles.option,
              {
                backgroundColor: active ? colors.primary : "transparent",
              },
            ]}
            accessibilityLabel={option.label}
          >
            <Text
              style={[
                styles.label,
                typography.button,
                { color: active ? colors.onPrimary : colors.textMuted },
              ]}
            >
              {option.label}
            </Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: 42,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
  },
});
