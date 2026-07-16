import type { AssetQuoteCache } from "../features/types";

function keepNewest(target: Map<string, AssetQuoteCache>, quote: AssetQuoteCache) {
  const current = target.get(quote.assetId);
  const quoteTime = Date.parse(quote.receivedAt);
  const currentTime = current ? Date.parse(current.receivedAt) : Number.NEGATIVE_INFINITY;
  if (!current || quoteTime > currentTime) {
    target.set(quote.assetId, quote);
  }
}

export function mergeQuoteCache(current: AssetQuoteCache[], incoming: AssetQuoteCache[]) {
  const newestIncoming = new Map<string, AssetQuoteCache>();
  incoming.forEach((quote) => keepNewest(newestIncoming, quote));

  const retained = new Map<string, AssetQuoteCache>();
  current.forEach((quote) => {
    if (!newestIncoming.has(quote.assetId)) {
      keepNewest(retained, quote);
    }
  });

  return [...newestIncoming.values(), ...retained.values()];
}
