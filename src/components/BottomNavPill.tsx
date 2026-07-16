import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MotionPressable } from "./MotionPressable";
import { typography, useThemeColors } from "../design/theme";
import { useI18n } from "../i18n";
import { useReducedMotion } from "../hooks/useReducedMotion";

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
  const tabLabels: Record<string, string> = {
    home: t.tabs.home,
    calendar: t.tabs.calendar,
    log: t.tabs.log,
    dashboard: t.tabs.dashboard,
    portfolio: t.tabs.portfolio,
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]}>
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
              accessibilityState={{ selected: focused }}
              onPress={pressTab}
              haptic={isLog ? "medium" : "selection"}
              style={[
                styles.item,
                isLog && [
                  styles.center,
                  {
                    backgroundColor: colors.primaryFill,
                    borderColor: colors.background,
                    boxShadow: `0 6px 16px ${colors.shadow}`,
                  },
                ],
              ]}
            >
              <Animated.View
                key={`${route.name}-${focused ? "active" : "idle"}`}
                entering={
                  reducedMotion
                    ? undefined
                    : ZoomIn.duration(190).easing(Easing.bezier(0.16, 1, 0.3, 1))
                }
              >
                <MaterialCommunityIcons
                  name={meta.icon}
                  size={isLog ? 30 : 21}
                  color={isLog ? colors.onPrimary : focused ? colors.primary : colors.textMuted}
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
    height: 66,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 23,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
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
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    marginHorizontal: 4,
    marginTop: -12,
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
