import { Stack } from "expo-router";

import { Providers } from "../src/providers/Providers";

export default function RootLayout() {
  return (
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
      </Stack>
    </Providers>
  );
}
