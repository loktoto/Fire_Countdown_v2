import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

import { sheetBackdropEnter, sheetBackdropExit, sheetEnter, sheetExit } from "../../design/motion";
import { tokens } from "../../design/tokens";
import { typography, useThemeColors } from "../../design/theme";
import type { FireGoal, Milestone, ProjectionScenario } from "../../features/types";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { MotionPressable } from "../MotionPressable";

// Shared patch/input types for the FIRE plan editor sheets.
export type FireGoalPatch = Partial<
  Pick<
    FireGoal,
    | "baseCurrency"
    | "currentAge"
    | "inflationRate"
    | "monthlySaving"
    | "name"
    | "targetAmount"
    | "targetMonthlySpending"
    | "withdrawalRate"
  >
>;

export type MilestonePatch = Partial<
  Pick<
    Milestone,
    "expectedReturnOverride" | "isActive" | "isHidden" | "name" | "targetAmount" | "targetDate"
  >
>;

export type ScenarioPatch = Partial<
  Pick<
    ProjectionScenario,
    | "expectedReturnAdjustment"
    | "inflationAdjustment"
    | "isDefault"
    | "monthlySavingAdjustment"
    | "name"
    | "targetSpendingAdjustment"
    | "withdrawalRateAdjustment"
  >
>;

export function normalizeNumberInput(raw: string, allowNegative = false) {
  const cleaned = raw.replace(",", ".").replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, "");
  const negative = allowNegative && cleaned.startsWith("-");
  const decimalParts = cleaned.replace(/-/g, "").split(".");
  const whole = decimalParts[0] ?? "";
  const decimals = decimalParts.slice(1).join("").slice(0, 4);
  const normalized = decimals.length > 0 ? `${whole}.${decimals}` : whole;
  return `${negative ? "-" : ""}${normalized}`.slice(0, 14);
}

export function normalizeDateInput(raw: string) {
  return raw.replace(/[^\d-]/g, "").slice(0, 10);
}

export function numberFromText(value: string, fallback = 0) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

export function percentText(value: number | null | undefined) {
  if (value == null) {
    return "";
  }
  return (value * 100).toFixed(2).replace(/\.?0+$/, "");
}

export function scenarioAssumptions(
  goal: FireGoal | null,
  scenario: ProjectionScenario,
  baseExpectedReturn = 0,
) {
  const targetMonthlySpending = Math.max(
    0,
    (goal?.targetMonthlySpending ?? 0) + scenario.targetSpendingAdjustment,
  );
  const monthlySaving = Math.max(0, (goal?.monthlySaving ?? 0) + scenario.monthlySavingAdjustment);
  const withdrawalRate = Math.max(
    0.001,
    (goal?.withdrawalRate ?? 0) + (scenario.withdrawalRateAdjustment ?? 0),
  );
  const inflationRate = (goal?.inflationRate ?? 0) + scenario.inflationAdjustment;
  const expectedReturn = Math.max(-0.95, baseExpectedReturn + scenario.expectedReturnAdjustment);

  return { expectedReturn, inflationRate, monthlySaving, targetMonthlySpending, withdrawalRate };
}

export function BaseSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
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
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetHeader({
  kicker,
  title,
  closeLabel,
  onClose,
}: {
  kicker: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  return (
    <>
      <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
            {kicker}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.title, typography.title, { color: colors.text }]}
          >
            {title}
          </Text>
        </View>
        <MotionPressable
          onPress={onClose}
          accessibilityLabel={closeLabel}
          style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}
        >
          <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
        </MotionPressable>
      </View>
    </>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  inputMode,
  maxLength,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "numbers-and-punctuation";
  inputMode?: "text" | "decimal" | "numeric";
  maxLength?: number;
  accessibilityLabel: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        inputMode={inputMode}
        maxLength={maxLength}
        selectTextOnFocus
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[
          styles.input,
          typography.body,
          {
            color: colors.text,
            borderColor: colors.surfaceBorder,
            backgroundColor: colors.backgroundAlt,
          },
        ]}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <MotionPressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected: value }}
      style={[
        styles.toggleRow,
        {
          borderColor: value ? colors.primaryBorder : colors.surfaceBorder,
          backgroundColor: value ? colors.primarySoft : colors.backgroundAlt,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={value ? "check-circle-outline" : "circle-outline"}
        size={20}
        color={value ? colors.primary : colors.textMuted}
      />
      <Text
        style={[
          styles.toggleText,
          typography.button,
          { color: value ? colors.primary : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
  );
}

export function SaveButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <MotionPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[styles.save, { backgroundColor: disabled ? colors.surfaceBorder : colors.primary }]}
    >
      <Text
        style={[
          styles.saveText,
          typography.button,
          { color: disabled ? colors.textMuted : colors.onPrimary },
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
  );
}

export function ResponsiveSplitFields({ children }: { children: ReactNode }) {
  const { fontScale, width } = useWindowDimensions();
  const shouldStack = width < 420 || fontScale >= 1.5;
  return (
    <View style={[styles.splitFields, shouldStack && styles.splitFieldsStack]}>{children}</View>
  );
}

export function TonalAddButton({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <MotionPressable
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        styles.tonalAddButton,
        { backgroundColor: colors.primarySoft, borderColor: `${colors.primary}52` },
      ]}
    >
      <MaterialCommunityIcons name="plus" size={19} color={colors.primary} />
      <Text style={[styles.tonalAddText, typography.button, { color: colors.primary }]}>
        {label}
      </Text>
    </MotionPressable>
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
    maxHeight: "90%",
    borderTopLeftRadius: tokens.radius.card,
    borderTopRightRadius: tokens.radius.card,
    borderWidth: 1,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  grabber: {
    alignSelf: "center",
    width: 48,
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
    minWidth: 0,
  },
  kicker: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  fieldGroup: {
    flex: 1,
    gap: tokens.spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 0,
    fontSize: 15,
  },
  splitFields: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  splitFieldsStack: {
    flexDirection: "column",
  },
  splitField: {
    flex: 1,
    minWidth: 0,
  },
  toggleRow: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  toggleText: {
    fontSize: 13,
  },
  save: {
    minHeight: 54,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 14,
  },
  tonalAddButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  tonalAddText: {
    fontSize: 14,
  },
  maxMethodsStatus: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  maxMethodsStatusText: {
    fontSize: 13,
  },
  listRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
    paddingVertical: 10,
  },
  scenarioComparison: { flex: 1, minWidth: 0, gap: 6 },
  scenarioComparisonTitle: { flexDirection: "row", alignItems: "center", gap: tokens.spacing.sm },
  scenarioName: { flex: 1, minWidth: 0, fontSize: 19, lineHeight: 24 },
  defaultBadge: {
    borderRadius: tokens.radius.pill,
    overflow: "hidden",
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    fontSize: 10,
    lineHeight: 14,
  },
  scenarioMetric: { flexDirection: "row", alignItems: "baseline", gap: tokens.spacing.md },
  scenarioMetricLabel: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 18 },
  scenarioMetricValue: {
    maxWidth: "58%",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  hidden: { display: "none" },
  listCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  listLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  listValue: {
    fontSize: 16,
    lineHeight: 21,
  },
  listMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  archive: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  archiveText: {
    fontSize: 13,
  },
});
