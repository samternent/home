import type { PackPalette16, StickerArt16 } from "../sticker-types";
import { base64ToBytes } from "../pixel";

export const STICKER_SIZE = 16;
export const STICKER_PIXEL_COUNT = STICKER_SIZE * STICKER_SIZE;
export const STICKER_PACKED_BYTES = STICKER_PIXEL_COUNT / 2;
export const PALETTE_LENGTH = 16;
export const TRANSPARENT_ARGB = 0x00000000;

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function assertPalette16(palette: PackPalette16): void {
  invariant(!!palette && typeof palette === "object", "palette must be an object.");
  invariant(
    Array.isArray(palette.colors),
    "palette.colors must be an array of ARGB uint32 values."
  );
  invariant(
    palette.colors.length === PALETTE_LENGTH,
    `palette.colors must contain ${PALETTE_LENGTH} entries.`
  );
  invariant(
    (palette.colors[0] >>> 0) === TRANSPARENT_ARGB,
    "palette.colors[0] must be transparent 0x00000000."
  );
  for (let i = 1; i < palette.colors.length; i += 1) {
    const color = palette.colors[i] >>> 0;
    const alpha = (color >>> 24) & 0xff;
    invariant(alpha === 0xff, "palette.colors[1..15] must have alpha 0xFF.");
  }
}

export function assertStickerArt16(art: StickerArt16): void {
  invariant(!!art && typeof art === "object", "art must be an object.");
  invariant(art.v === 1, "StickerArt16.v must be 1.");
  invariant(
    art.w === STICKER_SIZE && art.h === STICKER_SIZE,
    "StickerArt16 dimensions must be 16x16."
  );
  invariant(art.fmt === "idx4", "StickerArt16.fmt must be 'idx4'.");
  invariant(typeof art.px === "string" && art.px.length > 0, "StickerArt16.px is required.");

  const packed = base64ToBytes(art.px);
  invariant(
    packed.length === STICKER_PACKED_BYTES,
    `StickerArt16.px must decode to ${STICKER_PACKED_BYTES} bytes.`
  );

  const decodedPixels = packed.length * 2;
  invariant(
    decodedPixels === STICKER_PIXEL_COUNT,
    `StickerArt16 must decode to ${STICKER_PIXEL_COUNT} pixels.`
  );

  for (let i = 0; i < packed.length; i += 1) {
    const p0 = (packed[i] >> 4) & 0x0f;
    const p1 = packed[i] & 0x0f;
    invariant(p0 >= 0 && p0 <= 15, "pixel index out of bounds (0..15).");
    invariant(p1 >= 0 && p1 <= 15, "pixel index out of bounds (0..15).");
  }
}
