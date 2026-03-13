import { verifyBytes } from "./verifyBytes";

export async function verify(
  signature: string,
  data: string,
  publicKey: CryptoKey
): Promise<boolean> {
  const dataBuffer = new TextEncoder().encode(data);
  return verifyBytes(signature, dataBuffer, publicKey);
}

export async function verifyJson(
  signature: string,
  data: Object,
  publicKey: CryptoKey
) {
  return verify(signature, JSON.stringify(data), publicKey);
}
