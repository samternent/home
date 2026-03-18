import { computed, type ComputedRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { parseIdentity, type SerializedIdentity } from "@ternent/identity";
import { appConfig } from "@/app/config/app.config";

export type StoredIdentity = {
  id: string;
  fingerprint: string;
  serializedIdentity: SerializedIdentity;
};

export type IdentitySession = {
  identity: ComputedRef<StoredIdentity | null>;
  hasIdentity: ComputedRef<boolean>;
  setIdentity: (next: StoredIdentity) => void;
  clearIdentity: () => void;
};

export const identityStorageKey = `${appConfig.appId}/identity`;

const state = useLocalStorage<StoredIdentity | null>(identityStorageKey, null);

function normalizeStoredIdentity(
  value: StoredIdentity | null,
): StoredIdentity | null {
  if (!value || typeof value !== "object") return null;
  if (typeof value.id !== "string" || typeof value.fingerprint !== "string") {
    return null;
  }

  try {
    return {
      id: value.id,
      fingerprint: value.fingerprint,
      serializedIdentity: parseIdentity(value.serializedIdentity),
    };
  } catch {
    return null;
  }
}

export function useIdentitySession(): IdentitySession {
  const identity = computed(() => normalizeStoredIdentity(state.value));
  const hasIdentity = computed(() => Boolean(identity.value));

  const setIdentity = (next: StoredIdentity) => {
    state.value = next;
  };

  const clearIdentity = () => {
    state.value = null;
  };

  return {
    identity,
    hasIdentity,
    setIdentity,
    clearIdentity,
  };
}
