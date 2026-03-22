import {
  createPackPrintFilename,
  PACK_PRINT_CARD_HEIGHT,
  PACK_PRINT_CARD_SAFE_INSET,
  PACK_PRINT_CARD_WIDTH,
} from "@/modules/admin/print/print-config";

export type GeneratedPackPrintSource = {
  codeId: string;
  redeemUrl: string;
  qrSvg: string;
  label: string;
  kind: "pack" | "fixed-card";
  collectionId: string;
  version: string;
  dropId: string;
  count?: number;
  cardId?: string;
};

export type PackPrintCardModel = {
  id: string;
  batchId: string;
  filename: string;
  packName: string;
  packType: string;
  cardCount: number;
  openUrl: string;
  shortCode: string;
  qrValue: string;
  qrSvg: string;
  collectionId: string;
  collectionVersion: string;
  dropId: string;
  metadataLine: string;
  subtitle: string;
  dimensions: {
    width: number;
    height: number;
    safeInset: number;
  };
};

export function mapGeneratedPackToPrintModel(
  input: GeneratedPackPrintSource,
  options: {
    batchId: string;
    index: number;
  },
): PackPrintCardModel {
  const count = Math.max(1, Math.floor(Number(input.count || 1)));
  const packType = input.kind === "fixed-card" ? "Sticker pack" : "Pack";
  const subtitle =
    input.kind === "fixed-card"
      ? "Contains 1 sticker"
      : `Contains ${count} sticker${count === 1 ? "" : "s"}`;

  return {
    id: String(input.codeId || "").trim(),
    batchId: String(options.batchId || "").trim(),
    filename: createPackPrintFilename(options.batchId, options.index),
    packName: String(input.label || "PixPax pack").trim() || "PixPax pack",
    packType,
    cardCount: count,
    openUrl: String(input.redeemUrl || "").trim(),
    shortCode: String(input.codeId || "").trim(),
    qrValue: String(input.redeemUrl || "").trim(),
    qrSvg: String(input.qrSvg || "").trim(),
    collectionId: String(input.collectionId || "").trim(),
    collectionVersion: String(input.version || "").trim(),
    dropId: String(input.dropId || "").trim(),
    metadataLine: [input.collectionId, input.version].filter(Boolean).join(" / "),
    subtitle,
    dimensions: {
      width: PACK_PRINT_CARD_WIDTH,
      height: PACK_PRINT_CARD_HEIGHT,
      safeInset: PACK_PRINT_CARD_SAFE_INSET,
    },
  };
}
