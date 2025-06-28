/**
 * Creates a new cryptographic identity using ECDSA with P-256 curve
 * @returns A promise that resolves to a CryptoKeyPair containing public and private keys
 * @example
 * ```typescript
 * const identity = await createIdentity();
 * console.log('Public key:', identity.publicKey);
 * console.log('Private key:', identity.privateKey);
 * ```
 */
export async function createIdentity(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
}
