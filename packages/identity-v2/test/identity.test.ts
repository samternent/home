import { describe, expect, it } from "vitest";
import {
  convertEd25519PublicKeyToX25519PublicKey,
  createIdentity,
  createIdentityFromMnemonic,
  createMnemonicIdentity,
  deriveAgeRecipient,
  deriveAgeSecretKey,
  deriveKeyId,
  derivePublicKey,
  deriveX25519PublicKey,
  getIdentityDerivationPath,
  generateMnemonic,
  parseIdentity,
  serializeIdentity,
  signUtf8,
  validateMnemonic,
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

    expect(await derivePublicKey(identity.material.seed)).toBe(identity.publicKey);
    expect(await deriveKeyId(identity.publicKey)).toBe(identity.keyId);
  });

  it("creates deterministic identities from a mnemonic phrase", async () => {
    const input = {
      mnemonic:
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      passphrase: "TREZOR",
      createdAt: "2026-03-16T00:00:00.000Z",
    };

    const identityA = await createIdentityFromMnemonic(input);
    const identityB = await createIdentityFromMnemonic(input);

    expect(identityA).toEqual(identityB);
    expect(identityA).toEqual({
      format: "ternent-identity",
      version: "2",
      algorithm: "Ed25519",
      createdAt: "2026-03-16T00:00:00.000Z",
      publicKey: "6IBjlSqvqPfmXohZXC-oqbjX71wHutV9vvrRtw5VrUE",
      keyId: "f34b06f6ffee32599d0e3f49bbee43baf4018ab07378b505da8c778f766096b8",
      material: {
        kind: "seed",
        seed: "u7XruZ6e2gC5owNbLcZEqRFbgD8GPrqjyn-l5-SIz64",
      },
    });
    expect(getIdentityDerivationPath()).toBe("m/101010'/25519'/0'");
  });

  it("generates and validates 12- and 24-word mnemonics", async () => {
    const mnemonic12 = generateMnemonic({ words: 12 });
    const mnemonic24 =
      "liberty bag shell level tip galaxy glow shrimp cram hood lawsuit error waste zoo wash rough cinnamon firm sister mistake awful seven nurse hawk";
    const created = await createMnemonicIdentity({
      words: 12,
      passphrase: "optional",
      createdAt: "2026-03-16T00:00:00.000Z",
    });
    const twentyFourWordIdentity = await createIdentityFromMnemonic({
      mnemonic: mnemonic24,
      createdAt: "2026-03-16T00:00:00.000Z",
    });
    const noPassphraseIdentity = await createIdentityFromMnemonic({
      mnemonic:
        "legal winner thank year wave sausage worth useful legal winner thank yellow",
      createdAt: "2026-03-16T00:00:00.000Z",
    });

    expect(mnemonic12.split(" ")).toHaveLength(12);
    expect(mnemonic24.split(" ")).toHaveLength(24);
    expect(validateMnemonic(mnemonic12)).toBe(true);
    expect(validateMnemonic(mnemonic24)).toBe(true);
    expect(created.mnemonic.split(" ")).toHaveLength(12);
    expect(created.identity.material.kind).toBe("seed");
    expect(twentyFourWordIdentity).toEqual({
      format: "ternent-identity",
      version: "2",
      algorithm: "Ed25519",
      createdAt: "2026-03-16T00:00:00.000Z",
      publicKey: "E71yH7ReOw9yPR0rACZpa_ZU1D8xotD0uYhv5-bDih0",
      keyId: "41db29a5d32f112d1cec0511120309e9e02e7f15efda8a1890d269060e120839",
      material: {
        kind: "seed",
        seed: "GXKurndvf5UYhth7C_uuVjUf84V_17xe0kpIyVS12WI",
      },
    });
    expect(noPassphraseIdentity).toEqual({
      format: "ternent-identity",
      version: "2",
      algorithm: "Ed25519",
      createdAt: "2026-03-16T00:00:00.000Z",
      publicKey: "8gb5_L0cJPiga567IOtUgTydVa_2361Al17RE0v6sfA",
      keyId: "9bcf8f0f872020e588995f39b82e3ceb454e415f7edef4ecf7a5007dc50f8824",
      material: {
        kind: "seed",
        seed: "9OLA_8sUT8OZ0ILgUUzjI3Bq_uBKGa9Z5fmAPhf1RmE",
      },
    });
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

  it("never serializes mnemonic material into the exported identity", async () => {
    const identity = await createIdentityFromMnemonic({
      mnemonic:
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      passphrase: "TREZOR",
      createdAt: "2026-03-16T00:00:00.000Z",
    });
    const exported = JSON.parse(serializeIdentity(identity)) as Record<string, unknown>;

    expect(exported.material).toEqual(identity.material);
    expect(exported.mnemonic).toBeUndefined();
    expect(exported.passphrase).toBeUndefined();
  });
});
