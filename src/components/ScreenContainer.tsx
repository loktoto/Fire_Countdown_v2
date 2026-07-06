import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { enter } from "../design/motion";
import { tokens } from "../design/tokens";
import { useThemeColors } from "../design/theme";

export function ScreenContainer({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const content = (
    <Animated.View
      entering={enter()}
      style={[
        styles.inner,
        {
          paddingTop: Math.max(insets.top + tokens.spacing.lg, tokens.spacing.xl),
          paddingBottom: Math.max(insets.bottom + 116, 132),
        },
      ]}
    >
      {children}
    </Animated.View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.mode === "dark" ? "light" : "dark"} />
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    gap: 26,
    paddingHorizontal: tokens.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
