import { addNewLines, arrayBufferToBase64, b64encode } from "ternent-utils";

/**
 * Exports publickey
 * @param key - The key parameter
 * @returns Promise that resolves to string
 * @example
 * ```typescript
 * const result = await exportPublicKey(keyValue);
 * ```
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return b64encode(exported);
}

/**
 * Exports publickeyaspem
 * @param key - The key parameter
 * @returns Promise that resolves to string
 * @example
 * ```typescript
 * const result = await exportPublicKeyAsPem(keyValue);
 * ```
 */
export async function exportPublicKeyAsPem(key: CryptoKey): Promise<string> {
  const exportedPublicKey = await window.crypto.subtle.exportKey("spki", key);
  return `-----BEGIN PUBLIC KEY-----
${addNewLines(arrayBufferToBase64(exportedPublicKey))}-----END PUBLIC KEY-----`;
}
