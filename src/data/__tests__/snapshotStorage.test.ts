import { seedSnapshot } from "../seed";
import {
  readSnapshotFromStorage,
  readSnapshotResultFromStorage,
  SNAPSHOT_QUARANTINE_KEY,
  SNAPSHOT_SCHEMA_VERSION,
  SNAPSHOT_STORAGE_KEY,
  writeSnapshotToStorage,
  type SnapshotStorage,
} from "../snapshotStorage";

function memoryStorage(
  initial: string | null,
  options: { failMainWrites?: boolean; failReads?: boolean } = {},
) {
  const values = new Map<string, string>();
  if (initial !== null) {
    values.set(SNAPSHOT_STORAGE_KEY, initial);
  }
  const storage: SnapshotStorage = {
    getItem: jest.fn((key: string) => {
      if (options.failReads) {
        throw new Error("unavailable");
      }
      return values.get(key) ?? null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      if (options.failMainWrites && key === SNAPSHOT_STORAGE_KEY) {
        throw new Error("disk full");
      }
      values.set(key, value);
    }),
    removeItem: jest.fn((key: string) => values.delete(key)),
  };
  return { storage, values };
}

function currentEnvelope() {
  return JSON.stringify({
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    snapshot: seedSnapshot,
  });
}

describe("snapshot storage", () => {
  it("distinguishes a first run from a recovery fallback", () => {
    const { storage } = memoryStorage(null);

    expect(readSnapshotResultFromStorage(storage)).toEqual({
      status: "first_run",
      snapshot: seedSnapshot,
      recovery: null,
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("writes and reads the complete snapshot in the current versioned envelope", () => {
    const { storage, values } = memoryStorage(null);

    expect(writeSnapshotToStorage(storage, seedSnapshot)).toBe(true);
    expect(JSON.parse(values.get(SNAPSHOT_STORAGE_KEY)!)).toEqual({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      snapshot: seedSnapshot,
    });
    expect(readSnapshotResultFromStorage(storage)).toEqual({
      status: "ready",
      snapshot: seedSnapshot,
      recovery: null,
    });
  });

  it.each([
    ["unversioned", JSON.stringify({ ...seedSnapshot, hapticsEnabled: undefined })],
    [
      "schema v0",
      JSON.stringify({
        schemaVersion: 0,
        snapshot: { ...seedSnapshot, hapticsEnabled: undefined },
      }),
    ],
  ])("migrates a valid %s snapshot before returning it", (_label, stored) => {
    const { storage, values } = memoryStorage(stored);

    const result = readSnapshotResultFromStorage(storage);

    expect(result.status).toBe("ready");
    expect(result.snapshot.hapticsEnabled).toBe(true);
    expect(result.snapshot.goals).toHaveLength(seedSnapshot.goals.length);
    expect(result).toMatchObject({ migratedFrom: 0 });
    expect(JSON.parse(values.get(SNAPSHOT_STORAGE_KEY)!)).toEqual({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      snapshot: result.snapshot,
    });
  });

  it("keeps the original payload when an otherwise valid migration cannot be written", () => {
    const stored = JSON.stringify(seedSnapshot);
    const { storage, values } = memoryStorage(stored, { failMainWrites: true });

    const result = readSnapshotResultFromStorage(storage);

    expect(result).toMatchObject({
      status: "recovery",
      recovery: {
        reason: "migration_write_failed",
        rawPayload: stored,
        storedVersion: 0,
        quarantinePersisted: true,
      },
    });
    expect(values.get(SNAPSHOT_STORAGE_KEY)).toBe(stored);
    expect(JSON.parse(values.get(SNAPSHOT_QUARANTINE_KEY)!).rawPayload).toBe(stored);
  });

  it("quarantines malformed JSON without overwriting the original", () => {
    const stored = "{bad json";
    const { storage, values } = memoryStorage(stored);

    const result = readSnapshotResultFromStorage(storage);

    expect(result).toMatchObject({
      status: "recovery",
      snapshot: seedSnapshot,
      recovery: {
        reason: "malformed_json",
        rawPayload: stored,
        quarantinePersisted: true,
      },
    });
    expect(values.get(SNAPSHOT_STORAGE_KEY)).toBe(stored);
    expect(JSON.parse(values.get(SNAPSHOT_QUARANTINE_KEY)!).rawPayload).toBe(stored);
  });

  it("treats an empty persisted value as corruption rather than a first run", () => {
    const { storage, values } = memoryStorage("");

    const result = readSnapshotResultFromStorage(storage);

    expect(result).toMatchObject({
      status: "recovery",
      recovery: {
        reason: "malformed_json",
        rawPayload: "",
        quarantinePersisted: true,
      },
    });
    expect(values.get(SNAPSHOT_STORAGE_KEY)).toBe("");
  });

  it("quarantines future schema versions instead of attempting a downgrade", () => {
    const stored = JSON.stringify({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION + 1,
      snapshot: seedSnapshot,
    });
    const { storage, values } = memoryStorage(stored);

    const result = readSnapshotResultFromStorage(storage);

    expect(result).toMatchObject({
      status: "recovery",
      recovery: {
        reason: "unsupported_version",
        storedVersion: SNAPSHOT_SCHEMA_VERSION + 1,
      },
    });
    expect(values.get(SNAPSHOT_STORAGE_KEY)).toBe(stored);
  });

  it("quarantines partial collection corruption instead of silently dropping a row", () => {
    const stored = JSON.stringify({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      snapshot: {
        ...seedSnapshot,
        language: "zhHant",
        transactions: [
          seedSnapshot.transactions[0],
          { ...seedSnapshot.transactions[1], amount: "not-a-number" },
        ],
      },
    });
    const { storage, values } = memoryStorage(stored);

    const result = readSnapshotResultFromStorage(storage);

    expect(result.status).toBe("recovery");
    expect(result.snapshot.language).toBe("zhHant");
    expect(result.recovery).toMatchObject({
      reason: "partial_corruption",
      issues: ["transactions.1.invalid"],
    });
    expect(values.get(SNAPSHOT_STORAGE_KEY)).toBe(stored);
  });

  it("reports unavailable storage separately and does not invent a raw payload", () => {
    const { storage } = memoryStorage(currentEnvelope(), { failReads: true });

    expect(readSnapshotResultFromStorage(storage)).toMatchObject({
      status: "recovery",
      recovery: {
        reason: "storage_unavailable",
        rawPayload: null,
        quarantinePersisted: false,
      },
    });
  });

  it("reports persistence failure without throwing", () => {
    const { storage } = memoryStorage(null, { failMainWrites: true });

    expect(writeSnapshotToStorage(storage, seedSnapshot)).toBe(false);
  });

  it("keeps the compatibility reader returning the hydrated snapshot", () => {
    const { storage } = memoryStorage(currentEnvelope());

    expect(readSnapshotFromStorage(storage)).toEqual(seedSnapshot);
  });
});
