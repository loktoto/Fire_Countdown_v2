import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { typography, useThemeColors } from "../src/design/theme";
import { tokens } from "../src/design/tokens";

export default function NotFound() {
  const colors = useThemeColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="compass-outline" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.title, typography.title, { color: colors.text }]}>
          Route not found
        </Text>
        <Text style={[styles.copy, typography.body, { color: colors.textMuted }]}>
          This page is not part of your current FIRE plan.
        </Text>
        <Link
          href="/(tabs)/log"
          style={[
            styles.link,
            typography.button,
            { backgroundColor: colors.primaryFill, color: colors.onPrimary },
          ]}
        >
          Return to Log
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    gap: tokens.spacing.sm,
    padding: tokens.spacing.xl,
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: tokens.spacing.sm,
    borderRadius: tokens.radius.utility,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  copy: {
    maxWidth: 280,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    minHeight: 44,
    marginTop: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: 12,
    borderRadius: tokens.radius.pill,
    overflow: "hidden",
  },
});
