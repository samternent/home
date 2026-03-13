import { computed, shallowRef, type ComputedRef } from "vue";
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
  rememberInBrowser: ComputedRef<boolean>;
  setIdentity: (next: StoredIdentity) => void;
  clearIdentity: () => void;
  setRememberInBrowser: (next: boolean) => void;
};

export const rememberIdentityFlagStorageKey = `${appConfig.appId}/remember-identity`;
export const rememberedIdentityStorageKey = `${appConfig.appId}/remembered-identity`;

function readRememberFlag(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(rememberIdentityFlagStorageKey) === "true";
}

function readRememberedIdentity(): StoredIdentity | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(rememberedIdentityStorageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredIdentity;
  } catch {
    return null;
  }
}

function writeRememberFlag(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(rememberIdentityFlagStorageKey, value ? "true" : "false");
}

function writeRememberedIdentity(identity: StoredIdentity | null) {
  if (typeof window === "undefined") return;

  if (!identity) {
    window.localStorage.removeItem(rememberedIdentityStorageKey);
    return;
  }

  window.localStorage.setItem(rememberedIdentityStorageKey, JSON.stringify(identity));
}

const rememberInBrowserState = shallowRef<boolean>(readRememberFlag());
const activeIdentityState = shallowRef<StoredIdentity | null>(
  rememberInBrowserState.value ? readRememberedIdentity() : null,
);

function syncRememberedIdentity() {
  if (rememberInBrowserState.value) {
    writeRememberedIdentity(activeIdentityState.value);
    return;
  }

  writeRememberedIdentity(null);
}

export function resetIdentitySessionState() {
  const rememberFlag = readRememberFlag();
  rememberInBrowserState.value = rememberFlag;
  activeIdentityState.value = rememberFlag ? readRememberedIdentity() : null;
}

export function useIdentitySession(): IdentitySession {
  const identity = computed(() => activeIdentityState.value);
  const hasIdentity = computed(() => Boolean(activeIdentityState.value));
  const rememberInBrowser = computed(() => rememberInBrowserState.value);

  const setIdentity = (next: StoredIdentity) => {
    activeIdentityState.value = next;
    syncRememberedIdentity();
  };

  const clearIdentity = () => {
    activeIdentityState.value = null;
    writeRememberedIdentity(null);
  };

  const setRememberInBrowser = (next: boolean) => {
    rememberInBrowserState.value = next;
    writeRememberFlag(next);
    syncRememberedIdentity();
  };

  return {
    identity,
    hasIdentity,
    rememberInBrowser,
    setIdentity,
    clearIdentity,
    setRememberInBrowser,
  };
}
