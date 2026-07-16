import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { enter } from "../design/motion";
import { tokens } from "../design/tokens";
import { useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function ScreenContainer({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const content = (
    <Animated.View
      entering={reducedMotion ? undefined : enter()}
      style={[
        styles.inner,
        {
          paddingTop: Math.max(insets.top + 16, tokens.spacing.xl),
          paddingBottom: Math.max(insets.bottom + 100, 116),
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
          contentInsetAdjustmentBehavior="never"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
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
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 24,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
