import { canonicalStringify, hashData } from "ternent-utils";
import type {
  PixpaxCardCatalogEntry,
  PixpaxClaimantIdentity,
  PixpaxClaimantRef,
  PixpaxCollectionScope,
  PixpaxDropScope,
  PixpaxPackCard,
  PixpaxProofSubjectHash,
} from "./types.js";
import {
  PIXPAX_CARD_INSTANCE_VERSION,
  PIXPAX_PACK_DERIVATION_VERSION,
} from "./constants.js";

function trim(value: unknown): string {
  return String(value || "").trim();
}

function assertNonEmpty(value: string, label: string): string {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function asProofHash(value: string): PixpaxProofSubjectHash {
  return `sha256:${value}`;
}

export function normalizeClaimantRef(
  claimant: PixpaxClaimantRef,
): PixpaxClaimantRef {
  return {
    type: "identity-public-key",
    value: assertNonEmpty(trim(claimant?.value), "claimant.value"),
  };
}

export async function canonicalizeClaimantIdentity(
  claimant: PixpaxClaimantRef,
): Promise<PixpaxClaimantIdentity> {
  const normalized = normalizeClaimantRef(claimant);
  return {
    ...normalized,
    normalizedValue: normalized.value,
    fingerprint: await hashData({
      type: "pixpax-claimant-fingerprint",
      value: normalized.value,
    }),
  };
}

export function normalizeCollectionScope(
  scope: PixpaxCollectionScope,
): PixpaxCollectionScope {
  return {
    collectionId: assertNonEmpty(trim(scope?.collectionId), "collectionId"),
    collectionVersion: assertNonEmpty(
      trim(scope?.collectionVersion),
      "collectionVersion",
    ),
  };
}

export function normalizeDropScope(scope: PixpaxDropScope): PixpaxDropScope {
  return {
    dropId: assertNonEmpty(trim(scope?.dropId), "dropId"),
  };
}

export function normalizeCardCatalogEntry(
  card: PixpaxCardCatalogEntry,
  slotIndex?: number,
): PixpaxPackCard {
  const cardId = assertNonEmpty(trim(card?.cardId), "cardId");
  const normalizedSlotIndex = Number(slotIndex);
  if (!Number.isInteger(normalizedSlotIndex) || normalizedSlotIndex < 0) {
    throw new Error("slotIndex must be a non-negative integer.");
  }

  return {
    cardId,
    seriesId: trim(card?.seriesId) || null,
    slotIndex: normalizedSlotIndex,
    role: trim(card?.role) || null,
    renderPayload:
      card?.renderPayload && typeof card.renderPayload === "object"
        ? structuredClone(card.renderPayload)
        : null,
  };
}

export async function createDeterministicIssuanceMaterial(input: {
  claimant: PixpaxClaimantRef;
  scope: PixpaxCollectionScope;
  drop: PixpaxDropScope;
  count: number;
}): Promise<{
  version: typeof PIXPAX_PACK_DERIVATION_VERSION;
  claimant: PixpaxClaimantIdentity;
  collectionId: string;
  collectionVersion: string;
  dropId: string;
  count: number;
}> {
  const claimant = await canonicalizeClaimantIdentity(input.claimant);
  const scope = normalizeCollectionScope(input.scope);
  const drop = normalizeDropScope(input.drop);
  const count = Number(input.count);

  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer.");
  }

  return {
    version: PIXPAX_PACK_DERIVATION_VERSION,
    claimant,
    collectionId: scope.collectionId,
    collectionVersion: scope.collectionVersion,
    dropId: drop.dropId,
    count,
  };
}

export async function hashCanonicalValue(
  value: unknown,
): Promise<PixpaxProofSubjectHash> {
  return asProofHash(
    await hashData(value as string | object | number),
  );
}

export async function createPackItemHash(input: {
  scope: PixpaxCollectionScope;
  card: PixpaxPackCard;
}): Promise<PixpaxProofSubjectHash> {
  const scope = normalizeCollectionScope(input.scope);
  const card = normalizeCardCatalogEntry(input.card, input.card.slotIndex);
  return hashCanonicalValue({
    type: "pixpax-pack-item",
    collectionId: scope.collectionId,
    collectionVersion: scope.collectionVersion,
    cardId: card.cardId,
    slotIndex: card.slotIndex,
    seriesId: card.seriesId,
    role: card.role,
    renderPayload: card.renderPayload ?? null,
  });
}

export async function createPackItemHashes(input: {
  scope: PixpaxCollectionScope;
  cards: PixpaxPackCard[];
}): Promise<PixpaxProofSubjectHash[]> {
  const hashes: PixpaxProofSubjectHash[] = [];
  for (const card of input.cards) {
    hashes.push(await createPackItemHash({ scope: input.scope, card }));
  }
  return hashes;
}

export async function createPackRoot(
  itemHashes: PixpaxProofSubjectHash[],
): Promise<PixpaxProofSubjectHash> {
  if (!Array.isArray(itemHashes) || itemHashes.length === 0) {
    throw new Error("itemHashes must contain at least one hash.");
  }

  let level = [...itemHashes];
  while (level.length > 1) {
    const next: PixpaxProofSubjectHash[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      const right = level[index + 1] ?? left;
      next.push(
        await hashCanonicalValue({
          type: "pixpax-pack-root-node",
          left,
          right,
        }),
      );
    }
    level = next;
  }
  return level[0];
}

export async function createPackContentsHash(input: {
  itemHashes: PixpaxProofSubjectHash[];
  packRoot: PixpaxProofSubjectHash;
}): Promise<PixpaxProofSubjectHash> {
  return hashCanonicalValue({
    type: "pixpax-pack-contents",
    itemHashes: input.itemHashes,
    packRoot: input.packRoot,
    count: input.itemHashes.length,
  });
}

export async function deriveCardInstanceId(input: {
  claimEntryId: string;
  packId: string;
  slotIndex: number;
  cardId: string;
}): Promise<string> {
  const claimEntryId = assertNonEmpty(trim(input.claimEntryId), "claimEntryId");
  const packId = assertNonEmpty(trim(input.packId), "packId");
  const cardId = assertNonEmpty(trim(input.cardId), "cardId");
  const slotIndex = Number(input.slotIndex);

  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    throw new Error("slotIndex must be a non-negative integer.");
  }

  return await hashData({
    version: PIXPAX_CARD_INSTANCE_VERSION,
    claimEntryId,
    packId,
    slotIndex,
    cardId,
  });
}

export function stringifyCanonical(value: unknown): string {
  return canonicalStringify(value as string | object | number);
}
