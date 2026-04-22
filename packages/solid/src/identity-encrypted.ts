import {
  parseIdentity,
  serializeIdentity,
  validateIdentity,
  type SerializedIdentity,
} from "@ternent/identity";
import {
  decryptTextWithPassphrase,
  encryptTextWithPassphrase,
  initArmour,
} from "@ternent/armour";
import type {
  SolidEncryptedIdentityBlob,
  SolidIdentityUnlocker,
} from "./types.js";
import {
  assertPassphrase,
  isRecord,
  SOLID_ENCRYPTED_IDENTITY_FORMAT,
  SOLID_ENCRYPTED_IDENTITY_VERSION,
} from "./identity-shared.js";
import { resolveSolidIdentityUnlocker } from "./identity-unlocker.js";

export function isSolidEncryptedIdentityBlob(value: unknown): value is SolidEncryptedIdentityBlob {
  return (
    isRecord(value) &&
    value.format === SOLID_ENCRYPTED_IDENTITY_FORMAT &&
    value.version === SOLID_ENCRYPTED_IDENTITY_VERSION &&
    typeof value.createdAt === "string" &&
    (value.webId === null || typeof value.webId === "string") &&
    typeof value.keyId === "string" &&
    typeof value.publicKey === "string" &&
    typeof value.ciphertext === "string" &&
    isRecord(value.encryption) &&
    value.encryption.scheme === "armour-passphrase" &&
    value.encryption.encoding === "armor" &&
    typeof value.encryption.unlockMechanism === "string"
  );
}

function parseSolidEncryptedIdentityBlob(
  input: SolidEncryptedIdentityBlob | string,
): SolidEncryptedIdentityBlob {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;
  if (!isSolidEncryptedIdentityBlob(parsed)) {
    throw new Error(
      "Solid encrypted identity must be a ternent-solid-encrypted-identity v2 object.",
    );
  }

  return {
    format: parsed.format,
    version: parsed.version,
    createdAt: parsed.createdAt,
    webId: parsed.webId,
    keyId: parsed.keyId,
    publicKey: parsed.publicKey,
    ciphertext: parsed.ciphertext,
    encryption: {
      scheme: parsed.encryption.scheme,
      encoding: parsed.encryption.encoding,
      unlockMechanism: parsed.encryption.unlockMechanism,
    },
  };
}

export function serializeSolidEncryptedIdentityBlob(
  blob: SolidEncryptedIdentityBlob,
  pretty = true,
): string {
  return `${JSON.stringify(parseSolidEncryptedIdentityBlob(blob), null, pretty ? 2 : 0)}\n`;
}

export async function createSolidEncryptedIdentityBlob(input: {
  identity: SerializedIdentity | string;
  unlocker: SolidIdentityUnlocker;
  webId?: string | null;
  createdAt?: string;
  storage: "local-cache" | "solid-resource";
  cacheKey?: string;
  resourceUrl?: string;
}): Promise<SolidEncryptedIdentityBlob> {
  const identity = await validateIdentity(parseIdentity(input.identity));
  const unlocker = resolveSolidIdentityUnlocker(input.unlocker);
  const passphrase = assertPassphrase(
    await unlocker.unlock({
      reason: "encrypt",
      webId: input.webId ?? null,
      keyId: identity.keyId,
      storage: input.storage,
      cacheKey: input.cacheKey,
      resourceUrl: input.resourceUrl,
    }),
  );

  await initArmour();
  const ciphertext = await encryptTextWithPassphrase({
    passphrase,
    text: serializeIdentity(identity, false),
  });

  return {
    format: SOLID_ENCRYPTED_IDENTITY_FORMAT,
    version: SOLID_ENCRYPTED_IDENTITY_VERSION,
    createdAt: input.createdAt ?? new Date().toISOString(),
    webId: input.webId ?? null,
    keyId: identity.keyId,
    publicKey: identity.publicKey,
    ciphertext,
    encryption: {
      scheme: "armour-passphrase",
      encoding: "armor",
      unlockMechanism: unlocker.mechanism,
    },
  };
}

export async function restoreSolidIdentityFromEncryptedBlob(input: {
  blob: SolidEncryptedIdentityBlob | string;
  unlocker: SolidIdentityUnlocker;
  expectedWebId?: string;
  storage: "local-cache" | "solid-resource";
  cacheKey?: string;
  resourceUrl?: string;
}): Promise<SerializedIdentity> {
  const blob = parseSolidEncryptedIdentityBlob(input.blob);

  if (
    input.expectedWebId !== undefined &&
    blob.webId !== null &&
    blob.webId !== input.expectedWebId
  ) {
    throw new Error(
      `Solid encrypted identity belongs to ${blob.webId}, not ${input.expectedWebId}.`,
    );
  }

  const unlocker = resolveSolidIdentityUnlocker(input.unlocker);
  if (blob.encryption.unlockMechanism !== unlocker.mechanism) {
    throw new Error(
      `Solid encrypted identity requires unlock mechanism ${blob.encryption.unlockMechanism}, received ${unlocker.mechanism}.`,
    );
  }

  const passphrase = assertPassphrase(
    await unlocker.unlock({
      reason: "decrypt",
      webId: blob.webId,
      keyId: blob.keyId,
      storage: input.storage,
      cacheKey: input.cacheKey,
      resourceUrl: input.resourceUrl,
    }),
  );

  await initArmour();
  const plaintext = await decryptTextWithPassphrase({
    passphrase,
    data: blob.ciphertext,
  });
  const identity = await validateIdentity(parseIdentity(plaintext));

  if (identity.keyId !== blob.keyId || identity.publicKey !== blob.publicKey) {
    throw new Error("Decrypted Solid encrypted identity does not match its metadata.");
  }

  return identity;
}
