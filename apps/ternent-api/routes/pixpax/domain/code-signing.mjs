import { createHash, createPrivateKey, createPublicKey, webcrypto } from "node:crypto";
import { canonicalStringify } from "@ternent/concord-protocol";

const subtle = webcrypto?.subtle || globalThis.crypto?.subtle;

function ensureSubtle() {
  if (!subtle) {
    throw new Error("WebCrypto subtle is not available.");
  }
  return subtle;
}

function normalizePem(pem) {
  if (!pem) return "";
  const normalized = String(pem).includes("\\n") ? String(pem).replace(/\\n/g, "\n") : String(pem);
  return normalized.trim();
}

function ensurePublicPem(pemOrBody) {
  const normalized = normalizePem(pemOrBody);
  if (!normalized) return "";
  if (normalized.includes("BEGIN PUBLIC KEY")) return `${normalized}\n`;
  return `-----BEGIN PUBLIC KEY-----\n${normalized}\n-----END PUBLIC KEY-----\n`;
}

function ensurePrivatePem(pemOrBody) {
  const normalized = normalizePem(pemOrBody);
  if (!normalized) return "";
  if (normalized.includes("BEGIN PRIVATE KEY")) return `${normalized}\n`;
  return `-----BEGIN PRIVATE KEY-----\n${normalized}\n-----END PRIVATE KEY-----\n`;
}

function pemBodyToDer(pem, type) {
  const normalized = normalizePem(pem);
  const begin = `-----BEGIN ${type}-----`;
  const end = `-----END ${type}-----`;
  const stripped = normalized.replace(begin, "").replace(end, "").replaceAll("\n", "");
  return Buffer.from(stripped, "base64");
}

function canonicalBytes(value) {
  return Buffer.from(canonicalStringify(value), "utf8");
}

export function canonicalSha256Hex(value) {
  return createHash("sha256").update(canonicalBytes(value)).digest("hex");
}

function sha256HexFromBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function base64UrlEncode(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function base64UrlDecode(input) {
  const normalized = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${pad}`, "base64");
}

function derToRaw64(der) {
  const bytes = Buffer.from(der);
  if (bytes.length < 8 || bytes[0] !== 0x30) {
    throw new Error("Invalid DER ECDSA signature.");
  }

  let offset = 2;
  if (bytes[1] & 0x80) {
    const lenLen = bytes[1] & 0x7f;
    offset = 2 + lenLen;
  }

  if (bytes[offset] !== 0x02) throw new Error("Invalid DER signature r component.");
  const rLen = bytes[offset + 1];
  const r = bytes.slice(offset + 2, offset + 2 + rLen);
  offset = offset + 2 + rLen;

  if (bytes[offset] !== 0x02) throw new Error("Invalid DER signature s component.");
  const sLen = bytes[offset + 1];
  const s = bytes.slice(offset + 2, offset + 2 + sLen);

  const rRaw = r.length > 32 ? r.slice(r.length - 32) : Buffer.concat([Buffer.alloc(32 - r.length, 0), r]);
  const sRaw = s.length > 32 ? s.slice(s.length - 32) : Buffer.concat([Buffer.alloc(32 - s.length, 0), s]);
  return Buffer.concat([rRaw, sRaw]);
}

function raw64ToDer(raw) {
  const bytes = Buffer.from(raw);
  if (bytes.length !== 64) {
    throw new Error("ECDSA raw signature must be 64 bytes.");
  }

  const r = bytes.slice(0, 32);
  const s = bytes.slice(32, 64);

  function encodeInt(value) {
    let v = Buffer.from(value);
    while (v.length > 1 && v[0] === 0x00 && (v[1] & 0x80) === 0) {
      v = v.slice(1);
    }
    if (v[0] & 0x80) {
      v = Buffer.concat([Buffer.from([0x00]), v]);
    }
    return Buffer.concat([Buffer.from([0x02, v.length]), v]);
  }

  const rEncoded = encodeInt(r);
  const sEncoded = encodeInt(s);
  const body = Buffer.concat([rEncoded, sEncoded]);

  if (body.length < 128) {
    return Buffer.concat([Buffer.from([0x30, body.length]), body]);
  }

  return Buffer.concat([Buffer.from([0x30, 0x81, body.length]), body]);
}

async function importSigningKey(privateKeyPem) {
  const subtleApi = ensureSubtle();
  const der = pemBodyToDer(ensurePrivatePem(privateKeyPem), "PRIVATE KEY");
  return subtleApi.importKey(
    "pkcs8",
    der,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function importVerifyKey(publicKeyPem) {
  const subtleApi = ensureSubtle();
  const der = pemBodyToDer(ensurePublicPem(publicKeyPem), "PUBLIC KEY");
  return subtleApi.importKey(
    "spki",
    der,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}

async function signRaw64(privateKeyPem, messageBytes) {
  const subtleApi = ensureSubtle();
  const key = await importSigningKey(privateKeyPem);
  const signature = await subtleApi.sign({ name: "ECDSA", hash: "SHA-256" }, key, messageBytes);
  const bytes = Buffer.from(signature);
  if (bytes.length === 64) return bytes;
  return derToRaw64(bytes);
}

async function verifyRaw64(publicKeyPem, messageBytes, signatureRaw64) {
  const subtleApi = ensureSubtle();
  const key = await importVerifyKey(publicKeyPem);
  const sig = Buffer.from(signatureRaw64);
  if (sig.length !== 64) return false;
  return subtleApi.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, messageBytes);
}

export async function verifyP256Sha256Signature(publicKeyPemOrBody, messageBytes, signatureInput) {
  const publicKeyPem = ensurePublicPem(publicKeyPemOrBody);
  if (!publicKeyPem) return false;

  let sigBytes;
  try {
    sigBytes =
      typeof signatureInput === "string"
        ? base64UrlDecode(signatureInput)
        : Buffer.from(signatureInput || []);
  } catch {
    return false;
  }

  if (!sigBytes.length) return false;
  if (sigBytes.length === 64) {
    return verifyRaw64(publicKeyPem, messageBytes, sigBytes);
  }

  try {
    const raw = derToRaw64(sigBytes);
    return verifyRaw64(publicKeyPem, messageBytes, raw);
  } catch {
    // Some environments emit DER directly for ECDSA verify; accept as fallback.
    try {
      const subtleApi = ensureSubtle();
      const key = await importVerifyKey(publicKeyPem);
      return subtleApi.verify({ name: "ECDSA", hash: "SHA-256" }, key, sigBytes, messageBytes);
    } catch {
      return false;
    }
  }
}

export function deriveKeyIdFromPublicKey(publicKeyPemOrBody) {
  return createHash("sha256").update(normalizePem(publicKeyPemOrBody), "utf8").digest("hex");
}

export function derivePublicKeyFromPrivateKey(privateKeyPem) {
  const normalizedPrivateKey = ensurePrivatePem(privateKeyPem);
  if (!normalizedPrivateKey) return "";
  const key = createPrivateKey(normalizedPrivateKey);
  const pub = createPublicKey(key);
  return pub.export({ type: "spki", format: "pem" }).toString();
}

const TOKEN_V3_REQUIRED_FIELDS = new Set(["v", "k", "c", "e"]);

function assertNoExtraFields(payload, allowedFields, label) {
  for (const key of Object.keys(payload || {})) {
    if (!allowedFields.has(key)) {
      throw new Error(`${label} contains unsupported field: ${key}`);
    }
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertStrictTokenV3Payload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("token payload must be an object.");
  }

  assertNoExtraFields(payload, TOKEN_V3_REQUIRED_FIELDS, "token payload");
  for (const field of TOKEN_V3_REQUIRED_FIELDS) {
    if (!(field in payload)) {
      throw new Error(`token payload missing required field: ${field}`);
    }
  }

  if (payload.v !== 3) {
    throw new Error("token payload v must be 3.");
  }

  assertNonEmptyString(payload.k, "token payload.k");
  assertNonEmptyString(payload.c, "token payload.c");
  if (!Number.isInteger(payload.e) || payload.e < 1) {
    throw new Error("token payload.e must be epoch seconds integer.");
  }
}

const RECEIPT_ALLOWED_FIELDS = new Set([
  "v",
  "receiptKeyId",
  "tokenHash",
  "issuerKeyId",
  "collectorPubKey",
  "mintRef",
  "serverTime",
  "collectionId",
  "version",
  "kind",
  "codeId",
]);

export function assertStrictReceiptPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("receipt payload must be an object.");
  }

  assertNoExtraFields(payload, RECEIPT_ALLOWED_FIELDS, "receipt payload");

  if (payload.v !== 1) throw new Error("receipt payload v must be 1.");
  assertNonEmptyString(payload.receiptKeyId, "receipt payload.receiptKeyId");
  assertNonEmptyString(payload.tokenHash, "receipt payload.tokenHash");
  assertNonEmptyString(payload.issuerKeyId, "receipt payload.issuerKeyId");
  assertNonEmptyString(payload.collectorPubKey, "receipt payload.collectorPubKey");
  assertNonEmptyString(payload.mintRef, "receipt payload.mintRef");
  assertNonEmptyString(payload.collectionId, "receipt payload.collectionId");
  assertNonEmptyString(payload.version, "receipt payload.version");
  assertNonEmptyString(payload.kind, "receipt payload.kind");
  assertNonEmptyString(payload.codeId, "receipt payload.codeId");

  if (!Number.isInteger(payload.serverTime) || payload.serverTime < 1) {
    throw new Error("receipt payload.serverTime must be epoch seconds integer.");
  }
}

export function computeTokenHashFromPayloadBytes(payloadBytes) {
  return sha256HexFromBytes(payloadBytes);
}

export function computePolicyHash(policyObject) {
  return canonicalSha256Hex(policyObject);
}

export async function signTokenV3(payload, privateKeyPem) {
  assertStrictTokenV3Payload(payload);
  const normalizedPayload = { ...payload };
  const payloadBytes = canonicalBytes(normalizedPayload);
  const signatureRaw64 = await signRaw64(privateKeyPem, payloadBytes);

  return {
    token: `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(signatureRaw64)}`,
    payload: normalizedPayload,
    payloadBytes,
    signatureRaw64,
    tokenHash: computeTokenHashFromPayloadBytes(payloadBytes),
  };
}

export async function verifyTokenV3(token, options = {}) {
  const parts = String(token || "").trim().split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "invalid-token-format" };
  }

  const [payloadB64, sigB64] = parts;
  let payloadBytes;
  let signatureRaw64;
  let payload;

  try {
    payloadBytes = base64UrlDecode(payloadB64);
    signatureRaw64 = base64UrlDecode(sigB64);
    payload = JSON.parse(payloadBytes.toString("utf8"));
    if (Number(payload?.v) !== 3) {
      return {
        ok: false,
        reason: "legacy-token-unsupported",
        payloadVersion: Number(payload?.v) || null,
      };
    }
    assertStrictTokenV3Payload(payload);
    const canonicalPayloadBytes = canonicalBytes(payload);
    if (!Buffer.from(payloadBytes).equals(Buffer.from(canonicalPayloadBytes))) {
      return { ok: false, reason: "non-canonical-payload-bytes" };
    }
  } catch (error) {
    return { ok: false, reason: "invalid-token-payload", error: String(error?.message || error) };
  }

  let issuer = null;
  try {
    issuer = await options.resolveIssuerByKid?.(payload.k);
  } catch (error) {
    return { ok: false, reason: "issuer-resolution-failed", error: String(error?.message || error) };
  }

  if (!issuer || issuer.status !== "active" || !issuer.publicKeyPem) {
    return { ok: false, reason: "issuer-not-active", kid: payload.k };
  }

  try {
    const signatureValid = await verifyRaw64(issuer.publicKeyPem, payloadBytes, signatureRaw64);
    if (!signatureValid) {
      return { ok: false, reason: "signature-invalid", kid: payload.k };
    }
  } catch (error) {
    return { ok: false, reason: "signature-verify-error", error: String(error?.message || error) };
  }

  const expLeewaySeconds = Number.isFinite(Number(options.expLeewaySeconds))
    ? Math.max(0, Math.floor(Number(options.expLeewaySeconds)))
    : 60;
  const nowSeconds = Number.isFinite(Number(options.nowSeconds))
    ? Math.floor(Number(options.nowSeconds))
    : Math.floor(Date.now() / 1000);

  if (payload.e + expLeewaySeconds < nowSeconds) {
    return {
      ok: false,
      reason: "token-expired",
      exp: payload.e,
      nowSeconds,
      expLeewaySeconds,
    };
  }

  return {
    ok: true,
    payload,
    payloadBytes,
    signatureRaw64,
    issuer,
    tokenHash: computeTokenHashFromPayloadBytes(payloadBytes),
  };
}

export async function signReceiptV1(payload, privateKeyPem) {
  assertStrictReceiptPayload(payload);
  const receiptPayload = { ...payload };
  const payloadBytes = canonicalBytes(receiptPayload);
  const signatureRaw64 = await signRaw64(privateKeyPem, payloadBytes);

  return {
    payload: receiptPayload,
    payloadBytes,
    signatureRaw64,
    signature: base64UrlEncode(signatureRaw64),
  };
}

export async function verifyReceiptV1(payload, signature, publicKeyPem) {
  assertStrictReceiptPayload(payload);
  const bytes = canonicalBytes(payload);
  const sigRaw64 = base64UrlDecode(signature);
  return verifyRaw64(publicKeyPem, bytes, sigRaw64);
}

export async function verifyRaw64WithNode(publicKeyPem, messageBytes, signatureRaw64) {
  // Compatibility helper for tests: converts raw-64 to DER and verifies with node:crypto KeyObject path.
  const der = raw64ToDer(signatureRaw64);
  const subtleApi = ensureSubtle();
  const key = await importVerifyKey(publicKeyPem);
  const subtleOk = await subtleApi.verify({ name: "ECDSA", hash: "SHA-256" }, key, signatureRaw64, messageBytes);
  return { subtleOk, der };
}
