import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
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
  const size = 260;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(1, Math.max(0, progress));
  const draw = useSharedValue(reducedMotion ? 1 : 0);
  const ringScale = useSharedValue(1);
  const ringRotation = useSharedValue(0);
  const centerScale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      draw.value = 1;
      ringScale.value = 1;
      ringRotation.value = 0;
      centerScale.value = 1;
      return;
    }

    draw.value = 0;
    ringScale.value = 0.94;
    ringRotation.value = -7;
    centerScale.value = 0.9;

    draw.value = withTiming(1, {
      duration: 920,
      easing: Easing.out(Easing.cubic),
    });
    ringScale.value = withSequence(
      withTiming(1.04, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 150 }),
    );
    ringRotation.value = withSequence(
      withTiming(6, { duration: 210, easing: Easing.out(Easing.cubic) }),
      withSpring(0, { damping: 11, stiffness: 120 }),
    );
    centerScale.value = withDelay(
      220,
      withSequence(
        withTiming(1.1, { duration: 170, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 10, stiffness: 160 }),
      ),
    );
  }, [centerScale, draw, motionKey, reducedMotion, ringRotation, ringScale]);

  const animatedRingProps = useAnimatedProps(() => ({
    opacity: interpolate(draw.value, [0, 0.12, 1], [0, 1, 1], "clamp"),
    strokeDashoffset: circumference * (1 - safeProgress * draw.value),
  }));

  const ringMotionStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }, { scale: ringScale.value }],
  }));

  const centerMotionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(centerScale.value, [0.9, 1], [0.72, 1], "clamp"),
    transform: [{ scale: centerScale.value }],
  }));

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.root}>
      <Animated.View style={ringMotionStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="fire-ring" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.primary} />
              <Stop offset="1" stopColor={colors.positive} />
            </LinearGradient>
          </Defs>
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
            stroke="url(#fire-ring)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            rotation="-90"
            origin={`${center}, ${center}`}
            fill="transparent"
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
    width: 260,
    height: 260,
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
    maxWidth: 194,
  },
  centerLabel: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  centerValue: {
    fontSize: 42,
    lineHeight: 50,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
});
