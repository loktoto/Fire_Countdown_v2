import { seedSnapshot } from "./seed";
import { hydrateSnapshotPreferences } from "./snapshotPreferences";
import type { FireSnapshot } from "../features/types";

export const SNAPSHOT_STORAGE_KEY = "fire-countdown-v2:snapshot";

export type SnapshotStorage = Pick<Storage, "getItem" | "setItem">;

export function readSnapshotFromStorage(storage: SnapshotStorage): FireSnapshot {
  try {
    const stored = storage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!stored) {
      return seedSnapshot;
    }

    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return seedSnapshot;
    }

    return hydrateSnapshotPreferences(parsed as Partial<FireSnapshot>);
  } catch {
    return seedSnapshot;
  }
}

export function writeSnapshotToStorage(storage: SnapshotStorage, snapshot: FireSnapshot) {
  try {
    storage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}
