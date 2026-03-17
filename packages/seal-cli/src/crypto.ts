import {
  createIdentity,
  createIdentityFromMnemonic,
  createMnemonicIdentity,
  deriveKeyId,
  parseIdentity,
  serializeIdentity,
  signUtf8,
  verifyUtf8,
  type SerializedIdentity,
} from "@ternent/identity";

export type SealSignerInput = {
  identity: SerializedIdentity;
};

export type ResolvedSealSigner = {
  identity: SerializedIdentity;
  publicKey: string;
  keyId: string;
};

export const SEAL_SIGNATURE_CONTEXT = "ternent-seal/v2";

export async function createSealIdentity(
  createdAt = new Date().toISOString()
): Promise<SerializedIdentity> {
  return createIdentity(createdAt);
}

export async function createSealIdentityFromMnemonic(input: {
  mnemonic: string;
  passphrase?: string;
  createdAt?: string;
}): Promise<SerializedIdentity> {
  return createIdentityFromMnemonic(input);
}

export async function createSealMnemonicIdentity(input: {
  words?: 12 | 24;
  passphrase?: string;
  createdAt?: string;
} = {}): Promise<{ identity: SerializedIdentity; mnemonic: string }> {
  return createMnemonicIdentity(input);
}

export function exportIdentityJson(identity: SerializedIdentity): string {
  return serializeIdentity(identity);
}

export async function resolveSealSigner(
  input: SealSignerInput
): Promise<ResolvedSealSigner> {
  const identity = parseIdentity(input.identity);
  const keyId = await deriveKeyId(identity.publicKey);
  if (keyId !== identity.keyId) {
    throw new Error("Identity keyId does not match the signer public key.");
  }

  return {
    identity,
    publicKey: identity.publicKey,
    keyId,
  };
}

export async function signSealUtf8(
  identity: SerializedIdentity,
  value: string
): Promise<string> {
  return signUtf8(identity, value, {
    context: SEAL_SIGNATURE_CONTEXT,
  });
}

export async function verifySealUtf8(
  signature: string,
  value: string,
  publicKey: string
): Promise<boolean> {
  return verifyUtf8(publicKey, value, signature, {
    context: SEAL_SIGNATURE_CONTEXT,
  });
}

export async function verifyPublicKeyKeyId(
  publicKey: string,
  keyId: string
): Promise<boolean> {
  return (await deriveKeyId(publicKey)) === keyId;
}
