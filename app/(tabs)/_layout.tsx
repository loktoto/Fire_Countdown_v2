import { Tabs } from "expo-router";

import { BottomNavPill } from "../../src/components/BottomNavPill";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="log"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNavPill {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="log" options={{ title: "+" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="portfolio" options={{ title: "Portfolio" }} />
    </Tabs>
  );
}
