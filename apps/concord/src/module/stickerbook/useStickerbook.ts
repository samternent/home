import { computed } from "vue";
import { stripIdentityKey, generateId } from "ternent-utils";
import { useLedger } from "../ledger/useLedger";
import { useIdentity } from "../identity/useIdentity";

type PackOpened = {
  id: string;
  packId: string;
  seriesId: string;
  periodId: string;
  profile: string;
  openedAt: string;
};

type Collected = {
  id: string;
  packId: string;
  seriesId: string;
  creatureId: string;
  rarity: string;
  finish: string;
  collectedAt: string;
};

type Swap = {
  id: string;
  packId: string;
  seriesId: string;
  creatureId: string;
  rarity: string;
  finish: string;
  swappedAt: string;
};

export function getPeriodId(date = new Date()) {
  const seconds = parseInt(
    import.meta.env.VITE_STICKERBOOK_PERIOD_SECONDS || "",
    10
  );
  if (Number.isFinite(seconds) && seconds > 0) {
    const bucket = Math.floor(date.getTime() / (seconds * 1000));
    return `dev-${bucket}`;
  }

  const year = date.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function useStickerbook() {
  const { bridge, addItem } = useLedger();
  const { publicKeyPEM } = useIdentity();

  const profileId = computed(() => {
    const key = publicKeyPEM?.value || "";
    return key ? stripIdentityKey(key) : "anon";
  });

  const openedEntries = computed(() =>
    Object.values(bridge.collections.byKind.value?.["stickerbook-opened"] || {})
  );

  const collectedEntries = computed(() =>
    Object.values(
      bridge.collections.byKind.value?.["stickerbook-collected"] || {}
    )
  );

  const swapEntries = computed(() =>
    Object.values(bridge.collections.byKind.value?.["stickerbook-swaps"] || {})
  );

  const openedBySeriesPeriod = computed(() => {
    const map = new Map<string, PackOpened>();
    for (const entry of openedEntries.value) {
      if (!entry?.data?.periodId || !entry?.data?.seriesId) continue;
      const key = `${entry.data.seriesId}:${entry.data.periodId}`;
      map.set(key, entry.data);
    }
    return map;
  });

  const collectedByCreatureId = computed(() => {
    const map = new Map<string, Collected>();
    for (const entry of collectedEntries.value) {
      if (!entry?.data?.creatureId) continue;
      map.set(entry.data.creatureId, entry.data);
    }
    return map;
  });

  const collectedBySeries = computed(() => {
    const map = new Map<string, Collected[]>();
    for (const entry of collectedEntries.value) {
      if (!entry?.data?.seriesId) continue;
      const list = map.get(entry.data.seriesId) || [];
      list.push(entry.data);
      map.set(entry.data.seriesId, list);
    }
    return map;
  });

  const collectedUniqueBySeries = computed(() => {
    const map = new Map<string, Map<string, Collected>>();
    for (const entry of collectedEntries.value) {
      if (!entry?.data?.seriesId || !entry?.data?.creatureId) continue;
      const seriesMap =
        map.get(entry.data.seriesId) || new Map<string, Collected>();
      seriesMap.set(entry.data.creatureId, entry.data);
      map.set(entry.data.seriesId, seriesMap);
    }
    return map;
  });

  const collectedByRarity = computed(() => {
    const map = new Map<string, Collected[]>();
    for (const entry of collectedEntries.value) {
      if (!entry?.data?.rarity) continue;
      const list = map.get(entry.data.rarity) || [];
      list.push(entry.data);
      map.set(entry.data.rarity, list);
    }
    return map;
  });

  const collectedByPackId = computed(() => {
    const map = new Map<string, Collected[]>();
    for (const entry of collectedEntries.value) {
      if (!entry?.data?.packId) continue;
      const list = map.get(entry.data.packId) || [];
      list.push(entry.data);
      map.set(entry.data.packId, list);
    }
    return map;
  });

  const swapsBySeries = computed(() => {
    const map = new Map<string, Swap[]>();
    for (const entry of swapEntries.value) {
      if (!entry?.data?.seriesId) continue;
      const list = map.get(entry.data.seriesId) || [];
      list.push(entry.data);
      map.set(entry.data.seriesId, list);
    }
    return map;
  });

  async function recordPackOpened(payload: Omit<PackOpened, "id">) {
    await addItem({ id: generateId(), ...payload }, "stickerbook-opened");
  }

  async function recordCollected(payload: Omit<Collected, "id">) {
    await addItem({ id: generateId(), ...payload }, "stickerbook-collected");
  }

  async function recordSwap(payload: Omit<Swap, "id">) {
    await addItem({ id: generateId(), ...payload }, "stickerbook-swaps");
  }

  return {
    profileId,
    openedEntries,
    collectedEntries,
    swapEntries,
    openedBySeriesPeriod,
    collectedByCreatureId,
    collectedBySeries,
    collectedUniqueBySeries,
    collectedByRarity,
    collectedByPackId,
    swapsBySeries,
    recordPackOpened,
    recordCollected,
    recordSwap,
  };
}
