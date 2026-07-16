import { Image, StyleSheet, type ImageSourcePropType } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import type { FireCompanionId } from "../features/types";

export const FIRE_COMPANION_IDS: FireCompanionId[] = ["traveler_m", "traveler_f"];

type CompanionAssets = {
  idle: ImageSourcePropType;
  moving: ImageSourcePropType;
  nativeFacing: -1 | 1;
};

const companionAssets: Record<FireCompanionId, CompanionAssets> = {
  traveler_m: {
    idle: require("../../assets/companions/traveler-m-idle.png"),
    moving: require("../../assets/companions/traveler-m-moving.png"),
    nativeFacing: 1,
  },
  traveler_f: {
    idle: require("../../assets/companions/traveler-f-idle.png"),
    moving: require("../../assets/companions/traveler-f-moving.png"),
    nativeFacing: 1,
  },
};

export function FireCompanionArtwork({
  id,
  pose = "idle",
  size = 48,
}: {
  id: FireCompanionId;
  pose?: "idle" | "moving";
  tone?: string;
  size?: number;
}) {
  const source = pose === "moving" ? companionAssets[id].moving : companionAssets[id].idle;

  return <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />;
}

export function FireCompanion({
  id,
  direction,
  motionActive,
  stepPhase,
  breathPhase,
  reducedMotion,
  tone,
}: {
  id: FireCompanionId;
  direction: -1 | 0 | 1;
  motionActive: SharedValue<number>;
  stepPhase: SharedValue<number>;
  breathPhase: SharedValue<number>;
  reducedMotion: boolean;
  tone: string;
}) {
  const assets = companionAssets[id];
  const bodyStyle = useAnimatedStyle(() => {
    const active = reducedMotion ? 0 : motionActive.value;
    const breath = reducedMotion ? 0 : breathPhase.value * (1 - active);
    const step = Math.sin(stepPhase.value * Math.PI);
    const desiredFacing = direction === 0 ? 1 : direction;
    const facing = direction === 0 ? 1 : desiredFacing * assets.nativeFacing;
    return {
      transform: [
        { scaleX: facing },
        { translateY: -step * 2.2 * active - breath * 0.7 },
        { scaleY: 1 + breath * 0.012 },
      ],
    };
  }, [assets.nativeFacing, direction, reducedMotion]);

  const idleStyle = useAnimatedStyle(
    () => ({ opacity: (direction === 0 ? 1 : 0) * (1 - motionActive.value) }),
    [direction],
  );
  const restingDirectionStyle = useAnimatedStyle(
    () => ({ opacity: (direction === 0 ? 0 : 1) * (1 - motionActive.value) }),
    [direction],
  );
  const movingStyle = useAnimatedStyle(() => ({ opacity: motionActive.value }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + motionActive.value * 0.08,
    transform: [{ scaleX: 1 - motionActive.value * 0.16 }],
  }));

  return (
    <Animated.View style={[styles.motionRoot, bodyStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.shadow, { backgroundColor: tone }, shadowStyle]}
      />
      <Animated.View style={[styles.artLayer, idleStyle]}>
        <FireCompanionArtwork id={id} pose="idle" size={60} />
      </Animated.View>
      <Animated.View style={[styles.artLayer, restingDirectionStyle]}>
        <FireCompanionArtwork id={id} pose="moving" size={60} />
      </Animated.View>
      <Animated.View style={[styles.artLayer, movingStyle]}>
        <FireCompanionArtwork id={id} pose="moving" size={60} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  motionRoot: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  artLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    position: "absolute",
    bottom: 2,
    width: 28,
    height: 5,
    borderRadius: 3,
  },
});
