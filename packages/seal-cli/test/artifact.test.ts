import { describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import { recipientFromIdentity } from "@ternent/armour";
import {
  createSealArtifact,
  decryptSealArtifactPayload,
  verifySealArtifact,
} from "../src/artifact";
import { SealArtifactError } from "../src/errors";

async function createSigner() {
  return createIdentity();
}

describe("seal artifact", () => {
  it("creates, verifies, and decrypts an encrypted artifact", async () => {
    const signer = await createSigner();
    const alice = await createIdentity();
    const bob = await createIdentity();
    const aliceRecipient = await recipientFromIdentity(alice);
    const bobRecipient = await recipientFromIdentity(bob);
    const plaintext = new TextEncoder().encode("recipient targeted payload");
    const artifact = await createSealArtifact({
      signer: { identity: signer },
      subjectPath: "dist-manifest.json",
      payload: plaintext,
      recipients: [aliceRecipient, bobRecipient],
    });

    expect(artifact.type).toBe("seal-artifact");
    expect(artifact.version).toBe("1");
    expect(artifact.proof.subject.kind).toBe("artifact");
    const serialized = JSON.stringify(artifact);
    expect(serialized).not.toContain(aliceRecipient);
    expect(serialized).not.toContain(bobRecipient);

    const verification = await verifySealArtifact(artifact);
    expect(verification.valid).toBe(true);
    expect(verification.subjectHash).toBe(artifact.proof.subject.hash);
    expect(artifact.manifest.payloadHash).not.toBe(artifact.proof.subject.hash);

    const decrypted = await decryptSealArtifactPayload({
      artifact,
      identity: bob,
    });
    expect(new TextDecoder().decode(decrypted)).toBe(
      "recipient targeted payload"
    );
  });

  it("maps invalid recipients to seal errors", async () => {
    const signer = await createSigner();

    await expect(
      createSealArtifact({
        signer: { identity: signer },
        subjectPath: "artifact.tar.gz",
        payload: new TextEncoder().encode("secret"),
        recipients: ["bad-recipient"],
      })
    ).rejects.toMatchObject({
      code: "SEAL_INVALID_RECIPIENT",
      message: "Recipient must be a valid age recipient string.",
    });
  });

  it("fails decryption for unauthorized identities", async () => {
    const signer = await createSigner();
    const recipient = await createIdentity();
    const outsider = await createIdentity();
    const artifact = await createSealArtifact({
      signer: { identity: signer },
      subjectPath: "artifact.tar.gz",
      payload: new TextEncoder().encode("secret"),
      recipients: [await recipientFromIdentity(recipient)],
    });

    await expect(
      decryptSealArtifactPayload({
        artifact,
        identity: outsider,
      })
    ).rejects.toMatchObject({
      code: "SEAL_DECRYPTION_FAILED",
      message: "Failed to decrypt payload.",
    });
  });
});
