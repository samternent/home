import {
  RageDecryptionError,
  RageEncryptionError,
  RageValidationError,
  toDecryptionError,
  toEncryptionError,
} from "./errors.js";
import { assertRageInitialized } from "./init.js";
import { MAX_MESSAGE_SIZE } from "./limits.js";
import type {
  DecryptTextWithPassphraseInput,
  DecryptWithPassphraseInput,
  EncryptTextWithPassphraseInput,
  EncryptWithPassphraseInput,
  RageOutputFormat,
} from "./types.js";
import { getWasmBindings } from "./wasm.js";

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

function validatePassphrase(passphrase: string): void {
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new RageValidationError(
      "RAGE_EMPTY_PASSPHRASE",
      "Passphrase must not be empty."
    );
  }
}

function validateData(data: Uint8Array): void {
  if (!(data instanceof Uint8Array) || data.byteLength === 0) {
    throw new RageValidationError(
      "RAGE_EMPTY_DATA",
      "Data must be a non-empty Uint8Array."
    );
  }

  if (data.byteLength > MAX_MESSAGE_SIZE) {
    throw new RageValidationError(
      "RAGE_DATA_TOO_LARGE",
      "Data exceeds the 64MB maximum message size."
    );
  }
}

function normalizeCiphertext(value: unknown, output: RageOutputFormat): Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new RageEncryptionError(
      "RAGE_ENCRYPT_FAILED",
      `Rage WASM returned an invalid ${output} ciphertext payload.`
    );
  }
  return value;
}

function normalizePlaintext(value: unknown): Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new RageDecryptionError(
      "RAGE_DECRYPT_FAILED",
      "Rage WASM returned an invalid plaintext payload."
    );
  }
  return value;
}

function decodeUtf8(data: Uint8Array): string {
  try {
    return utf8Decoder.decode(data);
  } catch (error) {
    throw new RageDecryptionError(
      "RAGE_DECRYPT_FAILED",
      "Decrypted data is not valid UTF-8.",
      error
    );
  }
}

export async function encryptWithPassphrase(
  input: EncryptWithPassphraseInput
): Promise<Uint8Array> {
  assertRageInitialized();
  validatePassphrase(input.passphrase);
  validateData(input.data);

  const output = input.output ?? "armor";
  try {
    const ciphertext = await getWasmBindings().encryptWithPassphrase(
      input.passphrase,
      input.data,
      output === "armor"
    );
    return normalizeCiphertext(ciphertext, output);
  } catch (error) {
    throw toEncryptionError(error);
  }
}

export async function decryptWithPassphrase(
  input: DecryptWithPassphraseInput
): Promise<Uint8Array> {
  assertRageInitialized();
  validatePassphrase(input.passphrase);
  validateData(input.data);

  try {
    const plaintext = await getWasmBindings().decryptWithPassphrase(
      input.passphrase,
      input.data
    );
    return normalizePlaintext(plaintext);
  } catch (error) {
    throw toDecryptionError(error);
  }
}

export async function encryptTextWithPassphrase(
  input: EncryptTextWithPassphraseInput
): Promise<string> {
  const ciphertext = await encryptWithPassphrase({
    passphrase: input.passphrase,
    data: utf8Encoder.encode(input.text),
    output: "armor",
  });

  return utf8Decoder.decode(ciphertext);
}

export async function decryptTextWithPassphrase(
  input: DecryptTextWithPassphraseInput
): Promise<string> {
  const ciphertext =
    typeof input.data === "string" ? utf8Encoder.encode(input.data) : input.data;
  const plaintext = await decryptWithPassphrase({
    passphrase: input.passphrase,
    data: ciphertext,
  });

  return decodeUtf8(plaintext);
}
