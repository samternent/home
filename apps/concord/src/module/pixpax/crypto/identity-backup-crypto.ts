import { canonicalStringify } from "@ternent/concord-protocol";
import { importPrivateKeyFromPem, importPublicKeyFromPem } from "ternent-identity";
import type { EncryptedIdentityBackupEnvelopeV1 } from "../api/client";

const KDF_NAME = "PBKDF2-SHA256";
const KDF_ITERATIONS = 310000;
const CIPHER_NAME = "AES-256-GCM";
const ENVELOPE_FORMAT = "pixpax-identity-backup-encrypted";
const ENVELOPE_VERSION = "1.0";
const SECRET_FORMAT = "pixpax-identity-secret";
const SECRET_VERSION = "1.0";

export type IdentitySecretPayloadV1 = {
  format: "pixpax-identity-secret";
  version: "1.0";
  profileId: string;
  identity: {
    publicKeyPEM: string;
    privateKeyPEM: string;
  };
  encryption: {
    publicKey: string;
    privateKey: string;
  };
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
  return toUtf8Bytes(canonicalStringify(value ?? {}));
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
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
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
    ["deriveKey"]
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
    ["encrypt", "decrypt"]
  );
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
  clearPayload: IdentitySecretPayloadV1;
  passphrase: string;
}): Promise<EncryptedIdentityBackupEnvelopeV1> {
  const accountId = trim(input.accountId);
  const managedUserId = trim(input.managedUserId);
  const profileId = trim(input.profileId);
  const identityPublicKey = trim(input.identityPublicKey);
  const label = trim(input.label) || "Identity";
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

  const clearPayload: IdentitySecretPayloadV1 = {
    format: SECRET_FORMAT,
    version: SECRET_VERSION,
    profileId,
    identity: {
      publicKeyPEM: trim(input.clearPayload?.identity?.publicKeyPEM),
      privateKeyPEM: trim(input.clearPayload?.identity?.privateKeyPEM),
    },
    encryption: {
      publicKey: trim(input.clearPayload?.encryption?.publicKey),
      privateKey: trim(input.clearPayload?.encryption?.privateKey),
    },
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
    toCanonicalBytes(clearPayload)
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

async function validateIdentityKeyPair(publicKeyPEM: string, privateKeyPEM: string) {
  const publicKey = await importPublicKeyFromPem(publicKeyPEM);
  const privateKey = await importPrivateKeyFromPem(privateKeyPEM);
  const payload = toUtf8Bytes("pixpax-identity-backup-key-check");
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    payload
  );
  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    signature,
    payload
  );
  assert(valid, "Recovered identity keypair validation failed.");
}

export async function decryptIdentityBackupEnvelope(input: {
  envelope: EncryptedIdentityBackupEnvelopeV1;
  passphrase: string;
}) {
  const envelope = input.envelope;
  assert(trim(envelope?.format) === ENVELOPE_FORMAT, "Invalid backup envelope format.");
  assert(trim(envelope?.version) === ENVELOPE_VERSION, "Invalid backup envelope version.");
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
    fromBase64(trim(envelope.ciphertextB64))
  );

  const parsed = JSON.parse(fromUtf8Bytes(new Uint8Array(plaintext))) as IdentitySecretPayloadV1;
  assert(trim(parsed?.format) === SECRET_FORMAT, "Invalid recovered payload format.");
  assert(trim(parsed?.version) === SECRET_VERSION, "Invalid recovered payload version.");
  assert(trim(parsed?.profileId) === trim(envelope.profileId), "Recovered profile mismatch.");
  assert(
    trim(parsed?.identity?.publicKeyPEM) === trim(envelope.identityPublicKey),
    "Recovered identity public key mismatch."
  );
  await validateIdentityKeyPair(
    trim(parsed.identity.publicKeyPEM),
    trim(parsed.identity.privateKeyPEM)
  );
  return parsed;
}
