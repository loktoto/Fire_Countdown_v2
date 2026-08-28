import Slider from "@react-native-community/slider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { fireDurationFromDays } from "./dashboardPresentation";
import { MotionPressable } from "./MotionPressable";
import { signedPercentChange, whatIfOutcome } from "./whatIfPresentation";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { WhatIfDriverKey } from "../engine/selectors";
import { useWhatIfLabViewModel, type WhatIfControlRange } from "../hooks/useWhatIfLabViewModel";
import { useI18n } from "../i18n";
import {
  formatMonthYear,
  formatShortMonthYear,
  money,
  percent,
  signedMoney,
} from "../utils/format";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

function durationLabel(
  days: number | null,
  fireDistance: (years: number, months: number) => string,
) {
  const duration = fireDurationFromDays(days);
  return duration ? fireDistance(duration.years, duration.months) : null;
}

function ScenarioControl({
  testID,
  icon,
  label,
  baselineText,
  valueText,
  deltaText,
  value,
  range,
  minimumLabel,
  maximumLabel,
  onValueChange,
  onSlidingComplete,
}: {
  testID: string;
  icon: IconName;
  label: string;
  baselineText: string;
  valueText: string;
  deltaText: string;
  value: number;
  range: WhatIfControlRange;
  minimumLabel: string;
  maximumLabel: string;
  onValueChange: (value: number) => void;
  onSlidingComplete: (value: number) => void;
}) {
  const colors = useThemeColors();
  const { width, fontScale } = useWindowDimensions();
  const stackHeader = width < 360 || fontScale > 1.18;

  return (
    <View
      testID={testID}
      style={[
        styles.control,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <View style={[styles.controlHeader, stackHeader && styles.controlHeaderStack]}>
        <View style={styles.controlIdentity}>
          <View style={[styles.controlIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
          </View>
          <View style={styles.controlCopy}>
            <Text style={[styles.controlLabel, typography.title, { color: colors.text }]}>
              {label}
            </Text>
            <Text style={[styles.controlBaseline, typography.body, { color: colors.textMuted }]}>
              {baselineText}
            </Text>
          </View>
        </View>
        <View style={[styles.controlValueBlock, stackHeader && styles.controlValueBlockStack]}>
          <View
            style={[
              styles.deltaBadge,
              { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
            ]}
          >
            <Text style={[styles.deltaText, typography.button, { color: colors.primary }]}>
              {deltaText}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.controlValue, typography.title, { color: colors.primary }]}
          >
            {valueText}
          </Text>
        </View>
      </View>

      <Slider
        testID={`${testID}-slider`}
        accessibilityLabel={`${label}: ${valueText}`}
        accessibilityValue={{
          min: range.minimum,
          max: range.maximum,
          now: value,
          text: valueText,
        }}
        minimumValue={range.minimum}
        maximumValue={range.maximum}
        step={range.step}
        value={value}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.surfaceBorder}
        thumbTintColor={colors.primary}
        style={styles.slider}
      />
      <View style={styles.rangeLabels}>
        <Text style={[styles.rangeText, typography.body, { color: colors.textMuted }]}>
          {minimumLabel}
        </Text>
        <Text style={[styles.rangeText, typography.body, { color: colors.textMuted }]}>
          {maximumLabel}
        </Text>
      </View>
    </View>
  );
}

export function WhatIfLab({
  baselineScenarioId,
  onManageScenarios,
  onSelectScenario,
}: {
  baselineScenarioId?: string;
  onManageScenarios: () => void;
  onSelectScenario: (scenarioId: string) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const vm = useWhatIfLabViewModel(baselineScenarioId);
  const { width, fontScale } = useWindowDimensions();
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const stackResult = width < 390 || fontScale > 1.15;

  const resultOutcome = whatIfOutcome(
    vm.projection.impactDays,
    vm.projection.baseline.projectedFireDate,
    vm.projection.result.projectedFireDate,
  );
  const toneColor =
    resultOutcome.tone === "positive"
      ? colors.positive
      : resultOutcome.tone === "negative"
        ? colors.negative
        : colors.primary;
  const toneBackground =
    resultOutcome.tone === "positive"
      ? colors.positiveSoft
      : resultOutcome.tone === "negative"
        ? colors.negativeSoft
        : colors.primarySoft;
  const baselineDate = vm.projection.baseline.projectedFireDate
    ? formatMonthYear(vm.projection.baseline.projectedFireDate, t.locale)
    : t.dashboard.noCrossover;
  const baselineDisplayDate = vm.projection.baseline.projectedFireDate
    ? formatShortMonthYear(vm.projection.baseline.projectedFireDate, t.locale)
    : t.dashboard.noCrossover;
  const resultDate = vm.projection.result.projectedFireDate
    ? formatMonthYear(vm.projection.result.projectedFireDate, t.locale)
    : t.dashboard.noCrossover;
  const resultDisplayDate = vm.projection.result.projectedFireDate
    ? formatShortMonthYear(vm.projection.result.projectedFireDate, t.locale)
    : t.dashboard.noCrossover;
  const baselineDuration = durationLabel(
    vm.projection.baseline.projectedFireDays,
    t.dashboard.fireDistance,
  );
  const resultDuration = durationLabel(
    vm.projection.result.projectedFireDays,
    t.dashboard.fireDistance,
  );
  const outcomeDuration = durationLabel(resultOutcome.durationDays, t.dashboard.fireDistance);
  const outcomeHeadline =
    resultOutcome.state === "earlier" && outcomeDuration
      ? t.dashboard.fireDateEarlier(outcomeDuration)
      : resultOutcome.state === "later" && outcomeDuration
        ? t.dashboard.fireDateLater(outcomeDuration)
        : resultOutcome.state === "reachable"
          ? t.dashboard.fireBecomesReachable
          : resultOutcome.state === "out-of-range"
            ? t.dashboard.fireMovesOutOfRange
            : resultOutcome.state === "unavailable"
              ? t.dashboard.noCrossover
              : t.dashboard.sameFireDate;
  const outcomeBody =
    resultOutcome.state === "earlier" || resultOutcome.state === "later"
      ? t.dashboard.resultSentence(resultDate, baselineDate)
      : resultOutcome.state === "reachable"
        ? t.dashboard.reachableSentence(resultDate)
        : resultOutcome.state === "out-of-range"
          ? t.dashboard.outOfRangeSentence
          : resultOutcome.state === "unavailable"
            ? t.dashboard.tryChangeBody
            : t.dashboard.adjustToCompare;

  const driverLabels: Record<WhatIfDriverKey, string> = {
    monthlySaving: t.common.monthlySaving,
    expectedReturn: t.dashboard.methodReturn,
    targetMonthlySpending: t.dashboard.monthlySpending,
  };
  const strongestDriver = vm.strongestDriver;
  const strongestOutcome = strongestDriver
    ? whatIfOutcome(
        strongestDriver.impactDays,
        vm.projection.baseline.projectedFireDate,
        strongestDriver.projectedFireDate,
      )
    : null;
  const strongestDuration = strongestOutcome
    ? durationLabel(strongestOutcome.durationDays, t.dashboard.fireDistance)
    : null;
  const strongestLabel = strongestDriver ? driverLabels[strongestDriver.key] : null;
  const strongestChange = strongestDriver
    ? strongestDriver.key === "expectedReturn"
      ? signedPercentChange(
          vm.projection.inputs.expectedReturn - vm.projection.baselineInputs.expectedReturn,
        )
      : signedMoney(
          vm.projection.inputs[strongestDriver.key] -
            vm.projection.baselineInputs[strongestDriver.key],
          vm.currency,
        )
    : null;
  const insightBody =
    strongestDriver && strongestLabel && strongestOutcome
      ? strongestOutcome.state === "reachable"
        ? t.dashboard.driverMakesReachable(strongestLabel)
        : strongestOutcome.state === "out-of-range"
          ? t.dashboard.driverMovesOutOfRange(strongestLabel)
          : (strongestOutcome.state === "earlier" || strongestOutcome.state === "later") &&
              strongestDuration &&
              strongestChange
            ? t.dashboard.driverImpact(
                strongestLabel,
                strongestChange,
                strongestDuration,
                strongestOutcome.state === "earlier",
              )
            : t.dashboard.tryChangeBody
      : t.dashboard.tryChangeBody;

  function comparisonLabel(impactDays: number, result: string | null) {
    const outcome = whatIfOutcome(impactDays, vm.projection.baseline.projectedFireDate, result);
    const duration = durationLabel(outcome.durationDays, t.dashboard.fireDistance);
    if (outcome.state === "earlier" && duration) {
      return t.dashboard.fireDateEarlier(duration);
    }
    if (outcome.state === "later" && duration) {
      return t.dashboard.fireDateLater(duration);
    }
    if (outcome.state === "reachable") {
      return t.dashboard.fireBecomesReachable;
    }
    if (outcome.state === "out-of-range") {
      return t.dashboard.fireMovesOutOfRange;
    }
    if (outcome.state === "unavailable") {
      return t.dashboard.noCrossover;
    }
    return t.dashboard.sameFireDate;
  }

  return (
    <View testID="what-if-lab" style={styles.lab}>
      <View style={styles.introRow}>
        <View style={styles.introCopy}>
          <Text style={[styles.eyebrow, typography.button, { color: colors.primary }]}>
            {t.dashboard.scenarioLab}
          </Text>
          <Text style={[styles.title, typography.display, { color: colors.text }]}>
            {t.dashboard.whatIfTitle}
          </Text>
          <Text style={[styles.subtitle, typography.body, { color: colors.textMuted }]}>
            {t.dashboard.whatIfSubtitle}
          </Text>
        </View>
        {vm.hasChanges ? (
          <MotionPressable
            onPress={vm.reset}
            haptic="selection"
            accessibilityLabel={t.dashboard.resetLab}
            style={styles.resetButton}
          >
            <MaterialCommunityIcons name="restore" size={18} color={colors.primary} />
            <Text style={[styles.resetText, typography.button, { color: colors.primary }]}>
              {t.dashboard.resetLab}
            </Text>
          </MotionPressable>
        ) : null}
      </View>

      <View
        style={[
          styles.resultPanel,
          { backgroundColor: colors.surface, borderColor: colors.primaryBorder },
        ]}
      >
        <View style={[styles.resultCompare, stackResult && styles.resultCompareStack]}>
          <View style={[styles.planResult, stackResult && styles.planResultStack]}>
            <Text style={[styles.resultLabel, typography.body, { color: colors.textMuted }]}>
              {t.dashboard.currentPlan}
            </Text>
            <Text
              numberOfLines={1}
              minimumFontScale={0.72}
              adjustsFontSizeToFit
              style={[styles.resultDate, typography.display, { color: colors.text }]}
            >
              {baselineDisplayDate}
            </Text>
            <Text style={[styles.resultDuration, typography.body, { color: colors.textMuted }]}>
              {baselineDuration ?? t.dashboard.noCrossover}
            </Text>
          </View>
          <View
            style={[
              styles.resultArrow,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder },
            ]}
          >
            <MaterialCommunityIcons
              name={stackResult ? "arrow-down" : "arrow-right"}
              size={24}
              color={toneColor}
            />
          </View>
          <View style={[styles.planResult, stackResult && styles.planResultStack]}>
            <Text style={[styles.resultLabel, typography.body, { color: toneColor }]}>
              {t.dashboard.scenarioResult}
            </Text>
            <Text
              numberOfLines={1}
              minimumFontScale={0.72}
              adjustsFontSizeToFit
              style={[styles.resultDate, typography.display, { color: toneColor }]}
            >
              {resultDisplayDate}
            </Text>
            <Text style={[styles.resultDuration, typography.body, { color: colors.textMuted }]}>
              {resultDuration ?? t.dashboard.noCrossover}
            </Text>
          </View>
        </View>

        <View
          accessibilityLiveRegion="polite"
          style={[styles.outcomeBand, { backgroundColor: toneBackground }]}
        >
          <MaterialCommunityIcons
            name={resultOutcome.tone === "negative" ? "alert-circle-outline" : "creation-outline"}
            size={24}
            color={toneColor}
          />
          <View style={styles.outcomeCopy}>
            <Text style={[styles.outcomeHeadline, typography.title, { color: toneColor }]}>
              {outcomeHeadline}
            </Text>
            <Text style={[styles.outcomeBody, typography.body, { color: colors.textSubtle }]}>
              {outcomeBody}
            </Text>
          </View>
        </View>
        {vm.isCalculating ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.updating, typography.body, { color: colors.textMuted }]}
          >
            {t.dashboard.updatingResult}
          </Text>
        ) : null}
      </View>

      <ScenarioControl
        testID="what-if-monthly-saving"
        icon="piggy-bank-outline"
        label={t.common.monthlySaving}
        baselineText={money(vm.baselineInputs.monthlySaving, vm.currency)}
        valueText={money(vm.inputs.monthlySaving, vm.currency)}
        deltaText={signedMoney(
          vm.inputs.monthlySaving - vm.baselineInputs.monthlySaving,
          vm.currency,
        )}
        value={vm.inputs.monthlySaving}
        range={vm.controls.monthlySaving}
        minimumLabel={money(vm.controls.monthlySaving.minimum, vm.currency)}
        maximumLabel={money(vm.controls.monthlySaving.maximum, vm.currency)}
        onValueChange={(value) => vm.updateInput("monthlySaving", value)}
        onSlidingComplete={(value) => vm.commitInput("monthlySaving", value)}
      />
      <ScenarioControl
        testID="what-if-expected-return"
        icon="chart-line"
        label={t.dashboard.methodReturn}
        baselineText={percent(vm.baselineInputs.expectedReturn)}
        valueText={percent(vm.inputs.expectedReturn)}
        deltaText={signedPercentChange(vm.inputs.expectedReturn - vm.baselineInputs.expectedReturn)}
        value={vm.inputs.expectedReturn}
        range={vm.controls.expectedReturn}
        minimumLabel={percent(vm.controls.expectedReturn.minimum)}
        maximumLabel={percent(vm.controls.expectedReturn.maximum)}
        onValueChange={(value) => vm.updateInput("expectedReturn", value)}
        onSlidingComplete={(value) => vm.commitInput("expectedReturn", value)}
      />
      <ScenarioControl
        testID="what-if-monthly-spending"
        icon="cart-outline"
        label={t.dashboard.monthlySpending}
        baselineText={money(vm.baselineInputs.targetMonthlySpending, vm.currency)}
        valueText={money(vm.inputs.targetMonthlySpending, vm.currency)}
        deltaText={signedMoney(
          vm.inputs.targetMonthlySpending - vm.baselineInputs.targetMonthlySpending,
          vm.currency,
        )}
        value={vm.inputs.targetMonthlySpending}
        range={vm.controls.targetMonthlySpending}
        minimumLabel={money(vm.controls.targetMonthlySpending.minimum, vm.currency)}
        maximumLabel={money(vm.controls.targetMonthlySpending.maximum, vm.currency)}
        onValueChange={(value) => vm.updateInput("targetMonthlySpending", value)}
        onSlidingComplete={(value) => vm.commitInput("targetMonthlySpending", value)}
      />

      <View style={styles.savedSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            {t.dashboard.savedScenarios}
          </Text>
          <MotionPressable
            onPress={onManageScenarios}
            haptic="selection"
            accessibilityLabel={t.dashboard.viewAll}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, typography.button, { color: colors.primary }]}>
              {t.dashboard.viewAll}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />
          </MotionPressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetList}
        >
          {vm.scenarioPresets.map((preset) => {
            const selected = preset.scenario.id === vm.activePresetId;
            const presetDate = preset.timing.projectedFireDate
              ? formatShortMonthYear(preset.timing.projectedFireDate, t.locale)
              : t.dashboard.noCrossover;
            return (
              <MotionPressable
                key={preset.scenario.id}
                testID={`what-if-preset-${preset.scenario.id}`}
                onPress={() => onSelectScenario(preset.scenario.id)}
                haptic="selection"
                accessibilityLabel={t.dashboard.tapToLoadScenario(preset.scenario.name)}
                accessibilityState={{ selected }}
                style={[
                  styles.preset,
                  {
                    backgroundColor: selected ? colors.primarySoft : colors.surface,
                    borderColor: selected ? colors.primary : colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.presetTitleRow}>
                  <MaterialCommunityIcons
                    name={preset.scenario.isDefault ? "star" : "bookmark-outline"}
                    size={18}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.presetName,
                      typography.button,
                      { color: selected ? colors.primary : colors.text },
                    ]}
                  >
                    {preset.scenario.name}
                  </Text>
                </View>
                <Text style={[styles.presetDate, typography.title, { color: colors.text }]}>
                  {presetDate}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.presetMeta, typography.body, { color: colors.textMuted }]}
                >
                  {comparisonLabel(preset.impactDays, preset.timing.projectedFireDate)}
                </Text>
              </MotionPressable>
            );
          })}
        </ScrollView>
      </View>

      <View
        style={[
          styles.insightBand,
          { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
        ]}
      >
        <View style={[styles.insightIcon, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.insightCopy}>
          <Text style={[styles.insightTitle, typography.title, { color: colors.text }]}>
            {strongestLabel ? t.dashboard.biggestEffect(strongestLabel) : t.dashboard.tryChange}
          </Text>
          <Text style={[styles.insightBody, typography.body, { color: colors.textMuted }]}>
            {insightBody}
          </Text>
        </View>
        {strongestLabel ? (
          <View style={[styles.impactBadge, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="trending-up" size={16} color={colors.primary} />
            <Text style={[styles.impactBadgeText, typography.button, { color: colors.primary }]}>
              {t.dashboard.mostImpact}
            </Text>
          </View>
        ) : null}
      </View>

      <MotionPressable
        onPress={() => setComparisonOpen((current) => !current)}
        haptic="selection"
        accessibilityLabel={
          comparisonOpen ? t.dashboard.hideComparison : t.dashboard.compareScenarios
        }
        accessibilityState={{ expanded: comparisonOpen }}
        style={[
          styles.compareButton,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <MaterialCommunityIcons name="scale-balance" size={22} color={colors.primary} />
        <Text style={[styles.compareButtonText, typography.button, { color: colors.text }]}>
          {comparisonOpen ? t.dashboard.hideComparison : t.dashboard.compareScenarios}
        </Text>
        <MaterialCommunityIcons
          name={comparisonOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textMuted}
        />
      </MotionPressable>
      {comparisonOpen ? (
        <View style={[styles.comparison, { borderColor: colors.surfaceBorder }]}>
          {vm.scenarioPresets.map((preset, index) => (
            <View
              key={`comparison-${preset.scenario.id}`}
              style={[
                styles.comparisonRow,
                index > 0 ? { borderTopColor: colors.surfaceBorder, borderTopWidth: 1 } : undefined,
              ]}
            >
              <View style={styles.comparisonCopy}>
                <Text style={[styles.comparisonName, typography.button, { color: colors.text }]}>
                  {preset.scenario.name}
                </Text>
                <Text style={[styles.comparisonDate, typography.body, { color: colors.textMuted }]}>
                  {preset.timing.projectedFireDate
                    ? formatShortMonthYear(preset.timing.projectedFireDate, t.locale)
                    : t.dashboard.noCrossover}
                </Text>
              </View>
              <Text style={[styles.comparisonImpact, typography.button, { color: colors.primary }]}>
                {comparisonLabel(preset.impactDays, preset.timing.projectedFireDate)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lab: { gap: tokens.spacing.md },
  introRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xs,
    paddingTop: tokens.spacing.sm,
  },
  introCopy: { minWidth: 0, flex: 1, gap: tokens.spacing.xs },
  eyebrow: { fontSize: 14, lineHeight: 19 },
  title: { fontSize: 34, lineHeight: 40 },
  subtitle: { maxWidth: 520, fontSize: 16, lineHeight: 23 },
  resetButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.sm,
  },
  resetText: { fontSize: 14, lineHeight: 19 },
  resultPanel: {
    gap: tokens.spacing.md,
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.lg,
  },
  resultCompare: { flexDirection: "row", alignItems: "center", gap: tokens.spacing.md },
  resultCompareStack: { flexDirection: "column", alignItems: "stretch" },
  planResult: { minWidth: 0, flex: 1, gap: tokens.spacing.xs },
  planResultStack: { alignItems: "center" },
  resultLabel: { fontSize: 14, lineHeight: 19 },
  resultDate: { fontSize: 29, lineHeight: 35 },
  resultDuration: { fontSize: 14, lineHeight: 19 },
  resultArrow: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 24,
  },
  outcomeBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.md,
  },
  outcomeCopy: { minWidth: 0, flex: 1, gap: tokens.spacing.xs },
  outcomeHeadline: { fontSize: 20, lineHeight: 26 },
  outcomeBody: { fontSize: 14, lineHeight: 20 },
  updating: { alignSelf: "flex-end", fontSize: 12, lineHeight: 16 },
  control: {
    gap: tokens.spacing.xs,
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
  },
  controlHeader: { flexDirection: "row", alignItems: "center", gap: tokens.spacing.md },
  controlHeaderStack: { alignItems: "stretch", flexDirection: "column" },
  controlIdentity: { minWidth: 0, flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  controlIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  controlCopy: { minWidth: 0, flex: 1, gap: 1 },
  controlLabel: { fontSize: 16, lineHeight: 21 },
  controlBaseline: { fontSize: 14, lineHeight: 19 },
  controlValueBlock: { alignItems: "flex-end", gap: tokens.spacing.xs },
  controlValueBlockStack: { alignItems: "flex-start", paddingLeft: 60 },
  deltaBadge: {
    minHeight: 28,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 10,
  },
  deltaText: { fontSize: 12, lineHeight: 16 },
  controlValue: { maxWidth: 170, fontSize: 17, lineHeight: 22 },
  slider: { width: "100%", height: 44 },
  rangeLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  rangeText: { fontSize: 12, lineHeight: 16 },
  savedSection: { gap: tokens.spacing.sm, paddingVertical: tokens.spacing.xs },
  sectionHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  sectionTitle: { fontSize: 18, lineHeight: 24 },
  viewAllButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: tokens.spacing.sm,
  },
  viewAllText: { fontSize: 14, lineHeight: 19 },
  presetList: { gap: tokens.spacing.sm, paddingRight: tokens.spacing.lg },
  preset: {
    width: 164,
    minHeight: 130,
    gap: tokens.spacing.sm,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.md,
  },
  presetTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  presetName: { minWidth: 0, flex: 1, fontSize: 14, lineHeight: 19 },
  presetDate: { fontSize: 17, lineHeight: 22 },
  presetMeta: { fontSize: 13, lineHeight: 18 },
  insightBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
  },
  insightIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
  },
  insightCopy: { minWidth: 0, flex: 1, gap: tokens.spacing.xs },
  insightTitle: { fontSize: 16, lineHeight: 21 },
  insightBody: { fontSize: 14, lineHeight: 20 },
  impactBadge: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 10,
  },
  impactBadgeText: { fontSize: 12, lineHeight: 16 },
  compareButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
  },
  compareButtonText: { minWidth: 0, flex: 1, fontSize: 15, lineHeight: 20 },
  comparison: { overflow: "hidden", borderWidth: 1, borderRadius: tokens.radius.utility },
  comparisonRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  comparisonCopy: { minWidth: 0, flex: 1, gap: 1 },
  comparisonName: { fontSize: 14, lineHeight: 19 },
  comparisonDate: { fontSize: 13, lineHeight: 18 },
  comparisonImpact: { maxWidth: "48%", fontSize: 13, lineHeight: 18, textAlign: "right" },
});
