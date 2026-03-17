import {
  decryptWithIdentity as rageDecryptWithIdentity,
  encryptWithRecipients as rageEncryptWithRecipients,
} from "@ternent/rage";
import {
  normalizeSecretKey,
  recipientFromIdentity,
  resolveIdentity,
  secretKeyFromIdentity,
} from "./identity.js";
import {
  toArmourDecryptionError,
  toArmourEncryptionError,
} from "./errors.js";
import type {
  ArmourIdentityInput,
  DecryptWithIdentityInput,
  DecryptWithSecretKeyInput,
  EncryptForIdentitiesInput,
  EncryptForRecipientsInput,
} from "./types.js";

export async function recipientsFromIdentities(
  identities: ArmourIdentityInput[]
): Promise<string[]> {
  const resolved: string[] = [];

  for (const identity of identities) {
    await resolveIdentity(identity);
    resolved.push(await recipientFromIdentity(identity));
  }

  return resolved;
}

export async function encryptForRecipients(
  input: EncryptForRecipientsInput
): Promise<Uint8Array> {
  try {
    return await rageEncryptWithRecipients({
      recipients: input.recipients,
      data: input.data,
      output: input.output,
    });
  } catch (error) {
    throw toArmourEncryptionError(error);
  }
}

export async function decryptWithSecretKey(
  input: DecryptWithSecretKeyInput
): Promise<Uint8Array> {
  try {
    return await rageDecryptWithIdentity({
      identity: await normalizeSecretKey(input.secretKey),
      data: input.data,
    });
  } catch (error) {
    throw toArmourDecryptionError(error);
  }
}

export async function encryptForIdentities(
  input: EncryptForIdentitiesInput
): Promise<Uint8Array> {
  return encryptForRecipients({
    recipients: await recipientsFromIdentities(input.identities),
    data: input.data,
    output: input.output,
  });
}

export async function decryptWithIdentity(
  input: DecryptWithIdentityInput
): Promise<Uint8Array> {
  try {
    return await rageDecryptWithIdentity({
      identity: await secretKeyFromIdentity(input.identity),
      data: input.data,
    });
  } catch (error) {
    throw toArmourDecryptionError(error);
  }
}
