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
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FireStoreProvider } from "../data/fireStore";

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
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#090A0F",
        }}
      >
        <Text style={{ color: "#00F0FF" }}>Loading Fire Countdown</Text>
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
