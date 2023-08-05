import { removeLines, base64ToArrayBuffer } from "concords-utils";

interface IPoints {
  x: string;
  y: string;
}

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
