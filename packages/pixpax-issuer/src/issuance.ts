import {
  PIXPAX_PACK_DERIVATION_VERSION,
  assertValidPackIssuance,
  canonicalizeClaimantIdentity,
  createPackContentsHash,
  createPackItemHashes,
  createPackRoot,
  hashCanonicalValue,
  selectDeterministicPackCards,
  type PixpaxCardCatalogEntry,
  type PixpaxClaimUniqueness,
  type PixpaxClaimantRef,
  type PixpaxCollectionScope,
  type PixpaxDropScope,
  type PixpaxPackIssuance,
} from "@ternent/pixpax-core";
import { hashData } from "ternent-utils";

function trim(value: unknown): string {
  return String(value || "").trim();
}

function assertPositiveCount(value: number): number {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer.");
  }
  return count;
}

function assertUniqueCardIds(cards: PixpaxCardCatalogEntry[]): PixpaxCardCatalogEntry[] {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("cards must contain at least one card.");
  }

  const seen = new Set<string>();
  for (const card of cards) {
    const cardId = trim(card?.cardId);
    if (!cardId) {
      throw new Error("cards must contain cardId values.");
    }
    if (seen.has(cardId)) {
      throw new Error(`Duplicate cardId in pack issuance is not allowed: ${cardId}`);
    }
    seen.add(cardId);
  }

  return cards;
}

async function createPackId(input: {
  claimant?: PixpaxClaimantRef | null;
  scope: PixpaxCollectionScope;
  drop: PixpaxDropScope;
  cards: PixpaxCardCatalogEntry[];
  issuedAt: string;
  sourceCodeId?: string | null;
}) {
  return await hashData({
    type: "pixpax-pack-id",
    claimant: input.claimant || null,
    collectionId: input.scope.collectionId,
    collectionVersion: input.scope.collectionVersion,
    dropId: input.drop.dropId,
    issuedAt: trim(input.issuedAt),
    sourceCodeId: trim(input.sourceCodeId) || null,
    cards: input.cards.map((card) => card.cardId),
  });
}

export async function createDeterministicPackIssuance(input: {
  claimant: PixpaxClaimantRef;
  scope: PixpaxCollectionScope;
  drop: PixpaxDropScope;
  availableCards: PixpaxCardCatalogEntry[];
  count: number;
  issuedAt: string;
  issuerKeyId?: string | null;
  claimUniqueness?: PixpaxClaimUniqueness;
}): Promise<PixpaxPackIssuance> {
  const count = assertPositiveCount(input.count);
  const availableCards = assertUniqueCardIds(input.availableCards);
  const issuedAt = trim(input.issuedAt);
  if (!issuedAt) {
    throw new Error("issuedAt is required.");
  }

  const selection = await selectDeterministicPackCards({
    claimant: input.claimant,
    scope: input.scope,
    drop: input.drop,
    count,
    pool: availableCards,
  });
  const claimant = await canonicalizeClaimantIdentity(input.claimant);
  const itemHashes = await createPackItemHashes({
    scope: input.scope,
    cards: selection.cards,
  });
  const packRoot = await createPackRoot(itemHashes);
  const contentsHash = await createPackContentsHash({
    itemHashes,
    packRoot,
  });
  const packId = await createPackId({
    claimant: input.claimant,
    scope: input.scope,
    drop: input.drop,
    cards: selection.cards,
    issuedAt,
  });

  return await assertValidPackIssuance({
    version: "1",
    type: "pixpax-pack-issuance",
    proofScheme: "seal",
    issuanceKind: "deterministic",
    derivationVersion: PIXPAX_PACK_DERIVATION_VERSION,
    claimUniqueness: input.claimUniqueness || "claimant-drop",
    packId,
    issuedAt,
    claimant,
    collectionId: trim(input.scope.collectionId),
    collectionVersion: trim(input.scope.collectionVersion),
    dropId: trim(input.drop.dropId),
    issuerKeyId: trim(input.issuerKeyId) || null,
    sourceCodeId: null,
    deterministicMaterialHash: selection.materialHash,
    cards: selection.cards,
    itemHashes,
    packRoot,
    contentsHash,
  });
}

export async function createDesignatedPackIssuance(input: {
  scope: PixpaxCollectionScope;
  drop: PixpaxDropScope;
  cards: PixpaxCardCatalogEntry[];
  issuedAt: string;
  issuerKeyId?: string | null;
  sourceCodeId: string;
  claimUniqueness?: PixpaxClaimUniqueness;
}): Promise<PixpaxPackIssuance> {
  const inputCards = assertUniqueCardIds(input.cards);

  const cards = inputCards.map((card, slotIndex) => ({
    cardId: trim(card.cardId),
    seriesId: trim(card.seriesId) || null,
    slotIndex,
    role: trim(card.role) || null,
    renderPayload:
      card.renderPayload && typeof card.renderPayload === "object"
        ? structuredClone(card.renderPayload)
        : null,
  }));
  const itemHashes = await createPackItemHashes({
    scope: input.scope,
    cards,
  });
  const packRoot = await createPackRoot(itemHashes);
  const contentsHash = await createPackContentsHash({
    itemHashes,
    packRoot,
  });
  const packId = await createPackId({
    claimant: null,
    scope: input.scope,
    drop: input.drop,
    cards,
    issuedAt: input.issuedAt,
    sourceCodeId: input.sourceCodeId,
  });

  return await assertValidPackIssuance({
    version: "1",
    type: "pixpax-pack-issuance",
    proofScheme: "seal",
    issuanceKind: "designated",
    derivationVersion: PIXPAX_PACK_DERIVATION_VERSION,
    claimUniqueness:
      input.claimUniqueness || "designated-code-first-claim",
    packId,
    issuedAt: trim(input.issuedAt),
    claimant: null,
    collectionId: trim(input.scope.collectionId),
    collectionVersion: trim(input.scope.collectionVersion),
    dropId: trim(input.drop.dropId),
    issuerKeyId: trim(input.issuerKeyId) || null,
    sourceCodeId: trim(input.sourceCodeId),
    deterministicMaterialHash: null,
    cards,
    itemHashes,
    packRoot,
    contentsHash,
  });
}

export async function createIssuanceProofSubjectPath(
  issuance: PixpaxPackIssuance,
): Promise<string> {
  return `pixpax/issuance/${trim(issuance.collectionId)}/${trim(
    issuance.collectionVersion,
  )}/${trim(issuance.dropId)}/${trim(issuance.packId)}.json`;
}

export async function createIssuancePayloadHash(
  issuance: PixpaxPackIssuance,
) {
  return await hashCanonicalValue(issuance);
}
