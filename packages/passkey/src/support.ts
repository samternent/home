import { PasskeyUnsupportedError } from "./errors.js";
import { assertSupported } from "./utils/webauthn.js";

export function isSupported(): boolean {
  try {
    assertSupported();
    return true;
  } catch {
    return false;
  }
}

export function requireSupport(): void {
  try {
    assertSupported();
  } catch (error) {
    if (error instanceof PasskeyUnsupportedError) {
      throw error;
    }
    throw new PasskeyUnsupportedError(String(error));
  }
}
