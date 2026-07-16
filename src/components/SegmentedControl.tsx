import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { MotionPressable } from "./MotionPressable";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

function SegmentOption({
  active,
  activeColor,
  activeSoftColor,
  label,
  onPress,
}: {
  active: boolean;
  activeColor?: string;
  activeSoftColor?: string;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const indicatorColor = activeColor ?? colors.primary;
  const indicatorSoftColor = activeSoftColor ?? colors.primarySoft;
  const reducedMotion = useReducedMotion();
  const selected = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    selected.value = reducedMotion
      ? active
        ? 1
        : 0
      : withTiming(active ? 1 : 0, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        });
  }, [active, reducedMotion, selected]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: selected.value,
    transform: [{ scaleX: interpolate(selected.value, [0, 1], [0.88, 1], "clamp") }],
  }));

  return (
    <MotionPressable
      onPress={onPress}
      haptic="selection"
      hoverEffect={!active}
      style={styles.option}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          { backgroundColor: indicatorSoftColor, borderColor: `${indicatorColor}55` },
          indicatorStyle,
        ]}
      />
      <Text
        style={[
          styles.label,
          typography.button,
          { color: active ? indicatorColor : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  activeColor,
  activeSoftColor,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (next: T) => void;
  activeColor?: string;
  activeSoftColor?: string;
}) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder },
      ]}
    >
      {options.map((option) => (
        <SegmentOption
          key={option.value}
          active={option.value === value}
          activeColor={activeColor}
          activeSoftColor={activeSoftColor}
          label={option.label}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 14,
    zIndex: 1,
  },
});
