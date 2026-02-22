import { renderSVG } from "uqr";

const DEFAULT_QR_BASE_URL = "https://pixpax.xyz";
const DEFAULT_QR_ERROR_CORRECTION = "M";
const DEFAULT_QR_QUIET_ZONE_MODULES = 4;
const DEFAULT_QR_RENDER_SIZE_PX = 512;

function normalizeBaseUrl(value) {
  const candidate = String(value || "").trim();
  if (!candidate) return DEFAULT_QR_BASE_URL;
  return candidate.replace(/\/+$/, "");
}

export function resolveQrBaseUrl() {
  return normalizeBaseUrl(process.env.PIX_PAX_QR_BASE_URL);
}

export function buildRedeemUrlForCode(publicCode, baseUrl = resolveQrBaseUrl()) {
  const encodedCode = encodeURIComponent(String(publicCode || "").trim());
  return `${normalizeBaseUrl(baseUrl)}/r/${encodedCode}`;
}

export function buildRedeemUrlForToken(token, baseUrl = resolveQrBaseUrl()) {
  const encodedToken = encodeURIComponent(String(token || "").trim());
  return `${normalizeBaseUrl(baseUrl)}/r?t=${encodedToken}`;
}

export async function buildQrSvg(redeemUrl, options = {}) {
  const errorCorrectionLevel =
    String(options.errorCorrectionLevel || DEFAULT_QR_ERROR_CORRECTION).toUpperCase() || "M";
  const quietZoneModules = Number.isInteger(options.quietZoneModules)
    ? Math.max(0, Number(options.quietZoneModules))
    : DEFAULT_QR_QUIET_ZONE_MODULES;
  const sizePx = Number.isInteger(options.sizePx)
    ? Math.max(64, Number(options.sizePx))
    : DEFAULT_QR_RENDER_SIZE_PX;

  const qrSvg = renderSVG(String(redeemUrl || ""), {
    ecc: errorCorrectionLevel,
    border: quietZoneModules,
  });

  return {
    qrSvg,
    qrErrorCorrection: errorCorrectionLevel,
    qrQuietZoneModules: quietZoneModules,
    qrRenderSizePx: sizePx,
  };
}

export async function buildTokenQrArtifact(token, options = {}) {
  const publicCode = String(options.publicCode || "").trim();
  const redeemUrl = publicCode
    ? buildRedeemUrlForCode(publicCode, options.baseUrl || resolveQrBaseUrl())
    : buildRedeemUrlForToken(token, options.baseUrl || resolveQrBaseUrl());
  const qr = await buildQrSvg(redeemUrl, options);
  return {
    redeemUrl,
    ...qr,
  };
}
