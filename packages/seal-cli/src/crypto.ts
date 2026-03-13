import {
  deriveKeyIdFromPublicKey,
  deriveKeyIdFromPublicKeyBase64,
  derivePublicFromPrivatePEM,
  exportPublicKey,
  importPrivateKeyFromPem,
  importPublicKeyFromPem,
  signBytes,
  verifyBytes,
} from "ternent-identity";
import { formatIdentityKey } from "ternent-utils";

export type SealSignerInput = {
  privateKeyPem: string;
  publicKeyPem?: string;
  keyId?: string;
};

export type ResolvedSealSigner = {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyPem: string;
  publicKeyBase64: string;
  keyId: string;
};

function utf8Bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export async function importPublicKeyFromBase64(
  publicKeyBase64: string
): Promise<CryptoKey> {
  return importPublicKeyFromPem(formatIdentityKey(publicKeyBase64));
}

export async function exportPublicKeyBase64(key: CryptoKey): Promise<string> {
  return exportPublicKey(key);
}

export async function derivePublicKeyBase64FromPrivateKeyPem(
  privateKeyPem: string
): Promise<string> {
  const publicKeyPem = await derivePublicFromPrivatePEM(privateKeyPem);
  const publicKey = await importPublicKeyFromPem(publicKeyPem);
  return exportPublicKeyBase64(publicKey);
}

export async function resolveSealSigner(
  input: SealSignerInput
): Promise<ResolvedSealSigner> {
  const privateKey = await importPrivateKeyFromPem(input.privateKeyPem);
  const publicKeyPem = input.publicKeyPem
    ? input.publicKeyPem
    : await derivePublicFromPrivatePEM(input.privateKeyPem);
  const publicKey = await importPublicKeyFromPem(publicKeyPem);
  const publicKeyBase64 = await exportPublicKeyBase64(publicKey);
  const derivedPublicKeyBase64 = await derivePublicKeyBase64FromPrivateKeyPem(
    input.privateKeyPem
  );

  if (publicKeyBase64 !== derivedPublicKeyBase64) {
    throw new Error("Provided public key does not match the private key.");
  }

  const derivedKeyId = await deriveKeyIdFromPublicKey(publicKey);
  if (input.keyId && input.keyId !== derivedKeyId) {
    throw new Error("Provided keyId does not match the signer public key.");
  }
  const keyId = input.keyId ?? derivedKeyId;

  return {
    privateKey,
    publicKey,
    publicKeyPem,
    publicKeyBase64,
    keyId,
  };
}

export async function signUtf8(
  signingKey: CryptoKey,
  value: string
): Promise<string> {
  return signBytes(signingKey, utf8Bytes(value));
}

export async function verifyUtf8(
  signature: string,
  value: string,
  publicKey: CryptoKey
): Promise<boolean> {
  return verifyBytes(signature, utf8Bytes(value), publicKey);
}

export async function verifyPublicKeyKeyId(
  publicKeyBase64: string,
  keyId: string
): Promise<boolean> {
  return (await deriveKeyIdFromPublicKeyBase64(publicKeyBase64)) === keyId;
}
