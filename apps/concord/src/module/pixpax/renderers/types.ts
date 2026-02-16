import type { PackPalette16, Sticker, StickerArt16 } from "../sticker-types";

export type PixPaxArtRendererKind = "idx4" | "kit";

export type PixPaxKitLayer = {
  cardId?: string;
  renderPayload?: {
    gridSize?: number;
    gridB64?: string;
  };
};

export type PixPaxArtInput =
  | {
      kind: "idx4";
      art: StickerArt16;
    }
  | {
      kind: "kit";
      layers: PixPaxKitLayer[];
    };

export type PixPaxRendererProps = {
  art: PixPaxArtInput;
  palette: PackPalette16;
  class?: any;
};

export function toPixPaxArtInput(sticker: Sticker): PixPaxArtInput {
  return {
    kind: "idx4",
    art: sticker.art,
  };
}
