export type TotpPolicy = {
  issuer: string;
  accountName: string;
  digits: 6;
  period: 30;
};

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function assertCryptoSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "object") {
    throw new Error("Web Crypto API is required for authenticator verification.");
  }
  return globalThis.crypto.subtle;
}

function normalizeBase32(input: string): string {
  return String(input || "")
    .toUpperCase()
    .replace(/=+$/g, "")
    .replace(/\s+/g, "");
}

function base32Encode(bytes: Uint8Array): string {
  let value = 0;
  let bits = 0;
  let output = "";

  for (let index = 0; index < bytes.length; index += 1) {
    value = (value << 8) | bytes[index];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Uint8Array {
  const normalized = normalizeBase32(input);
  if (!normalized) {
    throw new Error("Authenticator secret is required.");
  }

  let value = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const mapped = BASE32_ALPHABET.indexOf(character);
    if (mapped === -1) {
      throw new Error("Authenticator secret is not valid Base32.");
    }
    value = (value << 5) | mapped;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

function toCounterBytes(counter: number): Uint8Array {
  const output = new Uint8Array(8);
  let value = Math.max(0, Math.floor(counter));

  for (let index = 7; index >= 0; index -= 1) {
    output[index] = value & 0xff;
    value = Math.floor(value / 256);
  }

  return output;
}

async function hmacSha1(secret: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const key = await assertCryptoSubtle().importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const digest = await assertCryptoSubtle().sign("HMAC", key, message);
  return new Uint8Array(digest);
}

async function totpAtCounter(input: {
  secretBase32: string;
  counter: number;
  digits: number;
}): Promise<string> {
  const secret = base32Decode(input.secretBase32);
  const digest = await hmacSha1(secret, toCounterBytes(input.counter));
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  const modulo = 10 ** input.digits;
  const code = binary % modulo;
  return String(code).padStart(input.digits, "0");
}

export function generateTotpSecret(length = 20): string {
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Web Crypto API is required for authenticator enrollment.");
  }
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

export function createOtpAuthUri(input: {
  secretBase32: string;
  policy: TotpPolicy;
}): string {
  const issuer = encodeURIComponent(input.policy.issuer);
  const account = encodeURIComponent(input.policy.accountName);
  const secret = normalizeBase32(input.secretBase32);

  return (
    `otpauth://totp/${issuer}:${account}` +
    `?secret=${secret}&issuer=${issuer}&algorithm=SHA1` +
    `&digits=${input.policy.digits}&period=${input.policy.period}`
  );
}

export async function verifyTotpCode(input: {
  secretBase32: string;
  code: string;
  policy: TotpPolicy;
  timeMs?: number;
  window?: number;
}): Promise<boolean> {
  const normalizedCode = String(input.code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const period = input.policy.period;
  const nowMs = input.timeMs ?? Date.now();
  const baseCounter = Math.floor(nowMs / 1000 / period);
  const window = Math.max(0, input.window ?? 1);

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = await totpAtCounter({
      secretBase32: input.secretBase32,
      counter: baseCounter + offset,
      digits: input.policy.digits,
    });
    if (expected === normalizedCode) {
      return true;
    }
  }

  return false;
}
