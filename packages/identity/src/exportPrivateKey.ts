import { addNewLines, arrayBufferToBase64 } from "concords-utils";

export async function exportPrivateKey(
  privateKey: CryptoKey
): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", privateKey);
}

export async function exportPrivateKeyAsPem(
  privateKey: CryptoKey
): Promise<string> {
  const exportedPrivateKey = await crypto.subtle.exportKey("pkcs8", privateKey);
  return `-----BEGIN PRIVATE KEY-----
${addNewLines(
  arrayBufferToBase64(exportedPrivateKey)
)}-----END PRIVATE KEY-----`;
}
