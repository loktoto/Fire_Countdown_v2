import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { CategoryGlyph } from "../components/CategoryGlyph";
import { GlassCard } from "../components/GlassCard";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatusBadge } from "../components/StatusBadge";
import { WealthCrossoverChart } from "../components/WealthCrossoverChart";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { CategoryCashflowLeader } from "../engine/selectors";
import { useDashboardViewModel } from "../hooks/useDashboardViewModel";
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
        {leader ? `${leader.transactionCount} records this month` : "No records this month"}
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
  const router = useRouter();
  const vm = useDashboardViewModel();
  const goalCurrency = vm.goal.baseCurrency;
  const years =
    vm.projectedFireDays === null ? "No" : Math.max(0, vm.projectedFireDays / 365.25).toFixed(1);
  const projectedFireMonth = vm.projectedFireDate?.slice(0, 7) ?? "Not reached";
  const projectedFireAge =
    vm.projectedFireDays === null || vm.goal.currentAge == null
      ? null
      : Math.floor(vm.goal.currentAge + vm.projectedFireDays / 365.25);

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
          Projection lab
        </Text>
        <Text style={[styles.title, typography.display, { color: colors.text }]}>
          FIRE trajectory
        </Text>
      </View>

      <SegmentedControl
        value={vm.scenarioId ?? "scenario-base"}
        onChange={vm.setScenarioId}
        options={vm.scenarios.map((scenario) => ({ value: scenario.id, label: scenario.name }))}
      />

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
              Projected FIRE
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.heroValue, typography.display, { color: colors.text }]}
            >
              {projectedFireMonth}
            </Text>
            <Text style={[styles.heroMeta, typography.body, { color: colors.textMuted }]}>
              {vm.scenario?.name ?? "Base"} method | {money(vm.target, goalCurrency)} target |{" "}
              {vm.projectedFireDays === null ? "No crossover" : `${years} years`}
            </Text>
          </View>
          <StatusBadge
            label={
              vm.projectedFireDays === null
                ? "No crossover"
                : projectedFireAge == null
                  ? "Age not set"
                  : `Age ${projectedFireAge}`
            }
            tone={vm.projectedFireDays === null ? "warning" : "primary"}
          />
        </View>
        <View style={styles.projectionGrid}>
          <ProjectionMetric label="Progress" value={percent(vm.progress)} tone="primary" />
          <ProjectionMetric label="Included FIRE" value={money(vm.includedAssets, goalCurrency)} />
          <ProjectionMetric
            label="Saved cashflow"
            value={signedMoney(vm.transactionAdjustment, goalCurrency)}
            tone={vm.transactionAdjustment >= 0 ? "positive" : "negative"}
          />
          <ProjectionMetric
            label="Month net"
            value={signedMoney(vm.monthSummary.net, goalCurrency)}
            tone={vm.monthSummary.net >= 0 ? "positive" : "negative"}
          />
        </View>
      </GlassCard>

      <GlassCard compact>
        <View style={styles.compactHeader}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            Cashflow leaders
          </Text>
          <StatusBadge
            label={`Today ${signedMoney(vm.todayImpact, goalCurrency)}`}
            tone={vm.todayImpact >= 0 ? "positive" : "negative"}
          />
        </View>
        <View style={styles.summaryGrid}>
          <SummaryLeaderCard
            title="Most spending"
            leader={vm.monthLeaders.expense}
            fallback="No spending"
            tone="negative"
            currency={goalCurrency}
          />
          <SummaryLeaderCard
            title="Most earning"
            leader={vm.monthLeaders.income}
            fallback="No earning"
            tone="positive"
            currency={goalCurrency}
          />
        </View>
      </GlassCard>

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          Wealth Crossover
        </Text>
        <WealthCrossoverChart
          projection={vm.chartProjection}
          currency={goalCurrency}
          currentAge={vm.goal.currentAge}
        />
      </GlassCard>

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          Assumptions
        </Text>
        <View style={styles.chips}>
          {[
            ["FIRE method", vm.scenario?.name ?? "Base"],
            ["Included assets", money(vm.includedAssets, goalCurrency)],
            ["Method return", percent(vm.effectiveAssumptions.expectedReturn)],
            ["Monthly saving", money(vm.effectiveAssumptions.monthlySaving, goalCurrency)],
            ["Withdrawal rate", percent(vm.effectiveAssumptions.withdrawalRate)],
            ["Inflation", percent(vm.effectiveAssumptions.inflationRate)],
            ["Target spending", money(vm.effectiveAssumptions.targetMonthlySpending, goalCurrency)],
            ["FIRE target", money(vm.effectiveAssumptions.targetAmount, goalCurrency)],
          ].map(([label, value]) => (
            <MotionPressable
              key={label}
              onPress={() => router.push("/settings")}
              style={[
                styles.chip,
                { borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceSolid },
              ]}
            >
              <Text style={[styles.chipLabel, typography.body, { color: colors.textMuted }]}>
                {label}
              </Text>
              <Text
                numberOfLines={2}
                minimumFontScale={0.86}
                adjustsFontSizeToFit
                style={[styles.chipValue, typography.button, { color: colors.text }]}
              >
                {value}
              </Text>
            </MotionPressable>
          ))}
        </View>
      </GlassCard>
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
