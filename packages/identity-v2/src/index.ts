import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import {
  generateMnemonic as bip39GenerateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic as bip39ValidateMnemonic,
} from "@scure/bip39";
import { wordlist as englishWordlist } from "@scure/bip39/wordlists/english.js";

const IDENTITY_FORMAT = "ternent-identity" as const;
const IDENTITY_VERSION = "2" as const;
const IDENTITY_ALGORITHM = "Ed25519" as const;
const ED25519_CONTEXT = "ternent-seal/v2";
const IDENTITY_MATERIAL_KIND = "seed" as const;
const IDENTITY_DERIVATION_PATH = "m/101010'/25519'/0'" as const;
const BIP39_LANGUAGE = "english" as const;
const SLIP10_HARDENED_OFFSET = 0x80000000;
const SLIP10_KEY = new TextEncoder().encode("ed25519 seed");
const IDENTITY_PATH_SEGMENTS = [101010, 25519, 0] as const;
const BECH32_GENERATORS = [
  0x3b6a57b2,
  0x26508e6d,
  0x1ea119fa,
  0x3d4233dd,
  0x2a1462b3,
];

export type MnemonicWordCount = 12 | 24;

export type IdentityMaterial = {
  kind: typeof IDENTITY_MATERIAL_KIND;
  seed: string;
};

export type SerializedIdentity = {
  format: typeof IDENTITY_FORMAT;
  version: typeof IDENTITY_VERSION;
  algorithm: typeof IDENTITY_ALGORITHM;
  createdAt: string;
  publicKey: string;
  keyId: string;
  material: IdentityMaterial;
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

function assertWordCount(words: number): MnemonicWordCount {
  if (words === 12 || words === 24) {
    return words;
  }
  throw new Error("Mnemonic word count must be 12 or 24.");
}

function strengthFromWordCount(words: MnemonicWordCount): 128 | 256 {
  return words === 24 ? 256 : 128;
}

function serializeUint32(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

function deriveSlip10Seed(seedBytes: Uint8Array): Uint8Array {
  let chain = hmac(sha512, SLIP10_KEY, seedBytes);
  let key = chain.slice(0, 32);
  let chainCode = chain.slice(32);

  for (const segment of IDENTITY_PATH_SEGMENTS) {
    const index = segment + SLIP10_HARDENED_OFFSET;
    chain = hmac(
      sha512,
      chainCode,
      concatBytes(new Uint8Array([0]), key, serializeUint32(index))
    );
    key = chain.slice(0, 32);
    chainCode = chain.slice(32);
  }

  return key;
}

function isSerializedIdentity(value: unknown): value is SerializedIdentity {
  return (
    isRecord(value) &&
    value.format === IDENTITY_FORMAT &&
    value.version === IDENTITY_VERSION &&
    value.algorithm === IDENTITY_ALGORITHM &&
    typeof value.createdAt === "string" &&
    typeof value.publicKey === "string" &&
    typeof value.keyId === "string" &&
    isRecord(value.material) &&
    value.material.kind === IDENTITY_MATERIAL_KIND &&
    typeof value.material.seed === "string"
  );
}

function toCanonicalIdentity(identity: SerializedIdentity): SerializedIdentity {
  return {
    format: identity.format,
    version: identity.version,
    algorithm: identity.algorithm,
    createdAt: identity.createdAt,
    publicKey: identity.publicKey,
    keyId: identity.keyId,
    material: {
      kind: identity.material.kind,
      seed: identity.material.seed,
    },
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
    return resolveSeedBytes(input.material.seed);
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

function resolveX25519PrivateKeyBytes(input: SeedLike): Uint8Array {
  return ed25519.utils.toMontgomerySecret(resolveSeedBytes(input));
}

function convertEd25519PublicKeyToX25519PublicKeyBytes(
  publicKeyBytes: Uint8Array
): Uint8Array {
  return ed25519.utils.toMontgomery(publicKeyBytes);
}

function resolveX25519PublicKeyBytes(input: PublicKeyLike): Uint8Array {
  if (isRecord(input) && "seed" in input) {
    return x25519.getPublicKey(
      resolveX25519PrivateKeyBytes(
        input.seed as string | Uint8Array | ArrayBuffer
      )
    );
  }
  if (isSerializedIdentity(input)) {
    return x25519.getPublicKey(resolveX25519PrivateKeyBytes(input));
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

async function createIdentityFromSeedBytes(
  seedBytes: Uint8Array,
  createdAt: string
): Promise<SerializedIdentity> {
  const publicKeyBytes = ed25519.getPublicKey(seedBytes);
  return {
    format: IDENTITY_FORMAT,
    version: IDENTITY_VERSION,
    algorithm: IDENTITY_ALGORITHM,
    createdAt,
    publicKey: base64UrlEncode(publicKeyBytes),
    keyId: bytesToHex(sha256(publicKeyBytes)),
    material: {
      kind: IDENTITY_MATERIAL_KIND,
      seed: base64UrlEncode(seedBytes),
    },
  };
}

export function getDefaultSignatureContext(): string {
  return ED25519_CONTEXT;
}

export function getIdentityDerivationPath(): string {
  return IDENTITY_DERIVATION_PATH;
}

export function generateMnemonic(input: {
  words?: MnemonicWordCount;
} = {}): string {
  const words = assertWordCount(input.words ?? 12);
  return bip39GenerateMnemonic(englishWordlist, strengthFromWordCount(words));
}

export function validateMnemonic(
  mnemonic: string,
  options: { wordlist?: typeof BIP39_LANGUAGE } = {}
): boolean {
  if (options.wordlist && options.wordlist !== BIP39_LANGUAGE) {
    throw new Error("Only the English BIP-39 wordlist is supported.");
  }
  return bip39ValidateMnemonic(String(mnemonic || "").trim(), englishWordlist);
}

export async function createIdentity(
  createdAt = new Date().toISOString()
): Promise<SerializedIdentity> {
  return createIdentityFromSeedBytes(
    ed25519.utils.randomSecretKey(),
    createdAt
  );
}

export async function createIdentityFromMnemonic(input: {
  mnemonic: string;
  passphrase?: string;
  createdAt?: string;
}): Promise<SerializedIdentity> {
  const mnemonic = String(input.mnemonic || "").trim();
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Mnemonic phrase is not a valid English BIP-39 phrase.");
  }
  const mnemonicSeed = mnemonicToSeedSync(mnemonic, input.passphrase || "");
  const derivedSeed = deriveSlip10Seed(mnemonicSeed);
  return createIdentityFromSeedBytes(
    derivedSeed,
    input.createdAt ?? new Date().toISOString()
  );
}

export async function createMnemonicIdentity(input: {
  words?: MnemonicWordCount;
  passphrase?: string;
  createdAt?: string;
} = {}): Promise<{ identity: SerializedIdentity; mnemonic: string }> {
  const mnemonic = generateMnemonic({ words: input.words ?? 12 });
  return {
    mnemonic,
    identity: await createIdentityFromMnemonic({
      mnemonic,
      passphrase: input.passphrase,
      createdAt: input.createdAt,
    }),
  };
}

export async function derivePublicKey(
  seed: string | Uint8Array | ArrayBuffer
): Promise<string> {
  return base64UrlEncode(ed25519.getPublicKey(resolveSeedBytes(seed)));
}

export async function deriveKeyId(
  publicKey: string | Uint8Array | ArrayBuffer
): Promise<string> {
  return bytesToHex(sha256(resolvePublicKeyBytes(publicKey)));
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
  const derivedPublicKey = await derivePublicKey(parsed.material.seed);
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
  return base64UrlEncode(
    ed25519.sign(
      combineContext(ensureBytes(payload, "Payload"), options.context),
      resolveSeedBytes(identityOrSeed)
    )
  );
}

export async function verifyBytes(
  publicKey: string | Uint8Array | ArrayBuffer,
  payload: Uint8Array | ArrayBuffer,
  signature: string,
  options: { context?: string } = {}
): Promise<boolean> {
  return ed25519.verify(
    base64UrlDecode(signature),
    combineContext(ensureBytes(payload, "Payload"), options.context),
    resolvePublicKeyBytes(publicKey)
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
  return base64UrlEncode(resolveX25519PrivateKeyBytes(input));
}

export async function deriveX25519PublicKey(input: PublicKeyLike): Promise<string> {
  return base64UrlEncode(resolveX25519PublicKeyBytes(input));
}

export async function convertEd25519PublicKeyToX25519PublicKey(
  publicKey: string | Uint8Array | ArrayBuffer
): Promise<string> {
  return base64UrlEncode(
    convertEd25519PublicKeyToX25519PublicKeyBytes(resolvePublicKeyBytes(publicKey))
  );
}

export async function deriveAgeRecipient(input: PublicKeyLike): Promise<string> {
  return bech32Encode("age", resolveX25519PublicKeyBytes(input));
}

export async function deriveAgeSecretKey(input: SeedLike): Promise<string> {
  return bech32Encode(
    "age-secret-key-",
    resolveX25519PrivateKeyBytes(input)
  ).toUpperCase();
}
