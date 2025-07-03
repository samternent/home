import { removeLines, base64ToArrayBuffer } from "concords-utils";

interface IPoints {
  x: string | undefined;
  y: string | undefined;
}

/**
 * importPublicKey function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function importPublicKey(points: IPoints): Promise<CryptoKey> {
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
 * Imports publickeyfrompem
 * @param key - The key parameter
 * @returns Promise that resolves to CryptoKey
 * @example
 * ```typescript
 * const result = await importPublicKeyFromPem("example");
 * ```
 */
export async function importPublicKeyFromPem(key: string): Promise<CryptoKey> {
  const b64key = key
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "");
  return crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(removeLines(b64key)),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}
