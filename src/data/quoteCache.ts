import type { AssetQuoteCache } from "../features/types";

function quoteTimestamp(quote: AssetQuoteCache) {
  const timestamp = Date.parse(quote.receivedAt);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function keepNewest(target: Map<string, AssetQuoteCache>, quote: AssetQuoteCache) {
  const current = target.get(quote.assetId);
  if (!current || quoteTimestamp(quote) > quoteTimestamp(current)) {
    target.set(quote.assetId, quote);
  }
}

export function mergeQuoteCache(current: AssetQuoteCache[], incoming: AssetQuoteCache[]) {
  const newest = new Map<string, AssetQuoteCache>();

  // Existing cache entries are considered first so an equal or invalid incoming
  // timestamp cannot replace the value already shown to the user. Within either
  // input, the first row wins a timestamp tie and a valid timestamp outranks an
  // invalid one.
  current.forEach((quote) => keepNewest(newest, quote));
  incoming.forEach((quote) => keepNewest(newest, quote));

  return [...newest.values()];
}
