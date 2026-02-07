import { describe, expect, it } from "vitest";
import type { PackPalette16, StickerArt16 } from "../sticker-types";
import {
  assertPalette16,
  assertStickerArt16,
} from "../protocol";
import { decodeIdx4ToIndices, packIndicesToIdx4Base64 } from "../pixel";
import { hashPalette16, hashRender, hashStickerArt } from "../hash";

function buildIndices(seed = 0): Uint8Array {
  const out = new Uint8Array(16 * 16);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = (i + seed) % 16;
  }
  return out;
}

function buildArt(seed = 0): StickerArt16 {
  return {
    v: 1,
    w: 16,
    h: 16,
    fmt: "idx4",
    px: packIndicesToIdx4Base64(buildIndices(seed)),
  };
}

function buildPalette(a = 0xffef4444, b = 0xff3b82f6): PackPalette16 {
  return {
    id: "pal_test",
    colors: [
      0x00000000,
      a,
      b,
      0xff22c55e,
      0xfff59e0b,
      0xffa855f7,
      0xff06b6d4,
      0xfff97316,
      0xff84cc16,
      0xffec4899,
      0xff8b5cf6,
      0xfff5d0fe,
      0xffbae6fd,
      0xfffde68a,
      0xff111111,
      0xffffffff,
    ],
  };
}

describe("pixpax protocol invariants", () => {
  it("pack(unpack(px)) round-trips exactly", () => {
    const original = buildArt(3).px;
    const unpacked = decodeIdx4ToIndices(buildArt(3));
    const repacked = packIndicesToIdx4Base64(unpacked);
    expect(repacked).toBe(original);
  });

  it("same art yields same artHash", async () => {
    const art = buildArt(7);
    const a = await hashStickerArt(art);
    const b = await hashStickerArt(art);
    expect(a).toBe(b);
  });

  it("same art + different palette keeps artHash but changes renderHash", async () => {
    const art = buildArt(4);
    const p1 = buildPalette(0xffef4444, 0xff3b82f6);
    const p2 = buildPalette(0xffffd700, 0xffc0c0c0);

    const artHashA = await hashStickerArt(art);
    const artHashB = await hashStickerArt(art);
    const palHashA = await hashPalette16(p1);
    const palHashB = await hashPalette16(p2);
    const renderA = await hashRender(artHashA, palHashA);
    const renderB = await hashRender(artHashB, palHashB);

    expect(artHashA).toBe(artHashB);
    expect(renderA).not.toBe(renderB);
  });

  it("invalid palette throws", () => {
    const invalid = {
      id: "bad",
      colors: [0x00000000, 0x80ffffff, ...new Array(14).fill(0xffffffff)],
    } as PackPalette16;
    expect(() => assertPalette16(invalid)).toThrow();
  });

  it("invalid px length throws", () => {
    const art = {
      v: 1,
      w: 16,
      h: 16,
      fmt: "idx4",
      px: "AA==",
    } as StickerArt16;
    expect(() => assertStickerArt16(art)).toThrow();
  });
});
