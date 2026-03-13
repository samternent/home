import { b64encode } from "ternent-utils";

export async function signBytes(
  signingKey: CryptoKey,
  data: Uint8Array | ArrayBuffer
): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: {
        name: "SHA-256",
      },
    },
    signingKey,
    bytes
  );

  return b64encode(signatureBuffer);
}
