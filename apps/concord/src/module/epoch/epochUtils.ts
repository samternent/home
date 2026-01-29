function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export function canonicalizeAgeRecipient(value: string): string {
  return (value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function canonicalizeIdentityKey(value: string): string {
  return (value || "").replace(/\s/g, "");
}

export async function fingerprint(value: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return bytesToHex(new Uint8Array(hashBuffer));
}

export async function deriveSignerKeyId(publicIdentityKey: string) {
  return fingerprint(canonicalizeIdentityKey(publicIdentityKey));
}

export async function deriveEpochId(params: {
  signerKeyId: string;
  encryptionPublicKey: string;
  prevEpochId: string | null;
  createdAt: string;
}) {
  const canonical = canonicalStringify({
    tag: "concord-epoch@1.0",
    createdAt: params.createdAt,
    encryptionPublicKey: canonicalizeAgeRecipient(params.encryptionPublicKey),
    prevEpochId: params.prevEpochId ?? null,
    signerKeyId: params.signerKeyId,
  });

  return fingerprint(canonical);
}
import { canonicalStringify } from "@ternent/concord-protocol";
