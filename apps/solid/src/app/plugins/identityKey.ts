import { deriveKeyId } from "@ternent/identity";

const IDENTITY_KEY_PATTERN = /^did:key:z[1-9A-HJ-NP-Za-km-z]{20,}$/;
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_LOOKUP = new Map(Array.from(BASE58_ALPHABET).map((char, index) => [char, index]));
const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);
const ED25519_PUBLIC_KEY_BYTES = 32;

function decodeBase64Url(value: string): Uint8Array {
  const normalized = String(value || "")
    .trim()
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  if (!normalized) {
    throw new Error("Public key is required.");
  }

  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  const buffer = (
    globalThis as typeof globalThis & {
      Buffer?: {
        from(input: string, encoding: "base64"): Uint8Array;
      };
    }
  ).Buffer;

  if (buffer) {
    return new Uint8Array(buffer.from(`${normalized}${pad}`, "base64"));
  }

  if (typeof atob === "undefined") {
    throw new Error("Base64url decoding is unavailable in this runtime.");
  }

  const binary = atob(`${normalized}${pad}`);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function resolveEd25519PublicKeyBytes(input: string | Uint8Array | ArrayBuffer): Uint8Array {
  const bytes =
    typeof input === "string"
      ? decodeBase64Url(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);

  if (bytes.length !== ED25519_PUBLIC_KEY_BYTES) {
    throw new Error("Identity key must reference a 32-byte Ed25519 public key.");
  }

  return bytes;
}

function decodeBase58(input: string): Uint8Array {
  const value = String(input || "").trim();
  if (!value) {
    throw new Error("Identity key multibase payload is required.");
  }

  let numeric = 0n;

  for (const character of value) {
    const digit = BASE58_LOOKUP.get(character);
    if (digit === undefined) {
      throw new Error(`Identity key contains invalid base58 character '${character}'.`);
    }
    numeric = numeric * 58n + BigInt(digit);
  }

  const bytes: number[] = [];
  while (numeric > 0n) {
    bytes.push(Number(numeric % 256n));
    numeric /= 256n;
  }
  bytes.reverse();

  let leadingZeros = 0;
  for (const character of value) {
    if (character !== "1") {
      break;
    }
    leadingZeros += 1;
  }

  return new Uint8Array([...new Array(leadingZeros).fill(0), ...bytes]);
}

function encodeBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return "";
  }

  let numeric = 0n;
  for (const byte of bytes) {
    numeric = (numeric << 8n) + BigInt(byte);
  }

  let encoded = "";
  while (numeric > 0n) {
    const digit = Number(numeric % 58n);
    encoded = BASE58_ALPHABET[digit] + encoded;
    numeric /= 58n;
  }

  let leadingZeros = 0;
  for (const byte of bytes) {
    if (byte !== 0) {
      break;
    }
    leadingZeros += 1;
  }

  return `${"1".repeat(leadingZeros)}${encoded}`;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export function isIdentityKeyFormat(value: string): boolean {
  return IDENTITY_KEY_PATTERN.test(String(value || "").trim());
}

export function shortIdentityKey(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= 28) {
    return normalized;
  }

  return `${normalized.slice(0, 16)}...${normalized.slice(-8)}`;
}

export async function validateIdentityKey(input: string): Promise<string> {
  const normalized = String(input || "").trim();

  if (!isIdentityKeyFormat(normalized)) {
    throw new Error("Identity key must be a did:key:z Ed25519 value.");
  }

  const decoded = decodeBase58(normalized.slice("did:key:z".length));
  if (decoded.length !== ED25519_MULTICODEC_PREFIX.length + ED25519_PUBLIC_KEY_BYTES) {
    throw new Error("Identity key must decode to an Ed25519 multicodec key.");
  }

  const prefix = decoded.slice(0, ED25519_MULTICODEC_PREFIX.length);
  if (!equalBytes(prefix, ED25519_MULTICODEC_PREFIX)) {
    throw new Error("Identity key multicodec prefix is not Ed25519.");
  }

  const publicKeyBytes = decoded.slice(ED25519_MULTICODEC_PREFIX.length);

  // Final parse through the shared identity library.
  await deriveKeyId(publicKeyBytes);

  return normalized;
}

export async function toLegacyAuthorDidFromIdentityKey(identityKey: string): Promise<string> {
  const normalized = await validateIdentityKey(identityKey);
  const decoded = decodeBase58(normalized.slice("did:key:z".length));
  const publicKeyBytes = decoded.slice(ED25519_MULTICODEC_PREFIX.length);
  const keyId = await deriveKeyId(publicKeyBytes);
  return `did:key:${keyId}`;
}

export function identityKeyToPublicKeyBytes(identityKey: string): Uint8Array {
  const normalized = String(identityKey || "").trim();
  if (!isIdentityKeyFormat(normalized)) {
    throw new Error("Identity key must be a did:key:z Ed25519 value.");
  }

  const decoded = decodeBase58(normalized.slice("did:key:z".length));
  if (decoded.length !== ED25519_MULTICODEC_PREFIX.length + ED25519_PUBLIC_KEY_BYTES) {
    throw new Error("Identity key must decode to an Ed25519 multicodec key.");
  }

  const prefix = decoded.slice(0, ED25519_MULTICODEC_PREFIX.length);
  if (!equalBytes(prefix, ED25519_MULTICODEC_PREFIX)) {
    throw new Error("Identity key multicodec prefix is not Ed25519.");
  }

  return decoded.slice(ED25519_MULTICODEC_PREFIX.length);
}

export function toDidKeyFromPublicKey(publicKey: string | Uint8Array | ArrayBuffer): string {
  const publicKeyBytes = resolveEd25519PublicKeyBytes(publicKey);

  const prefixed = new Uint8Array(ED25519_MULTICODEC_PREFIX.length + publicKeyBytes.length);
  prefixed.set(ED25519_MULTICODEC_PREFIX, 0);
  prefixed.set(publicKeyBytes, ED25519_MULTICODEC_PREFIX.length);

  return `did:key:z${encodeBase58(prefixed)}`;
}
