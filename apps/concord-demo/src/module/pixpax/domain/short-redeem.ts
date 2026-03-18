function readFirstString(value: unknown) {
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string" && entry.trim());
    return typeof first === "string" ? first.trim() : "";
  }
  if (typeof value === "string") return value.trim();
  return "";
}

export type ShortRedeemInput = {
  token?: string;
  code?: string;
};

function looksLikeSignedToken(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  const parts = raw.split(".");
  return parts.length === 2 && parts[0].length > 8 && parts[1].length > 16;
}

export function resolveShortRedeemInput(input: {
  queryT?: unknown;
  queryToken?: unknown;
  queryCode?: unknown;
  paramCode?: unknown;
}): ShortRedeemInput {
  const byQueryT = readFirstString(input.queryT);
  if (byQueryT) return { token: byQueryT };

  const byLegacyQueryToken = readFirstString(input.queryToken);
  if (byLegacyQueryToken) return { token: byLegacyQueryToken };

  const byQueryCode = readFirstString(input.queryCode);
  if (byQueryCode) return { code: byQueryCode };

  const byPathCode = readFirstString(input.paramCode);
  if (looksLikeSignedToken(byPathCode)) {
    return { token: byPathCode };
  }
  if (byPathCode) return { code: byPathCode };

  return {};
}
