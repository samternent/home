import { computed, type ComputedRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { appConfig } from "@/app/config/app.config";

export type StoredIdentity = {
  id: string;
  createdAt: string;
  publicKeyPem: string;
  privateKeyPem: string;
  fingerprint: string;
};

export type IdentitySession = {
  identity: ComputedRef<StoredIdentity | null>;
  hasIdentity: ComputedRef<boolean>;
  setIdentity: (next: StoredIdentity) => void;
  clearIdentity: () => void;
};

export const identityStorageKey = `${appConfig.appId}/identity`;

const state = useLocalStorage<StoredIdentity | null>(identityStorageKey, null);

export function useIdentitySession(): IdentitySession {
  const identity = computed(() => state.value);
  const hasIdentity = computed(() => Boolean(state.value));

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
