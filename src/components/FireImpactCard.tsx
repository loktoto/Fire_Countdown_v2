import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { FireCompanion } from "./FireCompanion";
import { FireCompanionPickerSheet } from "./FireCompanionPickerSheet";
import { FireDestinationGlyph } from "./FireDestination";
import { FireDestinationPickerSheet } from "./FireDestinationPickerSheet";
import {
  fireImpactPresentation,
  formatImpactDayValue,
  formatImpactPercent,
  type FireImpactInput,
} from "./fireImpactPresentation";
import { MotionPressable } from "./MotionPressable";
import { useFireStore } from "../data/fireStore";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";

const FIRE_EMOJI = "\u{1F525}";
const CRYING_EMOJI = "\u{1F622}";
const TRACK_FALLBACK_WIDTH = 280;
const COMPANION_SIZE = 64;
const ENDPOINT_SIZE = 44;
const ENDPOINT_OFFSET = -6;
const ENDPOINT_APPROACH = 10;
const MIN_TRAVEL = 64;
const TRACK_TOP = 72;

export function FireImpactCard({ amount, impact }: { amount: number; impact: FireImpactInput }) {
  const colors = useThemeColors();
  const t = useI18n();
  const reducedMotion = useReducedMotion();
  const { snapshot, setFireCompanion, setFireDestination } = useFireStore();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [destinationPickerVisible, setDestinationPickerVisible] = useState(false);
  const [trackWidth, setTrackWidth] = useState(TRACK_FALLBACK_WIDTH);
  const companionId = snapshot.fireCompanionId ?? "traveler_m";
  const destinationId = snapshot.fireDestinationId ?? "camp";
  const maxTravel = Math.max(
    MIN_TRAVEL,
    trackWidth / 2 - (ENDPOINT_SIZE + ENDPOINT_OFFSET + COMPANION_SIZE / 2) + ENDPOINT_APPROACH,
  );
  const meter = useSharedValue(0);
  const stepPhase = useSharedValue(0);
  const motionActive = useSharedValue(0);
  const arrival = useSharedValue(1);
  const breathPhase = useSharedValue(0);
  const presentation = fireImpactPresentation(amount, impact);
  const percentLabel = formatImpactPercent(presentation.rawPercent);
  const percentBubbleWidth = Math.min(108, Math.max(52, 18 + percentLabel.length * 7));
  const companionDirection: -1 | 0 | 1 =
    presentation.meterValue < 0 ? -1 : presentation.meterValue > 0 ? 1 : 0;

  const tone = (() => {
    if (amount <= 0) {
      return {
        color: colors.primary,
        headline: t.fireImpact.noImpactYet,
      };
    }

    if (impact.baseDays === null && impact.simulatedDays === null) {
      return {
        color: colors.textMuted,
        headline: t.fireImpact.outOfRange,
      };
    }

    if (impact.impactDays === Number.POSITIVE_INFINITY) {
      return {
        color: colors.negative,
        headline: t.fireImpact.movesOutOfRange(CRYING_EMOJI),
      };
    }

    if (impact.impactDays === Number.NEGATIVE_INFINITY) {
      return {
        color: colors.positive,
        headline: t.fireImpact.backInRange(FIRE_EMOJI),
      };
    }

    if (presentation.direction > 0) {
      const days = t.fireImpact.dayCount(
        formatImpactDayValue(presentation.absoluteDays, t.locale),
        presentation.absoluteDays,
      );
      return {
        color: colors.positive,
        headline: t.fireImpact.closer(days, FIRE_EMOJI),
      };
    }

    if (presentation.direction < 0) {
      const days = t.fireImpact.dayCount(
        formatImpactDayValue(presentation.absoluteDays, t.locale),
        presentation.absoluteDays,
      );
      return {
        color: colors.negative,
        headline: t.fireImpact.behind(days, CRYING_EMOJI),
      };
    }

    return {
      color: colors.primary,
      headline: t.fireImpact.unchanged,
    };
  })();

  useEffect(() => {
    const stopAnimations = () => {
      cancelAnimation(meter);
      cancelAnimation(stepPhase);
      cancelAnimation(motionActive);
      cancelAnimation(arrival);
      cancelAnimation(breathPhase);
    };
    stopAnimations();

    if (reducedMotion) {
      meter.value = presentation.meterValue;
      stepPhase.value = 0;
      motionActive.value = 0;
      arrival.value = 1;
      breathPhase.value = 0;
      return stopAnimations;
    }

    meter.value = withSpring(presentation.meterValue, {
      damping: 24,
      stiffness: 210,
      mass: 0.68,
      overshootClamping: true,
    });

    if (presentation.moving) {
      arrival.value = 0;
      arrival.value = withDelay(
        40,
        withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      );
      motionActive.value = 1;
      motionActive.value = withDelay(
        180,
        withTiming(0, { duration: 80, easing: Easing.out(Easing.cubic) }),
      );
      stepPhase.value = 0;
      stepPhase.value = withRepeat(
        withTiming(1, { duration: 90, easing: Easing.inOut(Easing.quad) }),
        2,
        true,
      );
    } else {
      arrival.value = 1;
      motionActive.value = 0;
      stepPhase.value = 0;
    }

    breathPhase.value = 0;
    return stopAnimations;
  }, [
    arrival,
    breathPhase,
    meter,
    motionActive,
    presentation.meterValue,
    presentation.moving,
    reducedMotion,
    stepPhase,
  ]);

  const companionPositionStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: meter.value * maxTravel }],
    };
  }, [maxTravel]);

  const rightTrailStyle = useAnimatedStyle(() => {
    const strength = Math.min(1, Math.max(0, meter.value));
    return {
      opacity: interpolate(strength, [0, 0.02, 1], [0, 0.48, 0.9], "clamp"),
      transform: [{ translateX: -maxTravel * (1 - strength) }],
    };
  }, [maxTravel]);

  const leftTrailStyle = useAnimatedStyle(() => {
    const strength = Math.min(1, Math.max(0, -meter.value));
    return {
      opacity: interpolate(strength, [0, 0.02, 1], [0, 0.48, 0.9], "clamp"),
      transform: [{ translateX: maxTravel * (1 - strength) }],
    };
  }, [maxTravel]);

  const arrivalStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0 : interpolate(arrival.value, [0, 0.35, 1], [0, 0.28, 0], "clamp"),
    transform: [{ scale: interpolate(arrival.value, [0, 1], [0.76, 1.38], "clamp") }],
  }));

  const goalEndpointStyle = useAnimatedStyle(() => {
    const proximity = Math.min(1, Math.max(0, meter.value));
    return {
      opacity: interpolate(meter.value, [-1, 0, 1], [0.46, 0.72, 1], "clamp"),
      transform: [{ scale: 0.94 + proximity * 0.08 }],
    };
  });

  const setbackEndpointStyle = useAnimatedStyle(() => {
    const proximity = Math.min(1, Math.max(0, -meter.value));
    return {
      opacity: interpolate(meter.value, [-1, 0, 1], [1, 0.72, 0.46], "clamp"),
      transform: [{ scale: 0.94 + proximity * 0.08 }],
    };
  });

  return (
    <>
      <View
        accessibilityLabel={t.fireImpact.accessibility(tone.headline, percentLabel)}
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceSolid,
            borderColor: `${tone.color}42`,
            boxShadow: `0 5px 12px ${tone.color}14`,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text
            numberOfLines={1}
            minimumFontScale={0.62}
            adjustsFontSizeToFit
            style={[styles.headline, typography.display, { color: colors.text }]}
          >
            {tone.headline}
          </Text>
        </View>

        <View
          style={styles.trackStage}
          onLayout={(event) => {
            const nextWidth = event.nativeEvent.layout.width;
            if (Math.abs(nextWidth - trackWidth) > 0.5) {
              setTrackWidth(nextWidth);
            }
          }}
        >
          <View style={[styles.track, { backgroundColor: colors.surfaceBorder }]} />
          <View
            pointerEvents="none"
            style={[
              styles.originMarker,
              { backgroundColor: colors.surfaceSolid, borderColor: colors.textMuted },
            ]}
          />
          <View pointerEvents="none" style={styles.rightTrailClip}>
            <Animated.View
              style={[
                styles.impactTrail,
                { width: maxTravel, backgroundColor: tone.color },
                rightTrailStyle,
              ]}
            />
          </View>
          <View pointerEvents="none" style={styles.leftTrailClip}>
            <Animated.View
              style={[
                styles.impactTrail,
                { width: maxTravel, backgroundColor: tone.color },
                leftTrailStyle,
              ]}
            />
          </View>
          <Animated.View style={[styles.endpoint, styles.setbackEndpoint, setbackEndpointStyle]}>
            <MotionPressable
              onPress={() => setDestinationPickerVisible(true)}
              haptic="selection"
              accessibilityLabel={t.fireImpact.changeDestination}
              style={styles.endpointButton}
            >
              <FireDestinationGlyph
                id={destinationId}
                side="setback"
                color={colors.negative}
                size={38}
              />
            </MotionPressable>
          </Animated.View>
          <Animated.View style={[styles.endpoint, styles.goalEndpoint, goalEndpointStyle]}>
            <MotionPressable
              onPress={() => setDestinationPickerVisible(true)}
              haptic="selection"
              accessibilityLabel={t.fireImpact.changeDestination}
              style={styles.endpointButton}
            >
              <FireDestinationGlyph
                id={destinationId}
                side="goal"
                color={colors.positive}
                size={40}
              />
            </MotionPressable>
          </Animated.View>

          <Animated.View
            style={[
              styles.companionPosition,
              { left: trackWidth / 2 - COMPANION_SIZE / 2 },
              companionPositionStyle,
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.percentBubble,
                {
                  width: percentBubbleWidth,
                  backgroundColor: `${tone.color}16`,
                  borderColor: `${tone.color}38`,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={[styles.percentValue, typography.button, { color: tone.color }]}
              >
                {percentLabel}
              </Text>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[styles.arrivalRing, { borderColor: tone.color }, arrivalStyle]}
            />
            <MotionPressable
              onPress={() => setPickerVisible(true)}
              haptic="selection"
              accessibilityLabel={t.fireImpact.changeCompanion}
              style={styles.companionButton}
            >
              <Animated.View key={companionId} entering={FadeIn.duration(170)}>
                <FireCompanion
                  id={companionId}
                  direction={companionDirection}
                  motionActive={motionActive}
                  stepPhase={stepPhase}
                  breathPhase={breathPhase}
                  reducedMotion={reducedMotion}
                  tone={tone.color}
                />
              </Animated.View>
            </MotionPressable>
          </Animated.View>
        </View>
      </View>

      <FireCompanionPickerSheet
        visible={pickerVisible}
        value={companionId}
        onSelect={setFireCompanion}
        onClose={() => setPickerVisible(false)}
      />
      <FireDestinationPickerSheet
        visible={destinationPickerVisible}
        value={destinationId}
        onSelect={setFireDestination}
        onClose={() => setDestinationPickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 4,
  },
  headerRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  headline: {
    flex: 1,
    minHeight: 24,
    fontSize: 17,
    lineHeight: 22,
  },
  percentValue: {
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ["tabular-nums"],
  },
  trackStage: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 340,
    height: 94,
  },
  track: {
    position: "absolute",
    top: TRACK_TOP,
    left: 14,
    right: 14,
    height: 3,
    borderRadius: 999,
    opacity: 0.7,
  },
  originMarker: {
    position: "absolute",
    zIndex: 1,
    top: TRACK_TOP - 3,
    left: "50%",
    width: 9,
    height: 9,
    marginLeft: -4.5,
    borderWidth: 1,
    borderRadius: 5,
  },
  rightTrailClip: {
    position: "absolute",
    left: "50%",
    top: TRACK_TOP - 1,
    width: "50%",
    height: 5,
    overflow: "hidden",
  },
  leftTrailClip: {
    position: "absolute",
    right: "50%",
    top: TRACK_TOP - 1,
    width: "50%",
    height: 5,
    alignItems: "flex-end",
    overflow: "hidden",
  },
  impactTrail: {
    height: 5,
    borderRadius: 999,
  },
  endpoint: {
    position: "absolute",
    zIndex: 2,
    top: TRACK_TOP - ENDPOINT_SIZE / 2 + 1.5,
    width: ENDPOINT_SIZE,
    height: ENDPOINT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  setbackEndpoint: {
    left: ENDPOINT_OFFSET,
  },
  goalEndpoint: {
    right: ENDPOINT_OFFSET,
  },
  endpointButton: {
    width: ENDPOINT_SIZE,
    height: ENDPOINT_SIZE,
    borderRadius: ENDPOINT_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  companionPosition: {
    position: "absolute",
    zIndex: 3,
    top: 0,
    width: COMPANION_SIZE,
    height: 94,
    alignItems: "center",
  },
  percentBubble: {
    height: 23,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  companionButton: {
    position: "absolute",
    top: 25,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  arrivalRing: {
    position: "absolute",
    top: 24,
    width: 66,
    height: 66,
    borderWidth: 1,
    borderRadius: 33,
  },
});
