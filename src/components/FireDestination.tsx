import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { DestinationScene, type DestinationSide } from "./FireDestinationScenes";
import type { FireDestinationId } from "../features/types";

export { fireDestinationVisuals } from "./FireDestinationScenes";

export const FIRE_DESTINATION_IDS: FireDestinationId[] = [
  "camp",
  "home",
  "beach",
  "mountain",
  "travel",
  "sunrise",
];

export function FireDestinationGlyph({
  id,
  side,
  color,
  size = 20,
}: {
  id: FireDestinationId;
  side: DestinationSide;
  color: string;
  size?: number;
}) {
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, {
        duration: 8400,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );

    return () => cancelAnimation(phase);
  }, [phase]);

  return (
    <View style={[styles.glyph, { width: size, height: size }]}>
      <DestinationScene id={id} side={side} phase={phase} size={size} tone={color} />
    </View>
  );
}

export function FireDestinationPair({
  id,
  positive,
  negative,
}: {
  id: FireDestinationId;
  positive: string;
  negative: string;
}) {
  return (
    <View style={styles.pair}>
      <View style={styles.endpoint}>
        <FireDestinationGlyph id={id} side="setback" color={negative} size={44} />
      </View>
      <View style={styles.path} />
      <View style={styles.endpoint}>
        <FireDestinationGlyph id={id} side="goal" color={positive} size={44} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  pair: {
    width: 108,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  endpoint: {
    width: 46,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  path: {
    width: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(148,163,184,0.3)",
  },
});
