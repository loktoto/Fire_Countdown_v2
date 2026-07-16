import { seedSnapshot } from "../seed";
import {
  readSnapshotFromStorage,
  SNAPSHOT_STORAGE_KEY,
  writeSnapshotToStorage,
  type SnapshotStorage,
} from "../snapshotStorage";

function storageWith(value: string | null): SnapshotStorage {
  return {
    getItem: jest.fn(() => value),
    setItem: jest.fn(),
  };
}

describe("snapshot storage", () => {
  it("falls back safely when storage throws or contains invalid JSON", () => {
    const throwingStorage: SnapshotStorage = {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: jest.fn(),
    };

    expect(readSnapshotFromStorage(throwingStorage)).toBe(seedSnapshot);
    expect(readSnapshotFromStorage(storageWith("{bad json"))).toBe(seedSnapshot);
  });

  it("hydrates a stored snapshot before returning it", () => {
    const snapshot = readSnapshotFromStorage(
      storageWith(JSON.stringify({ ...seedSnapshot, hapticsEnabled: undefined })),
    );

    expect(snapshot.hapticsEnabled).toBe(true);
    expect(snapshot.goals).toHaveLength(seedSnapshot.goals.length);
  });

  it("reports persistence failure without throwing", () => {
    const storage: SnapshotStorage = {
      getItem: jest.fn(() => null),
      setItem: () => {
        throw new Error("disk full");
      },
    };

    expect(writeSnapshotToStorage(storage, seedSnapshot)).toBe(false);
  });

  it("writes the complete snapshot to the stable storage key", () => {
    const storage = storageWith(null);
    expect(writeSnapshotToStorage(storage, seedSnapshot)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      SNAPSHOT_STORAGE_KEY,
      JSON.stringify(seedSnapshot),
    );
  });
});
