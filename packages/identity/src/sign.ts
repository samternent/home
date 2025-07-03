import { b64encode } from "concords-utils";

/**
 * Signs data
 * @param signingKey - The signingKey parameter
 * @param data - The data parameter
 * @returns Promise that resolves to void
 * @example
 * ```typescript
 * const result = await sign(signingKeyValue, dataValue);
 * ```
 */
export async function sign(signingKey: CryptoKey, data: any) {
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
