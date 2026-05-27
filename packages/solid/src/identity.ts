import {
  createIdentityFromMnemonic,
  createMnemonicIdentity,
  parseIdentity,
  serializeIdentity,
  validateIdentity,
  type MnemonicWordCount,
  type SerializedIdentity,
} from "@ternent/identity";
import { decryptTextWithPassphrase, encryptTextWithPassphrase, initArmour } from "@ternent/armour";
import type {
  CreateSolidIdentityFromMnemonicOptions,
  CreateSolidMnemonicIdentityOptions,
  CreateSolidMnemonicSecretOptions,
  CreateSolidWalletBackupOptions,
  RestoreSolidIdentityFromMnemonicSecretOptions,
  RestoreSolidIdentityFromBackupOptions,
  SolidSessionLike,
  SolidMnemonicSecret,
  SolidWalletBackup,
} from "./types.js";

const SOLID_MNEMONIC_FORMAT = "ternent-solid-mnemonic" as const;
const SOLID_MNEMONIC_VERSION = "1" as const;
const SOLID_WALLET_FORMAT = "ternent-solid-wallet" as const;
const SOLID_WALLET_VERSION = "1" as const;

function assertWebId(session: SolidSessionLike): string {
  const webId = String(session.info?.webId || "").trim();
  if (!webId) {
    throw new Error(
      "Solid session is missing a WebID. Ensure the session is authenticated before accessing Solid-backed resources.",
    );
  }
  return webId;
}

function assertMnemonicWords(words?: number): MnemonicWordCount | undefined {
  if (words === undefined) {
    return undefined;
  }
  if (words === 12 || words === 24) {
    return words;
  }
  throw new Error("Mnemonic word count must be 12 or 24.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getSolidWebId(session: SolidSessionLike): string {
  return assertWebId(session);
}

export async function createSolidMnemonicIdentity(
  options: CreateSolidMnemonicIdentityOptions = {},
): Promise<{ identity: SerializedIdentity; mnemonic: string }> {
  return await createMnemonicIdentity({
    words: assertMnemonicWords(options.words),
    passphrase: options.passphrase,
    createdAt: options.createdAt,
  });
}

export async function createSolidIdentity(
  options: CreateSolidIdentityFromMnemonicOptions,
): Promise<SerializedIdentity> {
  return await createIdentityFromMnemonic({
    mnemonic: options.mnemonic,
    passphrase: options.passphrase,
    createdAt: options.createdAt,
  });
}

export function isSolidMnemonicSecret(value: unknown): value is SolidMnemonicSecret {
  return (
    isRecord(value) &&
    value.format === SOLID_MNEMONIC_FORMAT &&
    value.version === SOLID_MNEMONIC_VERSION &&
    typeof value.createdAt === "string" &&
    (value.webId === null || typeof value.webId === "string") &&
    typeof value.keyId === "string" &&
    typeof value.publicKey === "string" &&
    typeof value.mnemonic === "string" &&
    (value.mnemonicPassphrase === null || typeof value.mnemonicPassphrase === "string")
  );
}

function parseSolidMnemonicSecret(input: SolidMnemonicSecret | string): SolidMnemonicSecret {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;
  if (!isSolidMnemonicSecret(parsed)) {
    throw new Error("Solid mnemonic secret must be a ternent-solid-mnemonic v1 object.");
  }
  return {
    format: parsed.format,
    version: parsed.version,
    createdAt: parsed.createdAt,
    webId: parsed.webId,
    keyId: parsed.keyId,
    publicKey: parsed.publicKey,
    mnemonic: parsed.mnemonic,
    mnemonicPassphrase: parsed.mnemonicPassphrase,
  };
}

export function serializeSolidMnemonicSecret(secret: SolidMnemonicSecret, pretty = true): string {
  return `${JSON.stringify(parseSolidMnemonicSecret(secret), null, pretty ? 2 : 0)}\n`;
}

export async function createSolidMnemonicSecret(
  input: CreateSolidMnemonicSecretOptions,
): Promise<SolidMnemonicSecret> {
  const identity = input.identity
    ? await validateIdentity(parseIdentity(input.identity))
    : await createSolidIdentity({
        mnemonic: input.mnemonic,
        passphrase: input.mnemonicPassphrase,
        createdAt: input.createdAt,
      });

  return {
    format: SOLID_MNEMONIC_FORMAT,
    version: SOLID_MNEMONIC_VERSION,
    createdAt: input.createdAt ?? new Date().toISOString(),
    webId: input.webId ?? null,
    keyId: identity.keyId,
    publicKey: identity.publicKey,
    mnemonic: input.mnemonic,
    mnemonicPassphrase: input.mnemonicPassphrase ?? null,
  };
}

export async function restoreSolidIdentityFromMnemonicSecret(
  input: RestoreSolidIdentityFromMnemonicSecretOptions,
): Promise<SerializedIdentity> {
  const secret = parseSolidMnemonicSecret(input.secret);

  if (
    input.expectedWebId !== undefined &&
    secret.webId !== null &&
    secret.webId !== input.expectedWebId
  ) {
    throw new Error(
      `Solid mnemonic secret belongs to ${secret.webId}, not ${input.expectedWebId}.`,
    );
  }

  const identity = await createSolidIdentity({
    mnemonic: secret.mnemonic,
    passphrase: secret.mnemonicPassphrase ?? undefined,
    createdAt: secret.createdAt,
  });

  if (identity.keyId !== secret.keyId || identity.publicKey !== secret.publicKey) {
    throw new Error(
      "Derived identity from Solid mnemonic secret does not match its secret metadata.",
    );
  }

  return identity;
}

export function isSolidWalletBackup(value: unknown): value is SolidWalletBackup {
  return (
    isRecord(value) &&
    value.format === SOLID_WALLET_FORMAT &&
    value.version === SOLID_WALLET_VERSION &&
    typeof value.createdAt === "string" &&
    (value.webId === null || typeof value.webId === "string") &&
    typeof value.keyId === "string" &&
    typeof value.publicKey === "string" &&
    typeof value.ciphertext === "string" &&
    isRecord(value.encryption) &&
    value.encryption.scheme === "armour-passphrase" &&
    value.encryption.encoding === "armor"
  );
}

function parseSolidWalletBackup(input: SolidWalletBackup | string): SolidWalletBackup {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;
  if (!isSolidWalletBackup(parsed)) {
    throw new Error("Solid wallet backup must be a ternent-solid-wallet v1 object.");
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
    },
  };
}

export function serializeSolidWalletBackup(backup: SolidWalletBackup, pretty = true): string {
  return `${JSON.stringify(parseSolidWalletBackup(backup), null, pretty ? 2 : 0)}\n`;
}

export async function createSolidWalletBackup(
  input: CreateSolidWalletBackupOptions,
): Promise<SolidWalletBackup> {
  const identity = await validateIdentity(parseIdentity(input.identity));
  await initArmour();

  const ciphertext = await encryptTextWithPassphrase({
    passphrase: input.passphrase,
    text: serializeIdentity(identity, false),
  });

  return {
    format: SOLID_WALLET_FORMAT,
    version: SOLID_WALLET_VERSION,
    createdAt: input.createdAt ?? new Date().toISOString(),
    webId: input.webId ?? null,
    keyId: identity.keyId,
    publicKey: identity.publicKey,
    ciphertext,
    encryption: {
      scheme: "armour-passphrase",
      encoding: "armor",
    },
  };
}

export async function restoreSolidIdentityFromBackup(
  input: RestoreSolidIdentityFromBackupOptions,
): Promise<SerializedIdentity> {
  const backup = parseSolidWalletBackup(input.backup);

  if (
    input.expectedWebId !== undefined &&
    backup.webId !== null &&
    backup.webId !== input.expectedWebId
  ) {
    throw new Error(`Solid wallet backup belongs to ${backup.webId}, not ${input.expectedWebId}.`);
  }

  await initArmour();
  const plaintext = await decryptTextWithPassphrase({
    passphrase: input.passphrase,
    data: backup.ciphertext,
  });
  const identity = await validateIdentity(parseIdentity(plaintext));

  if (identity.keyId !== backup.keyId || identity.publicKey !== backup.publicKey) {
    throw new Error("Decrypted Solid wallet backup does not match its backup metadata.");
  }

  return identity;
}
