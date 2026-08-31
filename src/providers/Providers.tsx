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
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TimeLensProvider } from "../components/TimeLens";
import { FireStoreProvider, useFireStore } from "../data/fireStore";
import { HapticsPreferenceProvider } from "./hapticsPreference";
import { LoadingScreen, systemLocale } from "./LoadingScreen";
import { PersistenceErrorNotice } from "./PersistenceErrorNotice";
import { SnapshotRecoveryNotice } from "./SnapshotRecoveryNotice";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Bridges the store's haptics preference into the lightweight leaf channel so
// pressables don't each subscribe to the whole FireSnapshot.
function HapticsPreferenceBridge({ children }: { children: ReactNode }) {
  const { snapshot } = useFireStore();
  return (
    <HapticsPreferenceProvider hapticsEnabled={snapshot.hapticsEnabled}>
      {children}
    </HapticsPreferenceProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
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
    return <LoadingScreen colorScheme={colorScheme} locale={systemLocale()} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <FireStoreProvider>
            <HapticsPreferenceBridge>
              <TimeLensProvider>{children}</TimeLensProvider>
              <PersistenceErrorNotice />
              <SnapshotRecoveryNotice />
            </HapticsPreferenceBridge>
          </FireStoreProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
