import {
  parseIdentity,
  serializeIdentity,
  validateIdentity,
  type SerializedIdentity,
} from "@ternent/identity";
import {
  getSolidWebId,
} from "./identity.js";
import type {
  CreateSolidIdentityCacheOptions,
  SolidIdentityCacheLike,
  SolidIdentityCacheStorageLike,
} from "./types.js";

const DEFAULT_CACHE_NAMESPACE = "@ternent/solid/cache/v1";

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

  return {
    name: "solid-identity-cache",
    key,
    async load(): Promise<SerializedIdentity | null> {
      const raw = storage.getItem(key);
      if (!raw) {
        return null;
      }
      return await validateIdentity(parseIdentity(raw));
    },
    async save(identity: SerializedIdentity): Promise<void> {
      const validated = await validateIdentity(parseIdentity(identity));
      storage.setItem(key, serializeIdentity(validated, false));
    },
    async clear(): Promise<void> {
      storage.removeItem(key);
    },
  };
}
