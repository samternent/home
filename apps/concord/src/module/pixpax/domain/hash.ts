import { canonicalStringify } from "@ternent/concord-protocol";
import type { PackPalette16, StickerArt16 } from "../sticker-types";
import { decodeIdx4ToIndices } from "../pixel";
import { assertPalette16, assertStickerArt16 } from "./protocol";

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeSha256Hex(hex: string): string {
  const normalized = String(hex || "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("Expected 64-char sha256 hex string.");
  }
  return normalized;
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = normalizeSha256Hex(hex);
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

function utf8Bytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
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
  const bytes = concatBytes([
    hexToBytes(normalizeSha256Hex(artHash)),
    hexToBytes(normalizeSha256Hex(paletteHash)),
  ]);
  return sha256Hex(bytes);
}

export async function hashCanonical(value: unknown): Promise<string> {
  return sha256Hex(utf8Bytes(canonicalStringify(value)));
}

export async function computeMerkleRootFromItemHashes(
  itemHashes: string[]
): Promise<string> {
  const normalizedLeafHashes = (Array.isArray(itemHashes) ? itemHashes : []).map(
    (value) => normalizeSha256Hex(value)
  );
  if (!normalizedLeafHashes.length) {
    return hashCanonical([]);
  }

  let level = normalizedLeafHashes.slice();
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i];
      next.push(await hashCanonical({ left, right }));
    }
    level = next;
  }

  return level[0];
}

export async function computePackCommitment(params: {
  itemHashes: string[];
  packRoot?: string;
  count?: number;
}): Promise<string> {
  const itemHashes = (Array.isArray(params.itemHashes) ? params.itemHashes : []).map(
    (value) => normalizeSha256Hex(value)
  );
  const packRoot = params.packRoot
    ? normalizeSha256Hex(params.packRoot)
    : await computeMerkleRootFromItemHashes(itemHashes);
  const count = Number.isFinite(params.count)
    ? Math.max(0, Math.floor(Number(params.count)))
    : itemHashes.length;

  return hashCanonical({
    itemHashes,
    count,
    packRoot,
  });
}
