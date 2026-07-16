import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { FIRE_DESTINATION_IDS, FireDestinationPair } from "./FireDestination";
import { MotionPressable } from "./MotionPressable";
import { sheetBackdropEnter, sheetBackdropExit, sheetEnter, sheetExit } from "../design/motion";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { FireDestinationId } from "../features/types";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";

export function FireDestinationPickerSheet({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: FireDestinationId;
  onSelect: (id: FireDestinationId) => void;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const reducedMotion = useReducedMotion();

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View
          entering={reducedMotion ? undefined : sheetBackdropEnter}
          exiting={reducedMotion ? undefined : sheetBackdropExit}
          style={styles.scrim}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          entering={reducedMotion ? undefined : sheetEnter}
          exiting={reducedMotion ? undefined : sheetExit}
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
                FIRE
              </Text>
              <Text style={[styles.title, typography.display, { color: colors.text }]}>
                {t.fireImpact.chooseDestination}
              </Text>
            </View>
            <MotionPressable
              onPress={onClose}
              accessibilityLabel={t.common.close}
              style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </MotionPressable>
          </View>

          <View style={styles.grid}>
            {FIRE_DESTINATION_IDS.map((id) => {
              const selected = id === value;
              const label = t.fireImpact.destinationNames[id];
              return (
                <MotionPressable
                  key={id}
                  onPress={() => {
                    onSelect(id);
                    onClose();
                  }}
                  haptic="selection"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected ? `${colors.primary}14` : colors.backgroundAlt,
                      borderColor: selected ? colors.primary : colors.surfaceBorder,
                    },
                  ]}
                >
                  <FireDestinationPair
                    id={id}
                    positive={colors.positive}
                    negative={colors.negative}
                  />
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.optionLabel,
                      typography.button,
                      { color: selected ? colors.primary : colors.text },
                    ]}
                  >
                    {label}
                  </Text>
                  {selected ? (
                    <View style={[styles.check, { backgroundColor: colors.primary }]}>
                      <MaterialCommunityIcons name="check" size={14} color={colors.onPrimary} />
                    </View>
                  ) : null}
                </MotionPressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: 34,
    gap: tokens.spacing.lg,
  },
  grabber: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: tokens.radius.pill,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontSize: 11,
    lineHeight: 15,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  option: {
    position: "relative",
    width: "48.5%",
    minHeight: 122,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.xs,
  },
  optionLabel: {
    width: "100%",
    textAlign: "center",
    fontSize: 13,
  },
  check: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
