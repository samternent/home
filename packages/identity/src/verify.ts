import { b64decode } from "@concords/utils";

export async function verify(
  signature: string,
  data: string,
  publicKey: CryptoKey
): Promise<boolean> {
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

export async function verifyJson(
  signature: string,
  data: Object,
  publicKey: CryptoKey
) {
  return verify(signature, JSON.stringify(data), publicKey);
}
