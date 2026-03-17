import {
  deriveAgeRecipient,
  deriveAgeSecretKey,
  parseIdentity,
  type SerializedIdentity,
} from "@ternent/identity";
import { AGE_SECRET_KEY_PREFIX } from "./constants.js";
import {
  ArmourIdentityError,
  ArmourValidationError,
  toArmourIdentityError,
} from "./errors.js";
import type { ArmourIdentityInput } from "./types.js";

export async function resolveIdentity(
  input: ArmourIdentityInput
): Promise<SerializedIdentity> {
  try {
    return parseIdentity(input);
  } catch (error) {
    throw toArmourIdentityError(
      error,
      "ARMOUR_INVALID_IDENTITY",
      "Identity input must be a valid @ternent/identity serialized identity."
    );
  }
}

export async function recipientFromIdentity(
  input: ArmourIdentityInput
): Promise<string> {
  const identity = await resolveIdentity(input);

  try {
    return await deriveAgeRecipient(identity);
  } catch (error) {
    throw toArmourIdentityError(
      error,
      "ARMOUR_IDENTITY_DERIVATION_FAILED",
      "Failed to derive an age recipient from the provided identity."
    );
  }
}

export async function secretKeyFromIdentity(
  input: ArmourIdentityInput
): Promise<string> {
  const identity = await resolveIdentity(input);

  try {
    return await deriveAgeSecretKey(identity);
  } catch (error) {
    throw toArmourIdentityError(
      error,
      "ARMOUR_IDENTITY_DERIVATION_FAILED",
      "Failed to derive an age secret key from the provided identity."
    );
  }
}

export async function normalizeSecretKey(secretKey: string): Promise<string> {
  const normalized = String(secretKey || "").trim();

  if (!normalized.startsWith(AGE_SECRET_KEY_PREFIX)) {
    throw new ArmourValidationError(
      "ARMOUR_INVALID_SECRET_KEY",
      "Secret key must be an age secret key string."
    );
  }

  return normalized;
}

export async function assertIdentityCapabilityRoot(
  input: ArmourIdentityInput
): Promise<SerializedIdentity> {
  const identity = await resolveIdentity(input);
  if (identity.algorithm !== "Ed25519") {
    throw new ArmourIdentityError(
      "ARMOUR_INVALID_IDENTITY",
      "Identity algorithm must be Ed25519."
    );
  }
  return identity;
}
