import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { CategoryGlyph } from "../components/CategoryGlyph";
import {
  FirePlanEditorSheet,
  ScenarioEditorSheet,
  ScenarioListSheet,
} from "../components/FirePlanSettingsSheets";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { WealthCrossoverChart } from "../components/WealthCrossoverChart";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { CategoryCashflowLeader } from "../engine/selectors";
import type { ProjectionScenario } from "../features/types";
import { useDashboardViewModel } from "../hooks/useDashboardViewModel";
import { useI18n } from "../i18n";
import { formatMonthYear, money, percent, signedMoney } from "../utils/format";

function ScenarioSwitcher({
  scenarios,
  value,
  onChange,
}: {
  scenarios: ProjectionScenario[];
  value?: string;
  onChange: (scenarioId: string) => void;
}) {
  const colors = useThemeColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scenarioContent}
      style={[
        styles.scenarioSwitcher,
        { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
      ]}
    >
      {scenarios.map((scenario) => {
        const active = scenario.id === value;
        return (
          <MotionPressable
            key={scenario.id}
            onPress={() => onChange(scenario.id)}
            haptic="selection"
            hoverEffect={!active}
            accessibilityLabel={scenario.name}
            accessibilityState={{ selected: active }}
            style={[
              styles.scenarioOption,
              active
                ? {
                    backgroundColor: colors.projectionSoft,
                    borderColor: `${colors.projection}48`,
                  }
                : undefined,
            ]}
          >
            <Text
              numberOfLines={1}
              minimumFontScale={0.72}
              adjustsFontSizeToFit
              style={[
                styles.scenarioLabel,
                typography.button,
                { color: active ? colors.projection : colors.textMuted },
              ]}
            >
              {scenario.name}
            </Text>
          </MotionPressable>
        );
      })}
    </ScrollView>
  );
}

function ForecastStat({
  label,
  value,
  tone = "neutral",
  divider = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "primary" | "projection" | "positive" | "negative";
  divider?: boolean;
}) {
  const colors = useThemeColors();
  const valueColor =
    tone === "projection"
      ? colors.projection
      : tone === "primary"
        ? colors.primary
        : tone === "positive"
          ? colors.positive
          : tone === "negative"
            ? colors.negative
            : colors.text;

  return (
    <View
      style={[
        styles.forecastStat,
        divider ? { borderLeftColor: colors.surfaceBorder, borderLeftWidth: 1 } : undefined,
      ]}
    >
      <Text style={[styles.statLabel, typography.body, { color: colors.textMuted }]}>{label}</Text>
      <Text
        numberOfLines={1}
        minimumFontScale={0.72}
        adjustsFontSizeToFit
        style={[styles.statValue, typography.button, { color: valueColor }]}
      >
        {value}
      </Text>
    </View>
  );
}

function CashflowLeaderRow({
  title,
  leader,
  fallback,
  tone,
  currency,
  divider = false,
}: {
  title: string;
  leader: CategoryCashflowLeader | null;
  fallback: string;
  tone: "positive" | "negative";
  currency: string;
  divider?: boolean;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const color = leader?.categoryColor ?? (tone === "positive" ? colors.positive : colors.negative);

  return (
    <View
      style={[
        styles.leaderRow,
        divider ? { borderTopColor: colors.surfaceBorder, borderTopWidth: 1 } : undefined,
      ]}
    >
      <CategoryGlyph icon={leader?.categoryIcon} color={color} size={40} />
      <View style={styles.leaderCopy}>
        <Text style={[styles.leaderEyebrow, typography.body, { color: colors.textMuted }]}>
          {title}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.leaderName, typography.button, { color: colors.text }]}
        >
          {leader?.categoryName ?? fallback}
        </Text>
        <Text style={[styles.leaderMeta, typography.body, { color: colors.textMuted }]}>
          {leader
            ? t.common.recordsThisMonth(leader.transactionCount)
            : t.common.noRecordsThisMonth}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        minimumFontScale={0.7}
        adjustsFontSizeToFit
        style={[
          styles.leaderAmount,
          typography.title,
          { color: tone === "positive" ? colors.positive : colors.negative },
        ]}
      >
        {money(leader?.amount ?? 0, currency)}
      </Text>
    </View>
  );
}

function AssumptionCell({
  label,
  value,
  onPress,
  leftDivider,
  bottomDivider,
}: {
  label: string;
  value: string;
  onPress: () => void;
  leftDivider: boolean;
  bottomDivider: boolean;
}) {
  const colors = useThemeColors();

  return (
    <MotionPressable
      onPress={onPress}
      haptic="selection"
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.assumptionCell,
        leftDivider ? { borderLeftColor: colors.surfaceBorder, borderLeftWidth: 1 } : undefined,
        bottomDivider
          ? { borderBottomColor: colors.surfaceBorder, borderBottomWidth: 1 }
          : undefined,
      ]}
    >
      <View style={styles.assumptionCopy}>
        <Text style={[styles.assumptionLabel, typography.body, { color: colors.textMuted }]}>
          {label}
        </Text>
        <Text
          numberOfLines={1}
          minimumFontScale={0.72}
          adjustsFontSizeToFit
          style={[styles.assumptionValue, typography.button, { color: colors.text }]}
        >
          {value}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={19} color={colors.textMuted} />
    </MotionPressable>
  );
}

export function DashboardScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const router = useRouter();
  const vm = useDashboardViewModel();
  const [firePlanEditorOpen, setFirePlanEditorOpen] = useState(false);
  const [scenarioListOpen, setScenarioListOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ProjectionScenario | null>(null);
  const [creatingScenario, setCreatingScenario] = useState(false);
  const goalCurrency = vm.goal.baseCurrency;
  const yearsToFire =
    vm.projectedFireDays === null ? null : Math.max(0, vm.projectedFireDays / 365.25).toFixed(1);
  const projectedFireMonth = vm.projectedFireDate
    ? formatMonthYear(vm.projectedFireDate, t.locale)
    : t.dashboard.notReached;
  const projectedFireAge =
    vm.projectedFireDays === null || vm.goal.currentAge == null
      ? null
      : Math.floor(vm.goal.currentAge + vm.projectedFireDays / 365.25);
  const scenarioCount = vm.scenarios.length;
  const activityMonthLabel = formatMonthYear(vm.activityDate, t.locale);
  const fundedProgress = Math.min(1, Math.max(0, vm.progress));
  const projectedAgeLabel =
    vm.goal.currentAge == null
      ? t.dashboard.ageNotSet
      : vm.projectedFireDays === null || projectedFireAge === null
        ? t.dashboard.noCrossover
        : t.dashboard.age(projectedFireAge);

  function openFirePlanEditor() {
    setFirePlanEditorOpen(true);
  }

  function openScenarioList() {
    setScenarioListOpen(true);
  }

  function addScenario() {
    const scenario = vm.newScenarioDraft();
    setScenarioListOpen(false);
    setCreatingScenario(true);
    setEditingScenario(scenario);
  }

  function editScenario(scenario: ProjectionScenario) {
    setScenarioListOpen(false);
    setCreatingScenario(false);
    setEditingScenario(scenario);
  }

  function closeScenarioEditor() {
    setEditingScenario(null);
    setCreatingScenario(false);
  }

  function saveScenario(scenarioId: string, patch: Partial<ProjectionScenario>) {
    if (creatingScenario && editingScenario) {
      const draft = { ...editingScenario, ...patch };
      vm.createScenario({
        archivedAt: draft.archivedAt ?? null,
        expectedReturnAdjustment: draft.expectedReturnAdjustment,
        inflationAdjustment: draft.inflationAdjustment,
        isDefault: draft.isDefault,
        monthlySavingAdjustment: draft.monthlySavingAdjustment,
        name: draft.name,
        targetSpendingAdjustment: draft.targetSpendingAdjustment,
        withdrawalRateAdjustment: draft.withdrawalRateAdjustment ?? 0,
      });
    } else {
      vm.updateScenario(scenarioId, patch);
    }
    closeScenarioEditor();
  }

  function archiveScenario(scenarioId: string) {
    vm.archiveScenario(scenarioId);
    closeScenarioEditor();
  }

  const assumptions = [
    {
      label: t.dashboard.includedAssets,
      value: money(vm.includedAssets, goalCurrency),
      onPress: () => router.push("/portfolio"),
    },
    {
      label: t.dashboard.methodReturn,
      value: percent(vm.effectiveAssumptions.expectedReturn),
      onPress: openScenarioList,
    },
    {
      label: t.common.monthlySaving,
      value: money(vm.effectiveAssumptions.monthlySaving, goalCurrency),
      onPress: openFirePlanEditor,
    },
    {
      label: t.common.withdrawalRate,
      value: percent(vm.effectiveAssumptions.withdrawalRate),
      onPress: openFirePlanEditor,
    },
    {
      label: t.common.inflation,
      value: percent(vm.effectiveAssumptions.inflationRate),
      onPress: openFirePlanEditor,
    },
    {
      label: t.dashboard.targetSpending,
      value: money(vm.effectiveAssumptions.targetMonthlySpending, goalCurrency),
      onPress: openFirePlanEditor,
    },
  ];

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow={t.dashboard.kicker}
        title={t.dashboard.title}
        accentColor={colors.projection}
        action={
          <MotionPressable
            onPress={openScenarioList}
            haptic="selection"
            accessibilityLabel={t.firePlan.editFireMethods}
            style={[
              styles.manageButton,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder },
            ]}
          >
            <MaterialCommunityIcons name="tune-variant" size={21} color={colors.projection} />
          </MotionPressable>
        }
      />

      <ScenarioSwitcher
        scenarios={vm.scenarios}
        value={vm.scenarioId}
        onChange={vm.setScenarioId}
      />

      <View
        style={[
          styles.projectionPanel,
          {
            backgroundColor: colors.projectionSoft,
            borderColor: `${colors.projection}38`,
          },
        ]}
      >
        <View style={styles.forecastHeader}>
          <View style={styles.forecastCopy}>
            <Text style={[styles.forecastLabel, typography.body, { color: colors.textMuted }]}>
              {t.dashboard.projectedFire}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.forecastDate, typography.display, { color: colors.text }]}
            >
              {projectedFireMonth}
            </Text>
            <Text style={[styles.forecastMeta, typography.body, { color: colors.textMuted }]}>
              {vm.scenario?.name ?? t.dashboard.base}
              {yearsToFire === null
                ? ` · ${t.dashboard.noCrossover}`
                : ` · ${t.dashboard.years(yearsToFire)}`}
            </Text>
          </View>
          <View
            style={[
              styles.ageBadge,
              { backgroundColor: colors.surface, borderColor: `${colors.projection}66` },
            ]}
          >
            <Text style={[styles.ageText, typography.button, { color: colors.projection }]}>
              {projectedAgeLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceBorder }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${fundedProgress * 100}%`, backgroundColor: colors.projection },
            ]}
          />
        </View>

        <View style={styles.forecastStats}>
          <ForecastStat
            label={t.dashboard.includedFire}
            value={money(vm.includedAssets, goalCurrency)}
          />
          <ForecastStat
            label={t.dashboard.progress}
            value={percent(vm.progress)}
            tone="projection"
            divider
          />
          <ForecastStat
            label={t.dashboard.fireTarget}
            value={money(vm.target, goalCurrency)}
            divider
          />
        </View>

        <View style={styles.chartHeader}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            {t.dashboard.wealthCrossover}
          </Text>
        </View>
        <WealthCrossoverChart
          key={vm.scenarioId ?? "scenario-base"}
          projection={vm.chartProjection}
          currency={goalCurrency}
          currentAge={vm.goal.currentAge}
          accentColor={colors.projection}
          targetColor={colors.target}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
              {t.dashboard.cashflowLeaders}
            </Text>
            <Text style={[styles.sectionMeta, typography.body, { color: colors.textMuted }]}>
              {activityMonthLabel}
            </Text>
          </View>
          <Text
            style={[
              styles.todayImpact,
              typography.button,
              { color: vm.todayImpact >= 0 ? colors.positive : colors.negative },
            ]}
          >
            {t.dashboard.today(signedMoney(vm.todayImpact, goalCurrency))}
          </Text>
        </View>

        <View
          style={[
            styles.cashflowBand,
            { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
          ]}
        >
          <ForecastStat
            label={t.common.income}
            value={money(vm.activityMonthSummary.income, goalCurrency)}
            tone="positive"
          />
          <ForecastStat
            label={t.common.expense}
            value={money(vm.activityMonthSummary.expense, goalCurrency)}
            tone="negative"
            divider
          />
          <ForecastStat
            label={t.common.net}
            value={signedMoney(vm.activityMonthSummary.net, goalCurrency)}
            tone={vm.activityMonthSummary.net >= 0 ? "positive" : "negative"}
            divider
          />
        </View>

        <View style={[styles.leaderList, { borderColor: colors.surfaceBorder }]}>
          <CashflowLeaderRow
            title={t.dashboard.mostSpending}
            leader={vm.activityMonthLeaders.expense}
            fallback={t.dashboard.noSpending}
            tone="negative"
            currency={goalCurrency}
          />
          <CashflowLeaderRow
            title={t.dashboard.mostEarning}
            leader={vm.activityMonthLeaders.income}
            fallback={t.dashboard.noEarning}
            tone="positive"
            currency={goalCurrency}
            divider
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
              {t.dashboard.assumptions}
            </Text>
            <Text style={[styles.sectionMeta, typography.body, { color: colors.textMuted }]}>
              {vm.scenario?.name ?? t.dashboard.base}
            </Text>
          </View>
          <MotionPressable
            onPress={openScenarioList}
            haptic="selection"
            accessibilityLabel={t.firePlan.editFireMethods}
            style={styles.inlineEdit}
          >
            <Text style={[styles.inlineEditText, typography.button, { color: colors.primary }]}>
              {t.common.edit}
            </Text>
          </MotionPressable>
        </View>
        <View style={[styles.assumptionGrid, { borderColor: colors.surfaceBorder }]}>
          {assumptions.map((assumption, index) => (
            <AssumptionCell
              key={assumption.label}
              label={assumption.label}
              value={assumption.value}
              onPress={assumption.onPress}
              leftDivider={index % 2 === 1}
              bottomDivider={index < assumptions.length - 2}
            />
          ))}
        </View>
      </View>

      <ScenarioListSheet
        visible={scenarioListOpen}
        goal={vm.goal}
        scenarios={vm.scenarios}
        currency={goalCurrency}
        baseExpectedReturn={vm.weightedReturn}
        onClose={() => setScenarioListOpen(false)}
        onAdd={addScenario}
        onEdit={editScenario}
      />
      <FirePlanEditorSheet
        visible={firePlanEditorOpen}
        goal={vm.goal}
        onClose={() => setFirePlanEditorOpen(false)}
        onSave={vm.updateGoal}
      />
      <ScenarioEditorSheet
        visible={editingScenario !== null}
        goal={vm.goal}
        scenario={editingScenario}
        baseExpectedReturn={vm.weightedReturn}
        onClose={closeScenarioEditor}
        onSave={saveScenario}
        onArchive={creatingScenario || scenarioCount <= 1 ? undefined : archiveScenario}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  manageButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  scenarioSwitcher: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
  },
  scenarioContent: {
    minWidth: "100%",
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  scenarioOption: {
    flexGrow: 1,
    minWidth: 108,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  scenarioLabel: {
    fontSize: 13,
    lineHeight: 17,
  },
  projectionPanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
    overflow: "hidden",
  },
  forecastHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  forecastCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  forecastLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  forecastDate: {
    fontSize: 38,
    lineHeight: 44,
    fontVariant: ["tabular-nums"],
  },
  forecastMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  ageBadge: {
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  ageText: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressTrack: {
    height: 5,
    borderRadius: tokens.radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: tokens.radius.pill,
  },
  forecastStats: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  forecastStat: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    gap: 3,
  },
  statLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  statValue: {
    fontSize: 14,
    lineHeight: 19,
    fontVariant: ["tabular-nums"],
  },
  chartHeader: {
    paddingTop: 2,
  },
  section: {
    gap: tokens.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  sectionMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  todayImpact: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "right",
  },
  cashflowBand: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingVertical: 12,
  },
  leaderList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  leaderRow: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 12,
  },
  leaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  leaderEyebrow: {
    fontSize: 10,
    lineHeight: 14,
  },
  leaderName: {
    fontSize: 15,
    lineHeight: 20,
  },
  leaderMeta: {
    fontSize: 10,
    lineHeight: 14,
  },
  leaderAmount: {
    maxWidth: "42%",
    fontSize: 18,
    lineHeight: 23,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  assumptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    overflow: "hidden",
  },
  assumptionCell: {
    flexBasis: "50%",
    maxWidth: "50%",
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assumptionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  assumptionLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  assumptionValue: {
    fontSize: 14,
    lineHeight: 19,
  },
  inlineEdit: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  inlineEditText: {
    fontSize: 13,
    lineHeight: 17,
  },
});
