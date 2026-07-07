import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useI18n } from "../i18n";

const FIRE_EMOJI = "\u{1F525}";
const CRYING_EMOJI = "\u{1F622}";
const WALKER_EMOJI = "\u{1F3C3}";
const IMPACT_SCALE_MAX_PERCENT = 100;
const WALKER_TRACK_WIDTH = 230;
const WALKER_WIDTH = 42;

type Impact = {
  impactDays: number;
  baseDays: number | null;
  simulatedDays: number | null;
};

function resultDaysLabel(days: number) {
  const decimals = days < 0.01 ? 4 : days < 10 ? 2 : 1;
  const unit = Math.abs(days - 1) < 0.0001 ? "day" : "days";
  return `${days.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  })} ${unit}`;
}

function impactPercentLabel(percent: number) {
  if (!Number.isFinite(percent)) {
    return percent > 0 ? ">100%" : "<-100%";
  }

  if (percent === 0) {
    return "0%";
  }

  const absolutePercent = Math.abs(percent);
  const decimals =
    absolutePercent < 0.0001 ? 6 : absolutePercent < 0.01 ? 4 : absolutePercent < 1 ? 3 : 2;
  const sign = percent > 0 ? "+" : "-";
  return `${sign}${absolutePercent.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  })}%`;
}

function impactPercentToMeterStrength(percent: number) {
  if (!Number.isFinite(percent)) {
    return 1;
  }

  const absolutePercent = Math.abs(percent);
  return Math.min(1, absolutePercent / IMPACT_SCALE_MAX_PERCENT);
}

export function FireImpactCard({ amount, impact }: { amount: number; impact: Impact }) {
  const colors = useThemeColors();
  const t = useI18n();
  const reducedMotion = useReducedMotion();
  const meter = useSharedValue(0);
  const walkPhase = useSharedValue(0);
  const actualDays = impact.impactDays;
  const finiteImpact = Number.isFinite(actualDays);
  const absoluteDays = finiteImpact ? Math.abs(actualDays) : Number.POSITIVE_INFINITY;
  const direction = actualDays < 0 ? 1 : actualDays > 0 ? -1 : 0;
  const rawImpactPercent =
    impact.baseDays && impact.baseDays > 0 ? (-actualDays / impact.baseDays) * 100 : 0;
  const percentLabel = impactPercentLabel(rawImpactPercent);
  const finitePercent = Number.isFinite(rawImpactPercent);
  const absolutePercent = finitePercent ? Math.abs(rawImpactPercent) : 100;
  const percentDirection = rawImpactPercent > 0 ? 1 : rawImpactPercent < 0 ? -1 : 0;
  const meterStrength =
    amount <= 0 || direction === 0
      ? 0
      : finitePercent
        ? impactPercentToMeterStrength(absolutePercent)
        : 1;
  const meterValue = percentDirection * meterStrength;

  const tone = useMemo(() => {
    if (amount <= 0) {
      return {
        color: colors.primary,
        soft: `${colors.primary}18`,
        headline: t.fireImpact.noImpactYet,
      };
    }

    if (impact.baseDays === null && impact.simulatedDays === null) {
      return {
        color: colors.textMuted,
        soft: `${colors.textMuted}14`,
        headline: t.fireImpact.outOfRange,
      };
    }

    if (actualDays === Number.POSITIVE_INFINITY) {
      return {
        color: colors.negative,
        soft: `${colors.negative}18`,
        headline: t.fireImpact.movesOutOfRange(CRYING_EMOJI),
      };
    }

    if (actualDays === Number.NEGATIVE_INFINITY) {
      return {
        color: colors.positive,
        soft: `${colors.positive}18`,
        headline: t.fireImpact.backInRange(FIRE_EMOJI),
      };
    }

    if (direction > 0) {
      return {
        color: colors.positive,
        soft: `${colors.positive}18`,
        headline: t.fireImpact.closer(resultDaysLabel(absoluteDays), FIRE_EMOJI),
      };
    }

    if (direction < 0) {
      return {
        color: colors.negative,
        soft: `${colors.negative}18`,
        headline: t.fireImpact.behind(resultDaysLabel(absoluteDays), CRYING_EMOJI),
      };
    }

    return {
      color: colors.primary,
      soft: `${colors.primary}18`,
      headline: t.fireImpact.unchanged,
    };
  }, [
    absoluteDays,
    actualDays,
    amount,
    colors.negative,
    colors.positive,
    colors.primary,
    colors.textMuted,
    direction,
    impact.baseDays,
    impact.simulatedDays,
    t.fireImpact,
  ]);

  useEffect(() => {
    if (reducedMotion) {
      meter.value = meterValue;
      cancelAnimation(walkPhase);
      walkPhase.value = 0;
      return;
    }

    meter.value = withTiming(meterValue, {
      duration: 420,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    if (amount > 0 && direction !== 0) {
      walkPhase.value = withRepeat(
        withTiming(1, { duration: 520, easing: Easing.linear }),
        -1,
        false,
      );
      return;
    }

    cancelAnimation(walkPhase);
    walkPhase.value = 0;
  }, [amount, direction, meter, meterValue, reducedMotion, walkPhase]);

  const walkerPositionStyle = useAnimatedStyle(() => {
    const travel = WALKER_TRACK_WIDTH - WALKER_WIDTH;
    const center = travel / 2;
    return {
      transform: [{ translateX: center + meter.value * center }],
    };
  });

  const characterMotionStyle = useAnimatedStyle(() => {
    const active = Math.abs(meter.value) > 0.001 && !reducedMotion;
    const phase = walkPhase.value * Math.PI * 2;
    const bob = active ? Math.abs(Math.sin(phase)) * -3 : 0;
    const stride = active ? Math.sin(phase) * 1.4 : 0;
    const lean = active ? Math.sin(phase) * 4.2 : 0;
    const facing = meter.value > 0.001 ? -1 : 1;
    return {
      transform: [
        { scaleX: facing },
        { translateX: stride * facing },
        { translateY: bob },
        { rotate: `${lean}deg` },
      ],
    };
  }, [reducedMotion]);

  return (
    <View
      accessibilityLabel={t.fireImpact.accessibility(tone.headline, percentLabel)}
      style={[
        styles.card,
        {
          backgroundColor: tone.soft,
          borderColor: `${tone.color}66`,
          shadowColor: tone.color,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text
            numberOfLines={2}
            minimumFontScale={0.82}
            adjustsFontSizeToFit
            style={[styles.headline, typography.display, { color: colors.text }]}
          >
            {tone.headline}
          </Text>
        </View>
      </View>

      <View style={styles.chartRow}>
        <View style={styles.percentHeader}>
          <Text style={[styles.percentLabel, typography.button, { color: colors.textMuted }]}>
            {t.fireImpact.firePercent}
          </Text>
          <Text style={[styles.percentValue, typography.button, { color: tone.color }]}>
            {percentLabel}
          </Text>
        </View>
        <View style={styles.walkerStage}>
          <View style={[styles.walkerTrack, { backgroundColor: colors.surfaceBorder }]} />
          <View style={[styles.walkerCenter, { backgroundColor: colors.textMuted }]} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.walkerPosition,
              amount <= 0 || direction === 0 ? styles.walkerMuted : null,
              walkerPositionStyle,
            ]}
          >
            <Animated.View
              style={[styles.character, { shadowColor: tone.color }, characterMotionStyle]}
            >
              <View style={[styles.characterGlow, { backgroundColor: tone.color }]} />
              <View style={styles.motionTrail}>
                <View style={[styles.trailDotLarge, { backgroundColor: tone.color }]} />
                <View style={[styles.trailDotMedium, { backgroundColor: tone.color }]} />
                <View style={[styles.trailDotSmall, { backgroundColor: tone.color }]} />
              </View>
              <Text maxFontSizeMultiplier={1} style={styles.walkerEmoji}>
                {WALKER_EMOJI}
              </Text>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  topRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing.xs,
  },
  headline: {
    fontSize: 18,
    lineHeight: 23,
  },
  chartRow: {
    gap: 4,
  },
  percentHeader: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  percentLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  percentValue: {
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ["tabular-nums"],
  },
  walkerStage: {
    alignSelf: "center",
    width: WALKER_TRACK_WIDTH,
    height: 54,
    justifyContent: "center",
  },
  walkerTrack: {
    height: 4,
    borderRadius: 2,
    opacity: 0.72,
  },
  walkerCenter: {
    position: "absolute",
    alignSelf: "center",
    width: 1,
    height: 32,
    borderRadius: 1,
    opacity: 0.52,
  },
  walkerPosition: {
    position: "absolute",
    left: 0,
    width: WALKER_WIDTH,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  character: {
    width: WALKER_WIDTH,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  characterGlow: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    opacity: 0.16,
  },
  motionTrail: {
    position: "absolute",
    left: 1,
    top: 18,
    width: 16,
    height: 15,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  trailDotLarge: {
    width: 9,
    height: 3,
    borderRadius: 999,
    opacity: 0.42,
  },
  trailDotMedium: {
    width: 6,
    height: 3,
    borderRadius: 999,
    opacity: 0.3,
  },
  trailDotSmall: {
    width: 3,
    height: 2,
    borderRadius: 999,
    opacity: 0.22,
  },
  walkerEmoji: {
    fontSize: 31,
    lineHeight: 36,
    includeFontPadding: false,
  },
  walkerMuted: {
    opacity: 0.56,
  },
});
