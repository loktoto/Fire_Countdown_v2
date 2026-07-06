import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { typography } from "../design/theme";

export function categoryIconLabel(icon?: string | null) {
  if (!icon) {
    return "";
  }
  return icon.startsWith("emoji:") ? icon.replace("emoji:", "") : icon;
}

export function isEmojiCategoryIcon(icon?: string | null) {
  return Boolean(icon?.startsWith("emoji:"));
}

export function CategoryGlyph({
  icon,
  color,
  size = 36,
}: {
  icon?: string | null;
  color: string;
  size?: number;
}) {
  const glyph = categoryIconLabel(icon);
  const iconName =
    glyph && glyph in MaterialCommunityIcons.glyphMap
      ? (glyph as keyof typeof MaterialCommunityIcons.glyphMap)
      : "shape-outline";

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}22`,
          borderColor: `${color}66`,
        },
      ]}
    >
      {isEmojiCategoryIcon(icon) ? (
        <Text
          maxFontSizeMultiplier={1}
          style={[styles.emoji, typography.bodyMedium, { fontSize: size * 0.48 }]}
        >
          {glyph}
        </Text>
      ) : (
        <MaterialCommunityIcons name={iconName} size={size * 0.56} color={color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emoji: {
    includeFontPadding: false,
    lineHeight: 28,
  },
});
