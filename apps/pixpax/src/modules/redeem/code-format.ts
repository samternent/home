function extractRedeemCodeCandidate(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const queryMatch =
    trimmed.match(/[?&](?:code|redeem)=([^&#]+)/i) ||
    trimmed.match(/(?:^|[?&])(?:code|redeem)=([^&#]+)/i);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]);
    } catch {
      return queryMatch[1];
    }
  }

  const pathMatch = trimmed.match(/\/r\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    try {
      return decodeURIComponent(pathMatch[1]);
    } catch {
      return pathMatch[1];
    }
  }

  return trimmed;
}

export function normalizeRedeemCode(value: unknown) {
  return extractRedeemCodeCandidate(String(value || ""))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function formatRedeemCode(value: unknown) {
  const normalized = normalizeRedeemCode(value);
  return normalized.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}
