import type { RageErrorCode } from "./types.js";

export class RageError extends Error {
  readonly code: RageErrorCode;
  readonly cause?: unknown;

  constructor(code: RageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export class RageInitError extends RageError {}
export class RageValidationError extends RageError {}
export class RageEncryptionError extends RageError {}
export class RageDecryptionError extends RageError {}

function getMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function toEncryptionError(error: unknown): RageError {
  if (error instanceof RageError) {
    return error;
  }

  const message = getMessage(error).toLowerCase();
  if (message.includes("invalid recipient")) {
    return new RageValidationError(
      "RAGE_INVALID_RECIPIENT",
      "Recipient must be an age recipient string.",
      error
    );
  }
  if (message.includes("data too large")) {
    return new RageValidationError(
      "RAGE_DATA_TOO_LARGE",
      "Data exceeds the 64MB maximum message size.",
      error
    );
  }

  return new RageEncryptionError(
    "RAGE_ENCRYPT_FAILED",
    "Failed to encrypt data.",
    error
  );
}

export function toDecryptionError(error: unknown): RageError {
  if (error instanceof RageError) {
    return error;
  }

  const message = getMessage(error).toLowerCase();
  if (message.includes("invalid identity")) {
    return new RageValidationError(
      "RAGE_INVALID_IDENTITY",
      "Identity must be an age secret key string.",
      error
    );
  }

  return new RageDecryptionError(
    "RAGE_DECRYPT_FAILED",
    "Failed to decrypt data.",
    error
  );
}
