import { createIdentity, parseIdentity, type SerializedIdentity } from "@ternent/identity";
import type { LocalStorageLike } from "./storage";

export const DEFAULT_IDENTITY_STORAGE_KEY = "solid/v2/concord/identity/v1";

function createMemoryStorage(): LocalStorageLike {
  const records = new Map<string, string>();
  return {
    getItem(key) {
      return records.get(key) ?? null;
    },
    setItem(key, value) {
      records.set(key, value);
    },
    removeItem(key) {
      records.delete(key);
    },
  };
}

export function resolveIdentityStorage(storage?: LocalStorageLike): LocalStorageLike {
  if (storage) {
    return storage;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return createMemoryStorage();
}

export type ActiveIdentity = {
  identityId: string;
  label: string;
  identity: SerializedIdentity;
};

function formatIdentityLabel(identity: SerializedIdentity): string {
  const suffix = identity.keyId.slice(-8);
  return `User ${suffix}`;
}

/**
 * Resolves a persisted Concord identity, creating and storing one when missing.
 */
export async function resolvePersistedIdentity(options?: {
  storage?: LocalStorageLike;
  storageKey?: string;
}): Promise<ActiveIdentity> {
  const storage = resolveIdentityStorage(options?.storage);
  const storageKey = options?.storageKey ?? DEFAULT_IDENTITY_STORAGE_KEY;

  const raw = storage.getItem(storageKey);
  if (raw) {
    try {
      const parsed = parseIdentity(raw);
      return {
        identityId: parsed.keyId,
        label: formatIdentityLabel(parsed),
        identity: parsed,
      };
    } catch {
      storage.removeItem(storageKey);
    }
  }

  const created = await createIdentity();
  storage.setItem(storageKey, JSON.stringify(created));

  return {
    identityId: created.keyId,
    label: formatIdentityLabel(created),
    identity: created,
  };
}
