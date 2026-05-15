import {
  createIdentityFromMnemonic,
  createMnemonicIdentity,
  parseIdentity,
  validateIdentity,
  type MnemonicWordCount,
  type SerializedIdentity,
} from "@ternent/identity";
import {
  decryptTextWithPassphrase,
  encryptTextWithPassphrase,
  initArmour,
} from "@ternent/armour";
import type { LocalStorageLike } from "./storage";
import {
  createOtpAuthUri,
  generateTotpSecret,
  verifyTotpCode,
  type TotpPolicy,
} from "./totp";

export const LEGACY_PLAINTEXT_IDENTITY_STORAGE_KEY = "solid/v2/concord/identity/v1";
export const DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY =
  "solid/v2/concord/identity/encrypted/v2";
export const DEFAULT_DEV_SESSION_UNLOCK_STORAGE_KEY =
  "solid/v2/concord/identity/unlocked/session/v1";

const LOCAL_IDENTITY_ENVELOPE_FORMAT = "ternent-solid-local-identity";
const LOCAL_IDENTITY_ENVELOPE_VERSION = "1";
const LOCAL_IDENTITY_PAYLOAD_VERSION = 1;
const DEFAULT_TOTP_ISSUER = "Concord";

export type IdentityBootstrapMode = "auto" | "unlock-only" | "onboard-only";

export type ActiveIdentity = {
  identityId: string;
  label: string;
  identity: SerializedIdentity;
};

export type EncryptedIdentityBlobV2 = {
  format: typeof LOCAL_IDENTITY_ENVELOPE_FORMAT;
  version: typeof LOCAL_IDENTITY_ENVELOPE_VERSION;
  createdAt: string;
  keyId: string;
  publicKey: string;
  ciphertext: string;
  encryption: {
    scheme: "armour-passphrase";
    encoding: "armor";
    algorithm: "rage";
  };
  unlockPolicy: {
    password: true;
    totp: boolean;
  };
};

type EncryptedIdentityPayload = {
  version: typeof LOCAL_IDENTITY_PAYLOAD_VERSION;
  identity: SerializedIdentity;
  mnemonic: string;
  mfa: {
    totpEnabled: boolean;
    totpSecretBase32: string | null;
    totpPolicy: TotpPolicy;
  };
};

export type StoredIdentitySummary = {
  identityId: string;
  publicKey: string;
  label: string;
  createdAt: string;
  mfaEnabled: boolean;
};

export type IdentityOnboardingDraft = {
  createdAt: string;
  identity: SerializedIdentity;
  mnemonic: string;
  label: string;
  mfa: {
    totpSecretBase32: string;
    totpAuthUri: string;
    policy: TotpPolicy;
  };
};

export type CreateIdentityServiceOptions = {
  identity?: SerializedIdentity;
  encryptedIdentity?: EncryptedIdentityBlobV2 | string;
  identityBootstrapMode?: IdentityBootstrapMode;
  storage?: LocalStorageLike;
  sessionStorage?: LocalStorageLike;
  storageKey?: string;
  sessionStorageKey?: string;
  devSessionUnlockBypass?: boolean;
  rpName?: string;
};

export type IdentityService = {
  ensureUnlocked(mode?: IdentityBootstrapMode): Promise<ActiveIdentity>;
  createOnboardingDraft(input?: {
    words?: MnemonicWordCount;
    totpIssuer?: string;
    totpAccountName?: string;
  }): Promise<IdentityOnboardingDraft>;
  completeOnboarding(input: {
    draft: IdentityOnboardingDraft;
    password: string;
    confirmPassword: string;
    mnemonicConfirmed: boolean;
    mfaEnabled: boolean;
    totpCode?: string;
  }): Promise<ActiveIdentity>;
  recoverFromMnemonic(input: {
    mnemonic: string;
    password: string;
    confirmPassword: string;
    mfaEnabled: boolean;
    totpSecretBase32?: string;
    totpCode?: string;
    totpIssuer?: string;
    totpAccountName?: string;
    createdAt?: string;
  }): Promise<ActiveIdentity>;
  unlockWithPassword(input: {
    password: string;
    totpCode?: string;
  }): Promise<ActiveIdentity>;
  getStoredIdentitySummary(): StoredIdentitySummary | null;
  lock(): Promise<void>;
};

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

function resolveSessionStorage(storage?: LocalStorageLike): LocalStorageLike {
  if (storage) {
    return storage;
  }

  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage;
  }

  return createMemoryStorage();
}

function formatIdentityLabel(identity: SerializedIdentity): string {
  const suffix = identity.keyId.slice(-8);
  return `User ${suffix}`;
}

function toActiveIdentity(identity: SerializedIdentity): ActiveIdentity {
  return {
    identityId: identity.keyId,
    label: formatIdentityLabel(identity),
    identity,
  };
}

function normalizeBootstrapMode(mode?: IdentityBootstrapMode): IdentityBootstrapMode {
  if (!mode) {
    return "auto";
  }

  if (mode === "auto" || mode === "unlock-only" || mode === "onboard-only") {
    return mode;
  }

  throw new Error(`Unsupported identity bootstrap mode: ${String(mode)}`);
}

function removeLegacyPlaintextIdentity(storage: LocalStorageLike): void {
  storage.removeItem(LEGACY_PLAINTEXT_IDENTITY_STORAGE_KEY);
}

function normalizePassword(input: string): string {
  const password = String(input || "");
  if (password.trim().length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  return password;
}

function normalizeTotpCode(input: string | undefined): string {
  return String(input || "").replace(/\s+/g, "");
}

function normalizeMnemonic(input: string): string {
  const normalized = String(input || "")
    .trim()
    .split(/\s+/g)
    .join(" ");
  if (!normalized) {
    throw new Error("Recovery mnemonic is required.");
  }
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEncryptedIdentityBlobV2(value: unknown): value is EncryptedIdentityBlobV2 {
  return (
    isRecord(value) &&
    value.format === LOCAL_IDENTITY_ENVELOPE_FORMAT &&
    value.version === LOCAL_IDENTITY_ENVELOPE_VERSION &&
    typeof value.createdAt === "string" &&
    typeof value.keyId === "string" &&
    typeof value.publicKey === "string" &&
    typeof value.ciphertext === "string" &&
    isRecord(value.encryption) &&
    value.encryption.scheme === "armour-passphrase" &&
    value.encryption.encoding === "armor" &&
    value.encryption.algorithm === "rage" &&
    isRecord(value.unlockPolicy) &&
    value.unlockPolicy.password === true &&
    typeof value.unlockPolicy.totp === "boolean"
  );
}

function parseEncryptedBlob(input: EncryptedIdentityBlobV2 | string): EncryptedIdentityBlobV2 {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;
  if (!isEncryptedIdentityBlobV2(parsed)) {
    throw new Error(
      "Encrypted identity payload must be a ternent-solid-local-identity v1 blob.",
    );
  }
  return parsed;
}

function isEncryptedIdentityPayload(value: unknown): value is EncryptedIdentityPayload {
  return (
    isRecord(value) &&
    value.version === LOCAL_IDENTITY_PAYLOAD_VERSION &&
    isRecord(value.identity) &&
    typeof value.mnemonic === "string" &&
    isRecord(value.mfa) &&
    typeof value.mfa.totpEnabled === "boolean" &&
    (value.mfa.totpSecretBase32 === null ||
      typeof value.mfa.totpSecretBase32 === "string") &&
    isRecord(value.mfa.totpPolicy) &&
    typeof value.mfa.totpPolicy.issuer === "string" &&
    typeof value.mfa.totpPolicy.accountName === "string" &&
    value.mfa.totpPolicy.digits === 6 &&
    value.mfa.totpPolicy.period === 30
  );
}

async function encryptPayload(input: {
  payload: EncryptedIdentityPayload;
  password: string;
}): Promise<string> {
  const serialized = JSON.stringify(input.payload);
  if (typeof serialized !== "string" || serialized.length === 0) {
    throw new Error(
      `Encrypted identity payload serialization failed (type=${typeof serialized}).`,
    );
  }
  await initArmour();
  return await encryptTextWithPassphrase({
    passphrase: input.password,
    text: serialized,
  });
}

async function decryptPayload(input: {
  blob: EncryptedIdentityBlobV2;
  password: string;
}): Promise<EncryptedIdentityPayload> {
  await initArmour();
  const plaintext = await decryptTextWithPassphrase({
    passphrase: input.password,
    data: input.blob.ciphertext,
  });
  const payload = JSON.parse(plaintext) as unknown;
  if (!isEncryptedIdentityPayload(payload)) {
    throw new Error("Encrypted identity payload is malformed.");
  }
  return payload;
}

function createEnvelope(input: {
  identity: SerializedIdentity;
  ciphertext: string;
  createdAt?: string;
  totpEnabled: boolean;
}): EncryptedIdentityBlobV2 {
  return {
    format: LOCAL_IDENTITY_ENVELOPE_FORMAT,
    version: LOCAL_IDENTITY_ENVELOPE_VERSION,
    createdAt: input.createdAt ?? new Date().toISOString(),
    keyId: input.identity.keyId,
    publicKey: input.identity.publicKey,
    ciphertext: input.ciphertext,
    encryption: {
      scheme: "armour-passphrase",
      encoding: "armor",
      algorithm: "rage",
    },
    unlockPolicy: {
      password: true,
      totp: input.totpEnabled,
    },
  };
}

function toSummary(blob: EncryptedIdentityBlobV2): StoredIdentitySummary {
  const suffix = blob.keyId.slice(-8);
  return {
    identityId: blob.keyId,
    publicKey: blob.publicKey,
    label: `User ${suffix}`,
    createdAt: blob.createdAt,
    mfaEnabled: blob.unlockPolicy.totp,
  };
}

function readStoredBlob(storage: LocalStorageLike, key: string): EncryptedIdentityBlobV2 | null {
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return parseEncryptedBlob(raw);
  } catch {
    return null;
  }
}

function readSessionIdentity(storage: LocalStorageLike, key: string): SerializedIdentity | null {
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return parseIdentity(raw);
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function persistSessionIdentity(
  storage: LocalStorageLike | null,
  key: string,
  identity: SerializedIdentity,
): void {
  if (!storage) {
    return;
  }
  storage.setItem(key, JSON.stringify(identity));
}

function clearSessionIdentity(storage: LocalStorageLike | null, key: string): void {
  if (!storage) {
    return;
  }
  storage.removeItem(key);
}

export function createIdentityService(options: CreateIdentityServiceOptions = {}): IdentityService {
  const storage = resolveIdentityStorage(options.storage);
  const storageKey = options.storageKey ?? DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY;
  const devSessionUnlockBypass = Boolean(options.devSessionUnlockBypass);
  const sessionStorage = devSessionUnlockBypass
    ? resolveSessionStorage(options.sessionStorage)
    : null;
  const sessionStorageKey =
    options.sessionStorageKey ?? DEFAULT_DEV_SESSION_UNLOCK_STORAGE_KEY;
  const initialIdentity =
    options.identity ??
    (sessionStorage
      ? readSessionIdentity(sessionStorage, sessionStorageKey)
      : undefined);
  let explicitEncryptedBlob: EncryptedIdentityBlobV2 | null = null;
  if (options.encryptedIdentity) {
    explicitEncryptedBlob = parseEncryptedBlob(options.encryptedIdentity);
  }
  let activeIdentity = initialIdentity ? toActiveIdentity(initialIdentity) : null;

  removeLegacyPlaintextIdentity(storage);

  const resolveEncryptedBlob = (): EncryptedIdentityBlobV2 | null => {
    if (explicitEncryptedBlob) {
      return explicitEncryptedBlob;
    }
    return readStoredBlob(storage, storageKey);
  };

  return {
    async ensureUnlocked(mode?: IdentityBootstrapMode): Promise<ActiveIdentity> {
      const resolvedMode = normalizeBootstrapMode(mode ?? options.identityBootstrapMode);
      if (activeIdentity) {
        return activeIdentity;
      }
      if (initialIdentity) {
        const validated = await validateIdentity(parseIdentity(initialIdentity));
        activeIdentity = toActiveIdentity(validated);
        return activeIdentity;
      }
      if (resolvedMode === "unlock-only" || resolvedMode === "auto") {
        throw new Error("Identity is locked. Unlock with password first.");
      }
      throw new Error("Identity is locked.");
    },

    async createOnboardingDraft(input = {}): Promise<IdentityOnboardingDraft> {
      const createdAt = new Date().toISOString();
      const { identity, mnemonic } = await createMnemonicIdentity({
        words: input.words ?? 12,
        createdAt,
      });

      const policy: TotpPolicy = {
        issuer: String(input.totpIssuer || options.rpName || DEFAULT_TOTP_ISSUER),
        accountName: String(
          input.totpAccountName || `${formatIdentityLabel(identity)}@local`,
        ),
        digits: 6,
        period: 30,
      };
      const totpSecretBase32 = generateTotpSecret();

      return {
        createdAt,
        identity,
        mnemonic,
        label: formatIdentityLabel(identity),
        mfa: {
          totpSecretBase32,
          totpAuthUri: createOtpAuthUri({
            secretBase32: totpSecretBase32,
            policy,
          }),
          policy,
        },
      };
    },

    async completeOnboarding(input): Promise<ActiveIdentity> {
      if (!input.mnemonicConfirmed) {
        throw new Error(
          "Confirm that you saved the mnemonic before creating the encrypted identity.",
        );
      }

      const password = normalizePassword(input.password);
      if (password !== input.confirmPassword) {
        throw new Error("Password confirmation does not match.");
      }

      const restored = await createIdentityFromMnemonic({
        mnemonic: input.draft.mnemonic,
        createdAt: input.draft.identity.createdAt,
      });
      if (
        restored.keyId !== input.draft.identity.keyId ||
        restored.publicKey !== input.draft.identity.publicKey
      ) {
        throw new Error("Onboarding draft mnemonic does not match its identity.");
      }

      const validatedIdentity = await validateIdentity(parseIdentity(input.draft.identity));
      const totpEnabled = Boolean(input.mfaEnabled);
      const totpSecretBase32 = totpEnabled ? input.draft.mfa.totpSecretBase32 : null;

      if (totpEnabled) {
        const code = normalizeTotpCode(input.totpCode);
        const ok = await verifyTotpCode({
          secretBase32: input.draft.mfa.totpSecretBase32,
          code,
          policy: input.draft.mfa.policy,
        });
        if (!ok) {
          throw new Error("Authenticator code is invalid. Check your app time and retry.");
        }
      }

      const payload: EncryptedIdentityPayload = {
        version: LOCAL_IDENTITY_PAYLOAD_VERSION,
        identity: validatedIdentity,
        mnemonic: input.draft.mnemonic,
        mfa: {
          totpEnabled,
          totpSecretBase32,
          totpPolicy: input.draft.mfa.policy,
        },
      };

      const ciphertext = await encryptPayload({
        payload,
        password,
      });
      const envelope = createEnvelope({
        identity: validatedIdentity,
        ciphertext,
        createdAt: input.draft.createdAt,
        totpEnabled,
      });
      storage.setItem(storageKey, JSON.stringify(envelope));
      explicitEncryptedBlob = envelope;
      persistSessionIdentity(sessionStorage, sessionStorageKey, validatedIdentity);

      activeIdentity = toActiveIdentity(validatedIdentity);
      return activeIdentity;
    },

    async recoverFromMnemonic(input): Promise<ActiveIdentity> {
      const password = normalizePassword(input.password);
      if (password !== input.confirmPassword) {
        throw new Error("Password confirmation does not match.");
      }

      const mnemonic = normalizeMnemonic(input.mnemonic);
      const restored = await createIdentityFromMnemonic({
        mnemonic,
        createdAt: input.createdAt,
      });
      const validatedIdentity = await validateIdentity(parseIdentity(restored));

      const totpEnabled = Boolean(input.mfaEnabled);
      const policy: TotpPolicy = {
        issuer: String(input.totpIssuer || options.rpName || DEFAULT_TOTP_ISSUER),
        accountName: String(
          input.totpAccountName || `${formatIdentityLabel(validatedIdentity)}@local`,
        ),
        digits: 6,
        period: 30,
      };

      let totpSecretBase32: string | null = null;
      if (totpEnabled) {
        const providedSecret = String(input.totpSecretBase32 || "").trim();
        if (!providedSecret) {
          throw new Error("Authenticator secret is required when MFA is enabled.");
        }
        const code = normalizeTotpCode(input.totpCode);
        const ok = await verifyTotpCode({
          secretBase32: providedSecret,
          code,
          policy,
        });
        if (!ok) {
          throw new Error("Authenticator code is invalid. Check your app time and retry.");
        }
        totpSecretBase32 = providedSecret;
      }

      const payload: EncryptedIdentityPayload = {
        version: LOCAL_IDENTITY_PAYLOAD_VERSION,
        identity: validatedIdentity,
        mnemonic,
        mfa: {
          totpEnabled,
          totpSecretBase32,
          totpPolicy: policy,
        },
      };

      const ciphertext = await encryptPayload({
        payload,
        password,
      });
      const envelope = createEnvelope({
        identity: validatedIdentity,
        ciphertext,
        totpEnabled,
      });

      storage.setItem(storageKey, JSON.stringify(envelope));
      explicitEncryptedBlob = envelope;
      persistSessionIdentity(sessionStorage, sessionStorageKey, validatedIdentity);

      activeIdentity = toActiveIdentity(validatedIdentity);
      return activeIdentity;
    },

    async unlockWithPassword(input): Promise<ActiveIdentity> {
      const blob = resolveEncryptedBlob();
      if (!blob) {
        throw new Error("No encrypted identity found. Create a new identity first.");
      }

      const password = normalizePassword(input.password);
      const payload = await decryptPayload({
        blob,
        password,
      });

      const identity = await validateIdentity(parseIdentity(payload.identity));
      if (identity.keyId !== blob.keyId || identity.publicKey !== blob.publicKey) {
        throw new Error("Encrypted identity metadata does not match decrypted identity.");
      }

      if (payload.mfa.totpEnabled) {
        const code = normalizeTotpCode(input.totpCode);
        const secret = payload.mfa.totpSecretBase32;
        if (!secret) {
          throw new Error("MFA is enabled but authenticator secret is missing.");
        }
        const ok = await verifyTotpCode({
          secretBase32: secret,
          code,
          policy: payload.mfa.totpPolicy,
        });
        if (!ok) {
          throw new Error("Authenticator code is invalid.");
        }
      }

      activeIdentity = toActiveIdentity(identity);
      persistSessionIdentity(sessionStorage, sessionStorageKey, identity);
      return activeIdentity;
    },

    getStoredIdentitySummary(): StoredIdentitySummary | null {
      const blob = resolveEncryptedBlob();
      if (!blob) {
        return null;
      }
      return toSummary(blob);
    },

    async lock(): Promise<void> {
      activeIdentity = null;
      clearSessionIdentity(sessionStorage, sessionStorageKey);
    },
  };
}

/**
 * Backward-compat wrapper for existing runtime callers.
 */
export async function resolvePersistedIdentity(options?: {
  storage?: LocalStorageLike;
  sessionStorage?: LocalStorageLike;
  storageKey?: string;
  sessionStorageKey?: string;
  identity?: SerializedIdentity;
  identityBootstrapMode?: IdentityBootstrapMode;
  devSessionUnlockBypass?: boolean;
}): Promise<ActiveIdentity> {
  const service = createIdentityService(options);
  return await service.ensureUnlocked();
}
