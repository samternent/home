import type {
  DeriveUnlockKeyOptions,
  PasskeyApproval,
} from "./types.js";
import { shaDigest } from "./challenge.js";
import { concatBytes, toUint8Array } from "./utils/bytes.js";

function requireSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "object") {
    throw new Error("Web Crypto API is required for passkey unlock key derivation.");
  }
  return globalThis.crypto.subtle;
}

export async function deriveEphemeralApprovalKey(
  approval: PasskeyApproval,
  options: DeriveUnlockKeyOptions = {},
): Promise<CryptoKey> {
  const algorithm = options.algorithm ?? "AES-GCM";
  const hash = options.hash ?? "SHA-256";
  const usage = options.usage ?? ["encrypt", "decrypt"];

  const material = concatBytes(
    toUint8Array(approval.response.authenticatorData),
    toUint8Array(approval.response.clientDataJSON),
    toUint8Array(approval.response.signature),
  );
  const digest = await shaDigest(material, hash);

  return await requireSubtle().importKey(
    "raw",
    digest,
    {
      name: algorithm,
      length: 256,
    },
    false,
    usage,
  );
}

export async function deriveUnlockKey(
  approval: PasskeyApproval,
  options: DeriveUnlockKeyOptions = {},
): Promise<CryptoKey> {
  return await deriveEphemeralApprovalKey(approval, options);
}
