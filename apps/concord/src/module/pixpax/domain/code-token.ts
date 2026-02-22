import { canonicalStringify } from "@ternent/concord-protocol";

export type PixPaxTokenPayload = {
  v: 3;
  k: string;
  c: string;
  e: number;
};

export type TokenVerifyResult = {
  ok: boolean;
  reason?: string;
  official: boolean;
  payload?: PixPaxTokenPayload;
  tokenHash?: string;
  isExpired?: boolean;
};

function encodeUtf8(value: string) {
  return new TextEncoder().encode(value);
}

function decodeUtf8(value: Uint8Array) {
  return new TextDecoder().decode(value);
}

function base64UrlDecodeToBytes(input: string) {
  const normalized = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${pad}`);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function base64UrlEncodeFromBytes(input: Uint8Array) {
  let binary = "";
  for (let i = 0; i < input.length; i += 1) {
    binary += String.fromCharCode(input[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePem(pem: string) {
  const normalized = String(pem || "");
  return normalized.includes("\\n") ? normalized.replace(/\\n/g, "\n").trim() : normalized.trim();
}

function hexToBytes(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("tokenHash must be a 32-byte hex string");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function derToRaw64(der: Uint8Array) {
  if (der.length < 8 || der[0] !== 0x30) {
    throw new Error("Invalid DER ECDSA signature");
  }

  let offset = 2;
  if (der[1] & 0x80) {
    const lenLen = der[1] & 0x7f;
    offset = 2 + lenLen;
  }

  if (der[offset] !== 0x02) throw new Error("Invalid DER ECDSA signature r");
  const rLen = der[offset + 1];
  const r = der.slice(offset + 2, offset + 2 + rLen);
  offset = offset + 2 + rLen;

  if (der[offset] !== 0x02) throw new Error("Invalid DER ECDSA signature s");
  const sLen = der[offset + 1];
  const s = der.slice(offset + 2, offset + 2 + sLen);

  const raw = new Uint8Array(64);
  const rSlice = r.length > 32 ? r.slice(r.length - 32) : r;
  const sSlice = s.length > 32 ? s.slice(s.length - 32) : s;
  raw.set(rSlice, 32 - rSlice.length);
  raw.set(sSlice, 64 - sSlice.length);
  return raw;
}

function publicPemToDer(publicKeyPem: string) {
  const normalized = normalizePem(publicKeyPem)
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replaceAll("\n", "");
  const binary = atob(normalized);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function verifyRaw64Signature(publicKeyPem: string, payloadBytes: Uint8Array, signatureRaw64: Uint8Array) {
  if (signatureRaw64.length !== 64) return false;
  const key = await crypto.subtle.importKey(
    "spki",
    publicPemToDer(publicKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    signatureRaw64,
    payloadBytes
  );
}

function assertStrictPayload(payload: Record<string, any>) {
  const allowed = new Set(["v", "k", "c", "e"]);
  for (const key of Object.keys(payload || {})) {
    if (!allowed.has(key)) {
      throw new Error(`unsupported token payload field: ${key}`);
    }
  }
  if (payload.v !== 3) throw new Error("token payload v must be 3");
  if (!payload.k || typeof payload.k !== "string") {
    throw new Error("token payload k is required");
  }
  if (!payload.c || typeof payload.c !== "string") {
    throw new Error("token payload c is required");
  }
  if (!Number.isInteger(payload.e) || payload.e < 1) {
    throw new Error("token payload e must be epoch seconds integer");
  }
}

export async function verifyPixpaxTokenOffline(input: {
  token: string;
  issuerPublicKeysByKid: Record<string, string>;
  nowSeconds?: number;
  expLeewaySeconds?: number;
}): Promise<TokenVerifyResult> {
  const raw = String(input.token || "").trim();
  const parts = raw.split(".");
  if (parts.length !== 2) {
    return { ok: false, official: false, reason: "invalid-format" };
  }

  const [payloadB64, signatureB64] = parts;
  let payloadBytes: Uint8Array;
  let signatureBytes: Uint8Array;
  let payload: PixPaxTokenPayload;
  try {
    payloadBytes = base64UrlDecodeToBytes(payloadB64);
    signatureBytes = base64UrlDecodeToBytes(signatureB64);
    payload = JSON.parse(decodeUtf8(payloadBytes)) as PixPaxTokenPayload;
    if (Number((payload as any)?.v) !== 3) {
      return {
        ok: false,
        official: false,
        reason: "legacy-token-unsupported",
      };
    }
    assertStrictPayload(payload as any);
  } catch (error: any) {
    return {
      ok: false,
      official: false,
      reason: `invalid-payload:${String(error?.message || error)}`,
    };
  }

  const canonical = encodeUtf8(canonicalStringify(payload));
  if (canonical.length !== payloadBytes.length) {
    return { ok: false, official: false, reason: "non-canonical-payload-bytes" };
  }
  for (let i = 0; i < canonical.length; i += 1) {
    if (canonical[i] !== payloadBytes[i]) {
      return { ok: false, official: false, reason: "non-canonical-payload-bytes" };
    }
  }

  const publicKeyPem = input.issuerPublicKeysByKid[String(payload.k || "").trim()] || "";
  if (!publicKeyPem) {
    return { ok: false, official: false, reason: "issuer-missing" };
  }

  const signatureValid = await verifyRaw64Signature(publicKeyPem, payloadBytes, signatureBytes);
  if (!signatureValid) {
    return { ok: false, official: false, reason: "signature-invalid" };
  }

  const nowSeconds = Number.isFinite(Number(input.nowSeconds))
    ? Math.floor(Number(input.nowSeconds))
    : Math.floor(Date.now() / 1000);
  const expLeewaySeconds = Number.isFinite(Number(input.expLeewaySeconds))
    ? Math.max(0, Math.floor(Number(input.expLeewaySeconds)))
    : 60;

  const isExpired = Number(payload.e) + expLeewaySeconds < nowSeconds;
  const tokenHash = await sha256Hex(payloadBytes);

  return {
    ok: true,
    official: true,
    payload,
    tokenHash,
    isExpired,
    reason: isExpired ? "expired" : "official",
  };
}

export async function signCollectorProofFromTokenHash(input: {
  tokenHash: string;
  privateKey: CryptoKey;
}) {
  const messageBytes = hexToBytes(input.tokenHash);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    input.privateKey,
    messageBytes
  );
  const signatureBytes = new Uint8Array(signature);
  const raw64 = signatureBytes.length === 64 ? signatureBytes : derToRaw64(signatureBytes);
  return base64UrlEncodeFromBytes(raw64);
}
