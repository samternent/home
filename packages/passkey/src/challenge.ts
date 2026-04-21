import type { ChallengeInput } from "./types.js";
import { toUint8Array } from "./utils/bytes.js";
import { stableJsonStringify } from "./utils/json.js";

function requireSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "object") {
    throw new Error("Web Crypto API is required for passkey challenge hashing.");
  }
  return globalThis.crypto.subtle;
}

export async function shaDigest(
  input: Uint8Array | ArrayBuffer,
  algorithm: "SHA-256" | "SHA-384" = "SHA-256",
): Promise<Uint8Array> {
  const digest = await requireSubtle().digest(algorithm, input);
  return new Uint8Array(digest);
}

export async function buildChallenge(
  input: ChallengeInput,
): Promise<ArrayBuffer> {
  if (typeof input === "string") {
    return new TextEncoder().encode(input).buffer;
  }

  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    return toUint8Array(input).slice().buffer;
  }

  const canonical = stableJsonStringify(input);
  const digest = await shaDigest(new TextEncoder().encode(canonical), "SHA-256");
  return digest.buffer;
}
