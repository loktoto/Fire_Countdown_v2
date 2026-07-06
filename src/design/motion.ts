import { Easing, FadeInUp, LinearTransition } from "react-native-reanimated";

import { tokens } from "./tokens";

export function enter(index = 0) {
  return FadeInUp.duration(tokens.motion.enterMs)
    .delay(index * tokens.motion.staggerMs)
    .easing(Easing.out(Easing.cubic));
}

export const rowLayout = LinearTransition.duration(220);

export const spring = {
  damping: 16,
  stiffness: 180,
};
