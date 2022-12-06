import {
  arrayBufferToBase64,
  addNewLines,
  removeLines,
  base64ToArrayBuffer,
  b64encode,
  b64decode,
} from "@concords/utils";

export async function generate() {
  return await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
}

/**
 * Import Signing Key from public key
 *
 * ```typescript
 * const signingKey: CryptoKey = await importSigningKey(identity, secret);
 * ```
 */
export function importSigningKey(points, secret) {
  if (!points || !secret) {
    return;
  }

  return crypto.subtle.importKey(
    "jwk",
    {
      crv: "P-256",
      ext: true,
      kty: "EC",
      ...points,
      d: secret,
    },
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign"]
  );
}
/**
 * Import Signing Key from public key
 *
 * ```typescript
 * const signingKey: CryptoKey = await importSigningKey(identity, secret);
 * ```
 */
export function importPublicKey(points) {
  if (!points) {
    return;
  }

  return crypto.subtle.importKey(
    "jwk",
    {
      crv: "P-256",
      ext: true,
      kty: "EC",
      ...points,
    },
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"]
  );
}

/**
 * Export Identity from signing key
 *
 * ```typescript
 * const user: Identity = await exportSigningKey(signingKey);
 *
 * const uniquePublicIdentifier = `${user.x}${user.y}`;
 * ```
 */
export async function exportSigningKey(signingKey) {
  return await crypto.subtle.exportKey("jwk", signingKey);
}

export async function exportPrivateKeyAsPem(signingKey) {
  const exportedPrivateKey = await crypto.subtle.exportKey("pkcs8", signingKey);
  return `-----BEGIN PRIVATE KEY-----
${addNewLines(
  arrayBufferToBase64(exportedPrivateKey)
)}-----END PRIVATE KEY-----`;
}

export async function importPrivateKeyFromPem(key) {
  const b64key = key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "");

  return window.crypto.subtle.importKey(
    "pkcs8",
    base64ToArrayBuffer(removeLines(b64key)),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
}

export async function importPublicKeyFromPem(key) {
  const b64key = key
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "");
  return window.crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(removeLines(b64key)),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}

/**
 * Export public key as der
 *
 * ```typescript
 * const b64der: string = await exportPublicKeyAsDer(publicKey);
 * ```
 */

export async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(exported)));
}

export async function exportPublicKeyAsPem(key) {
  const exportedPublicKey = await window.crypto.subtle.exportKey("spki", key);
  return `-----BEGIN PUBLIC KEY-----
${addNewLines(arrayBufferToBase64(exportedPublicKey))}-----END PUBLIC KEY-----`;
}

export async function sign(signingKey, data) {
  const dataBuffer = new TextEncoder().encode(data);
  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: {
        name: "SHA-256",
      },
    },
    signingKey,
    dataBuffer
  );

  return b64encode(signatureBuffer);
}

export async function signJson(signingKey, data) {
  return sign(signingKey, JSON.stringify(data));
}
export async function signBase64(signingKey, data) {
  return sign(signingKey, b64decode(data));
}

/**
 * Verify signature on JSON object
 *
 * ```typescript
 * const isSignatureValid: Boolean = await verifySignature(identity, signature, data);
 * ```
 */
export async function verify(signature, data, identity) {
  const publicKey = await importPublicKey(identity);
  const dataBuffer = new TextEncoder().encode(data);

  return crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    publicKey,
    b64decode(signature),
    dataBuffer
  );
}

export async function verifyJson(signature, data, key) {
  return verify(signature, JSON.stringify(data), key);
}
export async function verifyBase64(signature, data, key) {
  return verify(signature, b64decode(data), key);
}
