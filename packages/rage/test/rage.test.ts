import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));

async function loadSourceModule() {
  vi.resetModules();
  return import("../src/index.ts");
}

describe("@ternent/rage", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("requires manual init before use", async () => {
    const rage = await loadSourceModule();

    await expect(rage.generateKeyPair()).rejects.toMatchObject({
      name: "RageInitError",
      code: "RAGE_INIT_FAILED",
    });
  });

  it("initializes idempotently", async () => {
    const rage = await loadSourceModule();

    await expect(rage.initRage()).resolves.toBeUndefined();
    await expect(rage.initRage()).resolves.toBeUndefined();
  });

  it("round trips a single recipient message", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const alice = await rage.generateKeyPair();
    const ciphertext = await rage.encryptWithRecipients({
      recipients: [alice.publicKey],
      data: new TextEncoder().encode("hello"),
    });
    const plaintext = await rage.decryptWithIdentity({
      identity: alice.privateKey,
      data: ciphertext,
    });

    expect(new TextDecoder().decode(plaintext)).toBe("hello");
  });

  it("round trips a multi-recipient message", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const alice = await rage.generateKeyPair();
    const bob = await rage.generateKeyPair();
    const ciphertext = await rage.encryptWithRecipients({
      recipients: [alice.publicKey, bob.publicKey],
      data: new TextEncoder().encode("shared"),
    });
    const plaintext = await rage.decryptWithIdentity({
      identity: bob.privateKey,
      data: ciphertext,
    });

    expect(new TextDecoder().decode(plaintext)).toBe("shared");
  });

  it("round trips a passphrase message", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const ciphertext = await rage.encryptWithPassphrase({
      passphrase: "correct horse battery staple",
      data: new TextEncoder().encode("secret"),
    });
    const plaintext = await rage.decryptWithPassphrase({
      passphrase: "correct horse battery staple",
      data: ciphertext,
    });

    expect(new TextDecoder().decode(plaintext)).toBe("secret");
  });

  it("produces armored output by default", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const alice = await rage.generateKeyPair();
    const ciphertext = await rage.encryptWithRecipients({
      recipients: [alice.publicKey],
      data: new TextEncoder().encode("hello"),
    });

    expect(new TextDecoder().decode(ciphertext)).toContain(
      "-----BEGIN AGE ENCRYPTED FILE-----"
    );
  });

  it("produces binary output when requested", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const alice = await rage.generateKeyPair();
    const ciphertext = await rage.encryptWithRecipients({
      recipients: [alice.publicKey],
      data: new TextEncoder().encode("hello"),
      output: "binary",
    });

    expect(ciphertext.byteLength).toBeGreaterThan(0);
    expect(new TextDecoder().decode(ciphertext)).not.toContain(
      "-----BEGIN AGE ENCRYPTED FILE-----"
    );
  });

  it("rejects an empty recipient array", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    await expect(
      rage.encryptWithRecipients({
        recipients: [],
        data: new TextEncoder().encode("hello"),
      })
    ).rejects.toMatchObject({
      name: "RageValidationError",
      code: "RAGE_EMPTY_RECIPIENTS",
    });
  });

  it("rejects an empty passphrase", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    await expect(
      rage.encryptWithPassphrase({
        passphrase: "",
        data: new TextEncoder().encode("hello"),
      })
    ).rejects.toMatchObject({
      name: "RageValidationError",
      code: "RAGE_EMPTY_PASSPHRASE",
    });
  });

  it("rejects empty data", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const alice = await rage.generateKeyPair();
    await expect(
      rage.encryptWithRecipients({
        recipients: [alice.publicKey],
        data: new Uint8Array(),
      })
    ).rejects.toMatchObject({
      name: "RageValidationError",
      code: "RAGE_EMPTY_DATA",
    });
  });

  it("rejects oversized data", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const alice = await rage.generateKeyPair();
    await expect(
      rage.encryptWithRecipients({
        recipients: [alice.publicKey],
        data: new Uint8Array(rage.MAX_MESSAGE_SIZE + 1),
      })
    ).rejects.toMatchObject({
      name: "RageValidationError",
      code: "RAGE_DATA_TOO_LARGE",
    });
  });

  it("rejects decryption with the wrong identity", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const alice = await rage.generateKeyPair();
    const bob = await rage.generateKeyPair();
    const ciphertext = await rage.encryptWithRecipients({
      recipients: [alice.publicKey],
      data: new TextEncoder().encode("hello"),
    });

    await expect(
      rage.decryptWithIdentity({
        identity: bob.privateKey,
        data: ciphertext,
      })
    ).rejects.toMatchObject({
      name: "RageDecryptionError",
      code: "RAGE_DECRYPT_FAILED",
    });
  });

  it("rejects corrupted ciphertext", async () => {
    const rage = await loadSourceModule();
    await rage.initRage();

    const alice = await rage.generateKeyPair();
    const ciphertext = await rage.encryptWithRecipients({
      recipients: [alice.publicKey],
      data: new TextEncoder().encode("hello"),
      output: "binary",
    });
    const corrupted = Uint8Array.from(ciphertext);
    corrupted[Math.floor(corrupted.length / 2)] ^= 0xff;

    await expect(
      rage.decryptWithIdentity({
        identity: alice.privateKey,
        data: corrupted,
      })
    ).rejects.toMatchObject({
      name: "RageDecryptionError",
      code: "RAGE_DECRYPT_FAILED",
    });
  });

  it("imports from built ESM output without manual path hacks", async () => {
    const entryUrl = pathToFileURL(resolve(testDir, "../dist/index.js")).href;
    const rage = await import(entryUrl);

    await rage.initRage();

    const pair = await rage.generateKeyPair();
    expect(pair.type).toBe("x25519");
    expect(pair.privateKey).toMatch(/^AGE-SECRET-KEY-/);
    expect(pair.publicKey).toMatch(/^age1/);
  });
});
