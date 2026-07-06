import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MotionPressable } from "./MotionPressable";
import { typography, useThemeColors } from "../design/theme";

const tabMeta: Record<
  string,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  home: { label: "Home", icon: "view-dashboard-outline" },
  calendar: { label: "Calendar", icon: "calendar-month-outline" },
  log: { label: "+", icon: "plus" },
  dashboard: { label: "Dashboard", icon: "chart-timeline-variant" },
  portfolio: { label: "Portfolio", icon: "wallet-outline" },
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

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 14) }]}>
      <View
        style={[styles.pill, { backgroundColor: colors.nav, borderColor: colors.surfaceBorder }]}
      >
        {state.routes.map((route, index) => {
          const meta = tabMeta[route.name] ?? { label: route.name, icon: "circle-outline" };
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
              accessibilityLabel={`${meta.label} tab`}
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
                  {meta.label}
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
