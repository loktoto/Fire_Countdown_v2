import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MotionPressable } from "./MotionPressable";
import { typography, useThemeColors } from "../design/theme";
import { useI18n } from "../i18n";

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
  const tabLabels: Record<string, string> = {
    home: t.tabs.home,
    calendar: t.tabs.calendar,
    log: t.tabs.log,
    dashboard: t.tabs.dashboard,
    portfolio: t.tabs.portfolio,
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 14) }]}>
      <View
        style={[styles.pill, { backgroundColor: colors.nav, borderColor: colors.surfaceBorder }]}
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
              accessibilityLabel={label}
              onPress={pressTab}
              style={[
                styles.item,
                isLog && [
                  styles.center,
                  { backgroundColor: colors.primary, shadowColor: colors.primary },
                ],
              ]}
            >
              <MaterialCommunityIcons
                name={meta.icon}
                size={isLog ? 34 : 24}
                color={isLog ? colors.onPrimary : focused ? colors.primary : colors.textMuted}
              />
              {!isLog ? (
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
    left: 18,
    right: 18,
  },
  pill: {
    height: 78,
    borderWidth: 1,
    borderRadius: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 56,
  },
  center: {
    flex: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: -30,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  label: {
    fontSize: 11,
  },
});
