import { utf8Decoder, utf8Encoder } from "./constants.js";
import { invalidUtf8Error } from "./errors.js";
import {
  decryptWithIdentity,
  encryptForIdentities,
} from "./recipients.js";
import {
  decryptWithPassphrase,
  encryptWithPassphrase,
} from "./passphrase.js";
import type {
  DecryptTextWithIdentityInput,
  DecryptTextWithPassphraseInput,
  EncryptTextForIdentitiesInput,
  EncryptTextWithPassphraseInput,
} from "./types.js";

function decodeUtf8(data: Uint8Array): string {
  try {
    return utf8Decoder.decode(data);
  } catch (error) {
    throw invalidUtf8Error(error);
  }
}

function normalizeCiphertext(data: string | Uint8Array): Uint8Array {
  return typeof data === "string" ? utf8Encoder.encode(data) : data;
}

export async function encryptTextForIdentities(
  input: EncryptTextForIdentitiesInput
): Promise<string> {
  const ciphertext = await encryptForIdentities({
    identities: input.identities,
    data: utf8Encoder.encode(input.text),
    output: "armor",
  });

  return utf8Decoder.decode(ciphertext);
}

export async function decryptTextWithIdentity(
  input: DecryptTextWithIdentityInput
): Promise<string> {
  const plaintext = await decryptWithIdentity({
    identity: input.identity,
    data: normalizeCiphertext(input.data),
  });

  return decodeUtf8(plaintext);
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
  const plaintext = await decryptWithPassphrase({
    passphrase: input.passphrase,
    data: normalizeCiphertext(input.data),
  });

  return decodeUtf8(plaintext);
}
