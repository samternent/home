import type { SolidIdentityUnlockContext, SolidIdentityUnlocker } from "./types.js";
import { assertPassphrase } from "./identity-shared.js";

function createMissingUnlockerError(): Error {
  return new Error(
    "Solid encrypted identity persistence requires an explicit passphrase unlocker. Provide input.unlocker from your password flow.",
  );
}

export function createStaticSolidIdentityUnlocker(
  passphrase: string,
  mechanism: SolidIdentityUnlocker["mechanism"] = "unsafe-static-passphrase",
): SolidIdentityUnlocker {
  const normalized = assertPassphrase(passphrase);

  return {
    mechanism,
    async unlock(_context: SolidIdentityUnlockContext): Promise<string> {
      return normalized;
    },
  };
}

export function createPassphraseSolidIdentityUnlocker(passphrase: string): SolidIdentityUnlocker {
  return createStaticSolidIdentityUnlocker(passphrase, "password-passphrase");
}

export function createDefaultSolidIdentityUnlocker(): SolidIdentityUnlocker {
  throw createMissingUnlockerError();
}

export function resolveSolidIdentityUnlocker(
  unlocker?: SolidIdentityUnlocker,
): SolidIdentityUnlocker {
  if (unlocker) {
    return unlocker;
  }

  throw createMissingUnlockerError();
}
