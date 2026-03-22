# PixPax Pack Card Exporter

## Where export dimensions are configured

Print-card sizing lives in:

- [apps/pixpax/src/modules/admin/print/print-config.ts](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/admin/print/print-config.ts)

Key values:

- `PACK_PRINT_CARD_WIDTH`
- `PACK_PRINT_CARD_HEIGHT`
- `PACK_PRINT_CARD_SAFE_INSET`
- `PACK_PRINT_EXPORT_SCALE`
- `PACK_PRINT_PREVIEW_SCALE`

The visual card component uses the base width/height. PNG export multiplies that by `PACK_PRINT_EXPORT_SCALE`.

## How file naming is derived

Generated batch exports use:

- batch id from `createPackPrintBatchId()`
- file names from `createPackPrintFilename()`
- zip file name from `createPackPrintZipFilename()`

Current naming:

- single image: `pixpax-<batchId>-pack-001.png`
- zip: `pixpax-<batchId>-print-cards.zip`

## How QR values are mapped

The exporter does not invent a second QR contract.

The print model is derived from the generated admin batch item in:

- [apps/pixpax/src/modules/admin/print/mapGeneratedPackToPrintModel.ts](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/admin/print/mapGeneratedPackToPrintModel.ts)

Mapping rules:

- `shortCode` comes from generated `codeId`
- `openUrl` comes from generated `redeemUrl`
- `qrValue` also comes from generated `redeemUrl`
- `qrSvg` is reused directly from the admin/API response

## How to adjust the print card layout later

The dedicated print face lives in:

- [apps/pixpax/src/modules/admin/components/PackPrintCard.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/admin/components/PackPrintCard.vue)

This component is intentionally separate from normal app UI. Adjust:

- spacing and safe-area composition there
- metadata hierarchy there
- QR sizing/placement there

The export pipeline itself lives in:

- [apps/pixpax/src/modules/admin/print/exportPackBatchImages.ts](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/admin/print/exportPackBatchImages.ts)

That file is responsible for:

- waiting for fonts/layout
- rendering one PNG per pack card
- collecting the PNGs into a ZIP
- downloading the ZIP from the admin UI
