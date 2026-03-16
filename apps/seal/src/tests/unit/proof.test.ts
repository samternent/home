import { describe, expect, it, vi } from "vitest";
import {
  createIdentity,
  deriveKeyIdFromPublicKeyPem,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
} from "ternent-identity";
import {
  createSealHash,
  createSealProof,
  parseSealProofJson,
  verifyPublishedArtifacts,
  verifySealProofSignature,
} from "@/modules/proof";
import type { StoredIdentity } from "@/modules/identity";

async function createStoredIdentity(): Promise<StoredIdentity> {
  const keyPair = await createIdentity();
  const publicKeyPem = await exportPublicKeyAsPem(keyPair.publicKey);
  const privateKeyPem = await exportPrivateKeyAsPem(keyPair.privateKey);
  const keyId = await deriveKeyIdFromPublicKeyPem(publicKeyPem);

  return {
    id: `identity-${keyId.slice(0, 12)}`,
    createdAt: new Date().toISOString(),
    publicKeyPem,
    privateKeyPem,
    keyId,
  };
}

describe("proof", () => {
  it("creates and verifies a valid proof", async () => {
    const identity = await createStoredIdentity();
    const proof = await createSealProof({
      signer: {
        privateKeyPem: identity.privateKeyPem,
        publicKeyPem: identity.publicKeyPem,
        keyId: identity.keyId,
      },
      subject: {
        kind: "file",
        path: "hello.txt",
        hash: await createSealHash(new TextEncoder().encode("hello world")),
      },
    });

    const result = await verifySealProofSignature(proof);

    expect(result.ok).toBe(true);
  });

  it("rejects invalid signature", async () => {
    const identity = await createStoredIdentity();
    const proof = await createSealProof({
      signer: {
        privateKeyPem: identity.privateKeyPem,
        publicKeyPem: identity.publicKeyPem,
        keyId: identity.keyId,
      },
      subject: {
        kind: "file",
        path: "hello.txt",
        hash: await createSealHash(new TextEncoder().encode("hello world")),
      },
    });

    const tampered = {
      ...proof,
      subject: {
        ...proof.subject,
        hash: await createSealHash(new TextEncoder().encode("changed")),
      },
    };

    const result = await verifySealProofSignature(tampered);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("Invalid signature");
  });

  it("rejects malformed json", () => {
    const parsed = parseSealProofJson("not-json");

    expect(parsed.ok).toBe(false);
    expect(parsed.errors[0]).toContain("not valid JSON");
  });

  it("verifies published artifacts successfully", async () => {
    const identity = await createStoredIdentity();
    const manifestRaw =
      '{"files":{"assets/index.js":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},"root":"dist","type":"seal-manifest","version":"1"}';
    const manifestBytes = new TextEncoder().encode(manifestRaw);
    const proof = await createSealProof({
      signer: {
        privateKeyPem: identity.privateKeyPem,
        publicKeyPem: identity.publicKeyPem,
        keyId: identity.keyId,
      },
      subject: {
        kind: "manifest",
        path: "dist-manifest.json",
        hash: await createSealHash(manifestBytes),
      },
    });

    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/proof.json")) {
        return new Response(JSON.stringify(proof), { status: 200 });
      }
      if (url.endsWith("/dist-manifest.json")) {
        return new Response(manifestRaw, { status: 200 });
      }
      return new Response(
        JSON.stringify({
          algorithm: proof.algorithm,
          publicKey: proof.signer.publicKey,
          keyId: proof.signer.keyId,
        }),
        { status: 200 }
      );
    });

    const result = await verifyPublishedArtifacts(fetcher as typeof fetch);

    expect(result.valid).toBe(true);
    expect(result.keyId).toBe(identity.keyId);
    expect(result.proofRaw).toBe(JSON.stringify(proof));
  });

  it("fails published artifacts on key mismatch", async () => {
    const identity = await createStoredIdentity();
    const manifestRaw =
      '{"files":{"assets/index.js":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},"root":"dist","type":"seal-manifest","version":"1"}';
    const manifestBytes = new TextEncoder().encode(manifestRaw);
    const proof = await createSealProof({
      signer: {
        privateKeyPem: identity.privateKeyPem,
        publicKeyPem: identity.publicKeyPem,
        keyId: identity.keyId,
      },
      subject: {
        kind: "manifest",
        path: "dist-manifest.json",
        hash: await createSealHash(manifestBytes),
      },
    });

    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/proof.json")) {
        return new Response(JSON.stringify(proof), { status: 200 });
      }
      if (url.endsWith("/dist-manifest.json")) {
        return new Response(manifestRaw, { status: 200 });
      }
      return new Response(
        JSON.stringify({
          algorithm: proof.algorithm,
          publicKey: proof.signer.publicKey,
          keyId: "wrong-key-id",
        }),
        { status: 200 }
      );
    });

    const result = await verifyPublishedArtifacts(fetcher as typeof fetch);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("keyId");
  });

  it("fails published artifacts on signature mismatch", async () => {
    const identity = await createStoredIdentity();
    const manifestRaw =
      '{"files":{"assets/index.js":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},"root":"dist","type":"seal-manifest","version":"1"}';
    const manifestBytes = new TextEncoder().encode(manifestRaw);
    const proof = await createSealProof({
      signer: {
        privateKeyPem: identity.privateKeyPem,
        publicKeyPem: identity.publicKeyPem,
        keyId: identity.keyId,
      },
      subject: {
        kind: "manifest",
        path: "dist-manifest.json",
        hash: await createSealHash(manifestBytes),
      },
    });

    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/proof.json")) {
        return new Response(
          JSON.stringify({
            ...proof,
            signature: "invalid-signature",
          }),
          { status: 200 }
        );
      }
      if (url.endsWith("/dist-manifest.json")) {
        return new Response(manifestRaw, { status: 200 });
      }
      return new Response(
        JSON.stringify({
          algorithm: proof.algorithm,
          publicKey: proof.signer.publicKey,
          keyId: proof.signer.keyId,
        }),
        { status: 200 }
      );
    });

    const result = await verifyPublishedArtifacts(fetcher as typeof fetch);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Invalid signature");
  });
});
