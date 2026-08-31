import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import {
  BaseSheet,
  Field,
  normalizeNumberInput,
  numberFromText,
  percentText,
  ResponsiveSplitFields,
  SaveButton,
  scenarioAssumptions,
  SheetHeader,
  TonalAddButton,
  ToggleRow,
  type ScenarioPatch,
} from "./firePlanSheetKit";
import { styles } from "./sharedStyles";
import { MotionPressable } from "../MotionPressable";
import { fieldLabelWithUnit } from "../firePlanPresentation";
import { typography, useThemeColors } from "../../design/theme";
import type { FireGoal, ProjectionScenario } from "../../features/types";
import { useI18n } from "../../i18n";
import { money, percent } from "../../utils/format";

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
        {canAddScenario ? (
          <TonalAddButton label={t.firePlan.addFireMethod} onPress={onAdd} />
        ) : (
          <View
            accessible
            accessibilityLabel={t.firePlan.maxFireMethods}
            style={[
              styles.maxMethodsStatus,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={19}
              color={colors.textMuted}
            />
            <Text
              style={[styles.maxMethodsStatusText, typography.button, { color: colors.textMuted }]}
            >
              {t.firePlan.maxFireMethods}
            </Text>
          </View>
        )}
        {scenarios.map((scenario) => {
          const assumptions = scenarioAssumptions(goal, scenario, baseExpectedReturn);
          return (
            <MotionPressable
              key={scenario.id}
              onPress={() => onEdit(scenario)}
              accessibilityLabel={`${t.firePlan.editFireMethod} ${scenario.name}`}
              style={styles.listRow}
            >
              <View style={styles.scenarioComparison}>
                <View style={styles.scenarioComparisonTitle}>
                  <Text
                    numberOfLines={1}
                    style={[styles.scenarioName, typography.title, { color: colors.text }]}
                  >
                    {scenario.name}
                  </Text>
                  {scenario.isDefault ? (
                    <Text
                      style={[
                        styles.defaultBadge,
                        typography.button,
                        { backgroundColor: colors.primarySoft, color: colors.primary },
                      ]}
                    >
                      {t.common.defaultLabel}
                    </Text>
                  ) : null}
                </View>
                {[
                  [
                    t.firePlan.retirementMonthlyWithdrawal,
                    `${money(assumptions.targetMonthlySpending, currency)}${t.firePlan.monthlySuffix}`,
                  ],
                  [
                    t.common.monthlySaving,
                    `${money(assumptions.monthlySaving, currency)}${t.firePlan.monthlySuffix}`,
                  ],
                  [t.common.withdrawalRate, percent(assumptions.withdrawalRate)],
                  [t.firePlan.expectedReturn, `${percent(assumptions.expectedReturn)} p.a.`],
                ].map(([label, value]) => (
                  <View key={label} style={styles.scenarioMetric}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.scenarioMetricLabel,
                        typography.body,
                        { color: colors.textMuted },
                      ]}
                    >
                      {label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.scenarioMetricValue,
                        typography.button,
                        { color: colors.text },
                      ]}
                    >
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={[styles.listCopy, styles.hidden]}>
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
                  {scenario.name} · {money(assumptions.targetMonthlySpending, currency)}
                  {t.firePlan.monthlySuffix} · {percent(assumptions.withdrawalRate)}{" "}
                  {t.common.withdrawalRate}
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
  onSave: (scenarioId: string, patch: ScenarioPatch) => boolean;
  onArchive?: (scenarioId: string) => boolean;
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
  onSave: (scenarioId: string, patch: ScenarioPatch) => boolean;
  onArchive?: (scenarioId: string) => boolean;
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
    numberFromText(withdrawalRate) <= 100 &&
    numberFromText(inflationRate, 0) > -95 &&
    numberFromText(inflationRate, 0) <= 1000 &&
    numberFromText(expectedReturn, 0) > -95 &&
    numberFromText(expectedReturn, 0) <= 1000;

  function save() {
    if (!canSave) {
      return;
    }

    const persisted = onSave(scenario.id, {
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
    if (persisted) {
      onClose();
    }
  }

  function archive() {
    if (!onArchive) {
      return;
    }

    if (!confirmingArchive) {
      setConfirmingArchive(true);
      return;
    }

    if (onArchive(scenario.id)) {
      onClose();
    }
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
          label={fieldLabelWithUnit(t.firePlan.retirementMonthlyWithdrawal, goal?.baseCurrency)}
          value={targetMonthlySpending}
          onChangeText={(value) => setTargetMonthlySpending(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="28000"
          accessibilityLabel={fieldLabelWithUnit(
            t.firePlan.retirementMonthlyWithdrawal,
            goal?.baseCurrency,
          )}
        />
        <Field
          label={fieldLabelWithUnit(t.common.monthlySaving, goal?.baseCurrency)}
          value={monthlySaving}
          onChangeText={(value) => setMonthlySaving(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="18000"
          accessibilityLabel={fieldLabelWithUnit(t.common.monthlySaving, goal?.baseCurrency)}
        />
        <ResponsiveSplitFields>
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
