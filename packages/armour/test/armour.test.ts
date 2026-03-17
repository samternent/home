import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { createIdentity, serializeIdentity } from "../../identity-v2/src/index.ts";

async function loadSourceModule() {
  vi.resetModules();
  return import("../src/index.ts");
}

describe("@ternent/armour", () => {
  it("requires manual init before use", async () => {
    const armour = await loadSourceModule();

    await expect(
      armour.encryptWithPassphrase({
        passphrase: "correct horse battery staple",
        data: new TextEncoder().encode("hello"),
      })
    ).rejects.toMatchObject({
      name: "ArmourInitError",
      code: "ARMOUR_INIT_FAILED",
    });
  });

  it("initializes idempotently", async () => {
    const armour = await loadSourceModule();

    await expect(armour.initArmour()).resolves.toBeUndefined();
    await expect(armour.initArmour()).resolves.toBeUndefined();
  });

  it("derives age recipients and secrets from identity objects and strings", async () => {
    const armour = await loadSourceModule();
    const identity = await createIdentity("2026-03-17T00:00:00.000Z");
    const serialized = serializeIdentity(identity);

    const recipientFromObject = await armour.recipientFromIdentity(identity);
    const recipientFromString = await armour.recipientFromIdentity(serialized);
    const secret = await armour.secretKeyFromIdentity(identity);

    expect(recipientFromObject).toMatch(/^age1/);
    expect(recipientFromString).toBe(recipientFromObject);
    expect(secret).toMatch(/^AGE-SECRET-KEY-1/);
  });

  it("rejects malformed identity input with structured errors", async () => {
    const armour = await loadSourceModule();

    await expect(
      armour.recipientFromIdentity('{"format":"ternent-identity","version":"nope"}')
    ).rejects.toMatchObject({
      name: "ArmourIdentityError",
      code: "ARMOUR_INVALID_IDENTITY",
    });
  });

  it("encrypts for one identity and decrypts with the same identity", async () => {
    const armour = await loadSourceModule();
    await armour.initArmour();
    const identity = await createIdentity();

    const ciphertext = await armour.encryptForIdentities({
      identities: [identity],
      data: new TextEncoder().encode("hello"),
    });
    const plaintext = await armour.decryptWithIdentity({
      identity,
      data: ciphertext,
    });

    expect(new TextDecoder().decode(plaintext)).toBe("hello");
  });

  it("encrypts for multiple identities in one pass", async () => {
    const armour = await loadSourceModule();
    await armour.initArmour();
    const alice = await createIdentity();
    const bob = await createIdentity();

    const ciphertext = await armour.encryptForIdentities({
      identities: [alice, bob],
      data: new TextEncoder().encode("shared"),
    });
    const plaintext = await armour.decryptWithIdentity({
      identity: bob,
      data: ciphertext,
    });

    expect(new TextDecoder().decode(plaintext)).toBe("shared");
  });

  it("supports raw recipient passthrough and raw secret decryption", async () => {
    const armour = await loadSourceModule();
    await armour.initArmour();
    const identity = await createIdentity();
    const recipient = await armour.recipientFromIdentity(identity);
    const secretKey = await armour.secretKeyFromIdentity(identity);

    const ciphertext = await armour.encryptForRecipients({
      recipients: [recipient],
      data: new TextEncoder().encode("raw"),
      output: "binary",
    });
    const plaintext = await armour.decryptWithSecretKey({
      secretKey,
      data: ciphertext,
    });

    expect(new TextDecoder().decode(plaintext)).toBe("raw");
  });

  it("normalizes recipient validation failures", async () => {
    const armour = await loadSourceModule();
    await armour.initArmour();

    await expect(
      armour.encryptForRecipients({
        recipients: [],
        data: new TextEncoder().encode("hello"),
      })
    ).rejects.toMatchObject({
      name: "ArmourValidationError",
      code: "ARMOUR_EMPTY_RECIPIENTS",
    });
  });

  it("round trips passphrase encryption and rejects wrong passphrases", async () => {
    const armour = await loadSourceModule();
    await armour.initArmour();

    const ciphertext = await armour.encryptWithPassphrase({
      passphrase: "correct horse battery staple",
      data: new TextEncoder().encode("secret"),
    });
    const plaintext = await armour.decryptWithPassphrase({
      passphrase: "correct horse battery staple",
      data: ciphertext,
    });

    expect(new TextDecoder().decode(plaintext)).toBe("secret");

    await expect(
      armour.decryptWithPassphrase({
        passphrase: "wrong",
        data: ciphertext,
      })
    ).rejects.toMatchObject({
      name: "ArmourDecryptionError",
      code: "ARMOUR_DECRYPT_FAILED",
    });
  });

  it("rejects empty passphrases with structured validation errors", async () => {
    const armour = await loadSourceModule();
    await armour.initArmour();

    await expect(
      armour.encryptWithPassphrase({
        passphrase: "",
        data: new TextEncoder().encode("hello"),
      })
    ).rejects.toMatchObject({
      name: "ArmourValidationError",
      code: "ARMOUR_EMPTY_PASSPHRASE",
    });
  });

  it("round trips text helpers", async () => {
    const armour = await loadSourceModule();
    await armour.initArmour();
    const identity = await createIdentity();

    const ciphertext = await armour.encryptTextForIdentities({
      identities: [identity],
      text: "hello utf8",
    });
    const plaintext = await armour.decryptTextWithIdentity({
      identity,
      data: ciphertext,
    });

    expect(ciphertext).toContain("-----BEGIN AGE ENCRYPTED FILE-----");
    expect(plaintext).toBe("hello utf8");
  });

  it("accepts ArrayBuffer, Blob, and File-compatible inputs for binary helpers", async () => {
    const armour = await loadSourceModule();
    await armour.initArmour();
    const identity = await createIdentity();
    const fileLike =
      typeof File === "undefined"
        ? new Blob(["blob data"], { type: "text/plain" })
        : new File(["blob data"], "demo.txt", { type: "text/plain" });

    const ciphertextFromArrayBuffer = await armour.encryptBinaryForIdentities({
      identities: [identity],
      data: new TextEncoder().encode("buffer data").buffer,
      output: "binary",
    });
    const plaintextFromArrayBuffer = await armour.decryptBinaryWithIdentity({
      identity,
      data: ciphertextFromArrayBuffer,
    });
    const ciphertextFromFile = await armour.encryptBinaryForIdentities({
      identities: [identity],
      data: fileLike,
    });
    const plaintextFromFile = await armour.decryptBinaryWithIdentity({
      identity,
      data: ciphertextFromFile,
    });

    expect(new TextDecoder().decode(plaintextFromArrayBuffer)).toBe("buffer data");
    expect(new TextDecoder().decode(plaintextFromFile)).toBe("blob data");
  });

  it("keeps the package boundary clean", async () => {
    const sourceFiles = [
      "/Users/sam/dev/samternent/home/packages/armour/src/index.ts",
      "/Users/sam/dev/samternent/home/packages/armour/src/identity.ts",
      "/Users/sam/dev/samternent/home/packages/armour/src/recipients.ts",
      "/Users/sam/dev/samternent/home/packages/armour/src/passphrase.ts",
      "/Users/sam/dev/samternent/home/packages/armour/src/text.ts",
      "/Users/sam/dev/samternent/home/packages/armour/src/files.ts",
    ];
    const source = (await Promise.all(sourceFiles.map((file) => readFile(file, "utf8"))))
      .join("\n");
    const armour = await loadSourceModule();
    const identity = await createIdentity();

    expect(source).not.toMatch(/@ternent\/seal-/);
    expect(source).not.toMatch(/\benvelope\b/i);
    expect(source).not.toMatch(/\b(sign|verify)(Utf8|Bytes)?\b/);
    expect(source).not.toMatch(/\bencryptText\b(?!ForIdentities|WithPassphrase)/);
    expect(source).not.toMatch(/\bdecryptText\b(?!WithIdentity|WithPassphrase)/);

    await armour.initArmour();
    await expect(
      armour.encryptForIdentities({
        identities: [identity],
        data: new TextEncoder().encode("async"),
      })
    ).resolves.toBeInstanceOf(Uint8Array);
  });
});
