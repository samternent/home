import {
  parseIdentity,
  serializeIdentity,
  validateIdentity,
  type SerializedIdentity,
} from "@ternent/identity";
import type {
  EncryptedIdentityBackupEnvelope,
  EncryptedIdentityBackupEnvelopeV2,
} from "@/modules/api/client";
import type { StoredIdentity } from "@/modules/identity";

const KDF_NAME = "PBKDF2-SHA256";
const KDF_ITERATIONS = 310000;
const CIPHER_NAME = "AES-256-GCM";
const ENVELOPE_FORMAT = "pixpax-identity-backup-encrypted";
const ENVELOPE_VERSION = "2.0";
const LEGACY_ENVELOPE_VERSION = "1.0";
const SECRET_FORMAT = "pixpax-managed-identity-secret";
const SECRET_VERSION = "1.0";

export type ManagedIdentitySecretPayloadV1 = {
  format: "pixpax-managed-identity-secret";
  version: "1.0";
  profileId: string;
  identity: StoredIdentity;
  label: string;
  metadata: Record<string, unknown>;
};

function trim(value: unknown) {
  return String(value || "").trim();
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function toUtf8Bytes(value: string) {
  return new TextEncoder().encode(value);
}

function fromUtf8Bytes(value: Uint8Array) {
  return new TextDecoder().decode(value);
}

function toCanonicalBytes(value: unknown) {
  return toUtf8Bytes(JSON.stringify(value ?? {}));
}

function toBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function normalizePassphrase(value: string) {
  return String(value || "").normalize("NFC");
}

function normalizeIdentityKeyForFingerprint(value: string) {
  return String(value || "").replace(/\r/g, "").replace(/\s+/g, "").trim();
}

export async function deriveIdentityKeyFingerprint(identityPublicKey: string) {
  const normalized = normalizeIdentityKeyForFingerprint(identityPublicKey);
  assert(normalized, "identityPublicKey is required.");
  const digest = await crypto.subtle.digest("SHA-256", toUtf8Bytes(normalized));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveAesKey(input: {
  passphrase: string;
  saltB64: string;
  iterations: number;
}) {
  const passphrase = normalizePassphrase(input.passphrase);
  assert(passphrase.length > 0, "Passphrase is required.");
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toUtf8Bytes(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: input.iterations,
      salt: fromBase64(input.saltB64),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function normalizeStoredIdentity(input: StoredIdentity): StoredIdentity {
  return {
    id: trim(input.id),
    displayName: trim(input.displayName) || undefined,
    fingerprint: trim(input.fingerprint),
    serializedIdentity: parseIdentity(input.serializedIdentity),
    managedUserId: trim(input.managedUserId) || null,
  };
}

export async function encryptIdentityBackupEnvelope(input: {
  accountId: string;
  managedUserId: string;
  profileId: string;
  identityPublicKey: string;
  identityKeyFingerprint?: string;
  label: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  clearPayload: StoredIdentity;
  passphrase: string;
}): Promise<EncryptedIdentityBackupEnvelopeV2> {
  const accountId = trim(input.accountId);
  const managedUserId = trim(input.managedUserId);
  const profileId = trim(input.profileId);
  const identityPublicKey = trim(input.identityPublicKey);
  const label = trim(input.label) || "Child identity";
  const metadata =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? input.metadata
      : {};

  assert(accountId, "accountId is required.");
  assert(managedUserId, "managedUserId is required.");
  assert(profileId, "profileId is required.");
  assert(identityPublicKey, "identityPublicKey is required.");

  const identityKeyFingerprint =
    trim(input.identityKeyFingerprint) ||
    (await deriveIdentityKeyFingerprint(identityPublicKey));
  const createdAt = trim(input.createdAt) || new Date().toISOString();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const saltB64 = toBase64(salt);
  const ivB64 = toBase64(iv);
  const aad = {
    accountId,
    managedUserId,
    profileId,
    identityKeyFingerprint,
    format: ENVELOPE_FORMAT,
    version: ENVELOPE_VERSION,
  } as const;
  const key = await deriveAesKey({
    passphrase: input.passphrase,
    saltB64,
    iterations: KDF_ITERATIONS,
  });

  const clearPayload: ManagedIdentitySecretPayloadV1 = {
    format: SECRET_FORMAT,
    version: SECRET_VERSION,
    profileId,
    identity: normalizeStoredIdentity(input.clearPayload),
    label,
    metadata,
  };

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: toCanonicalBytes(aad),
    },
    key,
    toCanonicalBytes(clearPayload),
  );

  return {
    format: ENVELOPE_FORMAT,
    version: ENVELOPE_VERSION,
    accountId,
    managedUserId,
    profileId,
    identityPublicKey,
    identityKeyFingerprint,
    label,
    metadata,
    createdAt,
    crypto: {
      kdf: {
        name: KDF_NAME,
        iterations: KDF_ITERATIONS,
        saltB64,
      },
      cipher: {
        name: CIPHER_NAME,
        ivB64,
      },
      aad,
    },
    ciphertextB64: toBase64(new Uint8Array(ciphertext)),
  };
}

async function validateRecoveredIdentity(identity: SerializedIdentity) {
  return validateIdentity(parseIdentity(identity));
}

export async function decryptIdentityBackupEnvelope(input: {
  envelope: EncryptedIdentityBackupEnvelope;
  passphrase: string;
}) {
  const envelope = input.envelope;
  assert(trim(envelope?.format) === ENVELOPE_FORMAT, "Invalid backup envelope format.");
  const envelopeVersion = trim(envelope?.version);
  assert(
    envelopeVersion === ENVELOPE_VERSION || envelopeVersion === LEGACY_ENVELOPE_VERSION,
    "Invalid backup envelope version.",
  );
  assert(trim(envelope?.ciphertextB64), "Backup ciphertext is required.");

  const cryptoMeta = envelope.crypto;
  assert(trim(cryptoMeta?.kdf?.name) === KDF_NAME, "Unsupported backup KDF.");
  assert(Number(cryptoMeta?.kdf?.iterations) === KDF_ITERATIONS, "Unsupported KDF iterations.");
  assert(trim(cryptoMeta?.cipher?.name) === CIPHER_NAME, "Unsupported backup cipher.");

  const key = await deriveAesKey({
    passphrase: input.passphrase,
    saltB64: trim(cryptoMeta?.kdf?.saltB64),
    iterations: KDF_ITERATIONS,
  });

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(trim(cryptoMeta?.cipher?.ivB64)),
      additionalData: toCanonicalBytes(cryptoMeta?.aad || {}),
    },
    key,
    fromBase64(trim(envelope.ciphertextB64)),
  );

  const parsed = JSON.parse(
    fromUtf8Bytes(new Uint8Array(plaintext)),
  ) as ManagedIdentitySecretPayloadV1;
  assert(trim(parsed?.format) === SECRET_FORMAT, "Invalid recovered payload format.");
  assert(trim(parsed?.version) === SECRET_VERSION, "Invalid recovered payload version.");
  assert(trim(parsed?.profileId) === trim(envelope.profileId), "Recovered profile mismatch.");
  assert(
    trim(parsed?.identity?.serializedIdentity?.publicKey) === trim(envelope.identityPublicKey),
    "Recovered identity public key mismatch.",
  );

  const validatedIdentity = await validateRecoveredIdentity(parsed.identity.serializedIdentity);
  return {
    ...parsed,
    identity: {
      ...parsed.identity,
      serializedIdentity: JSON.parse(serializeIdentity(validatedIdentity)),
    } satisfies StoredIdentity,
  };
}
