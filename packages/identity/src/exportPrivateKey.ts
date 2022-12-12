import { addNewLines, arrayBufferToBase64 } from "@concords/utils";

export async function exportSigningKey(
  signingKey: CryptoKey
): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", signingKey);
}

export async function exportPrivateKeyAsPem(
  signingKey: CryptoKey
): Promise<string> {
  const exportedPrivateKey = await crypto.subtle.exportKey("pkcs8", signingKey);
  return `-----BEGIN PRIVATE KEY-----
${addNewLines(
  arrayBufferToBase64(exportedPrivateKey)
)}-----END PRIVATE KEY-----`;
}
