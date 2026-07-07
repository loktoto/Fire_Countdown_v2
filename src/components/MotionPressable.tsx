import { useEffect, type ReactNode } from "react";
import {
  Pressable,
  StyleProp,
  ViewStyle,
  type AccessibilityState,
  type Insets,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useReducedMotion } from "../hooks/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
}) {
  const reducedMotion = useReducedMotion();
  const pressScale = useSharedValue(1);
  const hoverLift = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2 * hoverLift.value },
      { scale: pressScale.value * (1 + hoverLift.value * 0.018) },
    ],
  }));

  useEffect(() => {
    if (!disabled && hoverEffect && !reducedMotion) {
      return;
    }

    pressScale.value = withTiming(1, { duration: 80 });
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

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
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
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
