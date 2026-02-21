export function pickCollectionRouteTarget(input: {
  forcedCollectionId?: string;
  routeCollectionId?: string;
  houseCollectionId?: string;
  fallbackCollectionId?: string;
}) {
  const forced = String(input.forcedCollectionId || "").trim();
  if (forced) return forced;
  const routeValue = String(input.routeCollectionId || "").trim();
  if (routeValue) return routeValue;
  const house = String(input.houseCollectionId || "").trim();
  if (house) return house;
  return String(input.fallbackCollectionId || "pixel-animals").trim() || "pixel-animals";
}

function normalizePackPayload(pack: any) {
  const payload = pack?.data?.issuerIssuePayload || {};
  if (String(payload?.packModel || "") !== "album") return null;
  return payload;
}

export function deriveOwnedCollectionIdsFromPacks(packs: any[]) {
  const ids = new Set<string>();
  for (const pack of packs || []) {
    const payload = normalizePackPayload(pack);
    if (!payload) continue;
    const collectionId = String(payload?.collectionId || "").trim();
    if (!collectionId) continue;
    ids.add(collectionId);
  }
  return Array.from(ids).sort((a, b) => a.localeCompare(b));
}

export function deriveOwnedCardIdsForCollectionVersion(
  packs: any[],
  collectionId: string,
  version: string
) {
  const cardIds = new Set<string>();
  const normalizedCollectionId = String(collectionId || "").trim();
  const normalizedVersion = String(version || "").trim();

  for (const pack of packs || []) {
    const payload = normalizePackPayload(pack);
    if (!payload) continue;
    if (String(payload?.collectionId || "") !== normalizedCollectionId) continue;
    if (String(payload?.collectionVersion || "") !== normalizedVersion) continue;
    const payloadCardIds = Array.isArray(payload?.cardIds) ? payload.cardIds : [];
    for (const cardId of payloadCardIds) {
      const normalized = String(cardId || "").trim();
      if (normalized) cardIds.add(normalized);
    }
  }

  return cardIds;
}
