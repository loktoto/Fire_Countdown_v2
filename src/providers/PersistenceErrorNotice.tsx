import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MotionPressable } from "../components/MotionPressable";
import { useFireStore } from "../data/fireStore";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useI18n } from "../i18n";

export function PersistenceErrorNotice() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useI18n();
  const { persistenceError, dismissPersistenceError } = useFireStore();

  if (!persistenceError) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingTop: Math.max(insets.top, tokens.spacing.sm) }]}
    >
      <View
        style={[
          styles.notice,
          {
            backgroundColor: colors.negativeSoft,
            borderColor: colors.negative,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={[styles.message, typography.body, { color: colors.text }]}
        >
          {t.common.persistenceSaveError}
        </Text>
        <MotionPressable
          onPress={dismissPersistenceError}
          accessibilityLabel={t.common.dismissPersistenceError}
          style={[styles.dismiss, { borderColor: colors.negative }]}
        >
          <Text style={[styles.dismissLabel, typography.button, { color: colors.negative }]}>
            {t.common.close}
          </Text>
        </MotionPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 1000,
    paddingHorizontal: tokens.spacing.md,
  },
  notice: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  dismiss: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
});
