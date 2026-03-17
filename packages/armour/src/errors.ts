import {
  RageDecryptionError,
  RageEncryptionError,
  RageError,
  RageInitError,
  RageValidationError,
} from "@ternent/rage";
import type { ArmourErrorCode } from "./types.js";

export class ArmourError extends Error {
  readonly code: ArmourErrorCode;
  readonly cause?: unknown;

  constructor(code: ArmourErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export class ArmourInitError extends ArmourError {}
export class ArmourValidationError extends ArmourError {}
export class ArmourIdentityError extends ArmourError {}
export class ArmourEncryptionError extends ArmourError {}
export class ArmourDecryptionError extends ArmourError {}

function getMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function toArmourInitError(error: unknown): ArmourInitError {
  if (error instanceof ArmourInitError) {
    return error;
  }
  return new ArmourInitError(
    "ARMOUR_INIT_FAILED",
    "Failed to initialize Armour.",
    error
  );
}

export function toArmourIdentityError(
  error: unknown,
  code: "ARMOUR_INVALID_IDENTITY" | "ARMOUR_IDENTITY_DERIVATION_FAILED",
  fallbackMessage: string
): ArmourIdentityError {
  if (error instanceof ArmourIdentityError) {
    return error;
  }

  return new ArmourIdentityError(code, fallbackMessage, error);
}

export function toArmourEncryptionError(error: unknown): ArmourError {
  if (error instanceof ArmourError) {
    return error;
  }

  if (error instanceof RageInitError) {
    return new ArmourInitError(
      "ARMOUR_INIT_FAILED",
      "Armour is not initialized. Call initArmour() before encrypting or decrypting.",
      error
    );
  }

  if (error instanceof RageValidationError) {
    switch (error.code) {
      case "RAGE_EMPTY_DATA":
        return new ArmourValidationError(
          "ARMOUR_EMPTY_DATA",
          "Data must be a non-empty Uint8Array.",
          error
        );
      case "RAGE_EMPTY_RECIPIENTS":
        return new ArmourValidationError(
          "ARMOUR_EMPTY_RECIPIENTS",
          "At least one recipient is required.",
          error
        );
      case "RAGE_INVALID_RECIPIENT":
        return new ArmourValidationError(
          "ARMOUR_INVALID_RECIPIENT",
          "Recipient must be an age recipient string.",
          error
        );
      case "RAGE_EMPTY_PASSPHRASE":
        return new ArmourValidationError(
          "ARMOUR_EMPTY_PASSPHRASE",
          "Passphrase must not be empty.",
          error
        );
      case "RAGE_DATA_TOO_LARGE":
        return new ArmourValidationError(
          "ARMOUR_DATA_TOO_LARGE",
          "Data exceeds the 64MB maximum message size.",
          error
        );
      default:
        break;
    }
  }

  if (error instanceof RageEncryptionError || error instanceof RageError) {
    return new ArmourEncryptionError(
      "ARMOUR_ENCRYPT_FAILED",
      "Failed to encrypt data.",
      error
    );
  }

  return new ArmourEncryptionError(
    "ARMOUR_ENCRYPT_FAILED",
    "Failed to encrypt data.",
    error
  );
}

export function toArmourDecryptionError(error: unknown): ArmourError {
  if (error instanceof ArmourError) {
    return error;
  }

  if (error instanceof RageInitError) {
    return new ArmourInitError(
      "ARMOUR_INIT_FAILED",
      "Armour is not initialized. Call initArmour() before encrypting or decrypting.",
      error
    );
  }

  if (error instanceof RageValidationError) {
    switch (error.code) {
      case "RAGE_EMPTY_DATA":
        return new ArmourValidationError(
          "ARMOUR_EMPTY_DATA",
          "Data must be a non-empty Uint8Array.",
          error
        );
      case "RAGE_INVALID_IDENTITY":
        return new ArmourValidationError(
          "ARMOUR_INVALID_SECRET_KEY",
          "Secret key must be an age secret key string.",
          error
        );
      case "RAGE_EMPTY_PASSPHRASE":
        return new ArmourValidationError(
          "ARMOUR_EMPTY_PASSPHRASE",
          "Passphrase must not be empty.",
          error
        );
      default:
        break;
    }
  }

  if (error instanceof RageDecryptionError || error instanceof RageError) {
    return new ArmourDecryptionError(
      "ARMOUR_DECRYPT_FAILED",
      "Failed to decrypt data.",
      error
    );
  }

  return new ArmourDecryptionError(
    "ARMOUR_DECRYPT_FAILED",
    "Failed to decrypt data.",
    error
  );
}
export function invalidUtf8Error(error: unknown): ArmourDecryptionError {
  return new ArmourDecryptionError(
    "ARMOUR_DECRYPT_FAILED",
    "Decrypted data is not valid UTF-8.",
    error
  );
}

export function invalidBinaryInputError(value: unknown): ArmourValidationError {
  const detail =
    value instanceof ArrayBuffer || value instanceof Uint8Array || value instanceof Blob
      ? "Data must be a non-empty Blob, File, ArrayBuffer, or Uint8Array."
      : `Unsupported binary input type: ${getMessage(value)}`;

  return new ArmourValidationError("ARMOUR_EMPTY_DATA", detail, value);
}
