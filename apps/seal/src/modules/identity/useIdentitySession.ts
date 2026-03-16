import { computed, shallowRef, type ComputedRef } from "vue";
import type { SerializedIdentity } from "@ternent/identity";
import { appConfig } from "@/app/config/app.config";

export type StoredIdentity = SerializedIdentity & {
  id: string;
};

type LegacyStoredIdentity = {
  id?: string;
  createdAt?: string;
  publicKeyPem?: string;
  privateKeyPem?: string;
  fingerprint?: string;
  keyId?: string;
};

export type IdentitySession = {
  identity: ComputedRef<StoredIdentity | null>;
  hasIdentity: ComputedRef<boolean>;
  rememberInBrowser: ComputedRef<boolean>;
  legacyIdentityRejected: ComputedRef<boolean>;
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

function toStoredIdentity(input: SerializedIdentity): StoredIdentity {
  return {
    id: `identity-${input.keyId.slice(0, 12)}`,
    ...input,
  };
}

function readRememberedIdentity(): {
  identity: StoredIdentity | null;
  legacyRejected: boolean;
} {
  if (typeof window === "undefined") {
    return { identity: null, legacyRejected: false };
  }

  const raw = window.localStorage.getItem(rememberedIdentityStorageKey);
  if (!raw) {
    return { identity: null, legacyRejected: false };
  }

  try {
    const parsed = JSON.parse(raw) as LegacyStoredIdentity | SerializedIdentity;
    if (
      typeof (parsed as LegacyStoredIdentity)?.privateKeyPem === "string" ||
      typeof (parsed as LegacyStoredIdentity)?.publicKeyPem === "string"
    ) {
      window.localStorage.removeItem(rememberedIdentityStorageKey);
      return { identity: null, legacyRejected: true };
    }

    if (
      typeof (parsed as SerializedIdentity)?.format !== "string" ||
      typeof (parsed as SerializedIdentity)?.seed !== "string" ||
      typeof (parsed as SerializedIdentity)?.publicKey !== "string" ||
      typeof (parsed as SerializedIdentity)?.keyId !== "string"
    ) {
      return { identity: null, legacyRejected: false };
    }

    return {
      identity: toStoredIdentity(parsed as SerializedIdentity),
      legacyRejected: false,
    };
  } catch {
    return { identity: null, legacyRejected: false };
  }
}

function writeRememberFlag(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    rememberIdentityFlagStorageKey,
    value ? "true" : "false"
  );
}

function writeRememberedIdentity(identity: StoredIdentity | null) {
  if (typeof window === "undefined") return;

  if (!identity) {
    window.localStorage.removeItem(rememberedIdentityStorageKey);
    return;
  }

  window.localStorage.setItem(
    rememberedIdentityStorageKey,
    JSON.stringify(identity)
  );
}

const rememberInBrowserState = shallowRef<boolean>(readRememberFlag());
const rememberedState = rememberInBrowserState.value
  ? readRememberedIdentity()
  : { identity: null, legacyRejected: false };
const activeIdentityState = shallowRef<StoredIdentity | null>(rememberedState.identity);
const legacyIdentityRejectedState = shallowRef<boolean>(
  rememberedState.legacyRejected
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
  const remembered = rememberFlag
    ? readRememberedIdentity()
    : { identity: null, legacyRejected: false };
  activeIdentityState.value = remembered.identity;
  legacyIdentityRejectedState.value = remembered.legacyRejected;
}

export function useIdentitySession(): IdentitySession {
  const identity = computed(() => activeIdentityState.value);
  const hasIdentity = computed(() => Boolean(activeIdentityState.value));
  const rememberInBrowser = computed(() => rememberInBrowserState.value);
  const legacyIdentityRejected = computed(
    () => legacyIdentityRejectedState.value
  );

  const setIdentity = (next: StoredIdentity) => {
    activeIdentityState.value = next;
    legacyIdentityRejectedState.value = false;
    syncRememberedIdentity();
  };

  const clearIdentity = () => {
    activeIdentityState.value = null;
    legacyIdentityRejectedState.value = false;
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
    legacyIdentityRejected,
    setIdentity,
    clearIdentity,
    setRememberInBrowser,
  };
}
