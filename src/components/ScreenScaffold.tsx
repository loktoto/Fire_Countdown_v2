import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { enter } from "../design/motion";
import { tokens } from "../design/tokens";
import { useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { getKeyboardAwareBottomClearance } from "./screenScaffoldLayout";

export function ScreenScaffold({
  children,
  scroll = true,
  hasBottomNavigation = true,
  keyboardAware = false,
  scrollRef,
}: {
  children: ReactNode;
  scroll?: boolean;
  hasBottomNavigation?: boolean;
  keyboardAware?: boolean;
  scrollRef?: React.RefObject<ScrollView | null>;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const imeInset = useKeyboardInset(keyboardAware);
  const bottomClearance = getKeyboardAwareBottomClearance({
    systemBottomInset: insets.bottom,
    hasBottomNavigation,
    imeInset,
  });
  const content = (
    <Animated.View
      entering={reducedMotion ? undefined : enter()}
      style={[styles.inner, { paddingTop: Math.max(insets.top + 16, tokens.spacing.xl) }]}
    >
      {children}
    </Animated.View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.mode === "dark" ? "light" : "dark"} />
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          contentInsetAdjustmentBehavior="never"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomClearance }]}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.nonScrollContent, { paddingBottom: bottomClearance }]}>{content}</View>
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
  nonScrollContent: {
    flex: 1,
  },
});
