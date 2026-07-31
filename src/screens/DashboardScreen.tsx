import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { fireDurationFromDays, getDashboardLayout } from "../components/dashboardPresentation";
import {
  FirePlanEditorSheet,
  ScenarioEditorSheet,
  ScenarioListSheet,
} from "../components/FirePlanSettingsSheets";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { TimeLensValue, type TimeLensKind } from "../components/TimeLens";
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
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primaryBorder,
                  }
                : undefined,
            ]}
          >
            {active ? (
              <MaterialCommunityIcons
                accessible={false}
                name="check"
                size={15}
                color={colors.primary}
              />
            ) : null}
            <Text
              numberOfLines={1}
              minimumFontScale={0.72}
              adjustsFontSizeToFit
              style={[
                styles.scenarioLabel,
                typography.button,
                { color: active ? colors.primary : colors.textMuted },
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
  timeLens,
  tone = "neutral",
  divider = false,
  stacked = false,
}: {
  label: string;
  value: string;
  timeLens?: { amount: number; kind: TimeLensKind };
  tone?: "neutral" | "primary" | "positive" | "negative";
  divider?: boolean;
  stacked?: boolean;
}) {
  const colors = useThemeColors();
  const valueColor =
    tone === "primary"
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
        stacked ? styles.forecastStatStacked : undefined,
        divider
          ? stacked
            ? { borderTopColor: colors.surfaceBorder, borderTopWidth: 1 }
            : { borderLeftColor: colors.surfaceBorder, borderLeftWidth: 1 }
          : undefined,
      ]}
    >
      <Text style={[styles.statLabel, typography.body, { color: colors.textMuted }]}>{label}</Text>
      {timeLens ? (
        <TimeLensValue
          amount={timeLens.amount}
          kind={timeLens.kind}
          moneyText={value}
          accessibilityLabel={`${label}: ${value}`}
          style={styles.statLens}
          textStyle={[styles.statValue, typography.button, { color: valueColor }]}
          minimumFontScale={0.72}
        />
      ) : (
        <Text
          numberOfLines={1}
          minimumFontScale={0.72}
          adjustsFontSizeToFit
          style={[styles.statValue, typography.button, { color: valueColor }]}
        >
          {value}
        </Text>
      )}
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
      <TimeLensValue
        amount={leader?.amount ?? 0}
        moneyText={money(leader?.amount ?? 0, currency)}
        kind={tone === "positive" ? "income" : "expense"}
        accessibilityLabel={`${title}: ${money(leader?.amount ?? 0, currency)}`}
        style={styles.leaderAmountLens}
        textStyle={[
          styles.leaderAmount,
          typography.title,
          { color: tone === "positive" ? colors.positive : colors.negative },
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit={false}
      />
    </View>
  );
}

function AssumptionCell({
  label,
  value,
  onPress,
  timeLens,
  leftDivider,
  bottomDivider,
  stacked,
}: {
  label: string;
  value: string;
  onPress: () => void;
  timeLens?: { amount: number; kind: TimeLensKind };
  leftDivider: boolean;
  bottomDivider: boolean;
  stacked: boolean;
}) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.assumptionCell,
        stacked ? styles.assumptionCellStacked : undefined,
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
        {timeLens ? (
          <TimeLensValue
            amount={timeLens.amount}
            kind={timeLens.kind}
            moneyText={value}
            onPress={onPress}
            accessibilityLabel={`${label}: ${value}`}
            style={styles.assumptionLens}
            textStyle={[styles.assumptionValue, typography.button, { color: colors.text }]}
            minimumFontScale={0.72}
          />
        ) : (
          <MotionPressable
            onPress={onPress}
            haptic="selection"
            accessibilityLabel={`${label}: ${value}`}
            style={styles.assumptionPlainValue}
          >
            <Text
              numberOfLines={1}
              minimumFontScale={0.72}
              adjustsFontSizeToFit
              style={[styles.assumptionValue, typography.button, { color: colors.text }]}
            >
              {value}
            </Text>
          </MotionPressable>
        )}
      </View>
      <MotionPressable
        onPress={onPress}
        haptic="selection"
        accessibilityLabel={`${label}: ${value}`}
        hitSlop={8}
        style={styles.assumptionChevron}
      >
        <MaterialCommunityIcons name="chevron-right" size={19} color={colors.textMuted} />
      </MotionPressable>
    </View>
  );
}

export function DashboardScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const router = useRouter();
  const vm = useDashboardViewModel();
  const { width, fontScale } = useWindowDimensions();
  const {
    stackForecast,
    stackForecastStats,
    stackCashflowStats,
    stackSectionHeader,
    stackAssumptions,
  } = getDashboardLayout(width, fontScale);
  const [firePlanEditorOpen, setFirePlanEditorOpen] = useState(false);
  const [scenarioListOpen, setScenarioListOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ProjectionScenario | null>(null);
  const [creatingScenario, setCreatingScenario] = useState(false);
  const goalCurrency = vm.goal.baseCurrency;
  const fireDuration = fireDurationFromDays(vm.projectedFireDays);
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
      ? t.dashboard.fireAgeNotSet
      : vm.projectedFireDays === null || projectedFireAge === null
        ? t.dashboard.noCrossover
        : t.dashboard.fireAge(projectedFireAge);

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
      timeLens: { amount: vm.includedAssets, kind: "asset" as const },
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
      timeLens: {
        amount: vm.effectiveAssumptions.monthlySaving,
        kind: "monthlySaving" as const,
      },
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
    <ScreenScaffold>
      <AppHeader
        eyebrow={t.dashboard.kicker}
        title={t.dashboard.title}
        accentColor={colors.primary}
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
            <MaterialCommunityIcons name="tune-variant" size={21} color={colors.primary} />
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
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <View style={[styles.forecastHeader, stackForecast && styles.forecastHeaderStack]}>
          <View style={styles.forecastCopy}>
            <Text style={[styles.forecastLabel, typography.body, { color: colors.textMuted }]}>
              {t.dashboard.projectedFire}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.forecastDate, typography.display, { color: colors.text }]}
            >
              {projectedFireMonth}
            </Text>
            <Text style={[styles.forecastMeta, typography.body, { color: colors.textMuted }]}>
              {vm.scenario?.name ?? t.dashboard.base}
              {fireDuration === null
                ? ` · ${t.dashboard.noCrossover}`
                : ` · ${t.dashboard.fireDistance(fireDuration.years, fireDuration.months)}`}
            </Text>
          </View>
          <View
            style={[
              styles.ageBadge,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.ageText, typography.button, { color: colors.textMuted }]}>
              {projectedAgeLabel}
            </Text>
          </View>
        </View>

        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t.dashboard.fireTargetFunded}
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(fundedProgress * 100),
            text: percent(vm.progress),
          }}
          style={[styles.progressTrack, { backgroundColor: colors.surfaceBorder }]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${fundedProgress * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>

        <View style={[styles.forecastStats, stackForecastStats && styles.forecastStatsStack]}>
          <ForecastStat
            label={t.dashboard.includedFire}
            value={money(vm.includedAssets, goalCurrency)}
            timeLens={{ amount: vm.includedAssets, kind: "asset" }}
            stacked={stackForecastStats}
          />
          <ForecastStat
            label={t.dashboard.fireTargetFunded}
            value={percent(vm.progress)}
            tone="neutral"
            divider
            stacked={stackForecastStats}
          />
          <ForecastStat
            label={t.dashboard.fireTarget}
            value={money(vm.target, goalCurrency)}
            timeLens={{ amount: vm.target, kind: "spending" }}
            divider
            stacked={stackForecastStats}
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
          accentColor={colors.chartEtf}
          targetColor={colors.chartRealEstate}
        />
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, stackSectionHeader && styles.sectionHeaderStack]}>
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
              {
                color:
                  vm.todayImpact > 0
                    ? colors.positive
                    : vm.todayImpact < 0
                      ? colors.negative
                      : colors.textMuted,
              },
            ]}
          >
            {t.dashboard.today(signedMoney(vm.todayImpact, goalCurrency))}
          </Text>
        </View>

        <View
          style={[
            styles.cashflowBand,
            stackCashflowStats && styles.cashflowBandStack,
            { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
          ]}
        >
          <ForecastStat
            label={t.common.income}
            value={money(vm.activityMonthSummary.income, goalCurrency)}
            timeLens={{ amount: vm.activityMonthSummary.income, kind: "income" }}
            tone="positive"
            stacked={stackCashflowStats}
          />
          <ForecastStat
            label={t.common.expense}
            value={money(vm.activityMonthSummary.expense, goalCurrency)}
            timeLens={{ amount: vm.activityMonthSummary.expense, kind: "expense" }}
            tone="negative"
            divider
            stacked={stackCashflowStats}
          />
          <ForecastStat
            label={t.common.net}
            value={signedMoney(vm.activityMonthSummary.net, goalCurrency)}
            tone={
              vm.activityMonthSummary.net > 0
                ? "positive"
                : vm.activityMonthSummary.net < 0
                  ? "negative"
                  : "neutral"
            }
            divider
            stacked={stackCashflowStats}
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
        <View style={[styles.sectionHeader, stackSectionHeader && styles.sectionHeaderStack]}>
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
              timeLens={assumption.timeLens}
              leftDivider={!stackAssumptions && index % 2 === 1}
              bottomDivider={
                stackAssumptions ? index < assumptions.length - 1 : index < assumptions.length - 2
              }
              stacked={stackAssumptions}
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
    </ScreenScaffold>
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
    flexDirection: "row",
    gap: 4,
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
  forecastHeaderStack: {
    flexDirection: "column",
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
  forecastStatsStack: {
    flexDirection: "column",
  },
  forecastStat: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    gap: 3,
  },
  forecastStatStacked: {
    width: "100%",
    paddingHorizontal: 0,
    paddingVertical: 10,
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
  statLens: { maxWidth: "100%", minHeight: 23, justifyContent: "center" },
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
  sectionHeaderStack: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: tokens.spacing.sm,
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
  cashflowBandStack: {
    flexDirection: "column",
    paddingHorizontal: 12,
    paddingVertical: 0,
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
    fontSize: 18,
    lineHeight: 23,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  leaderAmountLens: {
    maxWidth: "42%",
    minHeight: 44,
    flexShrink: 0,
    justifyContent: "center",
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
  assumptionCellStacked: {
    flexBasis: "100%",
    maxWidth: "100%",
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
  assumptionLens: {
    maxWidth: "100%",
    minHeight: 22,
    justifyContent: "center",
  },
  assumptionPlainValue: { minHeight: 22, justifyContent: "center" },
  assumptionChevron: { width: 28, height: 40, alignItems: "center", justifyContent: "center" },
  inlineEdit: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  inlineEditText: {
    fontSize: 13,
    lineHeight: 17,
  },
});
