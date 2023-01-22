import { importPrivateKeyFromPem } from "./importPrivateKey";
import { exportPrivateKey } from "./exportPrivateKey";
import { importPublicKey } from "./importPublicKey";
import { exportPublicKeyAsPem } from "./exportPublicKey";

export async function derivePublicFromPrivatePEM(privateKeyPEM: string) {
  const key = await importPrivateKeyFromPem(privateKeyPEM);
  const priv = await exportPrivateKey(key);
  const pub = await importPublicKey({ x: priv.x, y: priv.y });
  return exportPublicKeyAsPem(pub);
}
