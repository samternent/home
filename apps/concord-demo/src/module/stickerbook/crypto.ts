import { canonicalStringify } from "@ternent/concord-protocol";

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return toHex(new Uint8Array(digest));
  }

  const { createHash } = await import("crypto");
  return createHash("sha256").update(bytes).digest("hex");
}

export async function hashCanonical(value: unknown): Promise<string> {
  return sha256Hex(canonicalStringify(value));
}

export async function derivePackSeed(params: {
  serverSecret: string;
  clientNonce: string;
  packRequestId: string;
  seriesId: string;
  themeId: string;
}): Promise<string> {
  return hashCanonical({
    serverSecret: params.serverSecret,
    clientNonce: params.clientNonce,
    packRequestId: params.packRequestId,
    seriesId: params.seriesId,
    themeId: params.themeId,
  });
}
