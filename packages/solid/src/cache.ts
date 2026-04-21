import {
  parseIdentity,
  validateIdentity,
  type SerializedIdentity,
} from "@ternent/identity";
import {
  createSolidEncryptedIdentityBlob,
  getSolidWebId,
  isSolidEncryptedIdentityBlob,
  resolveSolidIdentityUnlocker,
  restoreSolidIdentityFromEncryptedBlob,
  serializeSolidEncryptedIdentityBlob,
} from "./identity.js";
import type {
  CreateSolidIdentityCacheOptions,
  SolidIdentityCacheLike,
  SolidIdentityCacheStorageLike,
} from "./types.js";

const DEFAULT_CACHE_NAMESPACE = "@ternent/solid/cache/v2";

function resolveStorage(
  storage?: SolidIdentityCacheStorageLike,
): SolidIdentityCacheStorageLike {
  if (storage) {
    return storage;
  }

  if (typeof localStorage !== "undefined") {
    return localStorage;
  }

  throw new Error(
    "Solid identity cache requires a storage adapter or browser localStorage.",
  );
}

function resolveCacheKey(input: CreateSolidIdentityCacheOptions): string {
  const explicitKey = String(input.key || "").trim();
  if (explicitKey) {
    return explicitKey;
  }

  const namespace = String(input.namespace || DEFAULT_CACHE_NAMESPACE).trim();
  const webId = input.webId
    ? String(input.webId).trim()
    : input.session
      ? getSolidWebId(input.session)
      : "";

  if (!webId) {
    throw new Error(
      "Solid identity cache requires either a key, webId, or session with a WebID.",
    );
  }

  return `${namespace}:${webId}`;
}

export function createSolidIdentityCache(
  input: CreateSolidIdentityCacheOptions = {},
): SolidIdentityCacheLike {
  const storage = resolveStorage(input.storage);
  const key = resolveCacheKey(input);
  const expectedWebId = input.webId
    ? String(input.webId).trim()
    : input.session?.info?.webId
      ? String(input.session.info.webId).trim()
      : undefined;
  const unlocker = resolveSolidIdentityUnlocker(input.unlocker);

  return {
    name: "solid-identity-cache",
    key,
    async load(): Promise<SerializedIdentity | null> {
      const raw = storage.getItem(key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!isSolidEncryptedIdentityBlob(parsed)) {
        throw new Error(
          `Solid identity cache entry ${key} is not a ternent-solid-encrypted-identity v2 blob.`,
        );
      }
      try {
        return await restoreSolidIdentityFromEncryptedBlob({
          blob: parsed,
          unlocker,
          expectedWebId,
          storage: "local-cache",
          cacheKey: key,
        });
      } catch (error) {
        if (typeof console !== "undefined" && typeof console.warn === "function") {
          console.warn(
            `[ternent/solid] Failed to decrypt cached identity for ${key}: ${String(error)}`,
          );
        }
        throw error;
      }
    },
    async save(identity: SerializedIdentity): Promise<void> {
      const validated = await validateIdentity(parseIdentity(identity));
      const blob = await createSolidEncryptedIdentityBlob({
        identity: validated,
        unlocker,
        webId: expectedWebId ?? null,
        storage: "local-cache",
        cacheKey: key,
      });
      storage.setItem(key, serializeSolidEncryptedIdentityBlob(blob, false).trimEnd());
    },
    async clear(): Promise<void> {
      storage.removeItem(key);
    },
  };
}
