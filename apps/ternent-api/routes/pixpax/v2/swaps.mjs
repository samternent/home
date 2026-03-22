import { createHash } from "node:crypto";

function trim(value) {
  return String(value || "").trim();
}

export function hashSwapPublicKey(publicKey) {
  return createHash("sha256")
    .update(`pixpax:swap:${trim(publicKey)}`, "utf8")
    .digest("hex");
}

export function createSwapRecord(input) {
  const offer = input.offerArtifact.payload;
  return {
    transferId: trim(offer.transferId),
    status: "offered",
    collectionId: trim(offer.collectionId),
    collectionVersion: trim(offer.collectionVersion),
    cardInstanceId: trim(offer.cardInstanceId),
    cardId: trim(offer.cardId),
    sourceClaimEntryId: trim(offer.sourceClaimEntryId),
    sourcePackId: trim(offer.sourcePackId),
    seriesId: trim(offer.seriesId) || null,
    slotIndex: Number(offer.slotIndex),
    role: trim(offer.role) || null,
    offeredAt: trim(offer.offeredAt),
    acceptedAt: null,
    recipientCompletedAt: null,
    senderCompletedAt: null,
    senderPublicKey: trim(offer.fromClaimant.normalizedValue || offer.fromClaimant.value),
    recipientPublicKey: trim(offer.toClaimant.normalizedValue || offer.toClaimant.value),
    senderHash: hashSwapPublicKey(
      trim(offer.fromClaimant.normalizedValue || offer.fromClaimant.value),
    ),
    recipientHash: hashSwapPublicKey(
      trim(offer.toClaimant.normalizedValue || offer.toClaimant.value),
    ),
    offerArtifact: input.offerArtifact,
    acceptanceArtifact: null,
  };
}

export function applyAcceptedSwapRecord(record, acceptanceArtifact) {
  const acceptance = acceptanceArtifact.payload;
  return {
    ...record,
    status: "accepted",
    acceptedAt: trim(acceptance.acceptedAt),
    recipientCompletedAt: trim(acceptance.acceptedAt),
    acceptanceArtifact,
  };
}

export function applyCompletedSwapRecord(record, completedAt) {
  const nextCompletedAt = trim(completedAt) || new Date().toISOString();
  return {
    ...record,
    status: "completed",
    senderCompletedAt: nextCompletedAt,
  };
}

export function recordMatchesInbox(record, recipientPublicKey, status = "") {
  const recipientHash = hashSwapPublicKey(recipientPublicKey);
  if (trim(record?.recipientHash) !== recipientHash) {
    return false;
  }
  const normalizedStatus = trim(status).toLowerCase();
  if (!normalizedStatus) {
    return trim(record?.status) !== "completed";
  }
  return trim(record?.status).toLowerCase() === normalizedStatus;
}

export function recordMatchesOutbox(record, senderPublicKey, status = "") {
  const senderHash = hashSwapPublicKey(senderPublicKey);
  if (trim(record?.senderHash) !== senderHash) {
    return false;
  }
  const normalizedStatus = trim(status).toLowerCase();
  if (!normalizedStatus) {
    return true;
  }
  return trim(record?.status).toLowerCase() === normalizedStatus;
}

export function sortSwapRecordsDesc(records) {
  return [...records].sort((left, right) => {
    const rightDate =
      trim(right?.acceptedAt) || trim(right?.offeredAt) || trim(right?.transferId);
    const leftDate = trim(left?.acceptedAt) || trim(left?.offeredAt) || trim(left?.transferId);
    if (leftDate !== rightDate) {
      return rightDate.localeCompare(leftDate);
    }
    return trim(right?.transferId).localeCompare(trim(left?.transferId));
  });
}
