export const PACK_PRINT_CARD_WIDTH = 750;
export const PACK_PRINT_CARD_HEIGHT = 1050;
export const PACK_PRINT_CARD_SAFE_INSET = 48;
export const PACK_PRINT_EXPORT_SCALE = 2;
export const PACK_PRINT_PREVIEW_SCALE = 0.42;

export function createPackPrintBatchId(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}${minute}${second}`;
}

export function createPackPrintFilename(batchId: string, index: number) {
  return `pixpax-${String(batchId || "batch").trim()}-pack-${String(index + 1).padStart(3, "0")}.png`;
}

export function createPackPrintZipFilename(batchId: string) {
  return `pixpax-${String(batchId || "batch").trim()}-print-cards.zip`;
}
