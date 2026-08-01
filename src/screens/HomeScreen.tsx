import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { FireProgressRing } from "../components/FireProgressRing";
import { MilestoneJourney } from "../components/MilestoneJourney";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { StatusBadge } from "../components/StatusBadge";
import { TimeLensValue } from "../components/TimeLens";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useHomeViewModel } from "../hooks/useHomeViewModel";
import { useI18n } from "../i18n";
import {
  formatMonthYear,
  isoDateParts,
  money,
  percent,
  signedMoney,
  todayIso,
} from "../utils/format";

export function HomeScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const vm = useHomeViewModel();
  const { fontScale, width } = useWindowDimensions();
  const [assetAmountsHidden, setAssetAmountsHidden] = useState(false);
  const [ringMotionKey, setRingMotionKey] = useState(0);
  const stackCompactDetails = width < 360 || fontScale > 1.2;
  const days = vm.projectedFireDays === null ? null : Math.max(0, Math.round(vm.projectedFireDays));
  const daysLabel = days == null ? t.common.noDate : days.toLocaleString();
  const assetVisibilityLabel = assetAmountsHidden
    ? t.common.showAssetAmounts
    : t.common.hideAssetAmounts;
  const goalCurrency = vm.goal.baseCurrency;
  const totalAssetValue = assetAmountsHidden ? "***" : money(vm.totalAssets, goalCurrency);
  const includedAssetValue = assetAmountsHidden ? "***" : money(vm.includedAssets, goalCurrency);

  const today = todayIso();
  const workdayParts = vm.projectedFireDate ? isoDateParts(vm.projectedFireDate) : null;
  const workday = workdayParts
    ? new Date(workdayParts.year, workdayParts.month - 1, workdayParts.day)
    : null;
  const currentMonthLabel = formatMonthYear(today, t.locale);

  const replayRingMotion = useCallback(() => {
    setRingMotionKey((current) => current + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      replayRingMotion();
    }, [replayRingMotion]),
  );
  const todayParts = isoDateParts(today);
  const monthsAway = workday
    ? Math.max(
        0,
        (workday.getFullYear() - todayParts.year) * 12 +
          workday.getMonth() -
          (todayParts.month - 1),
      )
    : null;

  function toggleAssetAmounts() {
    setAssetAmountsHidden((current) => !current);
  }

  return (
    <ScreenScaffold>
      <AppHeader eyebrow={t.home.kicker} title={t.home.title} />

      <View style={[styles.countdownStage, { borderBottomColor: colors.surfaceBorder }]}>
        <MotionPressable
          onPress={replayRingMotion}
          accessibilityLabel={`${t.home.daysToFire} ${daysLabel}. ${percent(vm.progress)}.`}
          accessibilityHint={t.home.replayCountdown}
          style={styles.ringReplay}
        >
          <FireProgressRing
            accessibilityLabel={`${t.home.daysToFire} ${daysLabel}. ${percent(vm.progress)}.`}
            motionKey={ringMotionKey}
            progress={vm.progress}
            centerLabel={t.home.daysToFire}
            centerValue={daysLabel}
          />
        </MotionPressable>

        <Text style={[styles.ringCaption, typography.body, { color: colors.textSubtle }]}>
          {t.home.completeTarget(percent(vm.progress), money(vm.target, goalCurrency))}
        </Text>

        <View
          accessible
          accessibilityLabel={`${t.home.lastRequiredWorkday}. ${
            workday
              ? workday.toLocaleDateString(t.locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : t.common.noDate
          }`}
          style={[
            styles.workdayTile,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Text style={[styles.workdayKicker, typography.button, { color: colors.textMuted }]}>
            {t.home.lastRequiredWorkday}
          </Text>
          <Text style={[styles.workdayWeekday, typography.title, { color: colors.textMuted }]}>
            {workday ? workday.toLocaleDateString(t.locale, { weekday: "long" }) : t.common.noDate}
          </Text>
          <Text style={[styles.workdayDate, typography.display, { color: colors.text }]}>
            {workday
              ? workday.toLocaleDateString(t.locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : t.common.noDate}
          </Text>
          <Text style={[styles.workdayAway, typography.body, { color: colors.textSubtle }]}>
            {monthsAway == null
              ? ""
              : t.home.workdayDistance(Math.floor(monthsAway / 12), monthsAway % 12)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statBand,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={[styles.statStrip, stackCompactDetails && styles.statStripStacked]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, typography.body, { color: colors.textMuted }]}>
              {t.home.netWorth}
            </Text>
            <TimeLensValue
              amount={vm.totalAssets}
              moneyText={totalAssetValue}
              kind="asset"
              disabled={assetAmountsHidden}
              onPress={toggleAssetAmounts}
              accessibilityLabel={`${t.home.netWorth}: ${totalAssetValue}. ${assetVisibilityLabel}`}
              adjustsFontSizeToFit={false}
              numberOfLines={2}
              style={styles.statLens}
              textStyle={[styles.statValue, typography.title, { color: colors.text }]}
            />
          </View>
          <View
            style={[
              styles.statDivider,
              stackCompactDetails && styles.statDividerStacked,
              { backgroundColor: colors.divider },
            ]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, typography.body, { color: colors.textMuted }]}>
              {t.home.includedFire}
            </Text>
            <TimeLensValue
              amount={vm.includedAssets}
              moneyText={includedAssetValue}
              kind="asset"
              disabled={assetAmountsHidden}
              onPress={toggleAssetAmounts}
              accessibilityLabel={`${t.home.includedFire}: ${includedAssetValue}. ${assetVisibilityLabel}`}
              adjustsFontSizeToFit={false}
              numberOfLines={2}
              style={styles.statLens}
              textStyle={[styles.statValue, typography.title, { color: colors.text }]}
            />
          </View>
        </View>
        <StatusBadge
          label={
            vm.todayImpact === 0
              ? t.home.noTodayImpact
              : t.home.todayImpact(signedMoney(vm.todayImpact, goalCurrency))
          }
          tone={vm.todayImpact > 0 ? "positive" : vm.todayImpact < 0 ? "negative" : "neutral"}
        />
      </View>

      {vm.acceleration.netDays != null && vm.acceleration.projectionDays != null ? (
        <View
          style={[
            styles.accelerationCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Text style={[styles.accelerationKicker, typography.button, { color: colors.textMuted }]}>
            {t.home.monthProgress(currentMonthLabel)}
          </Text>
          <Text style={[styles.accelerationHeadline, typography.title, { color: colors.text }]}>
            {t.home.monthProgressHeadline(
              Math.abs(Math.round(vm.acceleration.netDays)).toLocaleString(t.locale),
              vm.acceleration.netDays >= 0,
              currentMonthLabel,
            )}
          </Text>
          <View
            style={[
              styles.accelerationColumns,
              stackCompactDetails && styles.accelerationColumnsStacked,
            ]}
          >
            <View style={styles.accelerationMetric}>
              <Text style={[styles.accelerationValue, typography.title, { color: colors.text }]}>
                {t.home.dayCount(vm.acceleration.calendarDays.toLocaleString(t.locale))}
              </Text>
              <Text style={[typography.body, { color: colors.textMuted }]}>
                {t.home.calendarTimePassed}
              </Text>
            </View>
            <View style={styles.accelerationMetric}>
              <Text
                style={[
                  styles.accelerationValue,
                  typography.title,
                  {
                    color: vm.acceleration.projectionDays >= 0 ? colors.positive : colors.negative,
                  },
                ]}
              >
                {t.home.projectionMoveValue(
                  Math.abs(Math.round(vm.acceleration.projectionDays)).toLocaleString(t.locale),
                  vm.acceleration.projectionDays >= 0,
                )}
              </Text>
              <Text style={[typography.body, { color: colors.textMuted }]}>
                {t.home.estimatedFireDateMoved}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.journeySection}>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          {t.home.milestoneJourney}
        </Text>
        <MilestoneJourney
          currency={goalCurrency}
          currentAmount={vm.includedAssets}
          items={vm.milestones}
        />
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  countdownStage: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: tokens.spacing.xl,
  },
  workdayKicker: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  workdayTile: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.xs,
    alignItems: "center",
  },
  workdayWeekday: { fontSize: 18, lineHeight: 24 },
  workdayDate: { fontSize: 28, lineHeight: 35, textAlign: "center" },
  workdayAway: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  ringReplay: {
    alignSelf: "center",
    borderRadius: 130,
  },
  ringCaption: {
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  statStrip: {
    flexDirection: "row",
    alignItems: "stretch",
    columnGap: tokens.spacing.md,
  },
  statStripStacked: {
    flexDirection: "column",
    rowGap: tokens.spacing.md,
  },
  statBand: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
  },
  statDividerStacked: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 26,
    marginTop: 4,
  },
  statLens: { marginTop: 2, minHeight: 44, justifyContent: "center" },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  journeySection: {
    gap: tokens.spacing.md,
  },
  accelerationCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  accelerationKicker: { fontSize: 12, lineHeight: 16 },
  accelerationHeadline: { fontSize: 18, lineHeight: 25 },
  accelerationColumns: { flexDirection: "row", gap: tokens.spacing.md },
  accelerationColumnsStacked: { flexDirection: "column" },
  accelerationMetric: { flex: 1, gap: tokens.spacing.xs },
  accelerationValue: { fontSize: 20, lineHeight: 26 },
});
