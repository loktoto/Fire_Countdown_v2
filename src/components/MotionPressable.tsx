import type { ReactNode } from "react";
import {
  Pressable,
  StyleProp,
  ViewStyle,
  type AccessibilityState,
  type Insets,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

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
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  disabled?: boolean;
  hitSlop?: Insets | number;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        if (disabled) {
          return;
        }
        // Reanimated shared values are intentionally mutable.
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        if (disabled) {
          return;
        }
        // Reanimated shared values are intentionally mutable.
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
