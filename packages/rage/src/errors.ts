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

export interface SerializedRageError {
  name: string;
  message: string;
  code?: RageErrorCode;
  cause?: unknown;
  stack?: string;
}

function getMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function serializeError(error: unknown): SerializedRageError {
  if (error instanceof RageError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      cause: serializeCause(error.cause),
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    const serialized: SerializedRageError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    if ("cause" in error) {
      serialized.cause = serializeCause(Reflect.get(error, "cause"));
    }

    return serialized;
  }

  return {
    name: "Error",
    message: String(error),
  };
}

export function deserializeError(error: SerializedRageError): Error {
  if (error.code) {
    const ctor = getRageErrorConstructor(error.name, error.code);
    const hydrated = new ctor(error.code, error.message, error.cause);
    if (error.stack) {
      hydrated.stack = error.stack;
    }
    return hydrated;
  }

  const hydrated = new Error(error.message);
  hydrated.name = error.name;
  if (error.stack) {
    hydrated.stack = error.stack;
  }
  if (error.cause !== undefined) {
    Reflect.set(hydrated, "cause", error.cause);
  }
  return hydrated;
}

function serializeCause(cause: unknown): unknown {
  if (cause === null) {
    return null;
  }

  if (
    typeof cause === "string" ||
    typeof cause === "number" ||
    typeof cause === "boolean"
  ) {
    return cause;
  }

  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    };
  }

  return undefined;
}

function getRageErrorConstructor(name: string, code: RageErrorCode) {
  switch (name) {
    case "RageValidationError":
      return RageValidationError;
    case "RageEncryptionError":
      return RageEncryptionError;
    case "RageDecryptionError":
      return RageDecryptionError;
    case "RageInitError":
      return RageInitError;
  }

  switch (code) {
    case "RAGE_EMPTY_DATA":
    case "RAGE_EMPTY_RECIPIENTS":
    case "RAGE_INVALID_RECIPIENT":
    case "RAGE_INVALID_IDENTITY":
    case "RAGE_EMPTY_PASSPHRASE":
    case "RAGE_DATA_TOO_LARGE":
      return RageValidationError;
    case "RAGE_ENCRYPT_FAILED":
      return RageEncryptionError;
    case "RAGE_DECRYPT_FAILED":
      return RageDecryptionError;
    case "RAGE_INIT_FAILED":
    default:
      return RageInitError;
  }
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
