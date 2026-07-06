import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FireProgressRing } from "../components/FireProgressRing";
import { GlassCard } from "../components/GlassCard";
import { MilestoneJourney } from "../components/MilestoneJourney";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusBadge } from "../components/StatusBadge";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useHomeViewModel } from "../hooks/useHomeViewModel";
import { money, percent, signedMoney } from "../utils/format";

export function HomeScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation() as unknown as {
    addListener: (event: "tabPress", callback: () => void) => () => void;
  };
  const vm = useHomeViewModel();
  const [assetAmountsHidden, setAssetAmountsHidden] = useState(false);
  const [ringMotionKey, setRingMotionKey] = useState(0);
  const days = vm.projectedFireDays === null ? null : Math.max(0, Math.round(vm.projectedFireDays));
  const daysLabel = days == null ? "No date" : days.toLocaleString();
  const assetVisibilityLabel = assetAmountsHidden ? "Show asset amounts" : "Hide asset amounts";
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

  useEffect(
    () => navigation.addListener("tabPress", replayRingMotion),
    [navigation, replayRingMotion],
  );

  function toggleAssetAmounts() {
    setAssetAmountsHidden((current) => !current);
  }

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
            Fire Countdown
          </Text>
          <Text style={[styles.title, typography.display, { color: colors.text }]}>
            Distance to FIRE
          </Text>
        </View>
      </View>

      <MotionPressable
        onPress={replayRingMotion}
        accessibilityLabel="Replay FIRE countdown animation"
        style={styles.ringReplay}
      >
        <FireProgressRing
          accessibilityLabel={`Days to FIRE ${daysLabel}. ${percent(vm.progress)} complete.`}
          motionKey={ringMotionKey}
          progress={vm.progress}
          centerLabel="Days to FIRE"
          centerValue={daysLabel}
        />
      </MotionPressable>

      <Text style={[styles.ringCaption, typography.body, { color: colors.textMuted }]}>
        {percent(vm.progress)} complete | Target {money(vm.target, goalCurrency)}
      </Text>

      <GlassCard>
        <View style={styles.statStrip}>
          <MotionPressable
            onPress={toggleAssetAmounts}
            accessibilityLabel={assetVisibilityLabel}
            accessibilityState={{ selected: assetAmountsHidden }}
            hitSlop={8}
            style={styles.statItem}
          >
            <Text style={[styles.statLabel, typography.body, { color: colors.textMuted }]}>
              Net worth
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.statValue, typography.title, { color: colors.text }]}
            >
              {totalAssetValue}
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={toggleAssetAmounts}
            accessibilityLabel={assetVisibilityLabel}
            accessibilityState={{ selected: assetAmountsHidden }}
            hitSlop={8}
            style={styles.statItem}
          >
            <Text style={[styles.statLabel, typography.body, { color: colors.textMuted }]}>
              Included FIRE
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
          label={`Today impact ${signedMoney(vm.todayImpact, goalCurrency)}`}
          tone={vm.todayImpact >= 0 ? "positive" : "negative"}
        />
      </GlassCard>

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          Milestone Journey
        </Text>
        <MilestoneJourney
          currency={goalCurrency}
          currentAmount={vm.includedAssets}
          items={vm.milestones}
        />
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  ringReplay: {
    alignSelf: "center",
    borderRadius: 130,
  },
  ringCaption: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  statStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: tokens.spacing.md,
    columnGap: tokens.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: 132,
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
});
