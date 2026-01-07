import { b64encode } from "ternent-utils";

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
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const dataBuffer = new TextEncoder().encode(payload);
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
