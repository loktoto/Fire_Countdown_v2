import { hydrateSnapshotPreferences } from "../snapshotPreferences";
import { seedSnapshot } from "../seed";

describe("hydrateSnapshotPreferences", () => {
  it("gives existing snapshots the default FIRE companion", () => {
    expect(hydrateSnapshotPreferences({ currency: "HKD" }).fireCompanionId).toBe("traveler_m");
  });

  it("preserves the selected FIRE companion", () => {
    expect(hydrateSnapshotPreferences({ fireCompanionId: "traveler_f" }).fireCompanionId).toBe(
      "traveler_f",
    );
  });

  it("migrates retired companion choices to the default person", () => {
    expect(hydrateSnapshotPreferences({ fireCompanionId: "robot" as never }).fireCompanionId).toBe(
      "traveler_m",
    );
  });

  it("hydrates and preserves FIRE destinations", () => {
    expect(hydrateSnapshotPreferences({}).fireDestinationId).toBe("camp");
    expect(hydrateSnapshotPreferences({ fireDestinationId: "beach" }).fireDestinationId).toBe(
      "beach",
    );
  });

  it("repairs malformed collection shapes before screens or selectors receive them", () => {
    const hydrated = hydrateSnapshotPreferences({
      transactions: "not-an-array" as unknown as [],
      goals: [],
      quoteSettings: null as unknown as never,
    });

    expect(Array.isArray(hydrated.transactions)).toBe(true);
    expect(hydrated.transactions).toEqual(expect.any(Array));
    expect(hydrated.goals.length).toBeGreaterThan(0);
    expect(hydrated.quoteSettings.id).toBe("quote-settings");
  });

  it("drops malformed entries while preserving valid user entries", () => {
    const hydrated = hydrateSnapshotPreferences({
      transactions: [
        {
          id: "bad",
          amount: Number.NaN,
        },
        {
          id: "valid",
          amount: 25,
          type: "expense",
          currency: "HKD",
          categoryId: "cat-food",
          date: "2026-07-14",
          createdAt: "2026-07-14T00:00:00.000Z",
          updatedAt: "2026-07-14T00:00:00.000Z",
        },
      ] as never,
    });

    expect(hydrated.transactions.map((transaction) => transaction.id)).toEqual(["valid"]);
  });

  it("normalizes supported currencies and rejects invalid preference values", () => {
    expect(hydrateSnapshotPreferences({ currency: " usd " }).currency).toBe("USD");
    expect(
      hydrateSnapshotPreferences({
        currency: "invalid",
        fireCompanionId: "unknown" as never,
        language: "unsupported" as never,
      }),
    ).toMatchObject({ currency: "HKD", fireCompanionId: "traveler_m", language: "en" });
  });

  it("migrates legacy quote settings to the right provider", () => {
    const legacySettings = {
      ...seedSnapshot.quoteSettings,
      provider: undefined,
    };

    expect(
      hydrateSnapshotPreferences({ quoteSettings: legacySettings as never }).quoteSettings.provider,
    ).toBe("free_market");
    expect(
      hydrateSnapshotPreferences({
        quoteSettings: {
          ...legacySettings,
          scriptUrl: "https://script.google.com/macros/s/example/exec",
        } as never,
      }).quoteSettings.provider,
    ).toBe("custom_bridge");
  });

  it("migrates the retired keyed provider to free quotes", () => {
    expect(
      hydrateSnapshotPreferences({
        quoteSettings: {
          ...seedSnapshot.quoteSettings,
          provider: "twelve_data",
        } as never,
      }).quoteSettings.provider,
    ).toBe("free_market");
  });
});
