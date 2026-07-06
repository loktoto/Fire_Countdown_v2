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

function signedPercentText(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${percentText(Math.abs(value)) || "0"}%`;
}

function scenarioAssumptions(goal: FireGoal | null, scenario: ProjectionScenario) {
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

  return { inflationRate, monthlySaving, targetMonthlySpending, withdrawalRate };
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

  if (!visible || !goal) {
    return null;
  }

  const rows = [
    {
      label: "Current age",
      value: goal.currentAge == null ? "Not set" : `${goal.currentAge} years old`,
    },
    {
      label: "Retirement monthly withdrawal",
      value: money(goal.targetMonthlySpending, currency),
    },
    {
      label: "Monthly saving",
      value: money(goal.monthlySaving, currency),
    },
    {
      label: "Safe withdrawal rate",
      value: percent(goal.withdrawalRate),
    },
  ];

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <SheetHeader
        kicker="Fire setup"
        title="Current FIRE settings"
        closeLabel="Close FIRE settings"
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
            accessibilityLabel={`Edit ${row.label}`}
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
  const [targetAmount, setTargetAmount] = useState(
    goal.targetAmount == null ? "" : String(goal.targetAmount),
  );
  const [baseCurrency, setBaseCurrency] = useState(goal.baseCurrency);

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

    const targetOverride =
      targetAmount.trim().length > 0 ? Math.max(numberFromText(targetAmount), 0) : null;

    onSave(goal.id, {
      name: name.trim(),
      currentAge: Math.max(1, Math.min(120, Math.floor(numberFromText(currentAge)))),
      targetMonthlySpending: numberFromText(targetMonthlySpending),
      monthlySaving: numberFromText(monthlySaving),
      withdrawalRate: numberFromText(withdrawalRate) / 100,
      inflationRate: numberFromText(inflationRate, 0) / 100,
      targetAmount: targetOverride,
      baseCurrency: baseCurrency.trim().length > 0 ? baseCurrency.trim().toUpperCase() : "HKD",
    });
    onClose();
  }

  return (
    <>
      <SheetHeader
        kicker="Fire plan"
        title="Edit FIRE plan"
        closeLabel="Close FIRE plan editor"
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Field
          label="Plan name"
          value={name}
          onChangeText={setName}
          placeholder="Main FIRE Goal"
          accessibilityLabel="FIRE plan name"
        />
        <Field
          label="Current age"
          value={currentAge}
          onChangeText={(value) => setCurrentAge(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="numeric"
          placeholder="Enter age"
          accessibilityLabel="Current age"
        />
        <Field
          label="Retirement monthly withdrawal"
          value={targetMonthlySpending}
          onChangeText={(value) => setTargetMonthlySpending(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="28000"
          accessibilityLabel="Retirement monthly withdrawal"
        />
        <Field
          label="Monthly saving"
          value={monthlySaving}
          onChangeText={(value) => setMonthlySaving(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="18000"
          accessibilityLabel="Monthly saving"
        />
        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Field
              label="Withdrawal rate %"
              value={withdrawalRate}
              onChangeText={(value) => setWithdrawalRate(normalizeNumberInput(value))}
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              inputMode="decimal"
              placeholder="3.5"
              accessibilityLabel="Withdrawal rate percent"
            />
          </View>
          <View style={styles.splitField}>
            <Field
              label="Inflation %"
              value={inflationRate}
              onChangeText={(value) => setInflationRate(normalizeNumberInput(value, true))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="2.5"
              accessibilityLabel="Inflation percent"
            />
          </View>
        </View>
        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Field
              label="Target override"
              value={targetAmount}
              onChangeText={(value) => setTargetAmount(normalizeNumberInput(value))}
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              inputMode="decimal"
              placeholder="Auto"
              accessibilityLabel="Target amount override"
            />
          </View>
          <View style={styles.currencyField}>
            <Field
              label="Currency"
              value={baseCurrency}
              onChangeText={(value) => setBaseCurrency(value.toUpperCase().slice(0, 3))}
              maxLength={3}
              placeholder="HKD"
              accessibilityLabel="Base currency"
            />
          </View>
        </View>
        <SaveButton label="SAVE FIRE PLAN" disabled={!canSave} onPress={save} />
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

  if (!visible) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <SheetHeader
        kicker="Milestones"
        title="Milestone settings"
        closeLabel="Close milestone settings"
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SaveButton label="ADD MILESTONE" disabled={false} onPress={onAdd} />
        {milestones.length > 0 ? (
          milestones.map((milestone, index) => {
            const state = milestone.isHidden ? "Hidden" : milestone.isActive ? "Active" : "Paused";
            return (
              <MotionPressable
                key={milestone.id}
                onPress={() => onEdit(milestone)}
                accessibilityLabel={`Edit milestone ${milestone.name}`}
                style={styles.listRow}
              >
                <View style={styles.listCopy}>
                  <Text
                    numberOfLines={1}
                    style={[styles.listLabel, typography.body, { color: colors.textMuted }]}
                  >
                    Milestone {index + 1} | {state}
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
            No milestones yet.
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
  onClose,
  onAdd,
  onEdit,
}: {
  visible: boolean;
  goal: FireGoal | null;
  scenarios: ProjectionScenario[];
  currency: string;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (scenario: ProjectionScenario) => void;
}) {
  const colors = useThemeColors();
  const canAddScenario = scenarios.length < 3;

  if (!visible) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <SheetHeader
        kicker="Fire methods"
        title="FIRE method settings"
        closeLabel="Close FIRE method settings"
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SaveButton
          label={canAddScenario ? "ADD FIRE METHOD" : "MAX 3 FIRE METHODS"}
          disabled={!canAddScenario}
          onPress={onAdd}
        />
        {scenarios.map((scenario) => {
          const assumptions = scenarioAssumptions(goal, scenario);
          return (
            <MotionPressable
              key={scenario.id}
              onPress={() => onEdit(scenario)}
              accessibilityLabel={`Edit FIRE method ${scenario.name}`}
              style={styles.listRow}
            >
              <View style={styles.listCopy}>
                <Text
                  numberOfLines={1}
                  style={[styles.listLabel, typography.body, { color: colors.textMuted }]}
                >
                  {scenario.isDefault ? "Default dashboard method" : "FIRE method"}
                </Text>
                <Text
                  numberOfLines={2}
                  minimumFontScale={0.86}
                  adjustsFontSizeToFit
                  style={[styles.listValue, typography.title, { color: colors.text }]}
                >
                  {scenario.name} | {money(assumptions.targetMonthlySpending, currency)}/mo |{" "}
                  {percent(assumptions.withdrawalRate)} SWR
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.listMeta, typography.body, { color: colors.textMuted }]}
                >
                  Save {money(assumptions.monthlySaving, currency)} | Return{" "}
                  {signedPercentText(scenario.expectedReturnAdjustment)}
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
  onClose,
  onSave,
  onArchive,
}: {
  visible: boolean;
  goal: FireGoal | null;
  scenario: ProjectionScenario | null;
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
  onClose,
  onSave,
  onArchive,
}: {
  goal: FireGoal | null;
  scenario: ProjectionScenario;
  onClose: () => void;
  onSave: (scenarioId: string, patch: ScenarioPatch) => void;
  onArchive?: (scenarioId: string) => void;
}) {
  const colors = useThemeColors();
  const assumptions = scenarioAssumptions(goal, scenario);
  const [name, setName] = useState(scenario.name);
  const [targetMonthlySpending, setTargetMonthlySpending] = useState(
    String(assumptions.targetMonthlySpending),
  );
  const [monthlySaving, setMonthlySaving] = useState(String(assumptions.monthlySaving));
  const [withdrawalRate, setWithdrawalRate] = useState(percentText(assumptions.withdrawalRate));
  const [inflationRate, setInflationRate] = useState(percentText(assumptions.inflationRate));
  const [expectedReturnAdjustment, setExpectedReturnAdjustment] = useState(
    percentText(scenario.expectedReturnAdjustment),
  );
  const [isDefault, setIsDefault] = useState(scenario.isDefault);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const canSave =
    name.trim().length > 0 &&
    numberFromText(targetMonthlySpending) >= 0 &&
    numberFromText(monthlySaving) >= 0 &&
    numberFromText(withdrawalRate) > 0;

  function save() {
    if (!canSave) {
      return;
    }

    onSave(scenario.id, {
      name: name.trim(),
      expectedReturnAdjustment: numberFromText(expectedReturnAdjustment, 0) / 100,
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
        kicker="Fire method"
        title="Edit FIRE method"
        closeLabel="Close FIRE method editor"
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Field
          label="Method name"
          value={name}
          onChangeText={setName}
          placeholder="Conservative FIRE"
          accessibilityLabel="FIRE method name"
        />
        <Field
          label="Retirement monthly withdrawal"
          value={targetMonthlySpending}
          onChangeText={(value) => setTargetMonthlySpending(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="28000"
          accessibilityLabel="Method retirement monthly withdrawal"
        />
        <Field
          label="Monthly saving"
          value={monthlySaving}
          onChangeText={(value) => setMonthlySaving(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="18000"
          accessibilityLabel="Method monthly saving"
        />
        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Field
              label="Safe withdrawal rate %"
              value={withdrawalRate}
              onChangeText={(value) => setWithdrawalRate(normalizeNumberInput(value))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="3.5"
              accessibilityLabel="Method safe withdrawal rate percent"
            />
          </View>
          <View style={styles.splitField}>
            <Field
              label="Inflation %"
              value={inflationRate}
              onChangeText={(value) => setInflationRate(normalizeNumberInput(value, true))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="2.5"
              accessibilityLabel="Method inflation percent"
            />
          </View>
        </View>
        <Field
          label="Return adjustment %"
          value={expectedReturnAdjustment}
          onChangeText={(value) => setExpectedReturnAdjustment(normalizeNumberInput(value, true))}
          keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
          inputMode="decimal"
          placeholder="-2"
          accessibilityLabel="Expected return adjustment percent"
        />
        <ToggleRow
          label="Default dashboard version"
          value={isDefault}
          onPress={() => setIsDefault((current) => !current)}
        />
        <SaveButton label="SAVE FIRE VERSION" disabled={!canSave} onPress={save} />
        {onArchive ? (
          <MotionPressable
            onPress={archive}
            accessibilityLabel={
              confirmingArchive ? "Confirm delete FIRE method" : "Delete FIRE method"
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
              {confirmingArchive ? "CONFIRM DELETE" : "DELETE FIRE METHOD"}
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
        kicker="Milestone"
        title="Edit milestone"
        closeLabel="Close milestone editor"
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Field
          label="Milestone name"
          value={name}
          onChangeText={setName}
          placeholder="Coast FIRE"
          accessibilityLabel="Milestone name"
        />
        <Field
          label="Target amount"
          value={targetAmount}
          onChangeText={(value) => setTargetAmount(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="450000"
          accessibilityLabel="Milestone target amount"
        />
        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Field
              label="Target date"
              value={targetDate}
              onChangeText={(value) => setTargetDate(normalizeDateInput(value))}
              placeholder="YYYY-MM-DD"
              accessibilityLabel="Milestone target date"
            />
          </View>
          <View style={styles.splitField}>
            <Field
              label="Return override %"
              value={expectedReturnOverride}
              onChangeText={(value) => setExpectedReturnOverride(normalizeNumberInput(value, true))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="-"
              accessibilityLabel="Milestone return override percent"
            />
          </View>
        </View>
        <ToggleRow
          label="Active milestone"
          value={isActive}
          onPress={() => setIsActive((current) => !current)}
        />
        <ToggleRow
          label="Show on FIRE path"
          value={showOnPath}
          onPress={() => setShowOnPath((current) => !current)}
        />
        <SaveButton label="SAVE MILESTONE" disabled={!canSave} onPress={save} />
        {onArchive ? (
          <MotionPressable
            onPress={archive}
            accessibilityLabel={confirmingArchive ? "Confirm delete milestone" : "Delete milestone"}
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
              {confirmingArchive ? "CONFIRM DELETE" : "DELETE MILESTONE"}
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
  currencyField: {
    width: 98,
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
