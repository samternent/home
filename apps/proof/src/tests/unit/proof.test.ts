import { describe, expect, it } from "vitest";
import {
  createIdentity,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
} from "ternent-identity";
import { hashData, stripIdentityKey } from "ternent-utils";
import {
  createPortableProof,
  parsePortableProofJson,
  SUPPORTED_HASH_ALGORITHM,
  SUPPORTED_SIGNATURE_ALGORITHM,
  verifyPortableProofSignature,
} from "@/modules/proof";
import type { StoredIdentity } from "@/modules/identity";

async function createStoredIdentity(): Promise<StoredIdentity> {
  const keyPair = await createIdentity();
  const publicKeyPem = await exportPublicKeyAsPem(keyPair.publicKey);
  const privateKeyPem = await exportPrivateKeyAsPem(keyPair.privateKey);
  const fingerprint = await hashData(stripIdentityKey(publicKeyPem));

  return {
    id: `identity-${fingerprint.slice(0, 12)}`,
    createdAt: new Date().toISOString(),
    publicKeyPem,
    privateKeyPem,
    fingerprint,
  };
}

describe("proof", () => {
  it("creates and verifies a valid proof", async () => {
    const identity = await createStoredIdentity();
    const proof = await createPortableProof({
      identity,
      payload: {
        contentHash: await hashData("hello world"),
        hashAlgorithm: SUPPORTED_HASH_ALGORITHM,
        signatureAlgorithm: SUPPORTED_SIGNATURE_ALGORITHM,
        canonicalization: "ternent-utils/canonicalStringify-v1",
      },
    });

    const result = await verifyPortableProofSignature(proof);

    expect(result.ok).toBe(true);
  });

  it("rejects invalid signature", async () => {
    const identity = await createStoredIdentity();
    const proof = await createPortableProof({
      identity,
      payload: {
        contentHash: await hashData("hello world"),
        hashAlgorithm: SUPPORTED_HASH_ALGORITHM,
        signatureAlgorithm: SUPPORTED_SIGNATURE_ALGORITHM,
        canonicalization: "ternent-utils/canonicalStringify-v1",
      },
    });

    const tampered = {
      ...proof,
      payload: {
        ...proof.payload,
        contentHash: await hashData("changed"),
      },
    };

    const result = await verifyPortableProofSignature(tampered);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("Invalid signature");
  });

  it("rejects unsupported version", async () => {
    const identity = await createStoredIdentity();
    const proof = await createPortableProof({
      identity,
      payload: {
        contentHash: await hashData("hello world"),
        hashAlgorithm: SUPPORTED_HASH_ALGORITHM,
        signatureAlgorithm: SUPPORTED_SIGNATURE_ALGORITHM,
        canonicalization: "ternent-utils/canonicalStringify-v1",
      },
    });

    const unsupported = {
      ...proof,
      version: "portable-proof/v0",
    } as any;

    const result = await verifyPortableProofSignature(unsupported);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("Unsupported proof version");
  });

  it("rejects malformed json", () => {
    const parsed = parsePortableProofJson("not-json");

    expect(parsed.ok).toBe(false);
    expect(parsed.errors[0]).toContain("not valid JSON");
  });
});
