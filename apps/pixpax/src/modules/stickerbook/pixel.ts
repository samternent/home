import type {
  PixpaxPalette16,
  PixpaxPublicCollectionCard,
  PixpaxPublicCollectionBundle,
} from "@/modules/api/client";

export type StickerPalette = {
  id: string;
  colors: string[];
};

export type StickerPixelArt = {
  size: number;
  pixels: number[];
};

function toBase64Bytes(value: string) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return new Uint8Array();
  }

  const buffer = (globalThis as typeof globalThis & {
    Buffer?: {
      from(input: string, encoding: "base64"): Uint8Array;
    };
  }).Buffer;

  if (buffer) {
    return new Uint8Array(buffer.from(normalized, "base64"));
  }

  if (typeof atob === "function") {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  return new Uint8Array();
}

function toHexChannel(value: number) {
  return Math.max(0, Math.min(255, Math.trunc(value)))
    .toString(16)
    .padStart(2, "0");
}

export function argbToCssColor(value: number) {
  const color = Number(value) >>> 0;
  const a = (color >>> 24) & 0xff;
  const r = (color >>> 16) & 0xff;
  const g = (color >>> 8) & 0xff;
  const b = color & 0xff;

  if (a === 255) {
    return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
  }

  return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
}

export function normalizeStickerPalette(input: PixpaxPalette16 | null | undefined): StickerPalette {
  const colors = Array.isArray(input?.colors) ? input.colors : [];
  return {
    id: String(input?.id || "pixpax-palette"),
    colors: colors.map((value) => argbToCssColor(value)).slice(0, 16),
  };
}

export function decodeStickerPixelArt(card: PixpaxPublicCollectionCard): StickerPixelArt | null {
  const renderPayload = card.renderPayload || null;
  const gridSize = Number(renderPayload?.gridSize || 0);
  const gridB64 = String(renderPayload?.gridB64 || "").trim();
  if (!gridB64 || !Number.isInteger(gridSize) || gridSize < 1) {
    return null;
  }

  const packed = toBase64Bytes(gridB64);
  const pixels: number[] = [];
  for (const byte of packed) {
    pixels.push((byte >> 4) & 0x0f);
    pixels.push(byte & 0x0f);
  }

  return {
    size: gridSize,
    pixels: pixels.slice(0, gridSize * gridSize),
  };
}

export function getStickerPalette(bundle: PixpaxPublicCollectionBundle): StickerPalette {
  return normalizeStickerPalette(bundle.collection?.palette || null);
}

export function getStickerLabel(card: PixpaxPublicCollectionCard) {
  return String(card.label || card.title || card.name || card.cardId)
    .trim()
    .toUpperCase();
}

export function isStickerShiny(card: PixpaxPublicCollectionCard) {
  return Boolean(card.attributes && card.attributes.shiny);
}
