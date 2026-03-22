import type {
  PixbookClaimPackCommandInput,
  PixbookRecordTransferCommandInput,
  PixbookRecordPackOpenedCommandInput,
  PixbookSetDisplayProfileCommandInput,
  PixpaxPackIssuance,
  PixpaxPackIssuanceKind,
  PixpaxSignedArtifact,
  PixpaxTransferAcceptance,
  PixpaxTransferOffer,
} from "./types.js";
import {
  createPackContentsHash,
  createPackRoot,
  createPackItemHashes,
  normalizeCollectionScope,
} from "./canonical.js";

function trim(value: unknown): string {
  return String(value || "").trim();
}

function assertIsoString(value: unknown, label: string): string {
  const normalized = trim(value);
  if (!normalized || Number.isNaN(Date.parse(normalized))) {
    throw new Error(`${label} must be an ISO timestamp.`);
  }
  return normalized;
}

function assertPackKind(
  value: unknown,
  label: string,
): asserts value is PixpaxPackIssuanceKind {
  if (value !== "deterministic" && value !== "designated") {
    throw new Error(`${label} must be deterministic or designated.`);
  }
}

export async function assertValidPackIssuance(
  issuance: PixpaxPackIssuance,
): Promise<PixpaxPackIssuance> {
  if (!issuance || issuance.type !== "pixpax-pack-issuance") {
    throw new Error("issuance.type must be pixpax-pack-issuance.");
  }

  normalizeCollectionScope(issuance);
  assertIsoString(issuance.issuedAt, "issuedAt");
  assertPackKind(issuance.issuanceKind, "issuanceKind");

  if (issuance.issuanceKind === "deterministic") {
    if (!issuance.claimant || !trim(issuance.claimant.value)) {
      throw new Error("deterministic issuance requires claimant.");
    }
  }

  if (issuance.issuanceKind === "designated") {
    if (issuance.claimant !== null && !trim(issuance.claimant?.value)) {
      throw new Error("designated issuance claimant must be null or a valid identity.");
    }
    if (!trim(issuance.sourceCodeId)) {
      throw new Error("designated issuance requires sourceCodeId.");
    }
  }

  if (!Array.isArray(issuance.cards) || issuance.cards.length === 0) {
    throw new Error("issuance.cards must contain at least one card.");
  }
  if (!Array.isArray(issuance.itemHashes) || issuance.itemHashes.length === 0) {
    throw new Error("issuance.itemHashes must contain at least one hash.");
  }
  if (issuance.itemHashes.length !== issuance.cards.length) {
    throw new Error("issuance.itemHashes length must match issuance.cards.");
  }

  const recomputedItemHashes = await createPackItemHashes({
    scope: issuance,
    cards: issuance.cards,
  });
  for (let index = 0; index < recomputedItemHashes.length; index += 1) {
    if (recomputedItemHashes[index] !== issuance.itemHashes[index]) {
      throw new Error(`issuance.itemHashes[${index}] does not match card content.`);
    }
  }

  const recomputedPackRoot = await createPackRoot(issuance.itemHashes);
  if (recomputedPackRoot !== issuance.packRoot) {
    throw new Error("issuance.packRoot does not match itemHashes.");
  }

  const recomputedContentsHash = await createPackContentsHash({
    itemHashes: issuance.itemHashes,
    packRoot: issuance.packRoot,
  });
  if (recomputedContentsHash !== issuance.contentsHash) {
    throw new Error("issuance.contentsHash does not match pack contents.");
  }

  return issuance;
}

export async function assertValidSignedArtifact<TPayload extends object>(
  artifact: PixpaxSignedArtifact<TPayload>,
): Promise<PixpaxSignedArtifact<TPayload>> {
  if (!artifact || typeof artifact !== "object") {
    throw new Error("artifact is required.");
  }
  if (!artifact.proof || artifact.proof.type !== "seal-proof") {
    throw new Error("artifact.proof must be a seal-proof.");
  }
  return artifact;
}

export async function assertValidTransferOffer(
  offer: PixpaxTransferOffer,
): Promise<PixpaxTransferOffer> {
  if (!offer || offer.type !== "pixpax-transfer-offer") {
    throw new Error("offer.type must be pixpax-transfer-offer.");
  }
  normalizeCollectionScope(offer);
  assertIsoString(offer.offeredAt, "offeredAt");
  if (!trim(offer.cardInstanceId)) {
    throw new Error("cardInstanceId is required.");
  }
  if (!trim(offer.sourceClaimEntryId)) {
    throw new Error("sourceClaimEntryId is required.");
  }
  if (!trim(offer.sourcePackId)) {
    throw new Error("sourcePackId is required.");
  }
  if (!trim(offer.cardId)) {
    throw new Error("cardId is required.");
  }
  if (!offer.fromClaimant || !trim(offer.fromClaimant.value)) {
    throw new Error("fromClaimant is required.");
  }
  if (!offer.toClaimant || !trim(offer.toClaimant.value)) {
    throw new Error("toClaimant is required.");
  }
  if (!Number.isInteger(Number(offer.slotIndex)) || Number(offer.slotIndex) < 0) {
    throw new Error("slotIndex must be a non-negative integer.");
  }
  if (trim(offer.fromClaimant.normalizedValue) !== trim(offer.fromClaimant.value)) {
    throw new Error("fromClaimant.normalizedValue must match fromClaimant.value.");
  }
  if (trim(offer.toClaimant.normalizedValue) !== trim(offer.toClaimant.value)) {
    throw new Error("toClaimant.normalizedValue must match toClaimant.value.");
  }
  if (trim(offer.fromClaimant.normalizedValue) === trim(offer.toClaimant.normalizedValue)) {
    throw new Error("fromClaimant and toClaimant must differ.");
  }
  return offer;
}

export async function assertValidTransferAcceptance(
  acceptance: PixpaxTransferAcceptance,
): Promise<PixpaxTransferAcceptance> {
  if (!acceptance || acceptance.type !== "pixpax-transfer-acceptance") {
    throw new Error("acceptance.type must be pixpax-transfer-acceptance.");
  }
  normalizeCollectionScope(acceptance);
  assertIsoString(acceptance.acceptedAt, "acceptedAt");
  if (!trim(acceptance.transferId)) {
    throw new Error("transferId is required.");
  }
  if (!trim(acceptance.offerProofHash)) {
    throw new Error("offerProofHash is required.");
  }
  if (!trim(acceptance.cardInstanceId)) {
    throw new Error("cardInstanceId is required.");
  }
  if (!trim(acceptance.cardId)) {
    throw new Error("cardId is required.");
  }
  if (!trim(acceptance.sourceClaimEntryId)) {
    throw new Error("sourceClaimEntryId is required.");
  }
  if (!trim(acceptance.sourcePackId)) {
    throw new Error("sourcePackId is required.");
  }
  if (!acceptance.fromClaimant || !trim(acceptance.fromClaimant.value)) {
    throw new Error("fromClaimant is required.");
  }
  if (!acceptance.toClaimant || !trim(acceptance.toClaimant.value)) {
    throw new Error("toClaimant is required.");
  }
  if (!Number.isInteger(Number(acceptance.slotIndex)) || Number(acceptance.slotIndex) < 0) {
    throw new Error("slotIndex must be a non-negative integer.");
  }
  return acceptance;
}

export async function assertValidClaimPackCommandInput(
  input: PixbookClaimPackCommandInput,
): Promise<PixbookClaimPackCommandInput> {
  await assertValidSignedArtifact(input.artifact);
  await assertValidPackIssuance(input.artifact.payload);
  if (input.claimedAt) {
    assertIsoString(input.claimedAt, "claimedAt");
  }
  return input;
}

export function assertValidRecordPackOpenedCommandInput(
  input: PixbookRecordPackOpenedCommandInput,
): PixbookRecordPackOpenedCommandInput {
  if (!trim(input.claimEntryId)) {
    throw new Error("claimEntryId is required.");
  }
  if (!trim(input.packId)) {
    throw new Error("packId is required.");
  }
  if (input.openedAt) {
    assertIsoString(input.openedAt, "openedAt");
  }
  return input;
}

export function assertValidSetDisplayProfileCommandInput(
  input: PixbookSetDisplayProfileCommandInput,
): PixbookSetDisplayProfileCommandInput {
  if (!trim(input.displayName) && !trim(input.avatarUrl)) {
    throw new Error("displayName or avatarUrl must be provided.");
  }
  if (input.updatedAt) {
    assertIsoString(input.updatedAt, "updatedAt");
  }
  return input;
}

export async function assertValidRecordTransferCommandInput(
  input: PixbookRecordTransferCommandInput,
): Promise<PixbookRecordTransferCommandInput> {
  await assertValidSignedArtifact(input.offerArtifact);
  await assertValidSignedArtifact(input.acceptanceArtifact);
  await assertValidTransferOffer(input.offerArtifact.payload);
  await assertValidTransferAcceptance(input.acceptanceArtifact.payload);

  const offer = input.offerArtifact.payload;
  const acceptance = input.acceptanceArtifact.payload;

  if (trim(input.offerArtifact.proof.signer.publicKey) !== trim(offer.fromClaimant.normalizedValue)) {
    throw new Error("offerArtifact signer must match fromClaimant.");
  }
  if (
    trim(input.acceptanceArtifact.proof.signer.publicKey) !==
    trim(acceptance.toClaimant.normalizedValue)
  ) {
    throw new Error("acceptanceArtifact signer must match toClaimant.");
  }
  if (trim(acceptance.offerProofHash) !== trim(input.offerArtifact.proof.subject.hash)) {
    throw new Error("acceptance.offerProofHash must match offerArtifact proof subject hash.");
  }

  const expectedFields = [
    ["transferId", offer.transferId, acceptance.transferId],
    ["collectionId", offer.collectionId, acceptance.collectionId],
    ["collectionVersion", offer.collectionVersion, acceptance.collectionVersion],
    ["cardInstanceId", offer.cardInstanceId, acceptance.cardInstanceId],
    ["cardId", offer.cardId, acceptance.cardId],
    ["sourceClaimEntryId", offer.sourceClaimEntryId, acceptance.sourceClaimEntryId],
    ["sourcePackId", offer.sourcePackId, acceptance.sourcePackId],
    ["seriesId", offer.seriesId ?? null, acceptance.seriesId ?? null],
    ["slotIndex", offer.slotIndex, acceptance.slotIndex],
    ["role", offer.role ?? null, acceptance.role ?? null],
    ["fromClaimant", offer.fromClaimant.normalizedValue, acceptance.fromClaimant.normalizedValue],
    ["toClaimant", offer.toClaimant.normalizedValue, acceptance.toClaimant.normalizedValue],
  ] as const;

  for (const [label, left, right] of expectedFields) {
    if (left !== right) {
      throw new Error(`${label} must match between offer and acceptance.`);
    }
  }

  if (input.direction && input.direction !== "incoming" && input.direction !== "outgoing") {
    throw new Error("direction must be incoming or outgoing.");
  }
  if (input.recordedAt) {
    assertIsoString(input.recordedAt, "recordedAt");
  }

  return input;
}
