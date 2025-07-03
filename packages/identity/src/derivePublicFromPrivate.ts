import { importPrivateKeyFromPem } from "./importPrivateKey";
import { exportPrivateKey } from "./exportPrivateKey";
import { importPublicKey } from "./importPublicKey";
import { exportPublicKeyAsPem } from "./exportPublicKey";

/**
 * derivePublicFromPrivatePEM function
 * @param privateKeyPEM - The privateKeyPEM parameter
 * @returns Promise that resolves to void
 * @example
 * ```typescript
 * const result = await derivePublicFromPrivatePEM("example");
 * ```
 */
export async function derivePublicFromPrivatePEM(privateKeyPEM: string) {
  const key = await importPrivateKeyFromPem(privateKeyPEM);
  const priv = await exportPrivateKey(key);
  const pub = await importPublicKey({ x: priv.x, y: priv.y });
  return exportPublicKeyAsPem(pub);
}
