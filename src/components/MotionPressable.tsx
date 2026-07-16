import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
  type AccessibilityRole,
  type AccessibilityState,
  type Insets,
} from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { pressSpring } from "../design/motion";
import { tokens } from "../design/tokens";
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
  accessibilityHint,
  accessibilityRole = "button",
  accessibilityState,
  disabled = false,
  hitSlop,
  hoverEffect = true,
  haptic = false,
  testID,
  holdLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  disabled?: boolean;
  hitSlop?: Insets | number;
  hoverEffect?: boolean;
  haptic?: HapticFeedback;
  testID?: string;
  holdLabel?: string;
}) {
  const reducedMotion = useReducedMotion();
  const colors = useThemeColors();
  const { snapshot } = useFireStore();
  const { width: windowWidth } = useWindowDimensions();
  const pressableRef = useRef<View>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holdHint, setHoldHint] = useState<{
    label: string;
    left: number;
    top: number;
    width: number;
  } | null>(null);
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
      { translateY: -1 * hoverLift.value },
      { scale: pressScale.value * (1 + hoverLift.value * 0.012) },
    ],
  }));
  const hoverOverlayStyle = useAnimatedStyle(() => ({
    opacity: disabled || !hoverEffect || reducedMotion ? 0 : hoverLift.value * 0.72,
  }));

  useEffect(() => {
    if (!disabled && hoverEffect && !reducedMotion) {
      return;
    }

    pressScale.value = withTiming(1, { duration: 80 });
    // Reanimated shared values are intentionally mutable.
    hoverLift.value = withTiming(0, { duration: 80 });
  }, [disabled, hoverEffect, hoverLift, pressScale, reducedMotion]);

  useEffect(
    () => () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    },
    [],
  );

  function setHover(active: boolean) {
    if (disabled || reducedMotion || !hoverEffect) {
      return;
    }

    // Reanimated shared values are intentionally mutable.
    // eslint-disable-next-line react-hooks/immutability
    hoverLift.value = withTiming(active ? 1 : 0, {
      duration: active ? 130 : 100,
      easing: Easing.out(Easing.cubic),
    });
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

  function revealHoldHint() {
    const label = holdLabel ?? accessibilityHint ?? accessibilityLabel;
    if (!label) {
      return;
    }

    pressableRef.current?.measureInWindow((x, y, width) => {
      const bubbleWidth = Math.min(240, Math.max(104, label.length * 7.2 + 28));
      const left = Math.max(
        12,
        Math.min(windowWidth - bubbleWidth - 12, x + width / 2 - bubbleWidth / 2),
      );
      const top = Math.max(14, y - 44);
      setHoldHint({ label, left, top, width: bubbleWidth });

      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
      hintTimerRef.current = setTimeout(() => setHoldHint(null), 1250);
    });
  }

  return (
    <>
      <AnimatedPressable
        ref={pressableRef}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          ...accessibilityState,
          disabled: disabled || accessibilityState?.disabled,
        }}
        disabled={disabled}
        delayLongPress={420}
        hitSlop={hitSlop}
        testID={testID}
        onPress={
          onPress
            ? () => {
                void runHaptic();
                onPress();
              }
            : undefined
        }
        onLongPress={() => {
          revealHoldHint();
          onLongPress?.();
        }}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onPressIn={() => {
          if (disabled || reducedMotion) {
            return;
          }
          // Reanimated shared values are intentionally mutable.
          // eslint-disable-next-line react-hooks/immutability
          pressScale.value = withTiming(0.965, {
            duration: tokens.motion.pressMs,
            easing: Easing.out(Easing.cubic),
          });
        }}
        onPressOut={() => {
          if (disabled || reducedMotion) {
            return;
          }
          // Reanimated shared values are intentionally mutable.
          // eslint-disable-next-line react-hooks/immutability
          pressScale.value = withSpring(1, pressSpring);
        }}
        style={[styles.base, style, animatedStyle]}
      >
        <AnimatedView
          pointerEvents="none"
          style={[
            styles.hoverOverlay,
            {
              borderRadius: hoverRadius,
              backgroundColor:
                colors.mode === "dark" ? `${colors.primary}18` : `${colors.primary}24`,
              borderColor: `${colors.primary}80`,
            },
            hoverOverlayStyle,
          ]}
        />
        {children}
      </AnimatedPressable>

      {holdHint ? (
        <Modal transparent visible animationType="none" statusBarTranslucent>
          <View pointerEvents="none" style={styles.hintLayer}>
            <Animated.View
              entering={FadeInUp.duration(160).easing(Easing.out(Easing.cubic))}
              style={[
                styles.hintBubble,
                {
                  left: holdHint.left,
                  top: holdHint.top,
                  width: holdHint.width,
                  backgroundColor: colors.text,
                  boxShadow: `0 8px 22px ${colors.shadow}`,
                },
              ]}
            >
              <Text numberOfLines={2} style={[styles.hintText, { color: colors.background }]}>
                {holdHint.label}
              </Text>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </>
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
  hintLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  hintBubble: {
    position: "absolute",
    minHeight: 34,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
