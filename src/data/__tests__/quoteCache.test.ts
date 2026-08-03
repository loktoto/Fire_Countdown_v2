import type { AssetQuoteCache } from "../../features/types";
import { mergeQuoteCache } from "../quoteCache";
import { seedSnapshot } from "../seed";

function quote({
  id,
  assetId = "asset-1",
  receivedAt,
  price,
}: {
  id: string;
  assetId?: string;
  receivedAt: string;
  price: number;
}): AssetQuoteCache {
  return {
    id,
    assetId,
    symbol: `TEST:${assetId}`,
    price,
    currency: "HKD",
    receivedAt,
    source: "FREE_MARKET",
    status: "ok",
  };
}

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
    expect(merged.find((item) => item.assetId === original.assetId)?.id).toBe(
      "replacement",
    );
    expect(merged.find((item) => item.assetId === other.assetId)?.id).toBe("other");
  });

  it("preserves cached quotes when a refresh returns no usable data", () => {
    expect(mergeQuoteCache(seedSnapshot.quoteCache, [])).toEqual(seedSnapshot.quoteCache);
  });

  it("does not replace a newer cached quote with an older incoming quote", () => {
    const current = quote({
      id: "current-newer",
      receivedAt: "2026-08-03T10:00:00.000Z",
      price: 120,
    });
    const incoming = quote({
      id: "incoming-older",
      receivedAt: "2026-08-03T09:00:00.000Z",
      price: 100,
    });

    expect(mergeQuoteCache([current], [incoming])).toEqual([current]);
  });

  it("keeps the existing quote when timestamps are equal", () => {
    const receivedAt = "2026-08-03T10:00:00.000Z";
    const current = quote({ id: "current", receivedAt, price: 120 });
    const incoming = quote({ id: "incoming", receivedAt, price: 125 });

    expect(mergeQuoteCache([current], [incoming])).toEqual([current]);
  });

  it("selects the newest duplicate incoming row and keeps the first row on a tie", () => {
    const older = quote({
      id: "incoming-older",
      receivedAt: "2026-08-03T08:00:00.000Z",
      price: 90,
    });
    const newestFirst = quote({
      id: "incoming-newest-first",
      receivedAt: "2026-08-03T10:00:00.000Z",
      price: 120,
    });
    const newestTie = quote({
      id: "incoming-newest-tie",
      receivedAt: "2026-08-03T10:00:00.000Z",
      price: 121,
    });

    expect(mergeQuoteCache([], [older, newestFirst, newestTie])).toEqual([newestFirst]);
  });

  it("lets valid timestamps outrank invalid timestamps deterministically", () => {
    const invalidCurrent = quote({
      id: "invalid-current",
      receivedAt: "not-a-date",
      price: 80,
    });
    const invalidIncoming = quote({
      id: "invalid-incoming",
      receivedAt: "also-not-a-date",
      price: 90,
    });
    const validIncoming = quote({
      id: "valid-incoming",
      receivedAt: "2026-08-03T10:00:00.000Z",
      price: 120,
    });

    expect(mergeQuoteCache([invalidCurrent], [invalidIncoming])).toEqual([invalidCurrent]);
    expect(mergeQuoteCache([invalidCurrent], [validIncoming])).toEqual([validIncoming]);
    expect(mergeQuoteCache([validIncoming], [invalidIncoming])).toEqual([validIncoming]);
  });

  it("is monotonic when overlapping refreshes complete out of order", () => {
    const initial = quote({
      id: "initial",
      receivedAt: "2026-08-03T08:00:00.000Z",
      price: 90,
    });
    const olderResponse = quote({
      id: "older-response",
      receivedAt: "2026-08-03T09:00:00.000Z",
      price: 100,
    });
    const newerResponse = quote({
      id: "newer-response",
      receivedAt: "2026-08-03T10:00:00.000Z",
      price: 120,
    });

    const newerThenOlder = mergeQuoteCache(
      mergeQuoteCache([initial], [newerResponse]),
      [olderResponse],
    );
    const olderThenNewer = mergeQuoteCache(
      mergeQuoteCache([initial], [olderResponse]),
      [newerResponse],
    );

    expect(newerThenOlder).toEqual([newerResponse]);
    expect(olderThenNewer).toEqual([newerResponse]);
  });

  it("preserves independent assets while selecting each newest quote", () => {
    const assetOne = quote({
      id: "asset-one",
      assetId: "asset-1",
      receivedAt: "2026-08-03T10:00:00.000Z",
      price: 120,
    });
    const assetTwo = quote({
      id: "asset-two",
      assetId: "asset-2",
      receivedAt: "2026-08-03T09:00:00.000Z",
      price: 200,
    });

    expect(mergeQuoteCache([assetOne], [assetTwo])).toEqual([assetOne, assetTwo]);
  });
});
