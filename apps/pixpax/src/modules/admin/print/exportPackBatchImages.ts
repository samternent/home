import {
  createPackPrintZipFilename,
  PACK_PRINT_CARD_HEIGHT,
  PACK_PRINT_CARD_WIDTH,
  PACK_PRINT_EXPORT_SCALE,
} from "@/modules/admin/print/print-config";
import type { PackPrintCardModel } from "@/modules/admin/print/mapGeneratedPackToPrintModel";

export type PackBatchExportFailure = {
  id: string;
  filename: string;
  message: string;
};

export type PackBatchExportResult = {
  successCount: number;
  failures: PackBatchExportFailure[];
  zipFilename: string;
};

function triggerDownload(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

async function waitForStableRender() {
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    } catch {
      // Ignore font readiness failures and continue to capture the current layout.
    }
  }

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export async function exportPackBatchImages(options: {
  batchId: string;
  models: PackPrintCardModel[];
  getElement: (id: string) => HTMLElement | null;
  onProgress?: (value: { completed: number; total: number; current: string }) => void;
}) {
  const [{ toBlob }, { default: JSZip }] = await Promise.all([
    import("html-to-image"),
    import("jszip"),
  ]);

  const total = options.models.length;
  const failures: PackBatchExportFailure[] = [];
  const zip = new JSZip();
  let successCount = 0;

  for (let index = 0; index < options.models.length; index += 1) {
    const model = options.models[index];
    options.onProgress?.({
      completed: index,
      total,
      current: model.filename,
    });

    const element = options.getElement(model.id);
    if (!element) {
      failures.push({
        id: model.id,
        filename: model.filename,
        message: "Print card is not mounted.",
      });
      continue;
    }

    try {
      await waitForStableRender();
      const blob = await toBlob(element, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: PACK_PRINT_EXPORT_SCALE,
        canvasWidth: PACK_PRINT_CARD_WIDTH * PACK_PRINT_EXPORT_SCALE,
        canvasHeight: PACK_PRINT_CARD_HEIGHT * PACK_PRINT_EXPORT_SCALE,
      });
      if (!blob) {
        throw new Error("Unable to create PNG blob.");
      }
      zip.file(model.filename, blob);
      successCount += 1;
    } catch (error) {
      failures.push({
        id: model.id,
        filename: model.filename,
        message: String((error as Error)?.message || "Image export failed."),
      });
    }
  }

  options.onProgress?.({
    completed: total,
    total,
    current: "",
  });

  if (!successCount) {
    return {
      successCount,
      failures,
      zipFilename: createPackPrintZipFilename(options.batchId),
    } satisfies PackBatchExportResult;
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipFilename = createPackPrintZipFilename(options.batchId);
  triggerDownload(zipBlob, zipFilename);
  return {
    successCount,
    failures,
    zipFilename,
  } satisfies PackBatchExportResult;
}
