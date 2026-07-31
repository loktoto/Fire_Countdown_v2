import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useFireStore } from "../data/fireStore";
import { defaultScenario, mainGoal } from "../engine/selectors";
import {
  freedomDaysFunded,
  monthsOfRequiredWork,
  requiredWorkDaysForExpense,
  requiredWorkDaysReducedPerMonth,
} from "../engine/timeLens";
import { typography, useThemeColors } from "../design/theme";
import { tokens } from "../design/tokens";
import { useI18n } from "../i18n";

export type TimeLensKind = "asset" | "monthlySaving" | "expense" | "income" | "spending";

type LensMode = {
  id: string;
  title: string;
  value: string;
};

type LensState = {
  x: number;
  y: number;
  modes: LensMode[];
  index: number;
};

type TimeLensContextValue = {
  open: (state: LensState) => void;
  update: (index: number) => void;
  close: () => void;
};

const TimeLensContext = createContext<TimeLensContextValue | null>(null);
const LENS_SIZE = 184;
const SLIDE_STEP = 68;

function formatDuration(months: number, locale: string) {
  const roundedMonths = Math.max(0, Math.round(months));
  const years = Math.floor(roundedMonths / 12);
  const remainingMonths = roundedMonths % 12;
  const traditionalChinese = locale.toLowerCase().startsWith("zh");

  if (traditionalChinese) {
    if (years > 0 && remainingMonths > 0) return `${years} 年 ${remainingMonths} 個月`;
    if (years > 0) return `${years} 年`;
    return `${remainingMonths} 個月`;
  }

  if (years > 0 && remainingMonths > 0) return `${years}y ${remainingMonths}m`;
  if (years > 0) return `${years}y`;
  return `${remainingMonths}m`;
}

function formatDays(days: number) {
  const rounded = days >= 20 ? Math.round(days) : Math.round(days * 10) / 10;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function TimeLensOverlay({ state, visible }: { state: LensState | null; visible: boolean }) {
  const colors = useThemeColors();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = visible
      ? withSpring(1, { duration: 260, dampingRatio: 0.82 })
      : withTiming(0, { duration: 110, easing: Easing.out(Easing.cubic) });
  }, [progress, visible]);

  const lensStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }, { scale: 0.94 + progress.value * 0.06 }],
  }));

  if (!state) return null;

  const left = Math.max(12, Math.min(width - LENS_SIZE - 12, state.x - LENS_SIZE / 2));
  const top = Math.max(18, Math.min(height - LENS_SIZE - 18, state.y - LENS_SIZE * 0.88));
  const mode = state.modes[state.index] ?? state.modes[0] ?? { id: "money", title: "", value: "" };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.lens,
          {
            left,
            top,
            borderColor: `${colors.primary}A8`,
            boxShadow: `0 18px 46px ${colors.shadow}`,
          },
          lensStyle,
        ]}
      >
        <BlurView
          intensity={82}
          tint={colors.mode === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                colors.mode === "dark" ? "rgba(15,24,31,0.82)" : "rgba(250,250,246,0.84)",
            },
          ]}
        />
        <View style={[styles.lensInnerRing, { borderColor: `${colors.primary}40` }]} />
        <Text style={[styles.lensEyebrow, typography.button, { color: colors.primary }]}>
          TIME LENS
        </Text>
        <Animated.View
          key={mode.id}
          entering={FadeIn.duration(135).easing(Easing.out(Easing.cubic))}
          exiting={FadeOut.duration(70)}
          style={styles.lensCopy}
        >
          <Text
            numberOfLines={1}
            style={[styles.lensTitle, typography.body, { color: colors.textMuted }]}
          >
            {mode.title}
          </Text>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[styles.lensValue, typography.title, { color: colors.text }]}
          >
            {mode.value}
          </Text>
        </Animated.View>
        <View style={styles.modeDots}>
          {state.modes.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.modeDot,
                {
                  width: index === state.index ? 15 : 5,
                  backgroundColor: index === state.index ? colors.primary : colors.surfaceBorder,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export function TimeLensProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LensState | null>(null);
  const [visible, setVisible] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    },
    [],
  );

  const open = useCallback((next: LensState) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setState(next);
    setVisible(true);
  }, []);

  const update = useCallback((index: number) => {
    setState((current) => (current ? { ...current, index } : current));
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setState(null), 130);
  }, []);

  const contextValue = useMemo(() => ({ open, update, close }), [close, open, update]);

  return (
    <TimeLensContext.Provider value={contextValue}>
      <View style={styles.providerRoot}>
        {children}
        <TimeLensOverlay state={state} visible={visible} />
      </View>
    </TimeLensContext.Provider>
  );
}

function useTimeLensModes({
  kind,
  amount,
  moneyText,
}: {
  kind: TimeLensKind;
  amount: number;
  moneyText: string;
}) {
  const { snapshot } = useFireStore();
  const t = useI18n();

  return useMemo(() => {
    const goal = mainGoal(snapshot);
    const scenario = defaultScenario(snapshot);
    const monthlySaving = Math.max(
      0,
      (goal?.monthlySaving ?? 0) + (scenario?.monthlySavingAdjustment ?? 0),
    );
    const targetMonthlySpending = Math.max(
      0,
      (goal?.targetMonthlySpending ?? 0) + (scenario?.targetSpendingAdjustment ?? 0),
    );
    const modes: LensMode[] = [{ id: "money", title: t.timeLens.money, value: moneyText }];

    if (kind === "asset") {
      const workMonths = monthsOfRequiredWork(amount, monthlySaving);
      const fundedDays = freedomDaysFunded(amount, targetMonthlySpending);
      modes.push({
        id: "last-workday",
        title: t.timeLens.lastWorkday,
        value:
          workMonths === null
            ? t.timeLens.notAvailable
            : t.timeLens.earlier(formatDuration(workMonths, t.locale)),
      });
      modes.push({
        id: "freedom-year",
        title: t.timeLens.freedomYear,
        value:
          fundedDays === null
            ? t.timeLens.notAvailable
            : t.timeLens.daysFunded(formatDays(fundedDays)),
      });
    } else if (kind === "monthlySaving") {
      const reducedDays = requiredWorkDaysReducedPerMonth(amount, targetMonthlySpending);
      modes.push({
        id: "required-work",
        title: t.timeLens.requiredWork,
        value:
          reducedDays === null
            ? t.timeLens.notAvailable
            : t.timeLens.reducesWork(formatDays(reducedDays)),
      });
    } else if (kind === "expense" || kind === "income") {
      const workDays = requiredWorkDaysForExpense(amount, monthlySaving);
      modes.push({
        id: "required-work",
        title: t.timeLens.requiredWork,
        value:
          workDays === null
            ? t.timeLens.notAvailable
            : kind === "expense"
              ? t.timeLens.requiredWorkDays(formatDays(workDays))
              : t.timeLens.workDaysRemoved(formatDays(workDays)),
      });
    } else {
      const fundedDays = freedomDaysFunded(amount, targetMonthlySpending);
      modes.push({
        id: "freedom-year",
        title: t.timeLens.freedomYear,
        value:
          fundedDays === null
            ? t.timeLens.notAvailable
            : t.timeLens.daysFunded(formatDays(fundedDays)),
      });
    }

    return modes;
  }, [amount, kind, moneyText, snapshot, t]);
}

export function TimeLensValue({
  children,
  amount,
  moneyText,
  kind,
  textStyle,
  style,
  color,
  disabled = false,
  onPress,
  accessibilityLabel,
  numberOfLines = 1,
  adjustsFontSizeToFit = true,
  minimumFontScale = 0.66,
  testID,
}: {
  children?: ReactNode;
  amount: number;
  moneyText: string;
  kind: TimeLensKind;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  color?: string;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  testID?: string;
}) {
  const lens = useContext(TimeLensContext);
  const { snapshot } = useFireStore();
  const t = useI18n();
  const modes = useTimeLensModes({ kind, amount, moneyText });
  const [activeIndex, setActiveIndex] = useState(0);
  const didLongPress = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressableRef = useRef<View>(null);
  const enabled = !disabled && amount > 0 && moneyText !== "***" && modes.length > 1;

  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    },
    [],
  );

  function hapticSelection() {
    if (!snapshot.hapticsEnabled) return;
    void Haptics.selectionAsync().catch(() => undefined);
  }

  function beginLensAt(x: number, y: number) {
    if (!enabled || !lens) return;
    didLongPress.current = true;
    const nextIndex = Math.min(1, modes.length - 1);
    lens.open({ x, y, modes, index: nextIndex });
    hapticSelection();
    revealTimer.current = setTimeout(() => setActiveIndex(nextIndex), 85);
  }

  function updateFromTranslation(dx: number) {
    if (!didLongPress.current || !lens) return;
    const nextIndex = Math.max(0, Math.min(modes.length - 1, 1 + Math.round(dx / SLIDE_STEP)));
    if (nextIndex === activeIndex) return;
    setActiveIndex(nextIndex);
    lens.update(nextIndex);
    hapticSelection();
  }

  function endLens() {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (didLongPress.current) lens?.close();
    setActiveIndex(0);
    setTimeout(() => {
      didLongPress.current = false;
    }, 0);
  }

  function showAccessibilityMeaning() {
    const nextIndex = activeIndex <= 0 ? 1 : activeIndex >= modes.length - 1 ? 1 : activeIndex + 1;
    const mode = modes[nextIndex] ?? modes[0];
    if (!mode) return;
    setActiveIndex(nextIndex);
    AccessibilityInfo.announceForAccessibility(`${mode.title}. ${mode.value}`);
    pressableRef.current?.measureInWindow((x, y, width, height) => {
      lens?.open({ x: x + width / 2, y: y + height / 2, modes, index: nextIndex });
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => {
        lens?.close();
        setActiveIndex(0);
      }, 2800);
    });
  }

  const displayed = modes[activeIndex]?.value ?? moneyText;
  /* eslint-disable react-hooks/refs -- these callbacks run after native gesture recognition, never during render */
  const holdAndSlideGesture = Gesture.Pan()
    .activateAfterLongPress(360)
    .onStart((event) => beginLensAt(event.absoluteX, event.absoluteY))
    .onUpdate((event) => updateFromTranslation(event.translationX))
    .onFinalize(endLens)
    .runOnJS(true);
  /* eslint-enable react-hooks/refs */

  const animatedValue = (
    <Animated.Text
      key={`${activeIndex}-${displayed}`}
      entering={FadeIn.duration(activeIndex === 0 ? 105 : 150).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(70)}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      style={[textStyle, color ? { color } : undefined]}
    >
      {displayed}
    </Animated.Text>
  );

  if (children) {
    return (
      <GestureDetector gesture={holdAndSlideGesture}>
        <Pressable
          ref={pressableRef}
          accessible
          testID={testID}
          disabled={!enabled && !onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? moneyText}
          accessibilityHint={enabled ? t.timeLens.hint : undefined}
          accessibilityActions={
            enabled ? [{ name: "viewTimeMeaning", label: t.timeLens.viewTimeMeaning }] : undefined
          }
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "viewTimeMeaning") showAccessibilityMeaning();
          }}
          onPress={() => {
            if (!didLongPress.current) onPress?.();
          }}
          style={style}
        >
          {activeIndex === 0 ? <View pointerEvents="none">{children}</View> : animatedValue}
        </Pressable>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={holdAndSlideGesture}>
      <Pressable
        ref={pressableRef}
        accessible
        testID={testID}
        disabled={!enabled && !onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? moneyText}
        accessibilityHint={enabled ? t.timeLens.hint : undefined}
        accessibilityActions={
          enabled ? [{ name: "viewTimeMeaning", label: t.timeLens.viewTimeMeaning }] : undefined
        }
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "viewTimeMeaning") showAccessibilityMeaning();
        }}
        onPress={() => {
          if (!didLongPress.current) onPress?.();
        }}
        style={style}
      >
        {animatedValue}
      </Pressable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  providerRoot: { flex: 1 },
  lens: {
    position: "absolute",
    zIndex: 1000,
    width: LENS_SIZE,
    height: LENS_SIZE,
    borderRadius: LENS_SIZE / 2,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  lensInnerRing: {
    position: "absolute",
    top: 7,
    right: 7,
    bottom: 7,
    left: 7,
    borderRadius: (LENS_SIZE - 14) / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lensEyebrow: {
    position: "absolute",
    top: 26,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
  },
  lensCopy: { alignItems: "center", gap: 5, maxWidth: 142 },
  lensTitle: { fontSize: 12, lineHeight: 16, textAlign: "center" },
  lensValue: { fontSize: 19, lineHeight: 24, textAlign: "center" },
  modeDots: {
    position: "absolute",
    bottom: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  modeDot: { height: 5, borderRadius: tokens.radius.pill },
});
