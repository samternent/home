export function normalizeRedeemCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function formatRedeemCode(value: unknown) {
  const normalized = normalizeRedeemCode(value);
  return normalized.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}
