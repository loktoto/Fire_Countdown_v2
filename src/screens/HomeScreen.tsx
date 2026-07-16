import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { FireProgressRing } from "../components/FireProgressRing";
import { MilestoneJourney } from "../components/MilestoneJourney";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusBadge } from "../components/StatusBadge";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useHomeViewModel } from "../hooks/useHomeViewModel";
import { useI18n } from "../i18n";
import { money, percent, signedMoney } from "../utils/format";

export function HomeScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const vm = useHomeViewModel();
  const [assetAmountsHidden, setAssetAmountsHidden] = useState(false);
  const [ringMotionKey, setRingMotionKey] = useState(0);
  const days = vm.projectedFireDays === null ? null : Math.max(0, Math.round(vm.projectedFireDays));
  const daysLabel = days == null ? t.common.noDate : days.toLocaleString();
  const assetVisibilityLabel = assetAmountsHidden
    ? t.common.showAssetAmounts
    : t.common.hideAssetAmounts;
  const goalCurrency = vm.goal.baseCurrency;
  const totalAssetValue = assetAmountsHidden ? "***" : money(vm.totalAssets, goalCurrency);
  const includedAssetValue = assetAmountsHidden ? "***" : money(vm.includedAssets, goalCurrency);

  const replayRingMotion = useCallback(() => {
    setRingMotionKey((current) => current + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      replayRingMotion();
    }, [replayRingMotion]),
  );

  function toggleAssetAmounts() {
    setAssetAmountsHidden((current) => !current);
  }

  return (
    <ScreenContainer>
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
      </View>

      <View
        style={[
          styles.statBand,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.statStrip}>
          <MotionPressable
            onPress={toggleAssetAmounts}
            accessibilityLabel={assetVisibilityLabel}
            accessibilityState={{ selected: assetAmountsHidden }}
            hitSlop={8}
            style={styles.statItem}
          >
            <Text style={[styles.statLabel, typography.body, { color: colors.textMuted }]}>
              {t.home.netWorth}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.statValue, typography.title, { color: colors.text }]}
            >
              {totalAssetValue}
            </Text>
          </MotionPressable>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <MotionPressable
            onPress={toggleAssetAmounts}
            accessibilityLabel={assetVisibilityLabel}
            accessibilityState={{ selected: assetAmountsHidden }}
            hitSlop={8}
            style={styles.statItem}
          >
            <Text style={[styles.statLabel, typography.body, { color: colors.textMuted }]}>
              {t.home.includedFire}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.statValue, typography.title, { color: colors.text }]}
            >
              {includedAssetValue}
            </Text>
          </MotionPressable>
        </View>
        <StatusBadge
          label={t.home.todayImpact(signedMoney(vm.todayImpact, goalCurrency))}
          tone={vm.todayImpact >= 0 ? "positive" : "negative"}
        />
      </View>

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  countdownStage: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: tokens.spacing.xl,
  },
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
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 26,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  journeySection: {
    gap: tokens.spacing.md,
  },
});
