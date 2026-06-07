import type { MnemonicWordCount } from "@ternent/identity";
import type { SolidSessionLike } from "./types.js";

export const SOLID_MNEMONIC_FORMAT = "ternent-solid-mnemonic" as const;
export const SOLID_MNEMONIC_VERSION = "1" as const;
export const SOLID_WALLET_FORMAT = "ternent-solid-wallet" as const;
export const SOLID_WALLET_VERSION = "1" as const;
export const SOLID_ENCRYPTED_IDENTITY_FORMAT = "ternent-solid-encrypted-identity" as const;
export const SOLID_ENCRYPTED_IDENTITY_VERSION = "2" as const;

export function assertWebId(session: SolidSessionLike): string {
  const webId = String(session.info?.webId || "").trim();
  if (!webId) {
    throw new Error(
      "Solid session is missing a WebID. Ensure the session is authenticated before accessing Solid-backed resources.",
    );
  }
  return webId;
}

export function assertMnemonicWords(words?: number): MnemonicWordCount | undefined {
  if (words === undefined) {
    return undefined;
  }
  if (words === 12 || words === 24) {
    return words;
  }
  throw new Error("Mnemonic word count must be 12 or 24.");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function assertPassphrase(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error("Solid identity unlocker returned an empty passphrase.");
  }
  return normalized;
}
