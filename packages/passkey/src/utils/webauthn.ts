import {
  PasskeyCreateRejectedError,
  PasskeyGetRejectedError,
  PasskeyUnsupportedError,
} from "../errors.js";

export function isSecureContextLike(): boolean {
  if (typeof globalThis.window !== "undefined" && typeof window.isSecureContext === "boolean") {
    return window.isSecureContext;
  }

  return true;
}

export function resolveOrigin(): string {
  if (typeof globalThis.window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export function resolveRpId(input?: string): string {
  const explicit = String(input || "").trim();
  if (explicit) {
    return explicit;
  }

  if (typeof globalThis.window !== "undefined" && window.location?.hostname) {
    return window.location.hostname;
  }

  throw new PasskeyUnsupportedError(
    "Passkey operations require an rpId when window.location.hostname is unavailable.",
  );
}

export function assertSupported(): void {
  const hasPkc = typeof globalThis.PublicKeyCredential === "function";
  const credentials = globalThis.navigator?.credentials;
  const hasCreate = typeof credentials?.create === "function";
  const hasGet = typeof credentials?.get === "function";

  if (!isSecureContextLike() || !hasPkc || !hasCreate || !hasGet) {
    throw new PasskeyUnsupportedError();
  }
}

export function normalizeCreateError(error: unknown): Error {
  if (error instanceof PasskeyUnsupportedError) {
    return error;
  }

  if (error instanceof Error) {
    if (
      error.name === "AbortError" ||
      error.name === "NotAllowedError" ||
      error.name === "InvalidStateError"
    ) {
      return new PasskeyCreateRejectedError(error.message);
    }
    return error;
  }

  return new PasskeyCreateRejectedError(String(error));
}

export function normalizeGetError(error: unknown): Error {
  if (error instanceof PasskeyUnsupportedError) {
    return error;
  }

  if (error instanceof Error) {
    if (
      error.name === "AbortError" ||
      error.name === "NotAllowedError" ||
      error.name === "InvalidStateError"
    ) {
      return new PasskeyGetRejectedError(error.message);
    }
    return error;
  }

  return new PasskeyGetRejectedError(String(error));
}

export function ensureRegistrationCredential(value: Credential | null): PublicKeyCredential {
  if (!(value instanceof PublicKeyCredential)) {
    throw new PasskeyCreateRejectedError("Passkey registration did not return a PublicKeyCredential.");
  }

  if (!(value.response instanceof AuthenticatorAttestationResponse)) {
    throw new PasskeyCreateRejectedError("Passkey registration did not return an attestation response.");
  }

  return value;
}

export function ensureApprovalCredential(value: Credential | null): PublicKeyCredential {
  if (!(value instanceof PublicKeyCredential)) {
    throw new PasskeyGetRejectedError("Passkey approval did not return a PublicKeyCredential.");
  }

  if (!(value.response instanceof AuthenticatorAssertionResponse)) {
    throw new PasskeyGetRejectedError("Passkey approval did not return an assertion response.");
  }

  return value;
}
