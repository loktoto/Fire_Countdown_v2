import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { MotionPressable } from "./MotionPressable";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";

export function EditableRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <MotionPressable
      onPress={onPress}
      accessibilityLabel={`${label}, ${value}`}
      haptic="selection"
      style={[styles.row, { borderBottomColor: colors.surfaceBorder }]}
    >
      <View style={styles.textColumn}>
        <Text
          numberOfLines={2}
          style={[styles.label, typography.body, { color: colors.textMuted }]}
        >
          {label}
        </Text>
        <Text
          numberOfLines={2}
          minimumFontScale={0.86}
          adjustsFontSizeToFit
          style={[styles.value, typography.title, { color: colors.text }]}
        >
          {value}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
    paddingVertical: 10,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  value: {
    fontSize: 16,
    lineHeight: 21,
  },
});
