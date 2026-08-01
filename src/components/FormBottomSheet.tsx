import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MotionPressable } from "./MotionPressable";
import { sheetBackdropEnter, sheetBackdropExit, sheetEnter, sheetExit } from "../design/motion";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function FormBottomSheet({
  visible,
  kicker,
  title,
  closeLabel,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  kicker?: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const imeInset = useKeyboardInset(visible);
  const reducedMotion = useReducedMotion();
  const { fontScale, height } = useWindowDimensions();
  const shouldUseFullHeight = fontScale >= 1.4 || height < 700;
  const bottomInset = Math.max(insets.bottom, imeInset);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <Animated.View
          entering={reducedMotion ? undefined : sheetBackdropEnter}
          exiting={reducedMotion ? undefined : sheetBackdropExit}
          pointerEvents="auto"
          style={styles.scrim}
        />
        <Animated.View
          accessibilityViewIsModal
          entering={reducedMotion ? undefined : sheetEnter}
          exiting={reducedMotion ? undefined : sheetExit}
          style={[
            styles.sheet,
            shouldUseFullHeight ? { height: height - insets.top - tokens.spacing.sm } : undefined,
            { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              {kicker ? (
                <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
                  {kicker}
                </Text>
              ) : null}
              <Text
                numberOfLines={shouldUseFullHeight ? 2 : 1}
                style={[styles.title, typography.title, { color: colors.text }]}
              >
                {title}
              </Text>
            </View>
            <MotionPressable
              onPress={onClose}
              accessibilityLabel={closeLabel}
              hitSlop={8}
              style={[styles.close, { backgroundColor: colors.backgroundAlt }]}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </MotionPressable>
          </View>
          <ScrollView
            contentInsetAdjustmentBehavior="never"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.body,
              { paddingBottom: bottomInset + (footer ? 76 : tokens.spacing.md) },
            ]}
          >
            {children}
          </ScrollView>
          {footer ? (
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.surfaceBorder,
                  paddingBottom: Math.max(insets.bottom, tokens.spacing.sm),
                },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(5, 11, 14, 0.52)" },
  sheet: {
    maxHeight: "92%",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  grabber: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    marginTop: tokens.spacing.sm,
  },
  header: {
    minHeight: 64,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: { fontSize: 12, textTransform: "uppercase" },
  title: { fontSize: 24, lineHeight: 30 },
  close: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
  },
  footer: { padding: tokens.spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
