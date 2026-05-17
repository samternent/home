import type {
  LedgerContainer,
  LedgerPersistenceSnapshot,
  LedgerStorageAdapter,
} from "@ternent/ledger";
import type { CreateSolidStorageOptions, SolidSessionLike } from "./types.js";
import { createSolidJsonResource } from "./resource.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLedgerContainer(value: unknown): value is LedgerContainer {
  return (
    isRecord(value) &&
    value.format === "concord-ledger" &&
    value.version === "1" &&
    isRecord(value.commits) &&
    isRecord(value.entries) &&
    typeof value.head === "string"
  );
}

function isPersistenceSnapshot(value: unknown): value is LedgerPersistenceSnapshot {
  return (
    isRecord(value) &&
    "staged" in value &&
    Array.isArray(value.staged) &&
    (value.container === null ||
      value.container === undefined ||
      isLedgerContainer(value.container))
  );
}

function coerceSnapshot(value: unknown): LedgerPersistenceSnapshot {
  if (isPersistenceSnapshot(value)) {
    return {
      container: value.container ?? null,
      staged: value.staged,
    };
  }

  if (isLedgerContainer(value)) {
    return {
      container: value,
      staged: [],
    };
  }

  throw new Error(
    "Solid storage payload must be a Concord ledger snapshot or a concord-ledger container.",
  );
}

export function createSolidStorage(
  session: SolidSessionLike,
  url: string,
  options: CreateSolidStorageOptions = {},
): LedgerStorageAdapter {
  return createSolidJsonResource<LedgerPersistenceSnapshot>({
    session,
    url,
    name: "solid-ledger",
    contentType: options.contentType,
    coerce: coerceSnapshot,
  });
}
