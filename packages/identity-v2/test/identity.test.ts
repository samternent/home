import { describe, expect, it } from "vitest";
import {
  convertEd25519PublicKeyToX25519PublicKey,
  createIdentity,
  deriveAgeRecipient,
  deriveAgeSecretKey,
  deriveKeyId,
  derivePublicKey,
  deriveX25519PublicKey,
  parseIdentity,
  serializeIdentity,
  signUtf8,
  verifyUtf8,
} from "../src/index";

describe("@ternent/identity", () => {
  it("round-trips a serialized identity", async () => {
    const identity = await createIdentity("2026-03-16T00:00:00.000Z");
    const parsed = parseIdentity(serializeIdentity(identity));

    expect(parsed).toEqual(identity);
  });

  it("serializes a canonical identity payload without UI-only fields", async () => {
    const identity = await createIdentity("2026-03-16T00:00:00.000Z");
    const withUiState = {
      ...identity,
      id: `identity-${identity.keyId.slice(0, 12)}`,
    };

    expect(JSON.parse(serializeIdentity(withUiState as typeof identity))).toEqual(
      identity
    );
  });

  it("derives deterministic public keys and key ids from the seed", async () => {
    const identity = await createIdentity();

    expect(await derivePublicKey(identity.seed)).toBe(identity.publicKey);
    expect(await deriveKeyId(identity.publicKey)).toBe(identity.keyId);
  });

  it("uses signature context separation", async () => {
    const identity = await createIdentity();
    const signature = await signUtf8(identity, "hello", { context: "one" });

    expect(
      await verifyUtf8(identity.publicKey, "hello", signature, {
        context: "one",
      })
    ).toBe(true);
    expect(
      await verifyUtf8(identity.publicKey, "hello", signature, {
        context: "two",
      })
    ).toBe(false);
  });

  it("matches X25519 public derivation from seed and public conversion", async () => {
    const identity = await createIdentity();

    expect(await deriveX25519PublicKey(identity)).toBe(
      await convertEd25519PublicKeyToX25519PublicKey(identity.publicKey)
    );
  });

  it("derives stable age-compatible recipient and secret strings", async () => {
    const identity = await createIdentity();

    const recipient = await deriveAgeRecipient(identity);
    const secret = await deriveAgeSecretKey(identity);

    expect(recipient.startsWith("age1")).toBe(true);
    expect(secret.startsWith("AGE-SECRET-KEY-1")).toBe(true);
    expect(await deriveAgeRecipient(identity)).toBe(recipient);
    expect(await deriveAgeSecretKey(identity)).toBe(secret);
  });
});
