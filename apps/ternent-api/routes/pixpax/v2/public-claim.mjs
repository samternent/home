function trim(value) {
  return String(value || "").trim();
}

export function createAlreadyClaimedPayload(use) {
  return {
    claimedAt: trim(use?.claimedAt) || null,
    sourceCodeId: trim(use?.sourceCodeId) || null,
  };
}
