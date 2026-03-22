import { describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import {
  decryptIdentityBackupEnvelope,
  deriveIdentityKeyFingerprint,
  encryptIdentityBackupEnvelope,
} from "@/modules/family/identity-backup-crypto";

function toUtf8Bytes(value: string) {
  return new TextEncoder().encode(value);
}

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function createLegacyManagedIdentityEnvelope(input: {
  accountId: string;
  managedUserId: string;
  profileId: string;
  identityPublicKey: string;
  identityKeyFingerprint: string;
  label: string;
  passphrase: string;
  clearPayload: unknown;
}) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const saltB64 = toBase64(salt);
  const ivB64 = toBase64(iv);
  const aad = {
    accountId: input.accountId,
    managedUserId: input.managedUserId,
    profileId: input.profileId,
    identityKeyFingerprint: input.identityKeyFingerprint,
    format: "pixpax-identity-backup-encrypted" as const,
    version: "1.0" as const,
  };

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toUtf8Bytes(input.passphrase.normalize("NFC")),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 310000,
      salt: fromBase64(saltB64),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: toUtf8Bytes(JSON.stringify(aad)),
    },
    key,
    toUtf8Bytes(JSON.stringify(input.clearPayload)),
  );

  return {
    format: "pixpax-identity-backup-encrypted" as const,
    version: "1.0" as const,
    accountId: input.accountId,
    managedUserId: input.managedUserId,
    profileId: input.profileId,
    identityPublicKey: input.identityPublicKey,
    identityKeyFingerprint: input.identityKeyFingerprint,
    label: input.label,
    metadata: {},
    createdAt: new Date().toISOString(),
    crypto: {
      kdf: {
        name: "PBKDF2-SHA256" as const,
        iterations: 310000 as const,
        saltB64,
      },
      cipher: {
        name: "AES-256-GCM" as const,
        ivB64,
      },
      aad,
    },
    ciphertextB64: toBase64(new Uint8Array(ciphertext)),
  };
}

describe("identity backup crypto", () => {
  it("writes the managed-identity backup envelope as v2", async () => {
    const serializedIdentity = await createIdentity();
    const storedIdentity = {
      id: `identity-${serializedIdentity.keyId.slice(0, 12)}`,
      displayName: "Ava",
      fingerprint: serializedIdentity.keyId,
      serializedIdentity,
      managedUserId: "managed-user-1",
    };

    const envelope = await encryptIdentityBackupEnvelope({
      accountId: "account-1",
      managedUserId: "managed-user-1",
      profileId: storedIdentity.id,
      identityPublicKey: storedIdentity.serializedIdentity.publicKey,
      identityKeyFingerprint: await deriveIdentityKeyFingerprint(
        storedIdentity.serializedIdentity.publicKey,
      ),
      label: storedIdentity.displayName || "Ava",
      clearPayload: storedIdentity,
      passphrase: "correct horse battery staple",
    });

    expect(envelope.version).toBe("2.0");
    expect(envelope.crypto.aad.version).toBe("2.0");
  });

  it("continues to decrypt existing v1-tagged managed-identity envelopes", async () => {
    const serializedIdentity = await createIdentity();
    const storedIdentity = {
      id: `identity-${serializedIdentity.keyId.slice(0, 12)}`,
      displayName: "Milo",
      fingerprint: serializedIdentity.keyId,
      serializedIdentity,
      managedUserId: "managed-user-2",
    };

    const legacyTaggedEnvelope = await createLegacyManagedIdentityEnvelope({
      accountId: "account-1",
      managedUserId: "managed-user-2",
      profileId: storedIdentity.id,
      identityPublicKey: storedIdentity.serializedIdentity.publicKey,
      identityKeyFingerprint: await deriveIdentityKeyFingerprint(
        storedIdentity.serializedIdentity.publicKey,
      ),
      label: storedIdentity.displayName || "Milo",
      passphrase: "correct horse battery staple",
      clearPayload: {
        format: "pixpax-managed-identity-secret",
        version: "1.0",
        profileId: storedIdentity.id,
        identity: storedIdentity,
        label: storedIdentity.displayName || "Milo",
        metadata: {},
      },
    });

    const decrypted = await decryptIdentityBackupEnvelope({
      envelope: legacyTaggedEnvelope,
      passphrase: "correct horse battery staple",
    });

    expect(decrypted.identity.serializedIdentity.publicKey).toBe(
      storedIdentity.serializedIdentity.publicKey,
    );
    expect(decrypted.identity.displayName).toBe(storedIdentity.displayName);
  });
});
