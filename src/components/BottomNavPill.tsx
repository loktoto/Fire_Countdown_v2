import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MotionPressable } from "./MotionPressable";
import { typography, useThemeColors } from "../design/theme";
import { useLogEntryFlow } from "../features/logEntryFlow/LogEntryFlowContext";
import { useI18n } from "../i18n";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { bottomNavigationPillHeight, minimumBottomNavigationInset } from "./screenScaffoldLayout";

const tabMeta: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  home: { icon: "view-dashboard-outline" },
  calendar: { icon: "calendar-month-outline" },
  log: { icon: "plus" },
  dashboard: { icon: "chart-timeline-variant" },
  portfolio: { icon: "wallet-outline" },
};

type TabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation: {
    navigate: (name: string) => void;
    emit?: (options: { canPreventDefault: true; target: string; type: "tabPress" }) => {
      defaultPrevented: boolean;
    };
  };
};

export function BottomNavPill({ state, navigation }: TabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useI18n();
  const reducedMotion = useReducedMotion();
  const imeInset = useKeyboardInset();
  const entryFlow = useLogEntryFlow();
  const currentRoute = state.routes[state.index]?.name ?? "log";
  const isEntryMode = currentRoute === "log";
  const returnRouteRef = useRef("home");
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingSuccess, setSavingSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const tabLabels: Record<string, string> = {
    home: t.tabs.home,
    calendar: t.tabs.calendar,
    log: t.tabs.log,
    dashboard: t.tabs.dashboard,
    portfolio: t.tabs.portfolio,
  };

  useEffect(() => {
    if (!isEntryMode) {
      returnRouteRef.current = currentRoute;
    }
  }, [currentRoute, isEntryMode]);

  const exitEntryMode = useCallback(() => {
    navigation.navigate(returnRouteRef.current);
  }, [navigation]);

  useEffect(() => {
    entryFlow.registerExitHandler(exitEntryMode);
    return () => entryFlow.registerExitHandler(null);
  }, [entryFlow, exitEntryMode]);

  useEffect(
    () => () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    },
    [],
  );

  function completeEntry() {
    if (!entryFlow.canSave) {
      entryFlow.showValidation();
      return;
    }

    const result = entryFlow.save();
    if (!result.saved) {
      return;
    }

    setSavingSuccess(true);
    setToastMessage(result.message ?? t.log.transactionSaved);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = setTimeout(() => {
      setSavingSuccess(false);
      exitEntryMode();
    }, 260);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2800);
  }

  if (imeInset > 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, minimumBottomNavigationInset) }]}
    >
      {toastMessage ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          entering={reducedMotion ? undefined : FadeInUp.duration(200)}
          exiting={reducedMotion ? undefined : FadeOutDown.duration(160)}
          style={[
            styles.toast,
            {
              backgroundColor: colors.text,
              borderColor: colors.surfaceBorder,
              boxShadow: `0 10px 28px ${colors.shadow}`,
            },
          ]}
        >
          <MaterialCommunityIcons name="check-circle" size={19} color={colors.positive} />
          <Text style={[styles.toastText, typography.button, { color: colors.background }]}>
            {toastMessage}
          </Text>
        </Animated.View>
      ) : null}
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.nav,
            borderColor: colors.surfaceBorder,
            boxShadow:
              colors.mode === "dark"
                ? "0 12px 30px rgba(0,0,0,0.38)"
                : "0 12px 28px rgba(28,58,52,0.12)",
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const meta = tabMeta[route.name] ?? { icon: "circle-outline" };
          const label = tabLabels[route.name] ?? route.name;
          const focused = state.index === index;
          const isLog = route.name === "log";
          const pressTab = () => {
            if (isLog && isEntryMode) {
              completeEntry();
              return;
            }

            const event = navigation.emit?.({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!event?.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <MotionPressable
              key={route.key}
              accessibilityLabel={isLog ? t.log.title : label}
              accessibilityRole="tab"
              accessibilityState={{
                selected: focused,
                disabled: isLog && isEntryMode && !entryFlow.canSave,
              }}
              onPress={pressTab}
              haptic={isLog ? (isEntryMode && !entryFlow.canSave ? false : "medium") : "selection"}
              style={[
                styles.item,
                isLog && [
                  styles.center,
                  {
                    backgroundColor:
                      isEntryMode && !entryFlow.canSave && !savingSuccess
                        ? colors.surfaceElevated
                        : savingSuccess
                          ? colors.positive
                          : colors.primaryFill,
                    borderColor: colors.background,
                    boxShadow:
                      isEntryMode && !entryFlow.canSave ? "none" : `0 6px 16px ${colors.shadow}`,
                  },
                ],
              ]}
            >
              <Animated.View
                key={`${route.name}-${isLog && isEntryMode ? "confirm" : focused ? "active" : "idle"}-${savingSuccess ? "saved" : "ready"}`}
                entering={
                  reducedMotion
                    ? undefined
                    : ZoomIn.duration(190).easing(Easing.bezier(0.16, 1, 0.3, 1))
                }
              >
                <MaterialCommunityIcons
                  name={isLog && isEntryMode ? "check" : meta.icon}
                  size={isLog ? 33 : 21}
                  color={
                    isLog
                      ? isEntryMode && !entryFlow.canSave && !savingSuccess
                        ? colors.disabled
                        : colors.onPrimary
                      : focused
                        ? colors.primary
                        : colors.textMuted
                  }
                />
              </Animated.View>
              {!isLog ? (
                <>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      typography.button,
                      { color: focused ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {label}
                  </Text>
                  {focused ? (
                    <Animated.View
                      entering={
                        reducedMotion
                          ? undefined
                          : FadeInDown.duration(180).easing(Easing.out(Easing.cubic))
                      }
                      style={[styles.selectedMark, { backgroundColor: colors.primary }]}
                    />
                  ) : null}
                </>
              ) : null}
            </MotionPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  pill: {
    height: bottomNavigationPillHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 23,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  toast: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: bottomNavigationPillHeight + 12,
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toastText: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 48,
    borderRadius: 15,
    borderCurve: "continuous",
  },
  center: {
    flex: 0,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    marginHorizontal: 6,
    marginTop: -15,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
  },
  selectedMark: {
    position: "absolute",
    bottom: 1,
    width: 18,
    height: 3,
    borderRadius: 2,
  },
});
