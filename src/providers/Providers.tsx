import {
  Outfit_400Regular,
  Outfit_500Medium,
  useFonts as useOutfitFonts,
} from "@expo-google-fonts/outfit";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts as useSpaceGroteskFonts,
} from "@expo-google-fonts/space-grotesk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FireStoreProvider } from "../data/fireStore";
import { tokens } from "../design/tokens";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [spaceLoaded] = useSpaceGroteskFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [outfitLoaded] = useOutfitFonts({
    Outfit_400Regular,
    Outfit_500Medium,
  });

  if (!spaceLoaded || !outfitLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={tokens.color.cyan} size="small" />
        <Text style={styles.loadingTitle}>Fire Countdown</Text>
        <Text style={styles.loadingMeta}>Loading…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <FireStoreProvider>{children}</FireStoreProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
    backgroundColor: tokens.color.obsidian,
  },
  loadingTitle: {
    marginTop: tokens.spacing.sm,
    color: "#F5F8F6",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  loadingMeta: {
    color: tokens.color.muted,
    fontSize: 13,
  },
});
