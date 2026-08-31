import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, ScrollView, Text, View } from "react-native";
import { useState } from "react";

import {
  BaseSheet,
  Field,
  normalizeNumberInput,
  numberFromText,
  percentText,
  ResponsiveSplitFields,
  SaveButton,
  SheetHeader,
  type FireGoalPatch,
} from "./firePlanSheetKit";
import { styles } from "./sharedStyles";
import { fieldLabelWithUnit, optionalCurrentAgeFromText } from "../firePlanPresentation";
import { MotionPressable } from "../MotionPressable";
import { typography, useThemeColors } from "../../design/theme";
import type { FireGoal } from "../../features/types";
import { useI18n } from "../../i18n";
import { money, percent } from "../../utils/format";

export function FirePlanEditorSheet({
  visible,
  goal,
  onClose,
  onSave,
}: {
  visible: boolean;
  goal: FireGoal | null;
  onClose: () => void;
  onSave: (goalId: string, patch: FireGoalPatch) => boolean;
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
  onSave: (goalId: string, patch: FireGoalPatch) => boolean;
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

  const parsedCurrentAge = optionalCurrentAgeFromText(currentAge);
  const canSave =
    name.trim().length > 0 &&
    parsedCurrentAge !== undefined &&
    numberFromText(targetMonthlySpending) >= 0 &&
    numberFromText(monthlySaving) >= 0 &&
    numberFromText(withdrawalRate) > 0 &&
    numberFromText(withdrawalRate) <= 100 &&
    numberFromText(inflationRate, 0) > -95 &&
    numberFromText(inflationRate, 0) <= 1000;

  function save() {
    const nextCurrentAge = optionalCurrentAgeFromText(currentAge);
    if (!canSave || nextCurrentAge === undefined) {
      return;
    }

    const persisted = onSave(goal.id, {
      name: name.trim(),
      currentAge: nextCurrentAge,
      targetMonthlySpending: numberFromText(targetMonthlySpending),
      monthlySaving: numberFromText(monthlySaving),
      withdrawalRate: numberFromText(withdrawalRate) / 100,
      inflationRate: numberFromText(inflationRate, 0) / 100,
      targetAmount: null,
    });
    if (persisted) {
      onClose();
    }
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
          label={fieldLabelWithUnit(t.firePlan.retirementMonthlyWithdrawal, goal.baseCurrency)}
          value={targetMonthlySpending}
          onChangeText={(value) => setTargetMonthlySpending(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="28000"
          accessibilityLabel={fieldLabelWithUnit(
            t.firePlan.retirementMonthlyWithdrawal,
            goal.baseCurrency,
          )}
        />
        <Field
          label={fieldLabelWithUnit(t.common.monthlySaving, goal.baseCurrency)}
          value={monthlySaving}
          onChangeText={(value) => setMonthlySaving(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="18000"
          accessibilityLabel={fieldLabelWithUnit(t.common.monthlySaving, goal.baseCurrency)}
        />
        <ResponsiveSplitFields>
          <View style={styles.splitField}>
            <Field
              label={fieldLabelWithUnit(t.common.withdrawalRate, "%")}
              value={withdrawalRate}
              onChangeText={(value) => setWithdrawalRate(normalizeNumberInput(value))}
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              inputMode="decimal"
              placeholder="3.5"
              accessibilityLabel={fieldLabelWithUnit(t.common.withdrawalRate, "%")}
            />
          </View>
          <View style={styles.splitField}>
            <Field
              label={fieldLabelWithUnit(t.common.inflation, "%")}
              value={inflationRate}
              onChangeText={(value) => setInflationRate(normalizeNumberInput(value, true))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="2.5"
              accessibilityLabel={fieldLabelWithUnit(t.common.inflation, "%")}
            />
          </View>
        </ResponsiveSplitFields>
        <SaveButton label={t.firePlan.saveFirePlan} disabled={!canSave} onPress={save} />
      </ScrollView>
    </>
  );
}
