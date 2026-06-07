import { describe, expect, it } from "vitest";
import {
  createIdentityGlyphModel,
  getIdentityGlyphPaletteValues,
  resolveIdentityGlyphInput,
} from "./identityGlyph.utils";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodeBase58(bytes: Uint8Array): string {
  let numeric = 0n;
  for (const byte of bytes) {
    numeric = (numeric << 8n) + BigInt(byte);
  }

  let encoded = "";
  while (numeric > 0n) {
    const digit = Number(numeric % 58n);
    encoded = BASE58_ALPHABET[digit] + encoded;
    numeric /= 58n;
  }

  let leadingZeros = 0;
  for (const byte of bytes) {
    if (byte !== 0) {
      break;
    }
    leadingZeros += 1;
  }

  return `${"1".repeat(leadingZeros)}${encoded}`;
}

function toDidKeyFromPublicKey(publicKey: string): string {
  const raw = Buffer.from(publicKey.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const prefixed = new Uint8Array(2 + raw.length);
  prefixed.set([0xed, 0x01], 0);
  prefixed.set(raw, 2);
  return `did:key:z${encodeBase58(prefixed)}`;
}

function hexToRgb(value: string): { r: number; g: number; b: number } {
  const normalized = value.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function channelToLinear(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function contrastRatio(a: string, b: string): number {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  const luminanceA =
    0.2126 * channelToLinear(first.r) +
    0.7152 * channelToLinear(first.g) +
    0.0722 * channelToLinear(first.b);
  const luminanceB =
    0.2126 * channelToLinear(second.r) +
    0.7152 * channelToLinear(second.g) +
    0.0722 * channelToLinear(second.b);
  const light = Math.max(luminanceA, luminanceB);
  const dark = Math.min(luminanceA, luminanceB);
  return (light + 0.05) / (dark + 0.05);
}

describe("IdentityGlyph utils", () => {
  const publicKeyBytes = new Uint8Array(
    Array.from({ length: 32 }, (_, index) => (index * 7 + 19) % 256),
  );
  const publicKey = encodeBase64Url(publicKeyBytes);
  const didKey = toDidKeyFromPublicKey(publicKey);

  it("is deterministic for the same identity input", () => {
    const first = createIdentityGlyphModel(publicKey);
    const second = createIdentityGlyphModel(publicKey);

    expect(first).toEqual(second);
  });

  it("normalizes did:key and identity object forms to the same canonical identity", () => {
    const serializedIdentity = {
      format: "ternent-identity",
      version: "2",
      algorithm: "Ed25519",
      createdAt: "2026-04-28T10:00:00.000Z",
      publicKey,
      keyId: "key-id",
      material: {
        kind: "seed",
        seed: "seed-value",
      },
    };

    const canonicalFromPublicKey = resolveIdentityGlyphInput(publicKey);
    const canonicalFromDidKey = resolveIdentityGlyphInput(didKey);
    const canonicalFromIdentity = resolveIdentityGlyphInput(serializedIdentity);
    const canonicalFromNested = resolveIdentityGlyphInput({
      identity: {
        publicKey,
      },
    });

    expect(canonicalFromPublicKey.fallback).toBe(false);
    expect(canonicalFromPublicKey.canonicalIdentity).toBe(canonicalFromDidKey.canonicalIdentity);
    expect(canonicalFromPublicKey.canonicalIdentity).toBe(canonicalFromIdentity.canonicalIdentity);
    expect(canonicalFromPublicKey.canonicalIdentity).toBe(canonicalFromNested.canonicalIdentity);
  });

  it("guarantees vertical symmetry and minimum visual density", () => {
    const model = createIdentityGlyphModel(publicKey);
    const grid = model.grid;

    let filled = 0;
    for (let y = 0; y < grid.length; y += 1) {
      for (let x = 0; x < grid[y]!.length; x += 1) {
        if (grid[y]![x] !== 0) {
          filled += 1;
        }
        expect(grid[y]![x]).toBe(grid[y]![grid[y]!.length - 1 - x]);
      }
    }

    const center = Math.floor(grid.length / 2);
    const core = [
      grid[center]![center],
      grid[center - 1]![center],
      grid[center + 1]![center],
      grid[center]![center - 1],
      grid[center]![center + 1],
    ];

    expect(filled).toBeGreaterThanOrEqual(16);
    expect(core.filter((cell) => cell !== 0).length).toBeGreaterThanOrEqual(4);
  });

  it("uses four palette roles with strong contrast against background", () => {
    const model = createIdentityGlyphModel(publicKey);
    const [background, primary, secondary, accent] = getIdentityGlyphPaletteValues(model.palette);

    expect(background).toMatch(/^#[0-9a-f]{6}$/i);
    expect(primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(secondary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(accent).toMatch(/^#[0-9a-f]{6}$/i);

    expect(contrastRatio(background, primary)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(background, secondary)).toBeGreaterThanOrEqual(2.5);
    expect(contrastRatio(background, accent)).toBeGreaterThanOrEqual(2.8);
  });

  it("falls back to a deterministic non-empty fallback glyph for invalid input", () => {
    const first = createIdentityGlyphModel("invalid-public-key");
    const second = createIdentityGlyphModel("invalid-public-key");

    const filled = first.grid.flat().filter((cell) => cell !== 0).length;

    expect(first.fallback).toBe(true);
    expect(second.fallback).toBe(true);
    expect(first).toEqual(second);
    expect(filled).toBeGreaterThan(0);
  });
});
