import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

import { MotionPressable } from "./MotionPressable";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { FireGoal, Milestone, ProjectionScenario } from "../features/types";
import { useI18n } from "../i18n";
import { money, percent } from "../utils/format";

type FireGoalPatch = Partial<
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

type MilestonePatch = Partial<
  Pick<
    Milestone,
    "expectedReturnOverride" | "isActive" | "isHidden" | "name" | "targetAmount" | "targetDate"
  >
>;

type ScenarioPatch = Partial<
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

function normalizeNumberInput(raw: string, allowNegative = false) {
  const cleaned = raw.replace(",", ".").replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, "");
  const negative = allowNegative && cleaned.startsWith("-");
  const decimalParts = cleaned.replace(/-/g, "").split(".");
  const whole = decimalParts[0] ?? "";
  const decimals = decimalParts.slice(1).join("").slice(0, 4);
  const normalized = decimals.length > 0 ? `${whole}.${decimals}` : whole;
  return `${negative ? "-" : ""}${normalized}`.slice(0, 14);
}

function normalizeDateInput(raw: string) {
  return raw.replace(/[^\d-]/g, "").slice(0, 10);
}

function numberFromText(value: string, fallback = 0) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

function percentText(value: number | null | undefined) {
  if (value == null) {
    return "";
  }
  return (value * 100).toFixed(2).replace(/\.?0+$/, "");
}

function scenarioAssumptions(
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

function BaseSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();

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
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={styles.scrim}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.duration(260)}
          exiting={SlideOutDown.duration(180)}
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

function SheetHeader({
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

function Field({
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

function ToggleRow({
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
          borderColor: value ? colors.positive : colors.surfaceBorder,
          backgroundColor: value ? `${colors.positive}16` : colors.backgroundAlt,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={value ? "check-circle-outline" : "circle-outline"}
        size={20}
        color={value ? colors.positive : colors.textMuted}
      />
      <Text
        style={[
          styles.toggleText,
          typography.button,
          { color: value ? colors.positive : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
  );
}

function SaveButton({
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

export function FirePlanEditorSheet({
  visible,
  goal,
  onClose,
  onSave,
}: {
  visible: boolean;
  goal: FireGoal | null;
  onClose: () => void;
  onSave: (goalId: string, patch: FireGoalPatch) => void;
}) {
  if (!visible || !goal) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <FirePlanEditorContent key={goal.id} goal={goal} onClose={onClose} onSave={onSave} />
    </BaseSheet>
  );
}

export function FirePlanSummarySheet({
  visible,
  goal,
  currency,
  onClose,
  onEdit,
}: {
  visible: boolean;
  goal: FireGoal | null;
  currency: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();

  if (!visible || !goal) {
    return null;
  }

  const rows = [
    {
      label: t.firePlan.currentAge,
      value: goal.currentAge == null ? t.common.notSet : t.common.yearsOld(goal.currentAge),
    },
    {
      label: t.firePlan.retirementMonthlyWithdrawal,
      value: money(goal.targetMonthlySpending, currency),
    },
    {
      label: t.common.monthlySaving,
      value: money(goal.monthlySaving, currency),
    },
    {
      label: t.common.withdrawalRate,
      value: percent(goal.withdrawalRate),
    },
  ];

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <SheetHeader
        kicker={t.firePlan.fireSetup}
        title={t.firePlan.currentFireSettings}
        closeLabel={t.firePlan.closeFireSettings}
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {rows.slice(0, 3).map((row) => (
          <MotionPressable
            key={row.label}
            onPress={onEdit}
            accessibilityLabel={`${t.common.edit} ${row.label}`}
            style={styles.listRow}
          >
            <View style={styles.listCopy}>
              <Text
                numberOfLines={1}
                style={[styles.listLabel, typography.body, { color: colors.textMuted }]}
              >
                {row.label}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.listValue, typography.title, { color: colors.text }]}
              >
                {row.value}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
          </MotionPressable>
        ))}
      </ScrollView>
    </BaseSheet>
  );
}

function FirePlanEditorContent({
  goal,
  onClose,
  onSave,
}: {
  goal: FireGoal;
  onClose: () => void;
  onSave: (goalId: string, patch: FireGoalPatch) => void;
}) {
  const t = useI18n();
  const [name, setName] = useState(goal.name);
  const [currentAge, setCurrentAge] = useState(
    goal.currentAge == null ? "" : String(goal.currentAge),
  );
  const [targetMonthlySpending, setTargetMonthlySpending] = useState(
    String(goal.targetMonthlySpending),
  );
  const [monthlySaving, setMonthlySaving] = useState(String(goal.monthlySaving));
  const [withdrawalRate, setWithdrawalRate] = useState(percentText(goal.withdrawalRate));
  const [inflationRate, setInflationRate] = useState(percentText(goal.inflationRate));

  const canSave =
    name.trim().length > 0 &&
    numberFromText(currentAge) > 0 &&
    numberFromText(currentAge) <= 120 &&
    numberFromText(targetMonthlySpending) >= 0 &&
    numberFromText(monthlySaving) >= 0 &&
    numberFromText(withdrawalRate) > 0;

  function save() {
    if (!canSave) {
      return;
    }

    onSave(goal.id, {
      name: name.trim(),
      currentAge: Math.max(1, Math.min(120, Math.floor(numberFromText(currentAge)))),
      targetMonthlySpending: numberFromText(targetMonthlySpending),
      monthlySaving: numberFromText(monthlySaving),
      withdrawalRate: numberFromText(withdrawalRate) / 100,
      inflationRate: numberFromText(inflationRate, 0) / 100,
      targetAmount: null,
    });
    onClose();
  }

  return (
    <>
      <SheetHeader
        kicker={t.firePlan.firePlan}
        title={t.firePlan.editFirePlan}
        closeLabel={t.firePlan.closeFirePlanEditor}
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Field
          label={t.firePlan.planName}
          value={name}
          onChangeText={setName}
          placeholder={t.firePlan.mainFireGoal}
          accessibilityLabel={t.firePlan.planName}
        />
        <Field
          label={t.firePlan.currentAge}
          value={currentAge}
          onChangeText={(value) => setCurrentAge(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="numeric"
          placeholder={t.firePlan.enterAge}
          accessibilityLabel={t.firePlan.currentAge}
        />
        <Field
          label={t.firePlan.retirementMonthlyWithdrawal}
          value={targetMonthlySpending}
          onChangeText={(value) => setTargetMonthlySpending(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="28000"
          accessibilityLabel={t.firePlan.retirementMonthlyWithdrawal}
        />
        <Field
          label={t.common.monthlySaving}
          value={monthlySaving}
          onChangeText={(value) => setMonthlySaving(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="18000"
          accessibilityLabel={t.common.monthlySaving}
        />
        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Field
              label={`${t.common.withdrawalRate} %`}
              value={withdrawalRate}
              onChangeText={(value) => setWithdrawalRate(normalizeNumberInput(value))}
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              inputMode="decimal"
              placeholder="3.5"
              accessibilityLabel={`${t.common.withdrawalRate} %`}
            />
          </View>
          <View style={styles.splitField}>
            <Field
              label={`${t.common.inflation} %`}
              value={inflationRate}
              onChangeText={(value) => setInflationRate(normalizeNumberInput(value, true))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="2.5"
              accessibilityLabel={`${t.common.inflation} %`}
            />
          </View>
        </View>
        <SaveButton label={t.firePlan.saveFirePlan} disabled={!canSave} onPress={save} />
      </ScrollView>
    </>
  );
}

export function MilestoneEditorSheet({
  visible,
  milestone,
  onClose,
  onSave,
  onArchive,
}: {
  visible: boolean;
  milestone: Milestone | null;
  onClose: () => void;
  onSave: (milestoneId: string, patch: MilestonePatch) => void;
  onArchive?: (milestoneId: string) => void;
}) {
  if (!visible || !milestone) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <MilestoneEditorContent
        key={milestone.id}
        milestone={milestone}
        onClose={onClose}
        onSave={onSave}
        onArchive={onArchive}
      />
    </BaseSheet>
  );
}

export function MilestoneListSheet({
  visible,
  milestones,
  currency,
  onClose,
  onAdd,
  onEdit,
}: {
  visible: boolean;
  milestones: Milestone[];
  currency: string;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (milestone: Milestone) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();

  if (!visible) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <SheetHeader
        kicker={t.firePlan.milestones}
        title={t.firePlan.milestoneSettings}
        closeLabel={t.firePlan.closeMilestoneSettings}
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SaveButton label={t.firePlan.addMilestone} disabled={false} onPress={onAdd} />
        {milestones.length > 0 ? (
          milestones.map((milestone, index) => {
            const state = milestone.isHidden
              ? t.firePlan.hidden
              : milestone.isActive
                ? t.firePlan.active
                : t.firePlan.paused;
            return (
              <MotionPressable
                key={milestone.id}
                onPress={() => onEdit(milestone)}
                accessibilityLabel={`${t.firePlan.editMilestone} ${milestone.name}`}
                style={styles.listRow}
              >
                <View style={styles.listCopy}>
                  <Text
                    numberOfLines={1}
                    style={[styles.listLabel, typography.body, { color: colors.textMuted }]}
                  >
                    {t.firePlan.milestoneRow(index + 1, state)}
                  </Text>
                  <Text
                    numberOfLines={2}
                    minimumFontScale={0.86}
                    adjustsFontSizeToFit
                    style={[styles.listValue, typography.title, { color: colors.text }]}
                  >
                    {milestone.name} | {money(milestone.targetAmount, currency)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
              </MotionPressable>
            );
          })
        ) : (
          <Text style={[styles.emptyText, typography.body, { color: colors.textMuted }]}>
            {t.firePlan.noMilestonesYet}
          </Text>
        )}
      </ScrollView>
    </BaseSheet>
  );
}

export function ScenarioListSheet({
  visible,
  goal,
  scenarios,
  currency,
  baseExpectedReturn,
  onClose,
  onAdd,
  onEdit,
}: {
  visible: boolean;
  goal: FireGoal | null;
  scenarios: ProjectionScenario[];
  currency: string;
  baseExpectedReturn?: number;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (scenario: ProjectionScenario) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const canAddScenario = scenarios.length < 3;

  if (!visible) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <SheetHeader
        kicker={t.firePlan.fireMethods}
        title={t.firePlan.fireMethodSettings}
        closeLabel={t.firePlan.closeFireMethodSettings}
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SaveButton
          label={canAddScenario ? t.firePlan.addFireMethod : t.firePlan.maxFireMethods}
          disabled={!canAddScenario}
          onPress={onAdd}
        />
        {scenarios.map((scenario) => {
          const assumptions = scenarioAssumptions(goal, scenario, baseExpectedReturn);
          return (
            <MotionPressable
              key={scenario.id}
              onPress={() => onEdit(scenario)}
              accessibilityLabel={`${t.firePlan.editFireMethod} ${scenario.name}`}
              style={styles.listRow}
            >
              <View style={styles.listCopy}>
                <Text
                  numberOfLines={1}
                  style={[styles.listLabel, typography.body, { color: colors.textMuted }]}
                >
                  {scenario.isDefault ? t.firePlan.defaultDashboardMethod : t.firePlan.fireMethod}
                </Text>
                <Text
                  numberOfLines={2}
                  minimumFontScale={0.86}
                  adjustsFontSizeToFit
                  style={[styles.listValue, typography.title, { color: colors.text }]}
                >
                  {scenario.name} | {money(assumptions.targetMonthlySpending, currency)}
                  {t.firePlan.monthlySuffix} | {percent(assumptions.withdrawalRate)} SWR
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.listMeta, typography.body, { color: colors.textMuted }]}
                >
                  {t.firePlan.saveReturn(
                    money(assumptions.monthlySaving, currency),
                    percent(assumptions.expectedReturn),
                  )}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </MotionPressable>
          );
        })}
      </ScrollView>
    </BaseSheet>
  );
}

export function ScenarioEditorSheet({
  visible,
  goal,
  scenario,
  baseExpectedReturn,
  onClose,
  onSave,
  onArchive,
}: {
  visible: boolean;
  goal: FireGoal | null;
  scenario: ProjectionScenario | null;
  baseExpectedReturn?: number;
  onClose: () => void;
  onSave: (scenarioId: string, patch: ScenarioPatch) => void;
  onArchive?: (scenarioId: string) => void;
}) {
  if (!visible || !scenario) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <ScenarioEditorContent
        key={scenario.id}
        goal={goal}
        scenario={scenario}
        baseExpectedReturn={baseExpectedReturn}
        onClose={onClose}
        onSave={onSave}
        onArchive={onArchive}
      />
    </BaseSheet>
  );
}

function ScenarioEditorContent({
  goal,
  scenario,
  baseExpectedReturn = 0,
  onClose,
  onSave,
  onArchive,
}: {
  goal: FireGoal | null;
  scenario: ProjectionScenario;
  baseExpectedReturn?: number;
  onClose: () => void;
  onSave: (scenarioId: string, patch: ScenarioPatch) => void;
  onArchive?: (scenarioId: string) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const assumptions = scenarioAssumptions(goal, scenario, baseExpectedReturn);
  const [name, setName] = useState(scenario.name);
  const [targetMonthlySpending, setTargetMonthlySpending] = useState(
    String(assumptions.targetMonthlySpending),
  );
  const [monthlySaving, setMonthlySaving] = useState(String(assumptions.monthlySaving));
  const [withdrawalRate, setWithdrawalRate] = useState(percentText(assumptions.withdrawalRate));
  const [inflationRate, setInflationRate] = useState(percentText(assumptions.inflationRate));
  const [expectedReturn, setExpectedReturn] = useState(percentText(assumptions.expectedReturn));
  const [isDefault, setIsDefault] = useState(scenario.isDefault);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const canSave =
    name.trim().length > 0 &&
    numberFromText(targetMonthlySpending) >= 0 &&
    numberFromText(monthlySaving) >= 0 &&
    numberFromText(withdrawalRate) > 0 &&
    numberFromText(expectedReturn, 0) > -95;

  function save() {
    if (!canSave) {
      return;
    }

    onSave(scenario.id, {
      name: name.trim(),
      expectedReturnAdjustment: numberFromText(expectedReturn, 0) / 100 - baseExpectedReturn,
      inflationAdjustment: numberFromText(inflationRate, 0) / 100 - (goal?.inflationRate ?? 0),
      monthlySavingAdjustment: numberFromText(monthlySaving, 0) - (goal?.monthlySaving ?? 0),
      targetSpendingAdjustment:
        numberFromText(targetMonthlySpending, 0) - (goal?.targetMonthlySpending ?? 0),
      withdrawalRateAdjustment:
        numberFromText(withdrawalRate, 0) / 100 - (goal?.withdrawalRate ?? 0),
      isDefault,
    });
    onClose();
  }

  function archive() {
    if (!onArchive) {
      return;
    }

    if (!confirmingArchive) {
      setConfirmingArchive(true);
      return;
    }

    onArchive(scenario.id);
    onClose();
  }

  return (
    <>
      <SheetHeader
        kicker={t.firePlan.fireMethod}
        title={t.firePlan.editFireMethod}
        closeLabel={t.firePlan.closeFireMethodEditor}
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Field
          label={t.firePlan.methodName}
          value={name}
          onChangeText={setName}
          placeholder={t.firePlan.conservativeFire}
          accessibilityLabel={t.firePlan.methodName}
        />
        <Field
          label={t.firePlan.retirementMonthlyWithdrawal}
          value={targetMonthlySpending}
          onChangeText={(value) => setTargetMonthlySpending(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="28000"
          accessibilityLabel={t.firePlan.retirementMonthlyWithdrawal}
        />
        <Field
          label={t.common.monthlySaving}
          value={monthlySaving}
          onChangeText={(value) => setMonthlySaving(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="18000"
          accessibilityLabel={t.common.monthlySaving}
        />
        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Field
              label={t.firePlan.safeWithdrawalRate}
              value={withdrawalRate}
              onChangeText={(value) => setWithdrawalRate(normalizeNumberInput(value))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="3.5"
              accessibilityLabel={t.firePlan.safeWithdrawalRate}
            />
          </View>
          <View style={styles.splitField}>
            <Field
              label={`${t.common.inflation} %`}
              value={inflationRate}
              onChangeText={(value) => setInflationRate(normalizeNumberInput(value, true))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="2.5"
              accessibilityLabel={`${t.common.inflation} %`}
            />
          </View>
        </View>
        <Field
          label={t.firePlan.expectedReturn}
          value={expectedReturn}
          onChangeText={(value) => setExpectedReturn(normalizeNumberInput(value, true))}
          keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
          inputMode="decimal"
          placeholder={percentText(baseExpectedReturn) || "0"}
          accessibilityLabel={t.firePlan.expectedReturn}
        />
        <ToggleRow
          label={t.firePlan.defaultDashboardVersion}
          value={isDefault}
          onPress={() => setIsDefault((current) => !current)}
        />
        <SaveButton label={t.firePlan.saveFireVersion} disabled={!canSave} onPress={save} />
        {onArchive ? (
          <MotionPressable
            onPress={archive}
            accessibilityLabel={
              confirmingArchive ? t.firePlan.confirmDeleteFireMethod : t.firePlan.deleteFireMethod
            }
            style={[
              styles.archive,
              {
                borderColor: confirmingArchive ? colors.negative : colors.surfaceBorder,
                backgroundColor: confirmingArchive ? `${colors.negative}18` : colors.backgroundAlt,
              },
            ]}
          >
            <Text
              style={[
                styles.archiveText,
                typography.button,
                { color: confirmingArchive ? colors.negative : colors.textMuted },
              ]}
            >
              {confirmingArchive ? t.common.confirmDelete : t.firePlan.deleteFireMethod}
            </Text>
          </MotionPressable>
        ) : null}
      </ScrollView>
    </>
  );
}

function MilestoneEditorContent({
  milestone,
  onClose,
  onSave,
  onArchive,
}: {
  milestone: Milestone;
  onClose: () => void;
  onSave: (milestoneId: string, patch: MilestonePatch) => void;
  onArchive?: (milestoneId: string) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const [name, setName] = useState(milestone.name);
  const [targetAmount, setTargetAmount] = useState(String(milestone.targetAmount));
  const [targetDate, setTargetDate] = useState(milestone.targetDate ?? "");
  const [expectedReturnOverride, setExpectedReturnOverride] = useState(
    percentText(milestone.expectedReturnOverride),
  );
  const [isActive, setIsActive] = useState(milestone.isActive);
  const [showOnPath, setShowOnPath] = useState(!milestone.isHidden);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const canSave = name.trim().length > 0 && numberFromText(targetAmount) > 0;

  function save() {
    if (!canSave) {
      return;
    }

    onSave(milestone.id, {
      name: name.trim(),
      targetAmount: numberFromText(targetAmount),
      targetDate: targetDate.trim().length > 0 ? targetDate.trim() : null,
      expectedReturnOverride:
        expectedReturnOverride.trim().length > 0
          ? numberFromText(expectedReturnOverride) / 100
          : null,
      isActive,
      isHidden: !showOnPath,
    });
    onClose();
  }

  function archive() {
    if (!onArchive) {
      return;
    }

    if (!confirmingArchive) {
      setConfirmingArchive(true);
      return;
    }

    onArchive(milestone.id);
    onClose();
  }

  return (
    <>
      <SheetHeader
        kicker={t.firePlan.milestones}
        title={t.firePlan.editMilestone}
        closeLabel={t.firePlan.closeMilestoneEditor}
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Field
          label={t.firePlan.milestoneName}
          value={name}
          onChangeText={setName}
          placeholder={t.firePlan.coastFire}
          accessibilityLabel={t.firePlan.milestoneName}
        />
        <Field
          label={t.firePlan.targetAmount}
          value={targetAmount}
          onChangeText={(value) => setTargetAmount(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="450000"
          accessibilityLabel={t.firePlan.targetAmount}
        />
        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Field
              label={t.firePlan.targetDate}
              value={targetDate}
              onChangeText={(value) => setTargetDate(normalizeDateInput(value))}
              placeholder="YYYY-MM-DD"
              accessibilityLabel={t.firePlan.targetDate}
            />
          </View>
          <View style={styles.splitField}>
            <Field
              label={t.firePlan.returnOverride}
              value={expectedReturnOverride}
              onChangeText={(value) => setExpectedReturnOverride(normalizeNumberInput(value, true))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="-"
              accessibilityLabel={t.firePlan.returnOverride}
            />
          </View>
        </View>
        <ToggleRow
          label={t.firePlan.activeMilestone}
          value={isActive}
          onPress={() => setIsActive((current) => !current)}
        />
        <ToggleRow
          label={t.firePlan.showOnFirePath}
          value={showOnPath}
          onPress={() => setShowOnPath((current) => !current)}
        />
        <SaveButton label={t.firePlan.saveMilestone} disabled={!canSave} onPress={save} />
        {onArchive ? (
          <MotionPressable
            onPress={archive}
            accessibilityLabel={
              confirmingArchive ? t.firePlan.confirmDeleteMilestone : t.firePlan.deleteMilestone
            }
            style={[
              styles.archive,
              {
                borderColor: confirmingArchive ? colors.negative : colors.surfaceBorder,
                backgroundColor: confirmingArchive ? `${colors.negative}18` : colors.backgroundAlt,
              },
            ]}
          >
            <Text
              style={[
                styles.archiveText,
                typography.button,
                { color: confirmingArchive ? colors.negative : colors.textMuted },
              ]}
            >
              {confirmingArchive ? t.common.confirmDelete : t.firePlan.deleteMilestone}
            </Text>
          </MotionPressable>
        ) : null}
      </ScrollView>
    </>
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
  listRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
    paddingVertical: 10,
  },
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
