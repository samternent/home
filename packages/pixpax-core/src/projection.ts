import type {
  PixbookClaimedPackRecord,
  PixbookCollectionCompletion,
  PixbookOpenedPackRecord,
  PixbookOwnedCardInstance,
  PixbookReplayState,
  PixbookSeriesCompletion,
  PixbookTransferRecord,
  PixpaxCollectionCatalog,
} from "./types.js";
import { deriveCardInstanceId } from "./canonical.js";

function roundProgress(owned: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((owned / total) * 100));
}

export function createInitialPixbookReplayState(): PixbookReplayState {
  return {
    displayProfile: null,
    claimedPacksByEntryId: {},
    openedPacksByClaimEntryId: {},
    transfersByEntryId: {},
    ownedCardInstancesById: {},
    duplicateCountsByCardId: {},
    spareCountsByCardId: {},
    completionByCollectionKey: {},
    completionBySeriesKey: {},
    verificationByClaimEntryId: {},
    transferHistory: {
      outgoing: [],
      incoming: [],
    },
    ledgerHealth: {
      claimedPackCount: 0,
      openedPackCount: 0,
      lastEntryId: null,
      invalidEntries: [],
    },
  };
}

export async function deriveOwnedCardInstancesFromClaims(
  claims: Record<string, PixbookClaimedPackRecord>,
): Promise<Record<string, PixbookOwnedCardInstance>> {
  const owned: Record<string, PixbookOwnedCardInstance> = {};

  for (const [claimEntryId, claim] of Object.entries(claims)) {
    const issuance = claim.artifact.payload;
    for (const card of issuance.cards) {
      const cardInstanceId = await deriveCardInstanceId({
        claimEntryId,
        packId: issuance.packId,
        slotIndex: card.slotIndex,
        cardId: card.cardId,
      });
      owned[cardInstanceId] = {
        cardInstanceId,
        cardId: card.cardId,
        claimEntryId,
        packId: issuance.packId,
        collectionId: issuance.collectionId,
        collectionVersion: issuance.collectionVersion,
        seriesId: card.seriesId ?? null,
        slotIndex: card.slotIndex,
        role: card.role ?? null,
      };
    }
  }

  return owned;
}

function sortTransfers(
  transfers: Record<string, PixbookTransferRecord>,
): PixbookTransferRecord[] {
  return Object.values(transfers).sort((left, right) => {
    const timeCompare = String(left.recordedAt || "").localeCompare(
      String(right.recordedAt || ""),
    );
    if (timeCompare !== 0) return timeCompare;
    return String(left.transferEntryId || "").localeCompare(String(right.transferEntryId || ""));
  });
}

export function applyTransfersToOwnedCardInstances(
  owned: Record<string, PixbookOwnedCardInstance>,
  transfers: Record<string, PixbookTransferRecord>,
): Record<string, PixbookOwnedCardInstance> {
  const next = { ...owned };

  for (const transfer of sortTransfers(transfers)) {
    const offer = transfer.offerArtifact.payload;

    if (transfer.direction === "outgoing") {
      delete next[offer.cardInstanceId];
      continue;
    }

    next[offer.cardInstanceId] = {
      cardInstanceId: offer.cardInstanceId,
      cardId: offer.cardId,
      claimEntryId: offer.sourceClaimEntryId,
      packId: offer.sourcePackId,
      collectionId: offer.collectionId,
      collectionVersion: offer.collectionVersion,
      seriesId: offer.seriesId ?? null,
      slotIndex: offer.slotIndex,
      role: offer.role ?? null,
    };
  }

  return next;
}

export function deriveDuplicateCounts(
  owned: Record<string, PixbookOwnedCardInstance>,
): {
  duplicateCountsByCardId: Record<string, number>;
  spareCountsByCardId: Record<string, number>;
} {
  const counts: Record<string, number> = {};
  for (const instance of Object.values(owned)) {
    counts[instance.cardId] = (counts[instance.cardId] || 0) + 1;
  }

  const spares: Record<string, number> = {};
  for (const [cardId, count] of Object.entries(counts)) {
    spares[cardId] = Math.max(0, count - 1);
  }

  return {
    duplicateCountsByCardId: counts,
    spareCountsByCardId: spares,
  };
}

export function deriveCompletion(
  owned: Record<string, PixbookOwnedCardInstance>,
  catalogs: PixpaxCollectionCatalog[] = [],
): {
  completionByCollectionKey: Record<string, PixbookCollectionCompletion>;
  completionBySeriesKey: Record<string, PixbookSeriesCompletion>;
} {
  const ownedCardIdsByCollectionKey = new Map<string, Set<string>>();
  const ownedCardIdsBySeriesKey = new Map<string, Set<string>>();

  for (const instance of Object.values(owned)) {
    const collectionKey = `${instance.collectionId}::${instance.collectionVersion}`;
    const collectionSet =
      ownedCardIdsByCollectionKey.get(collectionKey) ?? new Set<string>();
    collectionSet.add(instance.cardId);
    ownedCardIdsByCollectionKey.set(collectionKey, collectionSet);

    const seriesKey = `${collectionKey}::${instance.seriesId || "unassigned"}`;
    const seriesSet = ownedCardIdsBySeriesKey.get(seriesKey) ?? new Set<string>();
    seriesSet.add(instance.cardId);
    ownedCardIdsBySeriesKey.set(seriesKey, seriesSet);
  }

  const completionByCollectionKey: Record<string, PixbookCollectionCompletion> =
    {};
  const completionBySeriesKey: Record<string, PixbookSeriesCompletion> = {};

  for (const catalog of catalogs) {
    const collectionKey = `${catalog.collectionId}::${catalog.collectionVersion}`;
    const uniqueOwned = ownedCardIdsByCollectionKey.get(collectionKey)?.size ?? 0;
    const totalCards = catalog.cards.length;

    completionByCollectionKey[collectionKey] = {
      totalCards,
      ownedUniqueCards: uniqueOwned,
      progressPercent: roundProgress(uniqueOwned, totalCards),
      complete: totalCards > 0 && uniqueOwned >= totalCards,
    };

    const cardsBySeries = new Map<string, Set<string>>();
    for (const card of catalog.cards) {
      const seriesId = String(card.seriesId || "").trim() || "unassigned";
      const set = cardsBySeries.get(seriesId) ?? new Set<string>();
      set.add(card.cardId);
      cardsBySeries.set(seriesId, set);
    }

    for (const [seriesId, set] of cardsBySeries.entries()) {
      const seriesKey = `${collectionKey}::${seriesId}`;
      const ownedUniqueCards = ownedCardIdsBySeriesKey.get(seriesKey)?.size ?? 0;
      completionBySeriesKey[seriesKey] = {
        seriesId,
        totalCards: set.size,
        ownedUniqueCards,
        progressPercent: roundProgress(ownedUniqueCards, set.size),
        complete: set.size > 0 && ownedUniqueCards >= set.size,
      };
    }
  }

  return {
    completionByCollectionKey,
    completionBySeriesKey,
  };
}

export async function createReplayStateFromClaims(input: {
  claimsByEntryId?: Record<string, PixbookClaimedPackRecord>;
  openedByClaimEntryId?: Record<string, PixbookOpenedPackRecord>;
  transfersByEntryId?: Record<string, PixbookTransferRecord>;
  catalogs?: PixpaxCollectionCatalog[];
}): Promise<PixbookReplayState> {
  const state = createInitialPixbookReplayState();
  state.claimedPacksByEntryId = { ...(input.claimsByEntryId || {}) };
  state.openedPacksByClaimEntryId = { ...(input.openedByClaimEntryId || {}) };
  state.transfersByEntryId = { ...(input.transfersByEntryId || {}) };
  const claimedInstances = await deriveOwnedCardInstancesFromClaims(state.claimedPacksByEntryId);
  state.ownedCardInstancesById = applyTransfersToOwnedCardInstances(
    claimedInstances,
    state.transfersByEntryId,
  );

  const duplicates = deriveDuplicateCounts(state.ownedCardInstancesById);
  state.duplicateCountsByCardId = duplicates.duplicateCountsByCardId;
  state.spareCountsByCardId = duplicates.spareCountsByCardId;

  const completion = deriveCompletion(
    state.ownedCardInstancesById,
    input.catalogs || [],
  );
  state.completionByCollectionKey = completion.completionByCollectionKey;
  state.completionBySeriesKey = completion.completionBySeriesKey;
  state.ledgerHealth.claimedPackCount = Object.keys(state.claimedPacksByEntryId).length;
  state.ledgerHealth.openedPackCount = Object.keys(
    state.openedPacksByClaimEntryId,
  ).length;
  const sortedTransfers = sortTransfers(state.transfersByEntryId);
  state.transferHistory = {
    outgoing: sortedTransfers
      .filter((entry) => entry.direction === "outgoing")
      .map((entry) => entry.transferEntryId),
    incoming: sortedTransfers
      .filter((entry) => entry.direction === "incoming")
      .map((entry) => entry.transferEntryId),
  };
  return state;
}
