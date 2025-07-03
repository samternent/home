import { removeLines, base64ToArrayBuffer } from "ternent-utils";

interface IPoints {
  x: string;
  y: string;
}

/**
 * importPrivateKey function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function importPrivateKey(
  points: IPoints,
  secret: string
): Promise<CryptoKey> {
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
 * Imports privatekeyfrompem
 * @param key - The key parameter
 * @returns Promise that resolves to CryptoKey
 * @example
 * ```typescript
 * const result = await importPrivateKeyFromPem("example");
 * ```
 */
export async function importPrivateKeyFromPem(key: string): Promise<CryptoKey> {
  const b64key = key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "");

  return crypto.subtle.importKey(
    "pkcs8",
    base64ToArrayBuffer(removeLines(b64key)),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
}
