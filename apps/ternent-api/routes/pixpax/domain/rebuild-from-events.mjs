import { PIXPAX_EVENT_TYPES } from "./events.mjs";

function sortEventsDeterministically(events) {
  return [...(events || [])].sort((a, b) => {
    const aAt = String(a?.occurredAt || "");
    const bAt = String(b?.occurredAt || "");
    if (aAt !== bAt) return aAt.localeCompare(bAt);
    return String(a?.eventId || "").localeCompare(String(b?.eventId || ""));
  });
}

export function rebuildCollectionSnapshotFromEvents(events) {
  const state = {
    collection: null,
    seriesById: new Set(),
    retiredSeriesById: new Set(),
    cardIds: new Set(),
    packsById: new Map(),
    claimedPackIds: new Set(),
    giftCodesById: new Map(),
  };

  for (const event of sortEventsDeterministically(events)) {
    const payload = event?.payload || {};
    switch (event?.type) {
      case PIXPAX_EVENT_TYPES.COLLECTION_CREATED:
        state.collection = {
          collectionId: String(payload.collectionId || ""),
          version: String(payload.version || ""),
          name: String(payload.name || ""),
          gridSize: Number(payload.gridSize || 0) || null,
          createdAt: String(event.occurredAt || ""),
        };
        break;
      case PIXPAX_EVENT_TYPES.SERIES_ADDED:
        for (const seriesId of payload.seriesIds || []) {
          const normalized = String(seriesId || "").trim();
          if (normalized) state.seriesById.add(normalized);
        }
        break;
      case PIXPAX_EVENT_TYPES.SERIES_RETIRED:
        if (payload.seriesId) {
          state.retiredSeriesById.add(String(payload.seriesId));
        }
        break;
      case PIXPAX_EVENT_TYPES.CARD_ADDED:
        if (payload.cardId) state.cardIds.add(String(payload.cardId));
        break;
      case PIXPAX_EVENT_TYPES.PACK_ISSUED:
        if (payload.packId) {
          state.packsById.set(String(payload.packId), {
            ...payload,
            issuedAt: String(event.occurredAt || ""),
          });
        }
        break;
      case PIXPAX_EVENT_TYPES.PACK_CLAIMED:
        if (payload.packId) state.claimedPackIds.add(String(payload.packId));
        break;
      case PIXPAX_EVENT_TYPES.GIFTCODE_CREATED:
        if (payload.codeId) {
          state.giftCodesById.set(String(payload.codeId), {
            ...payload,
            status: "created",
            createdAt: String(event.occurredAt || ""),
          });
        }
        break;
      case PIXPAX_EVENT_TYPES.GIFTCODE_REDEEMED:
        if (payload.codeId) {
          const existing = state.giftCodesById.get(String(payload.codeId)) || null;
          state.giftCodesById.set(String(payload.codeId), {
            ...(existing || {}),
            ...payload,
            status: "redeemed",
            redeemedAt: String(event.occurredAt || ""),
          });
        }
        break;
      default:
        break;
    }
  }

  return {
    collection: state.collection,
    seriesIds: [...state.seriesById].sort((a, b) => a.localeCompare(b)),
    retiredSeriesIds: [...state.retiredSeriesById].sort((a, b) => a.localeCompare(b)),
    cardIds: [...state.cardIds].sort((a, b) => a.localeCompare(b)),
    packsById: Object.fromEntries(
      [...state.packsById.entries()].sort(([a], [b]) => a.localeCompare(b))
    ),
    claimedPackIds: [...state.claimedPackIds].sort((a, b) => a.localeCompare(b)),
    giftCodesById: Object.fromEntries(
      [...state.giftCodesById.entries()].sort(([a], [b]) => a.localeCompare(b))
    ),
  };
}
