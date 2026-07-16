import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import type { FireDestinationId } from "../features/types";

export type DestinationSide = "goal" | "setback";

type SceneProps = {
  phase: SharedValue<number>;
  size: number;
  tone: string;
};

const TAU = Math.PI * 2;

const assets = {
  airplane: require("../../assets/destinations/airplane.png"),
  beach: require("../../assets/destinations/beach.png"),
  campfire: require("../../assets/destinations/campfire-flame-v3.png"),
  home: require("../../assets/destinations/home.png"),
  hourglass: require("../../assets/destinations/hourglass-v3.png"),
  mountain: require("../../assets/destinations/mountain.png"),
  overwork: require("../../assets/destinations/overwork-v3.png"),
  rainCloud: require("../../assets/destinations/rain-cloud-base-v3.png"),
  streetSleeper: require("../../assets/destinations/street-sleeper-v3.png"),
  sun: require("../../assets/destinations/sun-v3.png"),
  trafficCar: require("../../assets/destinations/traffic-car-v3.png"),
  trafficLight: require("../../assets/destinations/traffic-light-v3.png"),
  trafficSuv: require("../../assets/destinations/traffic-suv-v3.png"),
  trafficTaxi: require("../../assets/destinations/traffic-taxi-v3.png"),
  trafficTruck: require("../../assets/destinations/traffic-truck-v3.png"),
} satisfies Record<string, ImageSourcePropType>;

export const fireDestinationVisuals: Record<
  FireDestinationId,
  { goal: ImageSourcePropType; setback: ImageSourcePropType }
> = {
  camp: { goal: assets.campfire, setback: assets.rainCloud },
  home: { goal: assets.home, setback: assets.streetSleeper },
  beach: { goal: assets.beach, setback: assets.hourglass },
  mountain: { goal: assets.mountain, setback: assets.trafficCar },
  travel: { goal: assets.airplane, setback: assets.overwork },
  sunrise: { goal: assets.sun, setback: assets.overwork },
};

function loop(value: number, speed: number, offset = 0) {
  "worklet";
  return (value * speed + offset) % 1;
}

function softCycleOpacity(cycle: number) {
  "worklet";
  return Math.min(1, cycle * 7, (1 - cycle) * 7);
}

function streetLampPower(value: number) {
  "worklet";
  const signal =
    Math.sin(value * TAU * 7.1) +
    Math.sin(value * TAU * 13.7 + 0.8) * 0.52 +
    Math.sin(value * TAU * 3.2 + 1.7) * 0.26;
  if (signal > 0.92) return 0.08;
  if (signal > 0.58) return 0.38;
  return 1;
}

function RainDrop({ phase, size, offset, left }: SceneProps & { offset: number; left: number }) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 4.8, offset);
    return {
      opacity: softCycleOpacity(cycle) * 0.86,
      transform: [
        { translateX: -cycle * size * 0.045 },
        { translateY: cycle * size * 0.28 },
        { rotate: "12deg" },
        { scaleY: 0.78 + cycle * 0.3 },
      ],
    };
  }, [offset, size]);

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        {
          left: size * left,
          top: size * 0.48,
          width: Math.max(1.5, size * 0.045),
          height: Math.max(4, size * 0.15),
        },
        style,
      ]}
    />
  );
}

function RainScene(props: SceneProps) {
  const { phase, size, tone } = props;
  const cloudStyle = useAnimatedStyle(() => {
    const angle = phase.value * TAU * 0.72;
    return {
      transform: [
        { translateX: Math.sin(angle) * size * 0.045 },
        { translateY: Math.cos(angle * 0.8) * size * 0.012 },
      ],
    };
  }, [size]);
  const puddleStyle = useAnimatedStyle(() => {
    const pulse = (Math.sin(phase.value * TAU * 4.8) + 1) / 2;
    return {
      opacity: 0.12 + pulse * 0.18,
      transform: [{ scaleX: 0.68 + pulse * 0.32 }],
    };
  });

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <RainDrop {...props} offset={0} left={0.27} />
      <RainDrop {...props} offset={0.21} left={0.42} />
      <RainDrop {...props} offset={0.44} left={0.57} />
      <RainDrop {...props} offset={0.68} left={0.71} />
      <Animated.View
        style={[
          styles.puddle,
          {
            bottom: size * 0.03,
            left: size * 0.23,
            width: size * 0.54,
            backgroundColor: `${tone}42`,
          },
          puddleStyle,
        ]}
      />
      <Animated.Image
        source={assets.rainCloud}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.07, top: size * 0.02, width: size * 0.86, height: size * 0.58 },
          cloudStyle,
        ]}
      />
    </View>
  );
}

function FireSpark({ phase, size, offset, left }: SceneProps & { offset: number; left: number }) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 2.1, offset);
    return {
      opacity: Math.sin(cycle * Math.PI) * 0.82,
      transform: [
        { translateX: Math.sin(cycle * TAU + offset) * size * 0.05 },
        { translateY: -cycle * size * 0.38 },
        { scale: 0.75 + cycle * 0.45 },
      ],
    };
  }, [offset, size]);

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          left: size * left,
          bottom: size * 0.42,
          width: Math.max(2, size * 0.055),
          height: Math.max(2, size * 0.055),
        },
        style,
      ]}
    />
  );
}

function CampfireScene(props: SceneProps) {
  const { phase, size } = props;
  const flameStyle = useAnimatedStyle(() => {
    const fast = Math.sin(phase.value * TAU * 8.2);
    const slow = Math.sin(phase.value * TAU * 3.7 + 0.8);
    return {
      transform: [
        { translateX: fast * size * 0.008 },
        { translateY: -Math.abs(slow) * size * 0.018 },
        { rotate: `${fast * 1.25}deg` },
        { scaleX: 1 + fast * 0.025 },
        { scaleY: 0.985 + Math.abs(slow) * 0.055 },
      ],
    };
  }, [size]);
  const glowStyle = useAnimatedStyle(() => {
    const pulse = (Math.sin(phase.value * TAU * 4.1) + 1) / 2;
    return {
      opacity: 0.16 + pulse * 0.18,
      transform: [{ scale: 0.88 + pulse * 0.16 }],
    };
  });

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.fireGlow,
          {
            left: size * 0.17,
            bottom: size * 0.07,
            width: size * 0.66,
            height: size * 0.48,
          },
          glowStyle,
        ]}
      />
      <View
        style={[
          styles.log,
          {
            left: size * 0.21,
            bottom: size * 0.11,
            width: size * 0.58,
            height: Math.max(5, size * 0.13),
            transform: [{ rotate: "18deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.log,
          styles.logLight,
          {
            left: size * 0.21,
            bottom: size * 0.11,
            width: size * 0.58,
            height: Math.max(5, size * 0.13),
            transform: [{ rotate: "-18deg" }],
          },
        ]}
      />
      <Animated.Image
        source={assets.campfire}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.15, top: size * 0.02, width: size * 0.7, height: size * 0.72 },
          flameStyle,
        ]}
      />
      <FireSpark {...props} offset={0} left={0.44} />
      <FireSpark {...props} offset={0.34} left={0.53} />
      <FireSpark {...props} offset={0.66} left={0.61} />
    </View>
  );
}

function SmokePuff({ phase, size, offset }: SceneProps & { offset: number }) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 1.45, offset);
    return {
      opacity: Math.sin(cycle * Math.PI) * 0.58,
      transform: [
        { translateX: Math.sin(cycle * TAU + offset * 3) * size * 0.055 },
        { translateY: -cycle * size * 0.3 },
        { scale: 0.68 + cycle * 0.72 },
      ],
    };
  }, [offset, size]);

  return (
    <Animated.View
      style={[
        styles.smoke,
        {
          left: size * 0.32,
          top: size * 0.17,
          width: Math.max(4, size * 0.11),
          height: Math.max(4, size * 0.11),
        },
        style,
      ]}
    />
  );
}

function HomeScene(props: SceneProps) {
  const { phase, size, tone } = props;
  const houseStyle = useAnimatedStyle(() => {
    const settle = (Math.cos(phase.value * TAU * 0.62) + 1) / 2;
    return {
      transform: [{ translateY: -settle * size * 0.008 }, { scale: 1 + settle * 0.006 }],
    };
  }, [size]);

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <Animated.Image
        source={assets.home}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.06, top: size * 0.15, width: size * 0.88, height: size * 0.82 },
          houseStyle,
        ]}
      />
      <View
        style={[
          styles.homeGround,
          {
            left: size * 0.13,
            bottom: size * 0.01,
            width: size * 0.74,
            backgroundColor: `${tone}2E`,
          },
        ]}
      />
      <SmokePuff {...props} offset={0} />
      <SmokePuff {...props} offset={0.34} />
      <SmokePuff {...props} offset={0.68} />
    </View>
  );
}

function SleepDot({ phase, size, offset, left }: SceneProps & { offset: number; left: number }) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 0.9, offset);
    return {
      opacity: Math.sin(cycle * Math.PI) * 0.66,
      transform: [
        { translateX: cycle * size * 0.08 },
        { translateY: -cycle * size * 0.2 },
        { scale: 0.7 + cycle * 0.5 },
      ],
    };
  }, [offset, size]);

  return (
    <Animated.View
      style={[
        styles.sleepDot,
        {
          left: size * left,
          top: size * 0.36,
          width: Math.max(2, size * 0.055),
          height: Math.max(2, size * 0.055),
        },
        style,
      ]}
    />
  );
}

function StreetScene(props: SceneProps) {
  const { phase, size, tone } = props;
  const sleeperStyle = useAnimatedStyle(() => {
    const breath = (Math.sin(phase.value * TAU * 0.72) + 1) / 2;
    return {
      transform: [{ translateY: -breath * size * 0.008 }, { scaleY: 1 + breath * 0.016 }],
    };
  }, [size]);
  const lampStyle = useAnimatedStyle(() => {
    const power = streetLampPower(phase.value);
    return { opacity: 0.06 + power * 0.62, transform: [{ scale: 0.84 + power * 0.22 }] };
  });
  const lampHeadStyle = useAnimatedStyle(() => {
    const power = streetLampPower(phase.value);
    return {
      opacity: 0.26 + power * 0.74,
      transform: [{ scaleY: 0.94 + power * 0.06 }],
    };
  });

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.streetLampGlow,
          {
            left: -size * 0.03,
            top: size * 0.04,
            width: size * 0.28,
            height: size * 0.28,
          },
          lampStyle,
        ]}
      />
      <View
        style={[
          styles.streetLamp,
          {
            left: size * 0.085,
            top: size * 0.15,
            width: Math.max(1, size * 0.026),
            height: size * 0.7,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.streetLampHead,
          { left: size * 0.035, top: size * 0.12, width: size * 0.13, height: size * 0.09 },
          lampHeadStyle,
        ]}
      />
      <View
        style={[
          styles.streetLine,
          {
            left: size * 0.03,
            bottom: size * 0.04,
            width: size * 0.94,
            backgroundColor: `${tone}42`,
          },
        ]}
      />
      <View
        style={[
          styles.sleeperMat,
          {
            left: size * 0.09,
            bottom: size * 0.08,
            width: size * 0.73,
            height: size * 0.085,
            transform: [{ rotate: "-2deg" }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.streetBlanket,
          {
            left: size * 0.31,
            bottom: size * 0.135,
            width: size * 0.43,
            height: size * 0.24,
            borderRadius: size * 0.09,
            transform: [{ rotate: "-4deg" }],
          },
          sleeperStyle,
        ]}
      >
        <View style={styles.streetBlanketFold} />
        <View style={styles.streetBlanketPatch} />
      </Animated.View>
      <View
        style={[
          styles.sleeperHeadCrop,
          { left: size * 0.16, bottom: size * 0.17, width: size * 0.22, height: size * 0.23 },
        ]}
      >
        <Animated.Image
          source={assets.streetSleeper}
          resizeMode="contain"
          style={[
            styles.layer,
            {
              left: -size * 0.105,
              top: -size * 0.095,
              width: size * 0.72,
              height: size * 0.72,
            },
            sleeperStyle,
          ]}
        />
      </View>
      <View
        style={[
          styles.streetShoe,
          { left: size * 0.7, bottom: size * 0.12, transform: [{ rotate: "9deg" }] },
        ]}
      />
      <View
        style={[
          styles.streetShoe,
          { left: size * 0.75, bottom: size * 0.11, transform: [{ rotate: "-5deg" }] },
        ]}
      />
      <View
        style={[
          styles.cardboardBox,
          { right: size * 0.01, bottom: size * 0.1, width: size * 0.2, height: size * 0.18 },
        ]}
      >
        <View style={styles.cardboardFold} />
      </View>
      <SleepDot {...props} offset={0} left={0.66} />
      <SleepDot {...props} offset={0.5} left={0.71} />
    </View>
  );
}

function BeachCloud({ phase, size }: SceneProps) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 0.72, 0.18);
    return {
      opacity: softCycleOpacity(cycle) * 0.72,
      transform: [
        { translateX: cycle * size * 1.12 },
        { translateY: Math.sin(cycle * TAU) * size * 0.025 },
        { scale: 0.84 + Math.sin(cycle * Math.PI) * 0.08 },
      ],
    };
  }, [size]);

  return (
    <Animated.Image
      source={assets.rainCloud}
      resizeMode="contain"
      style={[
        styles.layer,
        {
          left: -size * 0.34,
          top: size * 0.08,
          width: size * 0.34,
          height: size * 0.24,
        },
        style,
      ]}
    />
  );
}

function BeachScene(props: SceneProps) {
  const { phase, size } = props;
  const beachStyle = useAnimatedStyle(() => {
    const breeze = Math.sin(phase.value * TAU * 0.8);
    return {
      transform: [{ translateX: breeze * size * 0.018 }, { rotate: `${breeze * 1.25}deg` }],
    };
  }, [size]);
  const sunStyle = useAnimatedStyle(() => {
    const pulse = (Math.sin(phase.value * TAU * 0.62) + 1) / 2;
    return {
      opacity: 0.82 + pulse * 0.18,
      transform: [{ rotate: `${phase.value * 80}deg` }, { scale: 0.94 + pulse * 0.08 }],
    };
  });

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <Animated.Image
        source={assets.sun}
        resizeMode="contain"
        style={[
          styles.layer,
          { right: -size * 0.01, top: -size * 0.01, width: size * 0.31, height: size * 0.31 },
          sunStyle,
        ]}
      />
      <BeachCloud {...props} />
      <Animated.Image
        source={assets.beach}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.05, top: size * 0.16, width: size * 0.88, height: size * 0.8 },
          beachStyle,
        ]}
      />
    </View>
  );
}

function SandGrain({ phase, size, offset }: SceneProps & { offset: number }) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 2.65, offset);
    return {
      opacity: softCycleOpacity(cycle) * 0.88,
      transform: [{ translateY: cycle * size * 0.31 }, { scale: 0.75 + cycle * 0.45 }],
    };
  }, [offset, size]);

  return (
    <Animated.View
      style={[
        styles.sandGrain,
        {
          left: size * 0.487,
          top: size * 0.39,
          width: Math.max(1.5, size * 0.04),
          height: Math.max(1.5, size * 0.04),
        },
        style,
      ]}
    />
  );
}

function HourglassScene(props: SceneProps) {
  const { phase, size } = props;
  const glassStyle = useAnimatedStyle(() => {
    const settle = Math.sin(phase.value * TAU * 0.72);
    return {
      transform: [
        { translateX: settle * size * 0.025 },
        { translateY: -Math.abs(settle) * size * 0.032 },
        { rotate: `${settle * 5.5}deg` },
        { scale: 1 + Math.abs(settle) * 0.025 },
      ],
    };
  }, [size]);
  const streamStyle = useAnimatedStyle(() => {
    const pulse = (Math.sin(phase.value * TAU * 2.65) + 1) / 2;
    return { opacity: 0.54 + pulse * 0.44, transform: [{ scaleY: 0.62 + pulse * 0.56 }] };
  });

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <Animated.Image
        source={assets.hourglass}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.1, top: size * 0.03, width: size * 0.8, height: size * 0.9 },
          glassStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.sandStream,
          {
            left: size * 0.496,
            top: size * 0.38,
            width: Math.max(1, size * 0.025),
            height: size * 0.22,
          },
          streamStyle,
        ]}
      />
      <SandGrain {...props} offset={0} />
      <SandGrain {...props} offset={0.5} />
    </View>
  );
}

function FlightTrail({ phase, size, offset, top }: SceneProps & { offset: number; top: number }) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 1.15, offset);
    return {
      opacity: softCycleOpacity(cycle) * 0.42,
      transform: [{ translateX: -cycle * size * 0.22 }, { scaleX: 1 - cycle * 0.28 }],
    };
  }, [offset, size]);
  return (
    <Animated.View
      style={[
        styles.flightTrail,
        { left: size * 0.14, top: size * top, width: size * 0.28 },
        style,
      ]}
    />
  );
}

function FlightScene(props: SceneProps) {
  const { phase, size } = props;
  const planeStyle = useAnimatedStyle(() => {
    const wave = Math.sin(phase.value * TAU);
    const drift = Math.sin(phase.value * Math.PI);
    return {
      transform: [
        { translateX: drift * size * 0.018 },
        { translateY: wave * size * 0.055 },
        { rotate: `${wave * 1.6}deg` },
      ],
    };
  }, [size]);

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <FlightTrail {...props} offset={0} top={0.56} />
      <FlightTrail {...props} offset={0.45} top={0.66} />
      <Animated.Image
        source={assets.airplane}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.07, top: size * 0.07, width: size * 0.86, height: size * 0.86 },
          planeStyle,
        ]}
      />
    </View>
  );
}

function WorkScene({ phase, size }: SceneProps) {
  const workerStyle = useAnimatedStyle(() => {
    const typing = Math.abs(Math.sin(phase.value * TAU * 6.4));
    const breathe = (Math.sin(phase.value * TAU * 0.75) + 1) / 2;
    return {
      transform: [
        { translateY: -typing * size * 0.012 - breathe * size * 0.004 },
        { rotate: `${(typing - 0.5) * 0.35}deg` },
      ],
    };
  }, [size]);
  const screenStyle = useAnimatedStyle(() => {
    const glow = (Math.sin(phase.value * TAU * 1.7) + 1) / 2;
    return { opacity: 0.07 + glow * 0.12, transform: [{ scale: 0.98 + glow * 0.025 }] };
  });
  const typingStyle = useAnimatedStyle(() => {
    const tick = Math.abs(Math.sin(phase.value * TAU * 6.4));
    return { opacity: 0.22 + tick * 0.5, transform: [{ translateX: tick * size * 0.025 }] };
  }, [size]);

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <Animated.Image
        source={assets.overwork}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.08, top: size * 0.02, width: size * 0.84, height: size * 0.92 },
          workerStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.screenGlow,
          { left: size * 0.24, top: size * 0.43, width: size * 0.52, height: size * 0.28 },
          screenStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.typingLine,
          { left: size * 0.36, bottom: size * 0.1, width: size * 0.28 },
          typingStyle,
        ]}
      />
    </View>
  );
}

function SunriseScene({ phase, size }: SceneProps) {
  const sunStyle = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 0.58, 0.04);
    const opacity = cycle < 0.08 ? cycle / 0.08 : cycle > 0.88 ? (1 - cycle) / 0.12 : 1;
    return {
      opacity,
      transform: [
        { translateY: size * (0.3 - cycle * 0.47) },
        { rotate: `${cycle * 42}deg` },
        { scale: 0.92 + cycle * 0.09 },
      ],
    };
  }, [size]);

  return (
    <View style={[styles.scene, styles.clippedScene, { width: size, height: size }]}>
      <Animated.Image
        source={assets.sun}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.25, top: size * 0.15, width: size * 0.5, height: size * 0.5 },
          sunStyle,
        ]}
      />
      <View
        style={[
          styles.sunriseHillBack,
          { left: -size * 0.12, bottom: size * 0.02, width: size * 0.72, height: size * 0.32 },
        ]}
      />
      <View
        style={[
          styles.sunriseHillFront,
          { right: -size * 0.08, bottom: size * 0.01, width: size * 0.76, height: size * 0.27 },
        ]}
      />
      <View
        style={[styles.horizonShine, { left: size * 0.18, bottom: size * 0.2, width: size * 0.64 }]}
      />
    </View>
  );
}

function NightOfficeScene({ phase, size }: SceneProps) {
  const workerStyle = useAnimatedStyle(() => {
    const typing = Math.abs(Math.sin(phase.value * TAU * 6.8));
    const fatigue = (Math.sin(phase.value * TAU * 0.42) + 1) / 2;
    return {
      transform: [
        { translateY: -typing * size * 0.014 + fatigue * size * 0.006 },
        { rotate: `${(typing - 0.5) * 0.45}deg` },
      ],
    };
  }, [size]);
  const moonStyle = useAnimatedStyle(() => {
    const glow = (Math.sin(phase.value * TAU * 0.48) + 1) / 2;
    return { opacity: 0.66 + glow * 0.28, transform: [{ scale: 0.92 + glow * 0.1 }] };
  });
  const officeScreenStyle = useAnimatedStyle(() => {
    const flicker = (Math.sin(phase.value * TAU * 1.9) + 1) / 2;
    return { opacity: 0.12 + flicker * 0.16, transform: [{ scale: 0.98 + flicker * 0.03 }] };
  });

  return (
    <View style={[styles.scene, styles.clippedScene, { width: size, height: size }]}>
      <View
        style={[
          styles.nightOffice,
          { left: size * 0.03, top: size * 0.02, width: size * 0.94, height: size * 0.9 },
        ]}
      />
      <Animated.View
        style={[
          styles.nightMoon,
          { right: size * 0.1, top: size * 0.08, width: size * 0.18, height: size * 0.18 },
          moonStyle,
        ]}
      />
      <View
        style={[
          styles.nightBuilding,
          { right: size * 0.03, bottom: size * 0.1, width: size * 0.34, height: size * 0.46 },
        ]}
      >
        <View style={[styles.nightWindowLight, { left: "18%", top: "18%" }]} />
        <View style={[styles.nightWindowLight, { right: "18%", top: "38%" }]} />
        <View style={[styles.nightWindowLight, { left: "24%", bottom: "14%" }]} />
      </View>
      <Animated.Image
        source={assets.overwork}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.08, top: size * 0.12, width: size * 0.78, height: size * 0.82 },
          workerStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.screenGlow,
          { left: size * 0.23, top: size * 0.5, width: size * 0.48, height: size * 0.25 },
          officeScreenStyle,
        ]}
      />
      <View
        style={[styles.officeDesk, { left: size * 0.14, bottom: size * 0.05, width: size * 0.64 }]}
      />
    </View>
  );
}

function Snowflake({
  phase,
  size,
  offset,
  left,
  scale,
}: SceneProps & { offset: number; left: number; scale: number }) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 1.55, offset);
    return {
      opacity: softCycleOpacity(cycle) * 0.88,
      transform: [
        { translateX: Math.sin(cycle * TAU + offset * 4) * size * 0.07 },
        { translateY: cycle * size * 0.63 },
        { scale: 0.72 + cycle * 0.28 },
      ],
    };
  }, [offset, size]);

  return (
    <Animated.View
      style={[
        styles.snowflake,
        {
          left: size * left,
          top: -size * 0.05,
          width: Math.max(2, size * 0.052 * scale),
          height: Math.max(2, size * 0.052 * scale),
        },
        style,
      ]}
    />
  );
}

function MountainScene(props: SceneProps) {
  const { phase, size, tone } = props;
  const mountainStyle = useAnimatedStyle(() => {
    const settle = (Math.sin(phase.value * TAU * 0.42) + 1) / 2;
    return { transform: [{ translateY: -settle * size * 0.006 }] };
  }, [size]);

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <View
        style={[
          styles.mountainGround,
          {
            left: size * 0.08,
            bottom: size * 0.03,
            width: size * 0.84,
            backgroundColor: `${tone}2E`,
          },
        ]}
      />
      <Animated.Image
        source={assets.mountain}
        resizeMode="contain"
        style={[
          styles.layer,
          { left: size * 0.04, top: size * 0.13, width: size * 0.92, height: size * 0.82 },
          mountainStyle,
        ]}
      />
      <Snowflake {...props} offset={0} left={0.18} scale={0.82} />
      <Snowflake {...props} offset={0.18} left={0.34} scale={1} />
      <Snowflake {...props} offset={0.39} left={0.5} scale={0.72} />
      <Snowflake {...props} offset={0.61} left={0.66} scale={0.92} />
      <Snowflake {...props} offset={0.81} left={0.8} scale={0.76} />
    </View>
  );
}

function JamCar({
  phase,
  size,
  source,
  left,
  bottom,
  scale,
  offset,
  travel,
}: SceneProps & {
  source: ImageSourcePropType;
  left: number;
  bottom: number;
  scale: number;
  offset: number;
  travel: number;
}) {
  const style = useAnimatedStyle(() => {
    const cycle = loop(phase.value, 1.25, offset);
    const firstRaw = Math.max(0, Math.min(1, (cycle - 0.06) / 0.28));
    const secondRaw = Math.max(0, Math.min(1, (cycle - 0.54) / 0.28));
    const firstCreep = firstRaw * firstRaw * (3 - 2 * firstRaw);
    const secondCreep = secondRaw * secondRaw * (3 - 2 * secondRaw);
    const creep = firstCreep * 0.54 + secondCreep * 0.46;
    const engineIdle = Math.sin(phase.value * TAU * (1.65 + offset * 0.35));
    return {
      transform: [{ translateX: creep * size * travel }, { translateY: engineIdle * size * 0.008 }],
    };
  }, [offset, size, travel]);

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[
        styles.layer,
        {
          left: size * left,
          bottom: size * bottom,
          width: size * scale,
          height: size * scale * 0.62,
        },
        style,
      ]}
    />
  );
}

function TrafficScene(props: SceneProps) {
  const { phase, size, tone } = props;
  const lightStyle = useAnimatedStyle(() => {
    const red = (Math.sin(phase.value * TAU * 0.7) + 1) / 2;
    return { opacity: 0.16 + red * 0.32, transform: [{ scale: 0.88 + red * 0.2 }] };
  });
  const signalStyle = useAnimatedStyle(() => {
    const sway = Math.sin(phase.value * TAU * 0.36);
    return { transform: [{ rotate: `${sway * 0.8}deg` }] };
  });
  const brakeStyle = useAnimatedStyle(() => {
    const brake = (Math.sin(phase.value * TAU * 0.74 + 1.2) + 1) / 2;
    return { opacity: 0.22 + brake * 0.64, transform: [{ scale: 0.82 + brake * 0.34 }] };
  });

  return (
    <View style={[styles.scene, { width: size, height: size }]}>
      <View
        style={[styles.road, { left: 0, bottom: size * 0.03, width: size, height: size * 0.58 }]}
      >
        <View style={[styles.roadDash, { left: size * 0.08, width: size * 0.18 }]} />
        <View style={[styles.roadDash, { left: size * 0.39, width: size * 0.18 }]} />
      </View>
      <View
        style={[
          styles.trafficGround,
          { left: 0, bottom: size * 0.02, width: size, backgroundColor: `${tone}38` },
        ]}
      />
      <JamCar
        {...props}
        source={assets.trafficTruck}
        left={-0.08}
        bottom={0.36}
        scale={0.5}
        offset={0.06}
        travel={0.17}
      />
      <JamCar
        {...props}
        source={assets.trafficTaxi}
        left={0.4}
        bottom={0.36}
        scale={0.44}
        offset={0.48}
        travel={0.135}
      />
      <JamCar
        {...props}
        source={assets.trafficSuv}
        left={-0.09}
        bottom={0.08}
        scale={0.51}
        offset={0.29}
        travel={0.16}
      />
      <JamCar
        {...props}
        source={assets.trafficCar}
        left={0.38}
        bottom={0.07}
        scale={0.53}
        offset={0.72}
        travel={0.145}
      />
      <Animated.View
        style={[
          styles.brakeGlow,
          {
            right: size * 0.075,
            bottom: size * 0.17,
            width: Math.max(2, size * 0.052),
            height: Math.max(2, size * 0.052),
          },
          brakeStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.brakeGlow,
          {
            right: size * 0.12,
            bottom: size * 0.47,
            width: Math.max(2, size * 0.045),
            height: Math.max(2, size * 0.045),
          },
          brakeStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.signalGlow,
          { right: -size * 0.01, top: 0, width: size * 0.24, height: size * 0.24 },
          lightStyle,
        ]}
      />
      <Animated.Image
        source={assets.trafficLight}
        resizeMode="contain"
        style={[
          styles.layer,
          { right: -size * 0.03, top: -size * 0.02, width: size * 0.29, height: size * 0.5 },
          signalStyle,
        ]}
      />
    </View>
  );
}

export function DestinationScene({
  id,
  side,
  phase,
  size,
  tone,
}: SceneProps & { id: FireDestinationId; side: DestinationSide }) {
  switch (`${id}:${side}`) {
    case "camp:setback":
      return <RainScene phase={phase} size={size} tone={tone} />;
    case "camp:goal":
      return <CampfireScene phase={phase} size={size} tone={tone} />;
    case "home:setback":
      return <StreetScene phase={phase} size={size} tone={tone} />;
    case "home:goal":
      return <HomeScene phase={phase} size={size} tone={tone} />;
    case "beach:setback":
      return <HourglassScene phase={phase} size={size} tone={tone} />;
    case "beach:goal":
      return <BeachScene phase={phase} size={size} tone={tone} />;
    case "travel:setback":
      return <WorkScene phase={phase} size={size} tone={tone} />;
    case "travel:goal":
      return <FlightScene phase={phase} size={size} tone={tone} />;
    case "sunrise:setback":
      return <NightOfficeScene phase={phase} size={size} tone={tone} />;
    case "sunrise:goal":
      return <SunriseScene phase={phase} size={size} tone={tone} />;
    case "mountain:setback":
      return <TrafficScene phase={phase} size={size} tone={tone} />;
    case "mountain:goal":
      return <MountainScene phase={phase} size={size} tone={tone} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  scene: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  clippedScene: {
    overflow: "hidden",
    borderRadius: 8,
  },
  layer: {
    position: "absolute",
  },
  rainDrop: {
    position: "absolute",
    borderRadius: 4,
    backgroundColor: "#3F68E8",
  },
  puddle: {
    position: "absolute",
    height: 3,
    borderRadius: 3,
  },
  spark: {
    position: "absolute",
    borderRadius: 8,
    backgroundColor: "#FFBF38",
  },
  fireGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 116, 54, 0.46)",
  },
  log: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#7F4C32",
    borderWidth: 1,
    borderColor: "rgba(255, 196, 120, 0.4)",
  },
  logLight: {
    backgroundColor: "#A9663D",
  },
  smoke: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(178, 187, 197, 0.8)",
  },
  homeGround: {
    position: "absolute",
    height: 3,
    borderRadius: 3,
  },
  streetLampGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 202, 102, 0.62)",
  },
  streetLamp: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: "#59616A",
  },
  streetLampHead: {
    position: "absolute",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: "#F0B750",
  },
  streetLine: {
    position: "absolute",
    height: 3,
    borderRadius: 3,
  },
  cardboardBox: {
    position: "absolute",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(112, 70, 38, 0.42)",
    backgroundColor: "#B47A49",
    overflow: "hidden",
  },
  cardboardFold: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(112, 70, 38, 0.38)",
  },
  sleeperMat: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: "#A87145",
    borderWidth: 1,
    borderColor: "rgba(106, 66, 35, 0.38)",
  },
  streetBlanket: {
    position: "absolute",
    backgroundColor: "#497A73",
    borderWidth: 1,
    borderColor: "rgba(34, 77, 70, 0.5)",
    overflow: "hidden",
  },
  streetBlanketFold: {
    position: "absolute",
    top: "48%",
    left: "9%",
    width: "78%",
    height: 1,
    transform: [{ rotate: "-7deg" }],
    backgroundColor: "rgba(202, 228, 216, 0.38)",
  },
  streetBlanketPatch: {
    position: "absolute",
    right: "12%",
    bottom: "13%",
    width: "20%",
    height: "26%",
    borderRadius: 2,
    backgroundColor: "rgba(236, 191, 121, 0.38)",
  },
  sleeperHeadCrop: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 999,
  },
  streetShoe: {
    position: "absolute",
    width: 7,
    height: 4,
    borderRadius: 5,
    backgroundColor: "#34434D",
  },
  sleepDot: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(139, 161, 199, 0.82)",
  },
  sandGrain: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#D89E34",
  },
  sandStream: {
    position: "absolute",
    borderRadius: 3,
    backgroundColor: "#D89E34",
  },
  flightTrail: {
    position: "absolute",
    height: 2,
    borderRadius: 3,
    backgroundColor: "rgba(112, 178, 218, 0.68)",
  },
  screenGlow: {
    position: "absolute",
    borderRadius: 5,
    backgroundColor: "#86D9FF",
  },
  typingLine: {
    position: "absolute",
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(123, 101, 180, 0.7)",
  },
  sunriseHillBack: {
    position: "absolute",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: "#65A9C7",
    transform: [{ rotate: "8deg" }],
  },
  sunriseHillFront: {
    position: "absolute",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: "#3D8E83",
    transform: [{ rotate: "-7deg" }],
  },
  horizonShine: {
    position: "absolute",
    height: 2,
    borderRadius: 3,
    backgroundColor: "rgba(255, 214, 112, 0.7)",
  },
  nightOffice: {
    position: "absolute",
    borderRadius: 7,
    backgroundColor: "#18243B",
    borderWidth: 1,
    borderColor: "rgba(130, 153, 195, 0.34)",
  },
  nightMoon: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#F2D98C",
  },
  nightBuilding: {
    position: "absolute",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: "#263653",
  },
  nightWindowLight: {
    position: "absolute",
    width: "18%",
    height: "12%",
    borderRadius: 1,
    backgroundColor: "#EECF6E",
  },
  officeDesk: {
    position: "absolute",
    height: 3,
    borderRadius: 3,
    backgroundColor: "#70516E",
  },
  mountainGround: {
    position: "absolute",
    height: 3,
    borderRadius: 3,
  },
  snowflake: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#CFE2F4",
    borderWidth: 0.5,
    borderColor: "rgba(111, 150, 190, 0.44)",
  },
  road: {
    position: "absolute",
    borderRadius: 5,
    backgroundColor: "#69717B",
    overflow: "hidden",
  },
  roadDash: {
    position: "absolute",
    top: "48%",
    height: 1.5,
    borderRadius: 2,
    backgroundColor: "rgba(255, 224, 128, 0.8)",
  },
  trafficGround: {
    position: "absolute",
    height: 3,
    borderRadius: 3,
  },
  signalGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(252, 74, 99, 0.52)",
  },
  brakeGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#FF415B",
  },
});
