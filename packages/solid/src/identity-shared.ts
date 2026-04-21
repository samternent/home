import type { MnemonicWordCount } from "@ternent/identity";
import type { SolidSessionLike } from "./types.js";

export const SOLID_MNEMONIC_FORMAT = "ternent-solid-mnemonic" as const;
export const SOLID_MNEMONIC_VERSION = "1" as const;
export const SOLID_WALLET_FORMAT = "ternent-solid-wallet" as const;
export const SOLID_WALLET_VERSION = "1" as const;
export const SOLID_ENCRYPTED_IDENTITY_FORMAT = "ternent-solid-encrypted-identity" as const;
export const SOLID_ENCRYPTED_IDENTITY_VERSION = "2" as const;
export const SOLID_UNLOCKER_NAMESPACE = "ternent-solid-identity-unlock/v1";

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

function bufferFromBase64(input: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(input, "base64"));
  }

  if (typeof atob === "function") {
    const decoded = atob(input);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i += 1) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  }

  throw new Error("Base64 decoding is not available in this runtime.");
}

function base64FromBytes(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  if (typeof btoa === "function") {
    let text = "";
    for (let i = 0; i < bytes.length; i += 1) {
      text += String.fromCharCode(bytes[i]);
    }
    return btoa(text);
  }

  throw new Error("Base64 encoding is not available in this runtime.");
}

export function bytesToBase64Url(input: ArrayBuffer | Uint8Array): string {
  return base64FromBytes(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  return bufferFromBase64(`${normalized}${"=".repeat(padLength)}`);
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, next) => sum + next.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

export function assertCryptoSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "object") {
    throw new Error("Web Crypto API is required for Solid identity encryption unlock workflows.");
  }
  return globalThis.crypto.subtle;
}

export function assertCrypto(): Crypto {
  if (typeof globalThis.crypto !== "object") {
    throw new Error("Web Crypto API is required for Solid identity encryption unlock workflows.");
  }
  return globalThis.crypto;
}

export async function sha256Base64Url(input: Uint8Array): Promise<string> {
  const digest = await assertCryptoSubtle().digest("SHA-256", input);
  return bytesToBase64Url(digest);
}

export function assertPassphrase(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error("Solid identity unlocker returned an empty passphrase.");
  }
  return normalized;
}

export function randomBase64Url(size = 32): string {
  const bytes = new Uint8Array(size);
  assertCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function resolveRpId(input?: string): string {
  const explicit = String(input || "").trim();
  if (explicit) {
    return explicit;
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    return window.location.hostname;
  }

  throw new Error(
    "Passkey unlock requires an rpId when window.location.hostname is unavailable.",
  );
}

export function resolveExpectedOrigin(): string | undefined {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return undefined;
}
