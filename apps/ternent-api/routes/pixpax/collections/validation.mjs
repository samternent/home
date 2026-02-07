function asNonEmptyString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInt(value) {
  return Number.isInteger(value) && value >= 0;
}

export function validateCollectionPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    errors.push("Body must be a JSON object.");
    return { ok: false, errors };
  }
  if (!isPositiveInt(payload.gridSize)) {
    errors.push("collection.gridSize must be a positive integer.");
  }
  return { ok: errors.length === 0, errors };
}

export function validateIndexPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    errors.push("Body must be a JSON object.");
    return { ok: false, errors };
  }

  const series = payload.series;
  const cards = payload.cards;
  const cardMap = payload.cardMap;

  if (!Array.isArray(series)) {
    errors.push("index.series must be an array.");
  }
  if (!Array.isArray(cards)) {
    errors.push("index.cards must be an array.");
  }
  if (!cardMap || typeof cardMap !== "object" || Array.isArray(cardMap)) {
    errors.push("index.cardMap must be an object.");
  }
  if (errors.length) return { ok: false, errors };

  const seriesIds = new Set();
  for (const item of series) {
    const seriesId = asNonEmptyString(item?.seriesId ?? item?.id);
    if (!seriesId) {
      errors.push("each index.series entry must include seriesId.");
      continue;
    }
    seriesIds.add(seriesId);
  }

  const normalizedCards = cards.map((cardId) => asNonEmptyString(cardId)).filter(Boolean);
  if (normalizedCards.length !== cards.length) {
    errors.push("index.cards must contain non-empty string cardIds.");
  }

  const uniqueCards = new Set(normalizedCards);
  if (uniqueCards.size !== normalizedCards.length) {
    errors.push("index.cards must not contain duplicate cardIds.");
  }

  for (const cardId of normalizedCards) {
    const mapping = cardMap[cardId];
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
      errors.push(`index.cardMap is missing mapping for cardId '${cardId}'.`);
      continue;
    }
    const mappingSeriesId = asNonEmptyString(mapping.seriesId);
    if (!mappingSeriesId) {
      errors.push(`index.cardMap['${cardId}'].seriesId is required.`);
    } else if (!seriesIds.has(mappingSeriesId)) {
      errors.push(`index.cardMap['${cardId}'].seriesId '${mappingSeriesId}' is not in index.series.`);
    }
    if (!isNonNegativeInt(mapping.slotIndex)) {
      errors.push(`index.cardMap['${cardId}'].slotIndex must be a non-negative integer.`);
    }
    if (!asNonEmptyString(mapping.role)) {
      errors.push(`index.cardMap['${cardId}'].role is required.`);
    }
  }

  for (const mappedCardId of Object.keys(cardMap)) {
    if (!uniqueCards.has(mappedCardId)) {
      errors.push(`index.cardMap contains extra cardId '${mappedCardId}' not present in index.cards.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateCardPayload(payload, expectedCardId, expectedGridSize) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    errors.push("Body must be a JSON object.");
    return { ok: false, errors };
  }

  const cardId = asNonEmptyString(payload.cardId);
  if (cardId && expectedCardId && cardId !== expectedCardId) {
    errors.push("card.cardId must match :cardId path parameter.");
  }

  const renderPayload = payload.renderPayload;
  if (!renderPayload || typeof renderPayload !== "object" || Array.isArray(renderPayload)) {
    errors.push("card.renderPayload is required.");
    return { ok: false, errors };
  }

  if (!asNonEmptyString(renderPayload.gridB64)) {
    errors.push("card.renderPayload.gridB64 is required.");
  }

  if (!isPositiveInt(renderPayload.gridSize)) {
    errors.push("card.renderPayload.gridSize must be a positive integer.");
  }

  if (
    isPositiveInt(expectedGridSize) &&
    isPositiveInt(renderPayload.gridSize) &&
    renderPayload.gridSize !== expectedGridSize
  ) {
    errors.push(
      `card.renderPayload.gridSize (${renderPayload.gridSize}) must match collection.gridSize (${expectedGridSize}).`
    );
  }

  return { ok: errors.length === 0, errors };
}
