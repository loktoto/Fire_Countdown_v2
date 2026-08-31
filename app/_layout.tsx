import { Stack } from "expo-router";
import { enableFreeze } from "react-native-screens";

import { AppErrorBoundary } from "../src/providers/AppErrorBoundary";
import { Providers } from "../src/providers/Providers";

// Frozen hidden screens stop re-rendering and replaying entry animations when
// the user switches tabs, keeping navigation smooth on low-end devices.
enableFreeze(true);

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <Providers>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="settings"
            options={{
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="recurring"
            options={{
              presentation: "modal",
            }}
          />
        </Stack>
      </Providers>
    </AppErrorBoundary>
  );
}
