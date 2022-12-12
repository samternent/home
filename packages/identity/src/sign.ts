import { b64encode } from "@concords/utils";

export async function sign(signingKey: CryptoKey, data: string) {
  const dataBuffer = new TextEncoder().encode(JSON.stringify(data));
  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: {
        name: "SHA-256",
      },
    },
    signingKey,
    dataBuffer
  );

  return b64encode(signatureBuffer);
}
