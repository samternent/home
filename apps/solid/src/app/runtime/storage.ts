import type { LedgerContainer, LedgerEntryRecord, LedgerStorageAdapter } from "@ternent/ledger";

export type LocalStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const DEFAULT_CONCORD_STORAGE_KEY = "solid/v2/concord/storage/v1";

function createMemoryStorage(): LocalStorageLike {
  const map = new Map<string, string>();
  return {
    getItem(key) {
      return map.get(key) ?? null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

function resolveStorage(storage?: LocalStorageLike): LocalStorageLike {
  if (storage) {
    return storage;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return createMemoryStorage();
}

function isLedgerContainer(value: unknown): value is LedgerContainer {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.format === "concord-ledger" &&
    candidate.version === "1" &&
    typeof candidate.commits === "object" &&
    candidate.commits !== null &&
    typeof candidate.entries === "object" &&
    candidate.entries !== null &&
    typeof candidate.head === "string"
  );
}

function isEntryRecord(value: unknown): value is LedgerEntryRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.entryId === "string" &&
    typeof candidate.kind === "string" &&
    typeof candidate.authoredAt === "string" &&
    typeof candidate.author === "string" &&
    typeof candidate.payload === "object" &&
    candidate.payload !== null &&
    typeof candidate.seal === "object" &&
    candidate.seal !== null
  );
}

export function createConcordLocalStorageAdapter(options?: {
  storage?: LocalStorageLike;
  storageKey?: string;
}): LedgerStorageAdapter {
  const storage = resolveStorage(options?.storage);
  const storageKey = options?.storageKey ?? DEFAULT_CONCORD_STORAGE_KEY;

  return {
    name: "solid-v2-local",
    async load() {
      const raw = storage.getItem(storageKey);
      if (!raw) {
        return null;
      }

      try {
        const parsed = JSON.parse(raw) as {
          container?: unknown;
          staged?: unknown;
        };

        if (!isLedgerContainer(parsed.container)) {
          return null;
        }

        const staged = Array.isArray(parsed.staged) ? parsed.staged.filter(isEntryRecord) : [];

        return {
          container: parsed.container,
          staged,
        };
      } catch {
        return null;
      }
    },
    async save(snapshot) {
      storage.setItem(storageKey, JSON.stringify(snapshot));
    },
    async clear() {
      storage.removeItem(storageKey);
    },
  };
}
