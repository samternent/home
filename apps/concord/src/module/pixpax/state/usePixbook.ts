import { getPeriodId as getLegacyPeriodId, useStickerbook } from "../../stickerbook/useStickerbook";

export const PIXPAX_PACK_RECEIVED_KIND = "pixpax.pack.received";
export const PIXPAX_CARD_TRANSFER_KIND = "pixpax.card.transfer";
export const PIXPAX_PACK_RECEIVED_LEGACY_KIND = "pack.received";
export const PIXPAX_CARD_TRANSFER_LEGACY_KIND = "sticker.transfer";

export function usePixbook() {
  return useStickerbook();
}

export function getPixpaxPeriodId(date: Date) {
  return getLegacyPeriodId(date);
}
