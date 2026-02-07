import type { PackPalette16, StickerArt16 } from "./sticker-types";
import { decodeIdx4ToIndices } from "./pixel";
import { assertPalette16, assertStickerArt16 } from "./protocol";

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = String(hex || "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("Expected 64-char sha256 hex string.");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return hexFromBytes(new Uint8Array(digest));
  }

  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(bytes).digest("hex");
}

function stickerHeaderBytes(art: StickerArt16): Uint8Array {
  return new TextEncoder().encode(
    `v=${art.v};w=${art.w};h=${art.h};fmt=${art.fmt};`
  );
}

export async function hashStickerArt(art: StickerArt16): Promise<string> {
  assertStickerArt16(art);
  const indices = decodeIdx4ToIndices(art);
  const canonicalBytes = concatBytes([stickerHeaderBytes(art), indices]);
  return sha256Hex(canonicalBytes);
}

export async function hashPalette16(palette: PackPalette16): Promise<string> {
  assertPalette16(palette);
  const bytes = new Uint8Array(16 * 4);
  let offset = 0;
  for (const color of palette.colors) {
    const value = color >>> 0;
    bytes[offset] = (value >>> 24) & 0xff;
    bytes[offset + 1] = (value >>> 16) & 0xff;
    bytes[offset + 2] = (value >>> 8) & 0xff;
    bytes[offset + 3] = value & 0xff;
    offset += 4;
  }
  return sha256Hex(bytes);
}

export async function hashRender(artHash: string, paletteHash: string): Promise<string> {
  const bytes = concatBytes([hexToBytes(artHash), hexToBytes(paletteHash)]);
  return sha256Hex(bytes);
}
