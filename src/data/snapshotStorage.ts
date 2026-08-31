import { seedSnapshot } from "./seed";
import { hydrateSnapshotPreferences, snapshotIntegrityIssues } from "./snapshotPreferences";
import type { FireSnapshot } from "../features/types";

export const SNAPSHOT_STORAGE_KEY = "fire-countdown-v2:snapshot";
export const SNAPSHOT_QUARANTINE_KEY = "fire-countdown-v2:snapshot:quarantine";
export const SNAPSHOT_SCHEMA_VERSION = 1;

export type SnapshotStorage = Pick<Storage, "getItem" | "setItem"> &
  Partial<Pick<Storage, "removeItem">>;

export type SnapshotRecoveryReason =
  | "malformed_json"
  | "partial_corruption"
  | "unsupported_version"
  | "migration_write_failed"
  | "storage_unavailable";

export type SnapshotRecovery = {
  reason: SnapshotRecoveryReason;
  rawPayload: string | null;
  storedVersion: number | null;
  quarantinePersisted: boolean;
  issues: string[];
};

export type SnapshotReadResult =
  | { status: "first_run"; snapshot: FireSnapshot; recovery: null }
  | { status: "ready"; snapshot: FireSnapshot; recovery: null; migratedFrom?: number }
  | { status: "recovery"; snapshot: FireSnapshot; recovery: SnapshotRecovery };

type SnapshotEnvelope = {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  snapshot: FireSnapshot;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function envelopeFor(snapshot: FireSnapshot): SnapshotEnvelope {
  return { schemaVersion: SNAPSHOT_SCHEMA_VERSION, snapshot };
}

function fallbackSnapshot(parsed?: unknown): FireSnapshot {
  const candidate =
    isRecord(parsed) && isRecord(parsed.snapshot)
      ? parsed.snapshot
      : isRecord(parsed)
        ? parsed
        : null;
  return candidate?.language === "zhHant" ? { ...seedSnapshot, language: "zhHant" } : seedSnapshot;
}

export function quarantineRawSnapshot(storage: SnapshotStorage, rawPayload: string) {
  try {
    storage.setItem(
      SNAPSHOT_QUARANTINE_KEY,
      JSON.stringify({
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        capturedAt: new Date().toISOString(),
        rawPayload,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearSnapshotQuarantine(storage: SnapshotStorage) {
  try {
    if (storage.removeItem) {
      storage.removeItem(SNAPSHOT_QUARANTINE_KEY);
    } else {
      storage.setItem(SNAPSHOT_QUARANTINE_KEY, "");
    }
    return true;
  } catch {
    return false;
  }
}

function recoveryResult({
  storage,
  rawPayload,
  parsed,
  reason,
  storedVersion = null,
  issues = [],
}: {
  storage: SnapshotStorage;
  rawPayload: string | null;
  parsed?: unknown;
  reason: SnapshotRecoveryReason;
  storedVersion?: number | null;
  issues?: string[];
}): SnapshotReadResult {
  return {
    status: "recovery",
    snapshot: fallbackSnapshot(parsed),
    recovery: {
      reason,
      rawPayload,
      storedVersion,
      quarantinePersisted: rawPayload === null ? false : quarantineRawSnapshot(storage, rawPayload),
      issues,
    },
  };
}

function migrateLegacySnapshot(payload: unknown) {
  const issues = snapshotIntegrityIssues(payload, "legacy");
  if (issues.length > 0 || !isRecord(payload)) {
    return { snapshot: null, issues } as const;
  }
  return {
    snapshot: hydrateSnapshotPreferences(payload as Partial<FireSnapshot>),
    issues: [] as string[],
  } as const;
}

export function readSnapshotResultFromStorage(storage: SnapshotStorage): SnapshotReadResult {
  let stored: string | null;
  try {
    stored = storage.getItem(SNAPSHOT_STORAGE_KEY);
  } catch {
    return recoveryResult({
      storage,
      rawPayload: null,
      reason: "storage_unavailable",
      issues: ["snapshot.read_failed"],
    });
  }

  if (stored === null) {
    return { status: "first_run", snapshot: seedSnapshot, recovery: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return recoveryResult({
      storage,
      rawPayload: stored,
      reason: "malformed_json",
      issues: ["snapshot.invalid_json"],
    });
  }

  if (!isRecord(parsed)) {
    return recoveryResult({
      storage,
      rawPayload: stored,
      parsed,
      reason: "partial_corruption",
      issues: ["snapshot.not_object"],
    });
  }

  if (Object.prototype.hasOwnProperty.call(parsed, "schemaVersion")) {
    const storedVersion = parsed.schemaVersion;
    if (!Number.isInteger(storedVersion) || Number(storedVersion) < 0) {
      return recoveryResult({
        storage,
        rawPayload: stored,
        parsed,
        reason: "unsupported_version",
        issues: ["snapshot.schema_version_invalid"],
      });
    }

    if (storedVersion === SNAPSHOT_SCHEMA_VERSION) {
      const issues = snapshotIntegrityIssues(parsed.snapshot, "current");
      if (issues.length > 0 || !isRecord(parsed.snapshot)) {
        return recoveryResult({
          storage,
          rawPayload: stored,
          parsed,
          reason: "partial_corruption",
          storedVersion: Number(storedVersion),
          issues,
        });
      }
      return {
        status: "ready",
        snapshot: hydrateSnapshotPreferences(parsed.snapshot as Partial<FireSnapshot>),
        recovery: null,
      };
    }

    if (storedVersion !== 0) {
      return recoveryResult({
        storage,
        rawPayload: stored,
        parsed,
        reason: "unsupported_version",
        storedVersion: Number(storedVersion),
        issues: ["snapshot.schema_version_unsupported"],
      });
    }

    const migration = migrateLegacySnapshot(parsed.snapshot);
    if (!migration.snapshot) {
      return recoveryResult({
        storage,
        rawPayload: stored,
        parsed,
        reason: "partial_corruption",
        storedVersion: 0,
        issues: migration.issues,
      });
    }
    if (!writeSnapshotToStorage(storage, migration.snapshot)) {
      return recoveryResult({
        storage,
        rawPayload: stored,
        parsed,
        reason: "migration_write_failed",
        storedVersion: 0,
        issues: ["snapshot.migration_write_failed"],
      });
    }
    return { status: "ready", snapshot: migration.snapshot, recovery: null, migratedFrom: 0 };
  }

  const migration = migrateLegacySnapshot(parsed);
  if (!migration.snapshot) {
    return recoveryResult({
      storage,
      rawPayload: stored,
      parsed,
      reason: "partial_corruption",
      storedVersion: 0,
      issues: migration.issues,
    });
  }
  if (!writeSnapshotToStorage(storage, migration.snapshot)) {
    return recoveryResult({
      storage,
      rawPayload: stored,
      parsed,
      reason: "migration_write_failed",
      storedVersion: 0,
      issues: ["snapshot.migration_write_failed"],
    });
  }
  return { status: "ready", snapshot: migration.snapshot, recovery: null, migratedFrom: 0 };
}

export function readSnapshotFromStorage(storage: SnapshotStorage): FireSnapshot {
  return readSnapshotResultFromStorage(storage).snapshot;
}

export function writeSnapshotToStorage(storage: SnapshotStorage, snapshot: FireSnapshot) {
  try {
    storage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(envelopeFor(snapshot)));
    return true;
  } catch {
    return false;
  }
}
