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
  DecryptTextWithIdentityInput,
  DecryptWithIdentityInput,
  EncryptTextWithRecipientsInput,
  EncryptWithRecipientsInput,
  RageOutputFormat,
} from "./types.js";
import { getWasmBindings } from "./wasm.js";

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

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

function validateRecipients(recipients: string[]): void {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new RageValidationError(
      "RAGE_EMPTY_RECIPIENTS",
      "At least one recipient is required."
    );
  }

  for (const recipient of recipients) {
    const normalized = String(recipient).trim();
    if (!normalized.startsWith("age1")) {
      throw new RageValidationError(
        "RAGE_INVALID_RECIPIENT",
        "Recipient must be an age recipient string."
      );
    }
  }
}

function validateIdentity(identity: string): string {
  const normalized = String(identity).trim();
  if (!normalized.startsWith("AGE-SECRET-KEY-")) {
    throw new RageValidationError(
      "RAGE_INVALID_IDENTITY",
      "Identity must be an age secret key string."
    );
  }
  return normalized;
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

export async function encryptWithRecipients(
  input: EncryptWithRecipientsInput
): Promise<Uint8Array> {
  assertRageInitialized();
  validateRecipients(input.recipients);
  validateData(input.data);

  const output = input.output ?? "armor";
  try {
    const ciphertext = await getWasmBindings().encryptWithRecipients(
      input.recipients,
      input.data,
      output === "armor"
    );
    return normalizeCiphertext(ciphertext, output);
  } catch (error) {
    throw toEncryptionError(error);
  }
}

export async function decryptWithIdentity(
  input: DecryptWithIdentityInput
): Promise<Uint8Array> {
  assertRageInitialized();
  const identity = validateIdentity(input.identity);
  validateData(input.data);

  try {
    const plaintext = await getWasmBindings().decryptWithIdentity(
      identity,
      input.data
    );
    return normalizePlaintext(plaintext);
  } catch (error) {
    throw toDecryptionError(error);
  }
}

export async function encryptTextWithRecipients(
  input: EncryptTextWithRecipientsInput
): Promise<string> {
  const ciphertext = await encryptWithRecipients({
    recipients: input.recipients,
    data: utf8Encoder.encode(input.text),
    output: "armor",
  });

  return utf8Decoder.decode(ciphertext);
}

export async function decryptTextWithIdentity(
  input: DecryptTextWithIdentityInput
): Promise<string> {
  const ciphertext =
    typeof input.data === "string" ? utf8Encoder.encode(input.data) : input.data;
  const plaintext = await decryptWithIdentity({
    identity: input.identity,
    data: ciphertext,
  });

  return decodeUtf8(plaintext);
}
