import { describe, expect, it } from "vitest";
import { createIdentity, deriveKeyId } from "@ternent/identity";
import {
  createSealHash,
  createSealProof,
  createSealPublicKeyArtifact,
  parseSealProofJson,
  verifySealProofAgainstBytes,
  verifySealProofSignature,
} from "../src/proof";

async function createSigner() {
  const identity = await createIdentity();
  return {
    identity,
    publicKey: identity.publicKey,
    keyId: await deriveKeyId(identity.publicKey),
  };
}

describe("seal proof", () => {
  it("signs and verifies a valid proof", async () => {
    const signer = await createSigner();
    const bytes = new TextEncoder().encode("seal proof bytes");
    const proof = await createSealProof({
      signer: { identity: signer.identity },
      subject: {
        kind: "file",
        path: "sample.txt",
        hash: await createSealHash(bytes),
      },
    });

    const signatureCheck = await verifySealProofSignature(proof);
    const verification = await verifySealProofAgainstBytes(proof, bytes);

    expect(signatureCheck.ok).toBe(true);
    expect(verification.valid).toBe(true);
    expect(verification.keyId).toBe(signer.keyId);
  });

  it("rejects invalid proof JSON", () => {
    const parsed = parseSealProofJson("not-json");

    expect(parsed.ok).toBe(false);
    expect(parsed.errors[0]).toContain("not valid JSON");
  });

  it("creates a portable public-key artifact", async () => {
    const signer = await createSigner();
    const artifact = await createSealPublicKeyArtifact({
      identity: signer.identity,
    });

    expect(artifact.publicKey).toBe(signer.publicKey);
    expect(artifact.keyId).toBe(signer.keyId);
    expect(artifact.version).toBe("2");
    expect(artifact.type).toBe("seal-public-key");
  });
});
