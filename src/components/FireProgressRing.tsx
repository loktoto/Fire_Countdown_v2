import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function FireProgressRing({
  accessibilityLabel,
  motionKey = 0,
  progress,
  centerLabel,
  centerValue,
}: {
  accessibilityLabel?: string;
  motionKey?: number;
  progress: number;
  centerLabel: string;
  centerValue: string;
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const size = 240;
  const stroke = 12;
  const radius = 97;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(1, Math.max(0, progress));
  const draw = useSharedValue(reducedMotion ? 1 : 0);
  const ringScale = useSharedValue(1);
  const centerScale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      draw.value = 1;
      ringScale.value = 1;
      centerScale.value = 1;
      return;
    }

    draw.value = 0;
    ringScale.value = 0.975;
    centerScale.value = 0.94;

    draw.value = withTiming(1, {
      duration: tokens.motion.drawMs,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    ringScale.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    centerScale.value = withDelay(
      70,
      withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) }),
    );
  }, [centerScale, draw, motionKey, reducedMotion, ringScale]);

  const animatedRingProps = useAnimatedProps(() => ({
    opacity: interpolate(draw.value, [0, 0.12, 1], [0, 1, 1], "clamp"),
    strokeDashoffset: circumference * (1 - safeProgress * draw.value),
  }));

  const animatedMarkerProps = useAnimatedProps(() => {
    const angle = -Math.PI / 2 + safeProgress * draw.value * Math.PI * 2;
    return {
      cx: center + Math.cos(angle) * radius,
      cy: center + Math.sin(angle) * radius,
      opacity: interpolate(draw.value, [0, 0.35, 1], [0, 0, 1], "clamp"),
    };
  });

  const ticks = Array.from({ length: 36 }, (_, index) => {
    const angle = -Math.PI / 2 + (index / 36) * Math.PI * 2;
    const outerRadius = 117;
    const innerRadius = index % 3 === 0 ? 108 : 112;
    return {
      index,
      x1: center + Math.cos(angle) * innerRadius,
      y1: center + Math.sin(angle) * innerRadius,
      x2: center + Math.cos(angle) * outerRadius,
      y2: center + Math.sin(angle) * outerRadius,
    };
  });

  const ringMotionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const centerMotionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(centerScale.value, [0.94, 1], [0.72, 1], "clamp"),
    transform: [{ scale: centerScale.value }],
  }));

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeProgress * 100) }}
      style={styles.root}
    >
      <Animated.View style={ringMotionStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {ticks.map((tick) => (
            <Line
              key={tick.index}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={colors.textMuted}
              strokeWidth={tick.index % 3 === 0 ? 1.4 : 1}
              opacity={tick.index % 3 === 0 ? 0.34 : 0.18}
              strokeLinecap="round"
            />
          ))}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.surfaceBorder}
            strokeWidth={stroke}
            fill="transparent"
          />
          <AnimatedCircle
            animatedProps={animatedRingProps}
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.primary}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            rotation="-90"
            origin={`${center}, ${center}`}
            fill="transparent"
          />
          <AnimatedCircle
            animatedProps={animatedMarkerProps}
            r={6}
            fill={colors.primary}
            stroke={colors.surfaceSolid}
            strokeWidth={3}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.center, centerMotionStyle]}>
        <Text style={[styles.centerLabel, typography.button, { color: colors.textMuted }]}>
          {centerLabel}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.centerValue, typography.display, { color: colors.text }]}
        >
          {centerValue}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    height: 240,
    width: 240,
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
    maxWidth: 176,
  },
  centerLabel: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  centerValue: {
    fontSize: 38,
    lineHeight: 46,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
});
