import * as Haptics from "expo-haptics";
import { useEffect, useMemo, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
  type AccessibilityState,
  type Insets,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useThemeColors } from "../design/theme";
import { useFireStore } from "../data/fireStore";
import { useReducedMotion } from "../hooks/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
type HapticFeedback = false | "selection" | "light" | "medium" | "heavy";

export function MotionPressable({
  children,
  onPress,
  onLongPress,
  style,
  accessibilityLabel,
  accessibilityState,
  disabled = false,
  hitSlop,
  hoverEffect = true,
  haptic = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  disabled?: boolean;
  hitSlop?: Insets | number;
  hoverEffect?: boolean;
  haptic?: HapticFeedback;
}) {
  const reducedMotion = useReducedMotion();
  const colors = useThemeColors();
  const { snapshot } = useFireStore();
  const pressScale = useSharedValue(1);
  const hoverLift = useSharedValue(0);
  const hoverRadius = useMemo(() => {
    const flattenedStyle = StyleSheet.flatten(style) as ViewStyle | undefined;
    const radiusCandidates = [
      flattenedStyle?.borderRadius,
      flattenedStyle?.borderTopLeftRadius,
      flattenedStyle?.borderTopRightRadius,
      flattenedStyle?.borderBottomLeftRadius,
      flattenedStyle?.borderBottomRightRadius,
    ];
    const radius = radiusCandidates.find(
      (candidate): candidate is number => typeof candidate === "number",
    );

    return radius ?? 12;
  }, [style]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2 * hoverLift.value },
      { scale: pressScale.value * (1 + hoverLift.value * 0.018) },
    ],
  }));
  const hoverOverlayStyle = useAnimatedStyle(() => ({
    opacity: disabled || !hoverEffect || reducedMotion ? 0 : hoverLift.value,
  }));

  useEffect(() => {
    if (!disabled && hoverEffect && !reducedMotion) {
      return;
    }

    pressScale.value = withTiming(1, { duration: 80 });
    // Reanimated shared values are intentionally mutable.
    // eslint-disable-next-line react-hooks/immutability
    hoverLift.value = withTiming(0, { duration: 80 });
  }, [disabled, hoverEffect, hoverLift, pressScale, reducedMotion]);

  function setHover(active: boolean) {
    if (disabled || reducedMotion || !hoverEffect) {
      return;
    }

    // Reanimated shared values are intentionally mutable.
    // eslint-disable-next-line react-hooks/immutability
    hoverLift.value = withTiming(active ? 1 : 0, { duration: active ? 140 : 120 });
  }

  async function runHaptic() {
    if (!haptic || !snapshot.hapticsEnabled) {
      return;
    }

    try {
      if (haptic === "selection") {
        await Haptics.selectionAsync();
        return;
      }

      const styles = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(styles[haptic]);
    } catch {
      // Haptics can be unavailable on some devices or web targets.
    }
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={
        onPress
          ? () => {
              void runHaptic();
              onPress();
            }
          : undefined
      }
      onLongPress={onLongPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onPressIn={() => {
        if (disabled) {
          return;
        }
        // Reanimated shared values are intentionally mutable.
        // eslint-disable-next-line react-hooks/immutability
        pressScale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        if (disabled) {
          return;
        }
        // Reanimated shared values are intentionally mutable.
        // eslint-disable-next-line react-hooks/immutability
        pressScale.value = withTiming(1, { duration: 120 });
      }}
      style={[styles.base, style, animatedStyle]}
    >
      <AnimatedView
        pointerEvents="none"
        style={[
          styles.hoverOverlay,
          {
            borderRadius: hoverRadius,
            backgroundColor: colors.mode === "dark" ? `${colors.primary}18` : `${colors.primary}24`,
            borderColor: `${colors.primary}80`,
          },
          hoverOverlayStyle,
        ]}
      />
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: "relative",
  },
  hoverOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
  },
});
