import { createNonceHex, hashCanonical } from "../../stickerbook/stickerbook-utils.mjs";

export const PIXPAX_EVENT_TYPES = Object.freeze({
  COLLECTION_CREATED: "collection.created",
  SERIES_ADDED: "series.added",
  SERIES_RETIRED: "series.retired",
  CARD_ADDED: "card.added",
  PACK_ISSUED: "pack.issued",
  PACK_CLAIMED: "pack.claimed",
  GIFTCODE_CREATED: "giftcode.created",
  GIFTCODE_REDEEMED: "giftcode.redeemed",
  PACK_INVALIDATED: "pack.invalidated",
});

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function ensureString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function ensureIsoDate(value, label) {
  ensureString(value, label);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be an ISO-8601 date string.`);
  }
}

function assertPayloadForType(type, payload) {
  ensureObject(payload, "event.payload");

  switch (type) {
    case PIXPAX_EVENT_TYPES.COLLECTION_CREATED:
      ensureString(payload.collectionId, "event.payload.collectionId");
      ensureString(payload.version, "event.payload.version");
      break;
    case PIXPAX_EVENT_TYPES.SERIES_ADDED:
      ensureString(payload.collectionId, "event.payload.collectionId");
      ensureString(payload.version, "event.payload.version");
      if (!Array.isArray(payload.seriesIds)) {
        throw new Error("event.payload.seriesIds must be an array.");
      }
      for (const seriesId of payload.seriesIds) {
        ensureString(seriesId, "event.payload.seriesIds[]");
      }
      break;
    case PIXPAX_EVENT_TYPES.SERIES_RETIRED:
      ensureString(payload.collectionId, "event.payload.collectionId");
      ensureString(payload.version, "event.payload.version");
      ensureString(payload.seriesId, "event.payload.seriesId");
      break;
    case PIXPAX_EVENT_TYPES.CARD_ADDED:
      ensureString(payload.collectionId, "event.payload.collectionId");
      ensureString(payload.version, "event.payload.version");
      ensureString(payload.cardId, "event.payload.cardId");
      break;
    case PIXPAX_EVENT_TYPES.PACK_ISSUED:
      ensureString(payload.packId, "event.payload.packId");
      ensureString(payload.collectionId, "event.payload.collectionId");
      ensureString(payload.collectionVersion, "event.payload.collectionVersion");
      ensureString(payload.dropId, "event.payload.dropId");
      ensureString(payload.packRoot, "event.payload.packRoot");
      if (payload.cardIds !== undefined) {
        if (!Array.isArray(payload.cardIds)) {
          throw new Error("event.payload.cardIds must be an array when provided.");
        }
        for (const cardId of payload.cardIds) {
          ensureString(cardId, "event.payload.cardIds[]");
        }
      }
      if (payload.itemHashes !== undefined) {
        if (!Array.isArray(payload.itemHashes)) {
          throw new Error("event.payload.itemHashes must be an array when provided.");
        }
        for (const itemHash of payload.itemHashes) {
          ensureString(itemHash, "event.payload.itemHashes[]");
        }
      }
      if (
        payload.signedEntryPayload !== undefined &&
        (!payload.signedEntryPayload || typeof payload.signedEntryPayload !== "object")
      ) {
        throw new Error("event.payload.signedEntryPayload must be an object when provided.");
      }
      break;
    case PIXPAX_EVENT_TYPES.PACK_CLAIMED:
      ensureString(payload.packId, "event.payload.packId");
      ensureString(payload.collectionId, "event.payload.collectionId");
      ensureString(payload.collectionVersion, "event.payload.collectionVersion");
      ensureString(payload.dropId, "event.payload.dropId");
      ensureString(payload.issuedTo, "event.payload.issuedTo");
      break;
    case PIXPAX_EVENT_TYPES.GIFTCODE_CREATED:
      ensureString(payload.codeId, "event.payload.codeId");
      ensureString(payload.collectionId, "event.payload.collectionId");
      ensureString(payload.version, "event.payload.version");
      ensureString(payload.dropId, "event.payload.dropId");
      break;
    case PIXPAX_EVENT_TYPES.GIFTCODE_REDEEMED:
      ensureString(payload.codeId, "event.payload.codeId");
      ensureString(payload.packId, "event.payload.packId");
      ensureString(payload.collectionId, "event.payload.collectionId");
      ensureString(payload.version, "event.payload.version");
      ensureString(payload.issuedTo, "event.payload.issuedTo");
      break;
    case PIXPAX_EVENT_TYPES.PACK_INVALIDATED:
      ensureString(payload.packId, "event.payload.packId");
      ensureString(payload.reason, "event.payload.reason");
      break;
    default:
      throw new Error(`Unsupported PixPax event type: ${type}`);
  }
}

export function assertPixpaxEvent(event) {
  ensureObject(event, "event");
  ensureString(event.type, "event.type");
  ensureString(event.eventId, "event.eventId");
  ensureIsoDate(event.occurredAt, "event.occurredAt");
  assertPayloadForType(event.type, event.payload);
}

export function createPixpaxEvent(params) {
  const type = String(params?.type || "").trim();
  const occurredAt = String(params?.occurredAt || "").trim() || new Date().toISOString();
  const payload = params?.payload || {};
  const source = String(params?.source || "pixpax.collections").trim();
  const nonce = createNonceHex(12);

  assertPayloadForType(type, payload);
  ensureIsoDate(occurredAt, "event.occurredAt");

  const eventId = hashCanonical({
    type,
    occurredAt,
    payload,
    source,
    nonce,
  });

  const event = {
    eventId,
    type,
    occurredAt,
    source,
    payload,
  };
  assertPixpaxEvent(event);
  return event;
}
