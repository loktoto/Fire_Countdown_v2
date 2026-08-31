import NetInfo from "@react-native-community/netinfo";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useFireStore } from "../data/fireStore";
import { mainGoal } from "../engine/selectors";
import { getPortfolioQuotes } from "../features/quoteBridge/client";

export function useQuoteRefresh() {
  const { snapshot, saveQuotes } = useFireStore();
  const goal = mainGoal(snapshot);
  const baseCurrency = goal?.baseCurrency ?? snapshot.currency;
  const quoteAssets = useMemo(
    () =>
      snapshot.assets.filter(
        (asset) =>
          !asset.archivedAt && asset.updateMethod !== "manual" && (asset.quantity ?? 0) > 0,
      ),
    [snapshot.assets],
  );

  const refreshQuotes = useMutation({
    mutationKey: ["portfolio-quotes", snapshot.quoteSettings.provider],
    mutationFn: async () => {
      const network = await NetInfo.fetch();
      if (network.isConnected === false) {
        throw new Error("You’re offline. Saved prices are still available.");
      }
      const quotes = await getPortfolioQuotes(
        snapshot.quoteSettings,
        quoteAssets,
        baseCurrency,
        snapshot.quoteCache,
      );
      if (!saveQuotes(quotes)) {
        throw new Error("Unable to persist refreshed quotes.");
      }
      return quotes;
    },
  });
  const { isPending, mutate } = refreshQuotes;
  const { enabled, lastRefreshAt, refreshIntervalMinutes } = snapshot.quoteSettings;

  const refreshIfDue = useCallback(() => {
    if (!enabled || quoteAssets.length === 0 || isPending) {
      return;
    }

    const lastRefresh = lastRefreshAt ? Date.parse(lastRefreshAt) : 0;
    const refreshAfter = refreshIntervalMinutes * 60_000;
    if (!lastRefresh || Date.now() - lastRefresh >= refreshAfter) {
      mutate();
    }
  }, [enabled, isPending, lastRefreshAt, mutate, quoteAssets.length, refreshIntervalMinutes]);

  return {
    refreshQuotes,
    refreshIfDue,
    quoteAssetCount: quoteAssets.length,
    quoteProvider: snapshot.quoteSettings.provider,
    quoteEnabled: snapshot.quoteSettings.enabled,
    lastRefreshAt: snapshot.quoteSettings.lastRefreshAt,
  };
}
