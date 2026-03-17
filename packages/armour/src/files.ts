import { invalidBinaryInputError } from "./errors.js";
import {
  decryptWithIdentity,
  encryptForIdentities,
} from "./recipients.js";
import {
  decryptWithPassphrase,
  encryptWithPassphrase,
} from "./passphrase.js";
import type {
  ArmourBinaryInput,
  DecryptBinaryWithIdentityInput,
  DecryptBinaryWithPassphraseInput,
  EncryptBinaryForIdentitiesInput,
  EncryptBinaryWithPassphraseInput,
} from "./types.js";

async function toUint8Array(data: ArmourBinaryInput): Promise<Uint8Array> {
  if (data instanceof Uint8Array) {
    if (data.byteLength === 0) {
      throw invalidBinaryInputError(data);
    }
    return Uint8Array.from(data);
  }

  if (data instanceof ArrayBuffer) {
    if (data.byteLength === 0) {
      throw invalidBinaryInputError(data);
    }
    return new Uint8Array(data.slice(0));
  }

  if (data instanceof Blob) {
    if (data.size === 0) {
      throw invalidBinaryInputError(data);
    }
    return new Uint8Array(await data.arrayBuffer());
  }

  throw invalidBinaryInputError(data);
}

export async function encryptBinaryForIdentities(
  input: EncryptBinaryForIdentitiesInput
): Promise<Uint8Array> {
  return encryptForIdentities({
    identities: input.identities,
    data: await toUint8Array(input.data),
    output: input.output,
  });
}

export async function decryptBinaryWithIdentity(
  input: DecryptBinaryWithIdentityInput
): Promise<Uint8Array> {
  return decryptWithIdentity({
    identity: input.identity,
    data: await toUint8Array(input.data),
  });
}

export async function encryptBinaryWithPassphrase(
  input: EncryptBinaryWithPassphraseInput
): Promise<Uint8Array> {
  return encryptWithPassphrase({
    passphrase: input.passphrase,
    data: await toUint8Array(input.data),
    output: input.output,
  });
}

export async function decryptBinaryWithPassphrase(
  input: DecryptBinaryWithPassphraseInput
): Promise<Uint8Array> {
  return decryptWithPassphrase({
    passphrase: input.passphrase,
    data: await toUint8Array(input.data),
  });
}
