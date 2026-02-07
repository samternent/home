export type StickerArt16 = {
  v: 1;
  w: 16;
  h: 16;
  fmt: "idx4";
  px: string;
};

export type StickerMeta = {
  id: string;
  contentHash: string;
  name: string;
  collectionId: string;
  collectionName: string;
  series?: string;
  tags?: string[];
  rarity: "common" | "rare" | "epic" | "legendary";
  finish: "matte" | "holo" | "gold" | "silver";
  shiny: boolean;
  createdAt?: string;
};

export type Sticker = {
  meta: StickerMeta;
  art: StickerArt16;
};

export type PackPalette16 = {
  id: string;
  colors: number[];
};

export type Collection = {
  id: string;
  name: string;
  series?: string;
  palette: PackPalette16;
  stickers: Sticker[];
};
