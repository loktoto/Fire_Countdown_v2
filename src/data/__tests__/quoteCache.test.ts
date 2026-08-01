import { mergeQuoteCache } from "../quoteCache";
import { seedSnapshot } from "../seed";

describe("quote cache", () => {
  it("keeps one newest quote per asset and replaces refreshed assets", () => {
    const original = seedSnapshot.quoteCache[0]!;
    const other = { ...original, id: "other", assetId: "asset-other" };
    const replacement = {
      ...original,
      id: "replacement",
      price: original.price + 10,
      receivedAt: "2026-07-14T00:00:00.000Z",
    };
    const staleDuplicate = {
      ...replacement,
      id: "stale",
      price: 1,
      receivedAt: "2026-07-13T00:00:00.000Z",
    };

    const merged = mergeQuoteCache([original, other], [staleDuplicate, replacement]);
    expect(merged).toHaveLength(2);
    expect(merged.find((quote) => quote.assetId === original.assetId)?.id).toBe("replacement");
    expect(merged.find((quote) => quote.assetId === other.assetId)?.id).toBe("other");
  });

  it("preserves cached quotes when a refresh returns no usable data", () => {
    expect(mergeQuoteCache(seedSnapshot.quoteCache, [])).toEqual(seedSnapshot.quoteCache);
  });
});
