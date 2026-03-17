import {
  decryptWithPassphrase as rageDecryptWithPassphrase,
  encryptWithPassphrase as rageEncryptWithPassphrase,
} from "@ternent/rage";
import {
  toArmourDecryptionError,
  toArmourEncryptionError,
} from "./errors.js";
import type {
  DecryptWithPassphraseInput,
  EncryptWithPassphraseInput,
} from "./types.js";

export async function encryptWithPassphrase(
  input: EncryptWithPassphraseInput
): Promise<Uint8Array> {
  try {
    return await rageEncryptWithPassphrase({
      passphrase: input.passphrase,
      data: input.data,
      output: input.output,
    });
  } catch (error) {
    throw toArmourEncryptionError(error);
  }
}

export async function decryptWithPassphrase(
  input: DecryptWithPassphraseInput
): Promise<Uint8Array> {
  try {
    return await rageDecryptWithPassphrase({
      passphrase: input.passphrase,
      data: input.data,
    });
  } catch (error) {
    throw toArmourDecryptionError(error);
  }
}
