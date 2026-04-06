import { computed, ref, watch } from "vue";
import {
  createIdentityFromMnemonic,
  createMnemonicIdentity,
  parseIdentity,
  serializeIdentity,
  validateIdentity,
  type SerializedIdentity,
} from "@ternent/identity";
import { appConfig } from "@/app/config/app.config";
import type { RunProviderRegistry } from "@/modules/run/workspace/types";
import { useRunProviderRegistry } from "@/modules/run/workspace/useRunProviderRegistry";
import type {
  RunIdentityBootstrapCandidate,
  RunIdentityCreateMnemonicResult,
  RunIdentityProfile,
  RunIdentityRecord,
  RunIdentityService,
} from "./types";

type PersistedIdentityCatalog = {
  version: "1";
  activeIdentityId: string | null;
  identities: RunIdentityRecord[];
};

const catalogStorageKey = `${appConfig.appId}/run-identity-catalog/v1`;

let singleton: RunIdentityService | null = null;

function canUseBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown identity error.");
}

function defaultLabelForIdentity(identity: SerializedIdentity): string {
  return `Identity ${identity.keyId.slice(0, 8)}`;
}

function normalizeProfile(
  identity: SerializedIdentity,
  profile?: Partial<RunIdentityProfile>,
): RunIdentityProfile {
  return {
    label: String(profile?.label || "").trim() || defaultLabelForIdentity(identity),
    createdAt: String(profile?.createdAt || "").trim() || identity.createdAt,
  };
}

function createRecord(
  identity: SerializedIdentity,
  profile?: Partial<RunIdentityProfile>,
): RunIdentityRecord {
  return {
    id: identity.keyId,
    identity,
    profile: normalizeProfile(identity, profile),
  };
}

function loadPersistedCatalog(): PersistedIdentityCatalog {
  if (!canUseBrowser()) {
    return {
      version: "1",
      activeIdentityId: null,
      identities: [],
    };
  }

  try {
    const raw = localStorage.getItem(catalogStorageKey);
    if (!raw) {
      return {
        version: "1",
        activeIdentityId: null,
        identities: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedIdentityCatalog> | null;
    return {
      version: "1",
      activeIdentityId:
        parsed && typeof parsed.activeIdentityId === "string"
          ? parsed.activeIdentityId
          : null,
      identities: Array.isArray(parsed?.identities) ? parsed.identities : [],
    };
  } catch {
    return {
      version: "1",
      activeIdentityId: null,
      identities: [],
    };
  }
}

function persistCatalog(input: PersistedIdentityCatalog) {
  if (!canUseBrowser()) {
    return;
  }

  localStorage.setItem(catalogStorageKey, JSON.stringify(input));
}

async function validateRecord(input: RunIdentityRecord): Promise<RunIdentityRecord> {
  const identity = await validateIdentity(parseIdentity(input.identity));
  return createRecord(identity, input.profile);
}

export function createRunIdentityService(
  providerRegistry: RunProviderRegistry = useRunProviderRegistry(),
): RunIdentityService {
  const status = ref<"missing" | "loading" | "ready" | "error">("loading");
  const error = ref<string | null>(null);
  const identitiesState = ref<RunIdentityRecord[]>([]);
  const activeIdentityIdState = ref<string | null>(null);
  const bootstrapCandidatesState = ref<RunIdentityBootstrapCandidate[]>([]);
  let started = false;

  function persistCurrentCatalog() {
    persistCatalog({
      version: "1",
      activeIdentityId: activeIdentityIdState.value,
      identities: identitiesState.value,
    });
  }

  function syncActiveIdentityId() {
    if (
      activeIdentityIdState.value &&
      identitiesState.value.some((record) => record.id === activeIdentityIdState.value)
    ) {
      return;
    }

    activeIdentityIdState.value = identitiesState.value[0]?.id ?? null;
  }

  function updateStatusFromCatalog() {
    syncActiveIdentityId();
    status.value = activeIdentityIdState.value ? "ready" : "missing";
  }

  async function upsertIdentityRecord(
    identity: SerializedIdentity,
    profile?: Partial<RunIdentityProfile>,
  ) {
    const nextRecord = createRecord(identity, profile);
    const existingIndex = identitiesState.value.findIndex(
      (record) => record.identity.keyId === nextRecord.identity.keyId,
    );

    if (existingIndex >= 0) {
      const merged = identitiesState.value.slice();
      merged[existingIndex] = {
        ...merged[existingIndex],
        identity: nextRecord.identity,
        profile: {
          ...merged[existingIndex]!.profile,
          ...nextRecord.profile,
        },
      };
      identitiesState.value = merged;
      return merged[existingIndex]!;
    }

    identitiesState.value = [...identitiesState.value, nextRecord];
    return nextRecord;
  }

  async function loadLocalCatalog() {
    status.value = "loading";
    error.value = null;

    const persisted = loadPersistedCatalog();
    const nextIdentities: RunIdentityRecord[] = [];
    let rejectedEntries = 0;

    for (const record of persisted.identities) {
      try {
        nextIdentities.push(await validateRecord(record));
      } catch {
        rejectedEntries += 1;
      }
    }

    identitiesState.value = nextIdentities;
    activeIdentityIdState.value =
      nextIdentities.find((record) => record.id === persisted.activeIdentityId)?.id ??
      nextIdentities[0]?.id ??
      null;

    if (rejectedEntries > 0 && !nextIdentities.length) {
      error.value = "Stored identities were invalid and have been ignored.";
    }

    updateStatusFromCatalog();
    persistCurrentCatalog();
  }

  async function refreshBootstrapCandidates() {
    const nextCandidates: RunIdentityBootstrapCandidate[] = [];

    for (const providerRecord of providerRegistry.providers.value) {
      const provider = providerRecord.provider;
      if (!provider.listCachedIdentities) {
        continue;
      }

      try {
        const candidates = await provider.listCachedIdentities();
        nextCandidates.push(...candidates);
      } catch {
        continue;
      }
    }

    bootstrapCandidatesState.value = nextCandidates;
  }

  watch(
    () =>
      providerRegistry.providers.value
        .map((provider) => `${provider.id}:${provider.status}:${provider.error ?? ""}`)
        .join("|"),
    () => {
      if (!started) {
        return;
      }

      void refreshBootstrapCandidates();
    },
  );

  return {
    status: computed(() => status.value),
    error: computed(() => error.value),
    identities: computed(() => identitiesState.value),
    activeIdentityId: computed(() => activeIdentityIdState.value),
    activeIdentity: computed(
      () =>
        identitiesState.value.find((record) => record.id === activeIdentityIdState.value) ??
        null,
    ),
    bootstrapCandidates: computed(() => bootstrapCandidatesState.value),
    async init() {
      if (started) {
        return;
      }

      started = true;
      await loadLocalCatalog();
      await refreshBootstrapCandidates();
    },
    async createMnemonicIdentity(input = {}): Promise<RunIdentityCreateMnemonicResult> {
      error.value = null;
      const result = await createMnemonicIdentity({ words: input.words ?? 12 });
      const record = await upsertIdentityRecord(result.identity, {
        label: input.label,
        createdAt: result.identity.createdAt,
      });
      activeIdentityIdState.value = record.id;
      persistCurrentCatalog();
      updateStatusFromCatalog();
      return {
        record,
        mnemonic: result.mnemonic,
      };
    },
    async importMnemonic(input) {
      error.value = null;
      const identity = await validateIdentity(
        await createIdentityFromMnemonic({
          mnemonic: input.mnemonic,
          passphrase: input.passphrase,
        }),
      );
      const record = await upsertIdentityRecord(identity, {
        label: input.label,
        createdAt: identity.createdAt,
      });
      activeIdentityIdState.value = record.id;
      persistCurrentCatalog();
      updateStatusFromCatalog();
      return record;
    },
    async importSerializedIdentity(input) {
      error.value = null;
      const identity = await validateIdentity(parseIdentity(input.serializedIdentity));
      const record = await upsertIdentityRecord(identity, {
        label: input.label,
        createdAt: identity.createdAt,
      });
      activeIdentityIdState.value = record.id;
      persistCurrentCatalog();
      updateStatusFromCatalog();
      return record;
    },
    async setActiveIdentity(identityId: string) {
      const nextRecord =
        identitiesState.value.find((record) => record.id === identityId) ?? null;
      if (!nextRecord) {
        throw new Error(`Identity not found: ${identityId}`);
      }

      activeIdentityIdState.value = nextRecord.id;
      persistCurrentCatalog();
      updateStatusFromCatalog();
      return nextRecord;
    },
    async removeIdentity(identityId: string) {
      const record = identitiesState.value.find((item) => item.id === identityId) ?? null;
      if (!record) {
        return;
      }

      const isActive = activeIdentityIdState.value === identityId;
      if (isActive && identitiesState.value.length > 1) {
        throw new Error(
          "Select a different active identity before removing the current identity.",
        );
      }

      identitiesState.value = identitiesState.value.filter((item) => item.id !== identityId);
      if (isActive) {
        activeIdentityIdState.value = identitiesState.value[0]?.id ?? null;
      }
      persistCurrentCatalog();
      updateStatusFromCatalog();
    },
    async exportIdentity(identityId?: string) {
      const record =
        identitiesState.value.find((item) => item.id === (identityId ?? activeIdentityIdState.value)) ??
        null;
      if (!record) {
        throw new Error("No identity is available to export.");
      }

      return serializeIdentity(record.identity);
    },
    async syncIdentityToProvider(providerId: string, identityId?: string) {
      const provider = providerRegistry.getProvider(providerId);
      const record =
        identitiesState.value.find((item) => item.id === (identityId ?? activeIdentityIdState.value)) ??
        null;

      if (!provider?.writeCachedIdentity) {
        throw new Error(`Provider ${providerId} does not support identity caching.`);
      }

      if (!record) {
        throw new Error("No identity is available to sync.");
      }

      await provider.writeCachedIdentity(record);
      await refreshBootstrapCandidates();
    },
    async adoptBootstrapCandidate(candidateId: string) {
      const candidate =
        bootstrapCandidatesState.value.find((item) => item.id === candidateId) ?? null;
      if (!candidate) {
        throw new Error(`Bootstrap candidate not found: ${candidateId}`);
      }
      if (!candidate.valid) {
        throw new Error(candidate.error || "Bootstrap candidate is invalid.");
      }

      const provider = providerRegistry.getProvider(candidate.providerId);
      if (!provider?.readCachedIdentity) {
        throw new Error(
          `Provider ${candidate.providerId} does not support cached identity recovery.`,
        );
      }

      const record = await provider.readCachedIdentity(candidate.cacheId);
      if (!record) {
        throw new Error("Provider identity cache entry could not be loaded.");
      }

      const validated = await upsertIdentityRecord(record.identity, record.profile);
      activeIdentityIdState.value = validated.id;
      persistCurrentCatalog();
      updateStatusFromCatalog();
      return validated;
    },
    refreshBootstrapCandidates,
  };
}

export function useRunIdentityService(): RunIdentityService {
  if (!singleton) {
    singleton = createRunIdentityService();
  }

  return singleton;
}
