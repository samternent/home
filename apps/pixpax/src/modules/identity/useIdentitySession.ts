import { computed, ref, type ComputedRef } from "vue";
import { parseIdentity, type SerializedIdentity } from "@ternent/identity";
import { appConfig } from "@/app/config/app.config";

export type StoredIdentity = {
  id: string;
  displayName?: string;
  fingerprint: string;
  serializedIdentity: SerializedIdentity;
  managedUserId?: string | null;
};

export type IdentitySession = {
  identity: ComputedRef<StoredIdentity | null>;
  identities: ComputedRef<StoredIdentity[]>;
  hasIdentity: ComputedRef<boolean>;
  activeIdentityId: ComputedRef<string>;
  setIdentity: (
    next: StoredIdentity,
    options?: {
      makeActive?: boolean;
    },
  ) => void;
  setActiveIdentity: (identityId: string) => void;
  updateIdentity: (identityId: string, patch: Partial<StoredIdentity>) => void;
  removeIdentity: (identityId: string) => void;
  clearIdentity: () => void;
};

export const identityStorageKey = `${appConfig.appId}/identity`;
export const identityDirectoryStorageKey = `${appConfig.appId}/identities`;
type StoredIdentityDirectory = {
  activeIdentityId: string;
  identities: StoredIdentity[];
};

const state = ref<StoredIdentityDirectory>({
  activeIdentityId: "",
  identities: [],
});
let hydrated = false;
let storageListenerAttached = false;

function normalizeStoredIdentity(value: StoredIdentity | null): StoredIdentity | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (typeof value.id !== "string" || typeof value.fingerprint !== "string") {
    return null;
  }

  try {
    return {
      id: value.id,
      ...(typeof value.displayName === "string" && value.displayName.trim()
        ? { displayName: value.displayName.trim() }
        : {}),
      fingerprint: value.fingerprint,
      serializedIdentity: parseIdentity(value.serializedIdentity),
      ...(typeof value.managedUserId === "string" || value.managedUserId === null
        ? { managedUserId: value.managedUserId ? String(value.managedUserId).trim() : null }
        : {}),
    };
  } catch {
    return null;
  }
}

function normalizeStoredIdentityDirectory(
  value: StoredIdentityDirectory | null,
): StoredIdentityDirectory {
  const normalizedIdentities = Array.isArray(value?.identities)
    ? value.identities
        .map((entry) => normalizeStoredIdentity(entry))
        .filter((entry): entry is StoredIdentity => Boolean(entry))
    : [];
  const activeIdentityId = String(value?.activeIdentityId || "").trim();
  const resolvedActiveIdentityId =
    normalizedIdentities.find((entry) => entry.id === activeIdentityId)?.id ||
    normalizedIdentities[0]?.id ||
    "";
  return {
    activeIdentityId: resolvedActiveIdentityId,
    identities: normalizedIdentities,
  };
}

function readStoredIdentityDirectoryFromBrowser(): StoredIdentityDirectory {
  if (typeof window === "undefined") {
    return {
      activeIdentityId: "",
      identities: [],
    };
  }

  const directoryRaw = window.localStorage.getItem(identityDirectoryStorageKey);
  if (directoryRaw) {
    try {
      return normalizeStoredIdentityDirectory(
        JSON.parse(directoryRaw) as StoredIdentityDirectory | null,
      );
    } catch {
      window.localStorage.removeItem(identityDirectoryStorageKey);
    }
  }

  const legacyRaw = window.localStorage.getItem(identityStorageKey);
  if (!legacyRaw) {
    return {
      activeIdentityId: "",
      identities: [],
    };
  }

  try {
    const normalizedLegacy = normalizeStoredIdentity(JSON.parse(legacyRaw) as StoredIdentity | null);
    const migrated = normalizeStoredIdentityDirectory({
      activeIdentityId: normalizedLegacy?.id || "",
      identities: normalizedLegacy ? [normalizedLegacy] : [],
    });
    window.localStorage.setItem(identityDirectoryStorageKey, JSON.stringify(migrated));
    window.localStorage.removeItem(identityStorageKey);
    return migrated;
  } catch {
    window.localStorage.removeItem(identityStorageKey);
    return {
      activeIdentityId: "",
      identities: [],
    };
  }
}

function writeStoredIdentityDirectoryToBrowser(next: StoredIdentityDirectory) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeStoredIdentityDirectory(next);
  window.localStorage.setItem(identityDirectoryStorageKey, JSON.stringify(normalized));
  window.localStorage.removeItem(identityStorageKey);
}

function ensureHydrated() {
  if (typeof window === "undefined") {
    return;
  }

  if (!hydrated) {
    state.value = readStoredIdentityDirectoryFromBrowser();
    hydrated = true;
  }

  if (!storageListenerAttached) {
    window.addEventListener("storage", (event) => {
      if (event.key === identityStorageKey || event.key === identityDirectoryStorageKey) {
        state.value = readStoredIdentityDirectoryFromBrowser();
      }
    });
    storageListenerAttached = true;
  }
}

export function useIdentitySession(): IdentitySession {
  ensureHydrated();

  const identities = computed(() =>
    normalizeStoredIdentityDirectory(state.value).identities,
  );
  const activeIdentityId = computed(() =>
    normalizeStoredIdentityDirectory(state.value).activeIdentityId,
  );
  const identity = computed(
    () =>
      identities.value.find((entry) => entry.id === activeIdentityId.value) ||
      identities.value[0] ||
      null,
  );
  const hasIdentity = computed(() => Boolean(identity.value));

  const setIdentity = (
    next: StoredIdentity,
    options: {
      makeActive?: boolean;
    } = {},
  ) => {
    const normalized = normalizeStoredIdentity(next);
    if (!normalized) {
      return;
    }

    const existing = identities.value.filter((entry) => entry.id !== normalized.id);
    const nextDirectory = normalizeStoredIdentityDirectory({
      activeIdentityId:
        options.makeActive === false
          ? activeIdentityId.value || normalized.id
          : normalized.id,
      identities: [...existing, normalized],
    });
    state.value = nextDirectory;
    writeStoredIdentityDirectoryToBrowser(nextDirectory);
  };

  const setActiveIdentity = (identityId: string) => {
    const resolvedIdentityId = String(identityId || "").trim();
    if (!resolvedIdentityId) {
      return;
    }
    const nextDirectory = normalizeStoredIdentityDirectory({
      activeIdentityId: resolvedIdentityId,
      identities: identities.value,
    });
    state.value = nextDirectory;
    writeStoredIdentityDirectoryToBrowser(nextDirectory);
  };

  const updateIdentity = (identityId: string, patch: Partial<StoredIdentity>) => {
    const resolvedIdentityId = String(identityId || "").trim();
    if (!resolvedIdentityId) {
      return;
    }
    const nextIdentities = identities.value.map((entry) => {
      if (entry.id !== resolvedIdentityId) {
        return entry;
      }
      return normalizeStoredIdentity({
        ...entry,
        ...patch,
        id: entry.id,
        serializedIdentity: patch.serializedIdentity || entry.serializedIdentity,
      }) || entry;
    });
    const nextDirectory = normalizeStoredIdentityDirectory({
      activeIdentityId: activeIdentityId.value,
      identities: nextIdentities,
    });
    state.value = nextDirectory;
    writeStoredIdentityDirectoryToBrowser(nextDirectory);
  };

  const removeIdentity = (identityId: string) => {
    const resolvedIdentityId = String(identityId || "").trim();
    if (!resolvedIdentityId) {
      return;
    }
    const nextIdentities = identities.value.filter((entry) => entry.id !== resolvedIdentityId);
    const nextDirectory = normalizeStoredIdentityDirectory({
      activeIdentityId:
        activeIdentityId.value === resolvedIdentityId
          ? nextIdentities[0]?.id || ""
          : activeIdentityId.value,
      identities: nextIdentities,
    });
    state.value = nextDirectory;
    writeStoredIdentityDirectoryToBrowser(nextDirectory);
  };

  const clearIdentity = () => {
    if (identity.value) {
      removeIdentity(identity.value.id);
      return;
    }
    state.value = {
      activeIdentityId: "",
      identities: [],
    };
    writeStoredIdentityDirectoryToBrowser(state.value);
  };

  return {
    identity,
    identities,
    hasIdentity,
    activeIdentityId,
    setIdentity,
    setActiveIdentity,
    updateIdentity,
    removeIdentity,
    clearIdentity,
  };
}
