import { buildTokenQrArtifact } from "./code-token-qr.mjs";

function normalizeLabel(value, fallback = "Redeem Code") {
  const label = String(value || "").trim();
  return label || fallback;
}

export async function buildCodeCardDataset(input) {
  const sourceItems = Array.isArray(input?.items) ? input.items : [];
  const seriesTitle = String(input?.seriesTitle || "").trim();
  const issuerName = String(input?.issuerName || "").trim() || "PixPax";
  const baseUrl = String(input?.baseUrl || "").trim();
  const qrSizePx = Number.isInteger(input?.qrSizePx) ? Number(input.qrSizePx) : undefined;

  const output = [];
  for (const entry of sourceItems) {
    const token = String(entry?.token || "").trim();
    const codeId = String(entry?.codeId || "").trim();
    if (!token) continue;
    const qr = await buildTokenQrArtifact(token, {
      baseUrl,
      sizePx: qrSizePx,
      publicCode: codeId,
    });

    output.push({
      token,
      tokenHash: String(entry?.tokenHash || "").trim(),
      label: normalizeLabel(entry?.label, "Redeem Code"),
      redeemUrl: qr.redeemUrl,
      qrSvg: qr.qrSvg,
      qrErrorCorrection: qr.qrErrorCorrection,
      qrQuietZoneModules: qr.qrQuietZoneModules,
      codeId,
      issuedAt: String(entry?.issuedAt || "").trim(),
      expiresAt: String(entry?.expiresAt || "").trim(),
      collectionId: String(entry?.collectionId || "").trim(),
      version: String(entry?.version || "").trim(),
      kind: String(entry?.kind || "").trim(),
      ...(entry?.cardId ? { cardId: String(entry.cardId) } : {}),
      ...(Number.isInteger(entry?.count) ? { count: Number(entry.count) } : {}),
      ...(entry?.dropId ? { dropId: String(entry.dropId) } : {}),
      ...(seriesTitle ? { seriesTitle } : {}),
      issuerName,
      ...(entry?.thumbnail && typeof entry.thumbnail === "object"
        ? { thumbnail: entry.thumbnail }
        : {}),
    });
  }
  return output;
}
