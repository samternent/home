import { addNewLines, arrayBufferToBase64, b64encode } from "concords-utils";

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return b64encode(exported);
}

export async function exportPublicKeyAsPem(key: CryptoKey): Promise<string> {
  const exportedPublicKey = await window.crypto.subtle.exportKey("spki", key);
  return `-----BEGIN PUBLIC KEY-----
${addNewLines(arrayBufferToBase64(exportedPublicKey))}-----END PUBLIC KEY-----`;
}
