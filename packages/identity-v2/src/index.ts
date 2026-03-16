const IDENTITY_FORMAT = "ternent-identity" as const;
const IDENTITY_VERSION = "2" as const;
const IDENTITY_ALGORITHM = "Ed25519" as const;
const ED25519_CONTEXT = "ternent-seal/v2";

const ED25519_PKCS8_PREFIX = hexToBytes("302e020100300506032b657004220420");
const ED25519_SPKI_PREFIX = hexToBytes("302a300506032b6570032100");
const X25519_PKCS8_PREFIX = hexToBytes("302e020100300506032b656e04220420");

const CURVE25519_P = (1n << 255n) - 19n;
const BECH32_GENERATORS = [
  0x3b6a57b2,
  0x26508e6d,
  0x1ea119fa,
  0x3d4233dd,
  0x2a1462b3,
];

function getWebCrypto(): Crypto {
  if (typeof globalThis.crypto !== "undefined") {
    return globalThis.crypto;
  }
  throw new Error("Web Crypto is not available in this runtime.");
}

function base64Encode(bytes: Uint8Array): string {
  const buffer = (globalThis as typeof globalThis & {
    Buffer?: {
      from(input: Uint8Array): { toString(encoding: "base64"): string };
      from(input: string, encoding: "base64"): Uint8Array;
    };
  }).Buffer;

  if (buffer) {
    return buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }
  throw new Error("Base64 encoding is not available in this runtime.");
}

function base64Decode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const buffer = (globalThis as typeof globalThis & {
    Buffer?: {
      from(input: Uint8Array): { toString(encoding: "base64"): string };
      from(input: string, encoding: "base64"): Uint8Array;
    };
  }).Buffer;

  if (buffer) {
    return new Uint8Array(buffer.from(normalized, "base64"));
  }

  if (typeof atob !== "undefined") {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  throw new Error("Base64 decoding is not available in this runtime.");
}

export type SerializedIdentity = {
  format: typeof IDENTITY_FORMAT;
  version: typeof IDENTITY_VERSION;
  algorithm: typeof IDENTITY_ALGORITHM;
  createdAt: string;
  seed: string;
  publicKey: string;
  keyId: string;
};

type SeedLike = SerializedIdentity | Uint8Array | ArrayBuffer | string;
type PublicKeyLike =
  | SerializedIdentity
  | Uint8Array
  | ArrayBuffer
  | string
  | { publicKey: string | Uint8Array | ArrayBuffer }
  | { seed: string | Uint8Array | ArrayBuffer };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hexToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function ensureBytes(
  value: Uint8Array | ArrayBuffer,
  label: string
): Uint8Array {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  if (bytes.length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

function normalizeBase64Url(value: string): string {
  return String(value || "")
    .trim()
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlEncode(bytes: Uint8Array): string {
  return base64Encode(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = normalizeBase64Url(value);
  if (!normalized) {
    throw new Error("Base64url value is required.");
  }
  const pad =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return base64Decode(`${normalized}${pad}`);
}

function utf8Bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function combineContext(
  payload: Uint8Array,
  context = ED25519_CONTEXT
): Uint8Array {
  return concatBytes(utf8Bytes(context), new Uint8Array([0]), payload);
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const hash = await getWebCrypto().subtle.digest("SHA-256", bytes);
  return new Uint8Array(hash);
}

async function sha512(bytes: Uint8Array): Promise<Uint8Array> {
  const hash = await getWebCrypto().subtle.digest("SHA-512", bytes);
  return new Uint8Array(hash);
}

function toLittleEndianBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (let index = bytes.length - 1; index >= 0; index -= 1) {
    result = (result << 8n) + BigInt(bytes[index]);
  }
  return result;
}

function fromLittleEndianBigInt(value: bigint, length: number): Uint8Array {
  let remaining = value;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

function mod(value: bigint, modulus: bigint): bigint {
  const result = value % modulus;
  return result >= 0n ? result : result + modulus;
}

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  let factor = mod(base, modulus);
  let power = exponent;
  while (power > 0n) {
    if (power & 1n) {
      result = mod(result * factor, modulus);
    }
    factor = mod(factor * factor, modulus);
    power >>= 1n;
  }
  return result;
}

function modInverse(value: bigint, modulus: bigint): bigint {
  if (value === 0n) {
    throw new Error("Cannot invert zero in the field.");
  }
  return modPow(value, modulus - 2n, modulus);
}

async function importEd25519PrivateKey(seedBytes: Uint8Array): Promise<CryptoKey> {
  return getWebCrypto().subtle.importKey(
    "pkcs8",
    concatBytes(ED25519_PKCS8_PREFIX, seedBytes),
    { name: "Ed25519" },
    true,
    ["sign"]
  );
}

async function importEd25519PublicKey(publicKeyBytes: Uint8Array): Promise<CryptoKey> {
  return getWebCrypto().subtle.importKey(
    "spki",
    concatBytes(ED25519_SPKI_PREFIX, publicKeyBytes),
    { name: "Ed25519" },
    true,
    ["verify"]
  );
}

async function exportEd25519PublicKeyFromSeed(
  seedBytes: Uint8Array
): Promise<Uint8Array> {
  const privateKey = await importEd25519PrivateKey(seedBytes);
  const jwk = (await getWebCrypto().subtle.exportKey(
    "jwk",
    privateKey
  )) as JsonWebKey;
  if (!jwk.x) {
    throw new Error("Unable to derive Ed25519 public key.");
  }
  return base64UrlDecode(jwk.x);
}

async function exportX25519PublicKeyFromScalar(
  scalarBytes: Uint8Array
): Promise<Uint8Array> {
  const privateKey = await getWebCrypto().subtle.importKey(
    "pkcs8",
    concatBytes(X25519_PKCS8_PREFIX, scalarBytes),
    { name: "X25519" },
    true,
    ["deriveBits"]
  );
  const jwk = (await getWebCrypto().subtle.exportKey(
    "jwk",
    privateKey
  )) as JsonWebKey;
  if (!jwk.x) {
    throw new Error("Unable to derive X25519 public key.");
  }
  return base64UrlDecode(jwk.x);
}

function isSerializedIdentity(value: unknown): value is SerializedIdentity {
  return (
    isRecord(value) &&
    value.format === IDENTITY_FORMAT &&
    value.version === IDENTITY_VERSION &&
    value.algorithm === IDENTITY_ALGORITHM &&
    typeof value.createdAt === "string" &&
    typeof value.seed === "string" &&
    typeof value.publicKey === "string" &&
    typeof value.keyId === "string"
  );
}

function toCanonicalIdentity(identity: SerializedIdentity): SerializedIdentity {
  return {
    format: identity.format,
    version: identity.version,
    algorithm: identity.algorithm,
    createdAt: identity.createdAt,
    seed: identity.seed,
    publicKey: identity.publicKey,
    keyId: identity.keyId,
  };
}

function resolveSeedBytes(input: SeedLike): Uint8Array {
  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    const bytes = ensureBytes(input, "Seed");
    if (bytes.length !== 32) {
      throw new Error("Seed must be 32 bytes.");
    }
    return bytes;
  }
  if (typeof input === "string") {
    const bytes = base64UrlDecode(input);
    if (bytes.length !== 32) {
      throw new Error("Seed must be 32 bytes.");
    }
    return bytes;
  }
  if (isSerializedIdentity(input)) {
    return resolveSeedBytes(input.seed);
  }
  throw new Error("A valid identity or 32-byte seed is required.");
}

function resolvePublicKeyBytes(input: PublicKeyLike): Uint8Array {
  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    const bytes = ensureBytes(input, "Public key");
    if (bytes.length !== 32) {
      throw new Error("Public key must be 32 bytes.");
    }
    return bytes;
  }
  if (typeof input === "string") {
    const bytes = base64UrlDecode(input);
    if (bytes.length !== 32) {
      throw new Error("Public key must be 32 bytes.");
    }
    return bytes;
  }
  if (isSerializedIdentity(input)) {
    return resolvePublicKeyBytes(input.publicKey);
  }
  if (isRecord(input) && "publicKey" in input) {
    return resolvePublicKeyBytes(
      input.publicKey as string | Uint8Array | ArrayBuffer
    );
  }
  throw new Error("A valid 32-byte public key is required.");
}

async function resolveX25519PrivateKeyBytes(input: SeedLike): Promise<Uint8Array> {
  const seedBytes = resolveSeedBytes(input);
  const hashed = await sha512(seedBytes);
  const scalar = hashed.slice(0, 32);
  scalar[0] &= 248;
  scalar[31] &= 127;
  scalar[31] |= 64;
  return scalar;
}

function convertEd25519PublicKeyToX25519PublicKeyBytes(
  publicKeyBytes: Uint8Array
): Uint8Array {
  const yBytes = publicKeyBytes.slice();
  yBytes[31] &= 0x7f;
  const y = toLittleEndianBigInt(yBytes);
  const numerator = mod(1n + y, CURVE25519_P);
  const denominator = mod(1n - y, CURVE25519_P);
  const u = mod(
    numerator * modInverse(denominator, CURVE25519_P),
    CURVE25519_P
  );
  return fromLittleEndianBigInt(u, 32);
}

async function resolveX25519PublicKeyBytes(
  input: PublicKeyLike
): Promise<Uint8Array> {
  if (isRecord(input) && "seed" in input) {
    return exportX25519PublicKeyFromScalar(
      await resolveX25519PrivateKeyBytes(
        input.seed as string | Uint8Array | ArrayBuffer
      )
    );
  }
  if (isSerializedIdentity(input)) {
    return exportX25519PublicKeyFromScalar(
      await resolveX25519PrivateKeyBytes(input)
    );
  }
  if (
    typeof input === "string" ||
    input instanceof Uint8Array ||
    input instanceof ArrayBuffer
  ) {
    return convertEd25519PublicKeyToX25519PublicKeyBytes(
      resolvePublicKeyBytes(input)
    );
  }
  if (isRecord(input) && "publicKey" in input) {
    return convertEd25519PublicKeyToX25519PublicKeyBytes(
      resolvePublicKeyBytes(
        input.publicKey as string | Uint8Array | ArrayBuffer
      )
    );
  }
  throw new Error("A valid identity seed or Ed25519 public key is required.");
}

function bech32Polymod(values: number[]): number {
  let checksum = 1;
  for (const value of values) {
    const top = checksum >>> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let bit = 0; bit < 5; bit += 1) {
      if ((top >>> bit) & 1) {
        checksum ^= BECH32_GENERATORS[bit];
      }
    }
  }
  return checksum;
}

function bech32HrpExpand(hrp: string): number[] {
  const output: number[] = [];
  for (let index = 0; index < hrp.length; index += 1) {
    output.push(hrp.charCodeAt(index) >> 5);
  }
  output.push(0);
  for (let index = 0; index < hrp.length; index += 1) {
    output.push(hrp.charCodeAt(index) & 31);
  }
  return output;
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number): number[] {
  let value = 0;
  let bits = 0;
  const maxValue = (1 << toBits) - 1;
  const output: number[] = [];
  for (const byte of data) {
    value = (value << fromBits) | byte;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      output.push((value >> bits) & maxValue);
    }
  }
  if (bits > 0) {
    output.push((value << (toBits - bits)) & maxValue);
  }
  return output;
}

function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values = [...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const polymod = bech32Polymod(values) ^ 1;
  const checksum: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    checksum.push((polymod >> (5 * (5 - index))) & 31);
  }
  return checksum;
}

function bech32Encode(hrp: string, data: Uint8Array): string {
  const charset = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const words = convertBits(data, 8, 5);
  const combined = [...words, ...bech32CreateChecksum(hrp, words)];
  return `${hrp}1${combined.map((value) => charset[value]).join("")}`;
}

export function getDefaultSignatureContext(): string {
  return ED25519_CONTEXT;
}

export async function createIdentity(
  createdAt = new Date().toISOString()
): Promise<SerializedIdentity> {
  const seedBytes = getWebCrypto().getRandomValues(new Uint8Array(32));
  const publicKeyBytes = await exportEd25519PublicKeyFromSeed(seedBytes);
  return {
    format: IDENTITY_FORMAT,
    version: IDENTITY_VERSION,
    algorithm: IDENTITY_ALGORITHM,
    createdAt,
    seed: base64UrlEncode(seedBytes),
    publicKey: base64UrlEncode(publicKeyBytes),
    keyId: await deriveKeyId(publicKeyBytes),
  };
}

export async function derivePublicKey(
  seed: string | Uint8Array | ArrayBuffer
): Promise<string> {
  return base64UrlEncode(
    await exportEd25519PublicKeyFromSeed(resolveSeedBytes(seed))
  );
}

export async function deriveKeyId(
  publicKey: string | Uint8Array | ArrayBuffer
): Promise<string> {
  return bytesToHex(await sha256(resolvePublicKeyBytes(publicKey)));
}

export function parseIdentity(input: string | SerializedIdentity): SerializedIdentity {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;
  if (!isSerializedIdentity(parsed)) {
    throw new Error("Identity payload must be a ternent-identity v2 object.");
  }
  return toCanonicalIdentity(parsed);
}

export function serializeIdentity(
  identity: SerializedIdentity,
  pretty = true
): string {
  return `${JSON.stringify(parseIdentity(identity), null, pretty ? 2 : 0)}\n`;
}

export async function validateIdentity(
  identity: SerializedIdentity
): Promise<SerializedIdentity> {
  const parsed = parseIdentity(identity);
  const derivedPublicKey = await derivePublicKey(parsed.seed);
  if (derivedPublicKey !== normalizeBase64Url(parsed.publicKey)) {
    throw new Error("Identity publicKey does not match the stored seed.");
  }
  const derivedKeyId = await deriveKeyId(parsed.publicKey);
  if (derivedKeyId !== parsed.keyId) {
    throw new Error("Identity keyId does not match the public key.");
  }
  return parsed;
}

export async function signBytes(
  identityOrSeed: SeedLike,
  payload: Uint8Array | ArrayBuffer,
  options: { context?: string } = {}
): Promise<string> {
  const privateKey = await importEd25519PrivateKey(resolveSeedBytes(identityOrSeed));
  const signature = await getWebCrypto().subtle.sign(
    "Ed25519",
    privateKey,
    combineContext(ensureBytes(payload, "Payload"), options.context)
  );
  return base64UrlEncode(new Uint8Array(signature));
}

export async function verifyBytes(
  publicKey: string | Uint8Array | ArrayBuffer,
  payload: Uint8Array | ArrayBuffer,
  signature: string,
  options: { context?: string } = {}
): Promise<boolean> {
  const verifyKey = await importEd25519PublicKey(resolvePublicKeyBytes(publicKey));
  return getWebCrypto().subtle.verify(
    "Ed25519",
    verifyKey,
    base64UrlDecode(signature),
    combineContext(ensureBytes(payload, "Payload"), options.context)
  );
}

export async function signUtf8(
  identityOrSeed: SeedLike,
  value: string,
  options: { context?: string } = {}
): Promise<string> {
  return signBytes(identityOrSeed, utf8Bytes(value), options);
}

export async function verifyUtf8(
  publicKey: string | Uint8Array | ArrayBuffer,
  value: string,
  signature: string,
  options: { context?: string } = {}
): Promise<boolean> {
  return verifyBytes(publicKey, utf8Bytes(value), signature, options);
}

export async function deriveX25519PrivateKey(input: SeedLike): Promise<string> {
  return base64UrlEncode(await resolveX25519PrivateKeyBytes(input));
}

export async function deriveX25519PublicKey(input: PublicKeyLike): Promise<string> {
  return base64UrlEncode(await resolveX25519PublicKeyBytes(input));
}

export async function convertEd25519PublicKeyToX25519PublicKey(
  publicKey: string | Uint8Array | ArrayBuffer
): Promise<string> {
  return base64UrlEncode(
    convertEd25519PublicKeyToX25519PublicKeyBytes(resolvePublicKeyBytes(publicKey))
  );
}

export async function deriveAgeRecipient(input: PublicKeyLike): Promise<string> {
  return bech32Encode("age", await resolveX25519PublicKeyBytes(input));
}

export async function deriveAgeSecretKey(input: SeedLike): Promise<string> {
  return bech32Encode(
    "age-secret-key-",
    await resolveX25519PrivateKeyBytes(input)
  ).toUpperCase();
}
