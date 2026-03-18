import type { StickerArt16 } from "./sticker-types";
import { assertStickerArt16 } from "./domain/protocol";

const PIXEL_COUNT = 16 * 16;
const PACKED_SIZE = PIXEL_COUNT / 2;

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function bytesToBase64(bytes: Uint8Array): string {
  const globalBuffer = (globalThis as any).Buffer;
  if (typeof globalBuffer !== "undefined") {
    return globalBuffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== "function") {
    throw new Error("bytesToBase64: no base64 encoder available.");
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const normalized = String(b64 || "").trim();
  invariant(!!normalized, "base64ToBytes: expected non-empty base64 string.");

  const globalBuffer = (globalThis as any).Buffer;
  if (typeof globalBuffer !== "undefined") {
    return new Uint8Array(globalBuffer.from(normalized, "base64"));
  }

  if (typeof atob !== "function") {
    throw new Error("base64ToBytes: no base64 decoder available.");
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function decodeIdx4ToIndices(sticker: StickerArt16): Uint8Array {
  assertStickerArt16(sticker);
  const packed = base64ToBytes(sticker.px);
  invariant(
    packed.length === PACKED_SIZE,
    `StickerArt16.px decoded length must be ${PACKED_SIZE} bytes.`
  );

  const out = new Uint8Array(PIXEL_COUNT);
  for (let i = 0; i < packed.length; i += 1) {
    const value = packed[i];
    const offset = i * 2;
    out[offset] = (value >> 4) & 0x0f;
    out[offset + 1] = value & 0x0f;
  }
  return out;
}

export function packIndicesToIdx4Base64(indices: Uint8Array): string {
  invariant(indices.length === PIXEL_COUNT, `indices must have ${PIXEL_COUNT} entries.`);
  const packed = new Uint8Array(PACKED_SIZE);

  for (let i = 0; i < PIXEL_COUNT; i += 2) {
    const p0 = indices[i];
    const p1 = indices[i + 1];
    invariant(p0 <= 15 && p1 <= 15, "indices values must be in range 0..15.");
    packed[i / 2] = ((p0 & 0x0f) << 4) | (p1 & 0x0f);
  }

  return bytesToBase64(packed);
}

export function argbToRgbaTuple(c: number): [r: number, g: number, b: number, a: number] {
  const value = Number(c) >>> 0;
  const a = (value >>> 24) & 0xff;
  const r = (value >>> 16) & 0xff;
  const g = (value >>> 8) & 0xff;
  const b = value & 0xff;
  return [r, g, b, a];
}

function toHex2(n: number): string {
  return Math.max(0, Math.min(255, Math.trunc(n))).toString(16).padStart(2, "0");
}

export function argbToCss(c: number): string {
  const [r, g, b, a] = argbToRgbaTuple(c);
  if (a === 255) {
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  }
  const alpha = Math.round((a / 255) * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
