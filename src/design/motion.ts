import {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

import { tokens } from "./tokens";

export function enter(index = 0) {
  return FadeInUp.duration(tokens.motion.enterMs)
    .delay(Math.min(index, 6) * tokens.motion.staggerMs)
    .easing(Easing.bezier(0.16, 1, 0.3, 1));
}

export const sheetBackdropEnter = FadeIn.duration(140).easing(Easing.out(Easing.quad));
export const sheetBackdropExit = FadeOut.duration(110).easing(Easing.in(Easing.quad));
export const sheetEnter = SlideInDown.duration(tokens.motion.sheetMs).easing(
  Easing.bezier(0.16, 1, 0.3, 1),
);
export const sheetExit = SlideOutDown.duration(180).easing(Easing.in(Easing.cubic));

export const rowLayout = LinearTransition.duration(180).easing(Easing.out(Easing.cubic));

export const spring = {
  damping: 20,
  stiffness: 220,
  mass: 0.8,
};

export const pressSpring = {
  damping: 20,
  stiffness: 380,
  mass: 0.5,
  overshootClamping: true,
};
