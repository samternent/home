import { addNewLines, hashData, stripIdentityKey } from "ternent-utils";
import { exportPublicKey } from "./exportPublicKey";

function normalizePublicKeyBody(publicKeyBase64: string): string {
  return addNewLines(publicKeyBase64).trimEnd();
}

export async function deriveKeyIdFromPublicKeyBase64(
  publicKeyBase64: string
): Promise<string> {
  return hashData(normalizePublicKeyBody(publicKeyBase64));
}

export async function deriveKeyIdFromPublicKeyPem(
  publicKeyPem: string
): Promise<string> {
  return hashData(stripIdentityKey(publicKeyPem));
}

export async function deriveKeyIdFromPublicKey(
  publicKey: CryptoKey
): Promise<string> {
  const publicKeyBase64 = await exportPublicKey(publicKey);
  return deriveKeyIdFromPublicKeyBase64(publicKeyBase64);
}
