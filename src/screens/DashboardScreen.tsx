import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { CategoryGlyph } from "../components/CategoryGlyph";
import {
  FirePlanEditorSheet,
  ScenarioEditorSheet,
  ScenarioListSheet,
} from "../components/FirePlanSettingsSheets";
import { GlassCard } from "../components/GlassCard";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatusBadge } from "../components/StatusBadge";
import { WealthCrossoverChart } from "../components/WealthCrossoverChart";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { CategoryCashflowLeader } from "../engine/selectors";
import type { ProjectionScenario } from "../features/types";
import { useDashboardViewModel } from "../hooks/useDashboardViewModel";
import { useI18n } from "../i18n";
import { money, percent, signedMoney } from "../utils/format";

function SummaryLeaderCard({
  title,
  leader,
  fallback,
  tone,
  currency,
}: {
  title: string;
  leader: CategoryCashflowLeader | null;
  fallback: string;
  tone: "positive" | "negative";
  currency: string;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const color = leader?.categoryColor ?? (tone === "positive" ? colors.positive : colors.negative);
  const amount = leader ? money(leader.amount, currency) : money(0, currency);

  return (
    <View
      style={[
        styles.summaryLeader,
        { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
      ]}
    >
      <View style={styles.summaryLeaderHeader}>
        <CategoryGlyph icon={leader?.categoryIcon} color={color} size={38} />
        <View style={styles.summaryLeaderCopy}>
          <Text style={[styles.liveLabel, typography.body, { color: colors.textMuted }]}>
            {title}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.summaryCategory, typography.button, { color: colors.text }]}
          >
            {leader?.categoryName ?? fallback}
          </Text>
        </View>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.summaryAmount,
          typography.title,
          { color: tone === "positive" ? colors.positive : colors.negative },
        ]}
      >
        {amount}
      </Text>
      <Text style={[styles.summaryMeta, typography.body, { color: colors.textMuted }]}>
        {leader ? t.common.recordsThisMonth(leader.transactionCount) : t.common.noRecordsThisMonth}
      </Text>
    </View>
  );
}

function ProjectionMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative" | "primary";
}) {
  const colors = useThemeColors();
  const toneColor =
    tone === "positive"
      ? colors.positive
      : tone === "negative"
        ? colors.negative
        : tone === "primary"
          ? colors.primary
          : colors.text;

  return (
    <View
      style={[
        styles.projectionMetric,
        { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
      ]}
    >
      <Text style={[styles.liveLabel, typography.body, { color: colors.textMuted }]}>{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.projectionMetricValue, typography.button, { color: toneColor }]}
      >
        {value}
      </Text>
    </View>
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
  const years =
    vm.projectedFireDays === null ? null : Math.max(0, vm.projectedFireDays / 365.25).toFixed(1);
  const projectedFireMonth = vm.projectedFireDate?.slice(0, 7) ?? t.dashboard.notReached;
  const projectedFireAge =
    vm.projectedFireDays === null || vm.goal.currentAge == null
      ? null
      : Math.floor(vm.goal.currentAge + vm.projectedFireDays / 365.25);
  const scenarioCount = vm.scenarios.length;

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

  const assumptionChips = [
    {
      label: t.dashboard.fireMethod,
      value: vm.scenario?.name ?? t.dashboard.base,
      onPress: openScenarioList,
    },
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
    {
      label: t.dashboard.fireTarget,
      value: money(vm.effectiveAssumptions.targetAmount, goalCurrency),
      onPress: openFirePlanEditor,
    },
  ];

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
          {t.dashboard.kicker}
        </Text>
        <Text style={[styles.title, typography.display, { color: colors.text }]}>
          {t.dashboard.title}
        </Text>
      </View>

      <SegmentedControl
        value={vm.scenarioId ?? "scenario-base"}
        onChange={vm.setScenarioId}
        options={vm.scenarios.map((scenario) => ({ value: scenario.id, label: scenario.name }))}
      />

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          {t.dashboard.wealthCrossover}
        </Text>
        <WealthCrossoverChart
          projection={vm.chartProjection}
          currency={goalCurrency}
          currentAge={vm.goal.currentAge}
        />
      </GlassCard>

      <GlassCard
        style={[
          styles.heroCard,
          {
            borderColor: `${colors.primary}55`,
            backgroundColor:
              colors.mode === "dark" ? "rgba(0, 240, 255, 0.055)" : "rgba(227, 234, 231, 0.98)",
          },
        ]}
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={[styles.liveLabel, typography.body, { color: colors.textMuted }]}>
              {t.dashboard.projectedFire}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.heroValue, typography.display, { color: colors.text }]}
            >
              {projectedFireMonth}
            </Text>
            <Text style={[styles.heroMeta, typography.body, { color: colors.textMuted }]}>
              {vm.scenario?.name ?? t.dashboard.base} {t.dashboard.method} |{" "}
              {money(vm.target, goalCurrency)} {t.dashboard.target} |{" "}
              {years === null ? t.dashboard.noCrossover : t.dashboard.years(years)}
            </Text>
          </View>
          <StatusBadge
            label={
              vm.projectedFireDays === null
                ? t.dashboard.noCrossover
                : projectedFireAge == null
                  ? t.dashboard.ageNotSet
                  : t.dashboard.age(projectedFireAge)
            }
            tone={vm.projectedFireDays === null ? "warning" : "primary"}
          />
        </View>
        <View style={styles.projectionGrid}>
          <ProjectionMetric
            label={t.dashboard.progress}
            value={percent(vm.progress)}
            tone="primary"
          />
          <ProjectionMetric
            label={t.dashboard.includedFire}
            value={money(vm.includedAssets, goalCurrency)}
          />
          <ProjectionMetric
            label={t.dashboard.savedCashflow}
            value={signedMoney(vm.transactionAdjustment, goalCurrency)}
            tone={vm.transactionAdjustment >= 0 ? "positive" : "negative"}
          />
          <ProjectionMetric
            label={t.dashboard.monthNet}
            value={signedMoney(vm.monthSummary.net, goalCurrency)}
            tone={vm.monthSummary.net >= 0 ? "positive" : "negative"}
          />
        </View>
      </GlassCard>

      <GlassCard compact>
        <View style={styles.compactHeader}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            {t.dashboard.cashflowLeaders}
          </Text>
          <StatusBadge
            label={t.dashboard.today(signedMoney(vm.todayImpact, goalCurrency))}
            tone={vm.todayImpact >= 0 ? "positive" : "negative"}
          />
        </View>
        <View style={styles.summaryGrid}>
          <SummaryLeaderCard
            title={t.dashboard.mostSpending}
            leader={vm.monthLeaders.expense}
            fallback={t.dashboard.noSpending}
            tone="negative"
            currency={goalCurrency}
          />
          <SummaryLeaderCard
            title={t.dashboard.mostEarning}
            leader={vm.monthLeaders.income}
            fallback={t.dashboard.noEarning}
            tone="positive"
            currency={goalCurrency}
          />
        </View>
      </GlassCard>

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          {t.dashboard.assumptions}
        </Text>
        <View style={styles.chips}>
          {assumptionChips.map((chip) => (
            <MotionPressable
              key={chip.label}
              onPress={chip.onPress}
              haptic="selection"
              style={[
                styles.chip,
                { borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceSolid },
              ]}
            >
              <Text style={[styles.chipLabel, typography.body, { color: colors.textMuted }]}>
                {chip.label}
              </Text>
              <Text
                numberOfLines={2}
                minimumFontScale={0.86}
                adjustsFontSizeToFit
                style={[styles.chipValue, typography.button, { color: colors.text }]}
              >
                {chip.value}
              </Text>
            </MotionPressable>
          ))}
        </View>
      </GlassCard>
      <ScenarioListSheet
        visible={scenarioListOpen}
        goal={vm.goal}
        scenarios={vm.scenarios}
        currency={goalCurrency}
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
        onClose={closeScenarioEditor}
        onSave={saveScenario}
        onArchive={creatingScenario || scenarioCount <= 1 ? undefined : archiveScenario}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
  },
  heroCard: {
    borderWidth: 1,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  heroValue: {
    fontSize: 40,
    lineHeight: 48,
    fontVariant: ["tabular-nums"],
  },
  heroMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  projectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: tokens.spacing.sm,
    columnGap: tokens.spacing.sm,
  },
  projectionMetric: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 130,
    minHeight: 64,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.sm,
    justifyContent: "center",
    gap: 4,
  },
  projectionMetricValue: {
    fontSize: 17,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: tokens.spacing.sm,
    columnGap: tokens.spacing.md,
  },
  liveLabel: {
    fontSize: 11,
    lineHeight: 15,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: tokens.spacing.sm,
    columnGap: tokens.spacing.sm,
  },
  summaryLeader: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 146,
    minHeight: 112,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  summaryLeaderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  summaryLeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  summaryCategory: {
    fontSize: 15,
    lineHeight: 20,
  },
  summaryAmount: {
    fontSize: 19,
    lineHeight: 24,
  },
  summaryMeta: {
    fontSize: 11,
    lineHeight: 15,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: tokens.spacing.sm,
    columnGap: tokens.spacing.sm,
  },
  chip: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 146,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.md,
    gap: 6,
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  chipValue: {
    fontSize: 14,
    lineHeight: 19,
  },
});
