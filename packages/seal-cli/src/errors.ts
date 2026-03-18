import {
  ArmourError,
  ArmourValidationError,
} from "@ternent/armour";

export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;
export const EXIT_HASH_MISMATCH = 2;
export const EXIT_SIGNATURE_INVALID = 3;
export const EXIT_INVALID_PROOF = 4;
export const EXIT_KEY_CONFIG = 5;

export type SealErrorCode =
  | "SEAL_INVALID_RECIPIENT"
  | "SEAL_ENCRYPTION_FAILED"
  | "SEAL_DECRYPTION_FAILED"
  | "SEAL_UNSUPPORTED_ENCRYPTION_MODE";

export class SealError extends Error {
  readonly code: SealErrorCode;
  readonly cause?: unknown;

  constructor(code: SealErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export class SealArtifactError extends SealError {}

export class SealCliError extends Error {
  exitCode: number;

  constructor(message: string, exitCode = EXIT_FAILURE) {
    super(message);
    this.name = "SealCliError";
    this.exitCode = exitCode;
  }
}

export function getExitCode(error: unknown): number {
  if (error instanceof SealCliError) {
    return error.exitCode;
  }
  return EXIT_FAILURE;
}

export function unsupportedEncryptionModeError(
  message = "Seal does not support this encryption mode."
): SealArtifactError {
  return new SealArtifactError(
    "SEAL_UNSUPPORTED_ENCRYPTION_MODE",
    message
  );
}

export function toSealEncryptionError(error: unknown): SealArtifactError {
  if (error instanceof SealArtifactError) {
    return error;
  }

  if (
    error instanceof ArmourValidationError &&
    (error.code === "ARMOUR_EMPTY_RECIPIENTS" ||
      error.code === "ARMOUR_INVALID_RECIPIENT")
  ) {
    return new SealArtifactError(
      "SEAL_INVALID_RECIPIENT",
      "Recipient must be a valid age recipient string.",
      error
    );
  }

  if (error instanceof ArmourError) {
    return new SealArtifactError(
      "SEAL_ENCRYPTION_FAILED",
      "Failed to encrypt payload.",
      error
    );
  }

  return new SealArtifactError(
    "SEAL_ENCRYPTION_FAILED",
    "Failed to encrypt payload.",
    error
  );
}

export function toSealDecryptionError(error: unknown): SealArtifactError {
  if (error instanceof SealArtifactError) {
    return error;
  }

  if (error instanceof ArmourError) {
    return new SealArtifactError(
      "SEAL_DECRYPTION_FAILED",
      "Failed to decrypt payload.",
      error
    );
  }

  return new SealArtifactError(
    "SEAL_DECRYPTION_FAILED",
    "Failed to decrypt payload.",
    error
  );
}
