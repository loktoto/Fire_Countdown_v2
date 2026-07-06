import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  FadeInRight,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

const darkChartColors = [tokens.color.cyan, tokens.color.emerald, "#96A6BF", "#FED639", "#FF7A45"];
const CHART_SIZE = 112;
const CHART_STROKE = 18;
const CHART_RADIUS = (CHART_SIZE - CHART_STROKE) / 2;
const CHART_CENTER = CHART_SIZE / 2;
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AllocationSegment = {
  label: string;
  value: number;
};

type ChartSegment = {
  color: string;
  length: number;
  label: string;
  strokeDashoffset: number;
};

function formatAllocationLabel(label: string) {
  return label
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "etf") {
        return "ETF";
      }
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

function AllocationSlice({
  motionKey,
  reducedMotion,
  segment,
  segmentIndex,
}: {
  motionKey: number;
  reducedMotion: boolean;
  segment: ChartSegment;
  segmentIndex: number;
}) {
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      // Reanimated shared values are intentionally mutable.

      progress.value = 1;
      return;
    }

    // Reanimated shared values are intentionally mutable.

    progress.value = 0;
    // Reanimated shared values are intentionally mutable.

    progress.value = withDelay(
      segmentIndex * 95,
      withTiming(1, {
        duration: 680,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [motionKey, progress, reducedMotion, segmentIndex]);

  const animatedProps = useAnimatedProps(() => {
    const opacity = interpolate(progress.value, [0, 0.16, 1], [0, 1, 1], "clamp");
    return {
      opacity,
      strokeDashoffset: segment.strokeDashoffset + (1 - progress.value) * segment.length,
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cx={CHART_CENTER}
      cy={CHART_CENTER}
      r={CHART_RADIUS}
      stroke={segment.color}
      strokeWidth={CHART_STROKE}
      fill="none"
      strokeDasharray={`${segment.length} ${CHART_CIRCUMFERENCE - segment.length}`}
      strokeLinecap="butt"
      transform={`rotate(-90 ${CHART_CENTER} ${CHART_CENTER})`}
    />
  );
}

export function AllocationBar({
  motionKey = 0,
  segments,
}: {
  motionKey?: number;
  segments: AllocationSegment[];
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const chartPalette =
    colors.mode === "dark"
      ? darkChartColors
      : [colors.primary, colors.positive, "#6C7C90", colors.warning, "#87573B"];
  const chartScale = useSharedValue(1);
  const chartRotation = useSharedValue(0);
  const orbit = useSharedValue(reducedMotion ? 1 : 0);
  const centerScale = useSharedValue(1);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  const chartSegments = visibleSegments.map((segment, index) => {
    const previousValue = visibleSegments
      .slice(0, index)
      .reduce((sum, previousSegment) => sum + previousSegment.value, 0);
    const length = (segment.value / total) * CHART_CIRCUMFERENCE;
    return {
      color: chartPalette[index % chartPalette.length] ?? colors.primary,
      label: segment.label,
      length,
      strokeDashoffset: -(previousValue / total) * CHART_CIRCUMFERENCE,
    };
  });

  useEffect(() => {
    if (reducedMotion) {
      // Reanimated shared values are intentionally mutable.

      chartScale.value = 1;
      // Reanimated shared values are intentionally mutable.

      chartRotation.value = 0;
      // Reanimated shared values are intentionally mutable.

      centerScale.value = 1;
      // Reanimated shared values are intentionally mutable.

      orbit.value = 1;
      return;
    }

    // Reanimated shared values are intentionally mutable.

    chartScale.value = 0.94;
    // Reanimated shared values are intentionally mutable.

    chartRotation.value = -8;
    // Reanimated shared values are intentionally mutable.

    centerScale.value = 0.9;
    // Reanimated shared values are intentionally mutable.

    orbit.value = 0;

    // Reanimated shared values are intentionally mutable.

    chartScale.value = withSequence(
      withTiming(1.06, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 150 }),
    );
    // Reanimated shared values are intentionally mutable.

    chartRotation.value = withSequence(
      withTiming(7, { duration: 210, easing: Easing.out(Easing.cubic) }),
      withSpring(0, { damping: 11, stiffness: 120 }),
    );
    // Reanimated shared values are intentionally mutable.

    centerScale.value = withDelay(
      260,
      withSequence(
        withTiming(1.12, { duration: 160, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 10, stiffness: 160 }),
      ),
    );
    // Reanimated shared values are intentionally mutable.

    orbit.value = withTiming(1, {
      duration: 980,
      easing: Easing.out(Easing.cubic),
    });
  }, [centerScale, chartRotation, chartScale, motionKey, orbit, reducedMotion]);

  const chartMotionStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chartRotation.value}deg` }, { scale: chartScale.value }],
  }));

  const centerMotionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(centerScale.value, [0.9, 1], [0.66, 1], "clamp"),
    transform: [{ scale: centerScale.value }],
  }));

  const orbitStyle = useAnimatedStyle(() => {
    const angle = orbit.value * Math.PI * 2 - Math.PI / 2;
    const radius = CHART_RADIUS + CHART_STROKE / 2;
    const opacity = interpolate(orbit.value, [0, 0.08, 0.84, 1], [0, 1, 1, 0], "clamp");
    const scale = interpolate(orbit.value, [0, 0.12, 0.82, 1], [0.5, 1.15, 1, 0.7], "clamp");

    return {
      opacity: reducedMotion ? 0 : opacity,
      transform: [
        { translateX: Math.cos(angle) * radius },
        { translateY: Math.sin(angle) * radius },
        { scale },
      ],
    };
  }, [reducedMotion]);

  return (
    <View
      accessibilityLabel={`Allocation: ${segments
        .map((segment) => `${segment.label} ${Math.round((segment.value / total) * 100)} percent`)
        .join(", ")}`}
      style={styles.root}
    >
      <View style={styles.chartWrap}>
        <Animated.View style={chartMotionStyle}>
          <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
            <Circle
              cx={CHART_CENTER}
              cy={CHART_CENTER}
              r={CHART_RADIUS}
              stroke={colors.surfaceSolid}
              strokeWidth={CHART_STROKE}
              fill="none"
            />
            {chartSegments.map((segment, index) => (
              <AllocationSlice
                key={segment.label}
                motionKey={motionKey}
                reducedMotion={reducedMotion}
                segment={segment}
                segmentIndex={index}
              />
            ))}
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.centerLabel, centerMotionStyle]}>
          <Text style={[styles.centerValue, typography.title, { color: colors.text }]}>100%</Text>
          <Text style={[styles.centerText, typography.body, { color: colors.textMuted }]}>mix</Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.orbitSpark,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
            orbitStyle,
          ]}
        />
      </View>
      <View style={styles.legend}>
        {segments.map((segment, index) => (
          <Animated.View
            key={`${segment.label}-${motionKey}`}
            entering={
              reducedMotion
                ? undefined
                : FadeInRight.duration(260)
                    .delay(180 + index * 55)
                    .easing(Easing.out(Easing.cubic))
            }
            style={styles.legendItem}
          >
            <View
              style={[styles.dot, { backgroundColor: chartPalette[index % chartPalette.length] }]}
            />
            <View style={styles.legendTextRow}>
              <Text
                numberOfLines={1}
                style={[styles.legendName, typography.bodyMedium, { color: colors.text }]}
              >
                {formatAllocationLabel(segment.label)}
              </Text>
              <Text
                style={[styles.legendPercent, typography.bodyMedium, { color: colors.textSubtle }]}
              >
                {Math.round((segment.value / total) * 100)}%
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.lg,
  },
  chartWrap: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitSpark: {
    position: "absolute",
    left: CHART_CENTER - 5,
    top: CHART_CENTER - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOpacity: 0.42,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  centerValue: {
    fontSize: 20,
    lineHeight: 24,
    fontVariant: ["tabular-nums"],
  },
  centerText: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  legend: {
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    gap: tokens.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendName: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
  },
  legendPercent: {
    flexShrink: 0,
    fontSize: 13,
    lineHeight: 18,
  },
});
