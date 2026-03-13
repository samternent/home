import { b64decode } from "ternent-utils";

export async function verifyBytes(
  signature: string,
  data: Uint8Array | ArrayBuffer,
  publicKey: CryptoKey
): Promise<boolean> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  return crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    publicKey,
    b64decode(signature),
    bytes
  );
}
