import { Stack } from "expo-router";

import { AppErrorBoundary } from "../src/providers/AppErrorBoundary";
import { Providers } from "../src/providers/Providers";

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
