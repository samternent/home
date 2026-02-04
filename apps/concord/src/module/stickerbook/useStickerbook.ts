import { computed } from "vue";
import { useProfile } from "../profile/useProfile";
import { useLedger, useBridge } from "../ledger/useLedger";

type PackReceivedPayload = {
  type: "pack.received";
  packId: string;
  packRequestId: string;
  seriesId: string;
  themeId: string;
  periodId: string;
  profileId: string;
  packSeed: string;
  packRoot: string;
  algoVersion: string;
  kitHash: string;
  themeHash: string;
  issuerKeyId: string;
  verified?: boolean;
  verifiedAt: string;
};

type StickerOwnedPayload = {
  type: "sticker.owned";
  packId: string;
  packRequestId: string;
  seriesId: string;
  themeId: string;
  stickerId: string;
  creatureId?: string;
  index: number;
  rarity: string;
  catalogueId?: string | null;
  finish?: string;
  verified?: boolean;
  entry?: any;
  proof?: any;
  ownedAt: string;
};

export function useStickerbook() {
  const profile = useProfile();
  const ledger = useLedger();
  const bridge = useBridge();

  const packEntries = bridge.collections.useArray("pack.received");
  const stickerEntries = bridge.collections.useArray("sticker.owned");

  const openedEntries = computed(() =>
    packEntries.value.map((entry: any) => ({
      entryId: entry.entryId,
      data: entry.payload || entry.data || {},
    }))
  );

  const openedBySeriesPeriod = computed(() => {
    const map = new Map<string, PackReceivedPayload>();
    for (const entry of openedEntries.value) {
      const data = entry.data as PackReceivedPayload;
      if (!data?.seriesId || !data?.periodId) continue;
      map.set(`${data.seriesId}:${data.periodId}`, data);
    }
    return map;
  });

  const collectedByStickerId = computed(() => {
    const map = new Map<string, StickerOwnedPayload>();
    for (const entry of stickerEntries.value as any[]) {
      const data = entry.payload || entry.data;
      if (!data?.stickerId) continue;
      map.set(data.stickerId, data as StickerOwnedPayload);
    }
    return map;
  });

  const collectedByPackId = computed(() => {
    const map = new Map<string, StickerOwnedPayload[]>();
    for (const entry of stickerEntries.value as any[]) {
      const data = entry.payload || entry.data;
      if (!data?.packId) continue;
      const list = map.get(data.packId) || [];
      list.push(data as StickerOwnedPayload);
      map.set(data.packId, list);
    }
    return map;
  });

  const collectedBySeries = computed(() => {
    const map = new Map<string, StickerOwnedPayload[]>();
    for (const entry of stickerEntries.value as any[]) {
      const data = entry.payload || entry.data;
      if (!data?.seriesId) continue;
      const list = map.get(data.seriesId) || [];
      list.push(data as StickerOwnedPayload);
      map.set(data.seriesId, list);
    }
    return map;
  });

  const collectedUniqueBySeries = computed(() => {
    const map = new Map<string, Set<string>>();
    for (const entry of stickerEntries.value as any[]) {
      const data = entry.payload || entry.data;
      if (!data?.seriesId || !data?.stickerId) continue;
      const set = map.get(data.seriesId) || new Set<string>();
      set.add(data.stickerId);
      map.set(data.seriesId, set);
    }
    return map;
  });

  const collectedByCreatureId = computed(() => {
    const map = new Map<string, StickerOwnedPayload>();
    for (const entry of stickerEntries.value as any[]) {
      const data = entry.payload || entry.data;
      const key = data?.creatureId || data?.catalogueId || data?.stickerId;
      if (!key) continue;
      map.set(key, data as StickerOwnedPayload);
    }
    return map;
  });

  const swapsBySeries = computed(() => {
    const map = new Map<string, StickerOwnedPayload[]>();
    const counts = new Map<string, number>();
    for (const entry of stickerEntries.value as any[]) {
      const data = entry.payload || entry.data;
      const swapId = data?.creatureId || data?.stickerId;
      if (!data?.seriesId || !swapId) continue;
      const key = `${data.seriesId}:${swapId}`;
      const next = (counts.get(key) || 0) + 1;
      counts.set(key, next);
      if (next <= 1) continue;
      const list = map.get(data.seriesId) || [];
      list.push(data as StickerOwnedPayload);
      map.set(data.seriesId, list);
    }
    return map;
  });

  async function recordPackReceived(payload: PackReceivedPayload) {
    await ledger.api.addAndStage({
      kind: "pack.received",
      payload,
      silent: true,
    });
  }

  async function recordStickerOwned(payload: StickerOwnedPayload) {
    await ledger.api.addAndStage({
      kind: "sticker.owned",
      payload,
      silent: true,
    });
  }

  async function recordPackAndStickers(
    pack: PackReceivedPayload,
    stickers: StickerOwnedPayload[]
  ) {
    const ledgerApi = ledger.api.api;
    const priorPending = ledgerApi?.getState()?.pending ?? [];

    try {
      await recordPackReceived(pack);
      for (const sticker of stickers) {
        await recordStickerOwned(sticker);
      }
      await ledger.api.commit("stickerbook: pack received", {
        type: "stickerbook",
      });
    } catch (error) {
      if (ledgerApi?.replacePending) {
        await ledgerApi.replacePending(priorPending);
      }
      throw error;
    }
  }

  return {
    profileId: profile.profileId,
    openedEntries,
    openedBySeriesPeriod,
    collectedByStickerId,
    collectedByCreatureId,
    collectedBySeries,
    collectedUniqueBySeries,
    collectedByPackId,
    swapsBySeries,
    recordPackAndStickers,
  };
}

export function getPeriodId(date: Date) {
  const year = date.getUTCFullYear();
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const dayOffset = Math.floor(
    (date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000)
  );
  const week = Math.floor((dayOffset + firstDay.getUTCDay()) / 7);
  return `week-${year}-${week}`;
}
