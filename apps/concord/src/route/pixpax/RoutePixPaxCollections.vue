<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { Button } from "ternent-ui/primitives";
import { SSegmentedControl } from "ternent-ui/components";
import { useLocalStorage } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import PixPaxStickerCard from "../../module/pixpax/PixPaxStickerCard.vue";
import type {
  Collection,
  PackPalette16,
  Sticker,
  StickerMeta,
} from "../../module/pixpax/sticker-types";
import { useStickerbook } from "../../module/stickerbook/useStickerbook";

const apiBase = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_TERNENT_API_URL || "https://api.ternent.dev";

function buildApiUrl(path: string) {
  if (!apiBase) return path;
  return new URL(path, apiBase).toString();
}

function toIsoWeek(date = new Date()) {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${utc.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

type CollectionRef = {
  collectionId: string;
  version: string;
};

type ApiCollection = {
  collectionId?: string;
  name?: string;
  description?: string;
  version?: string;
  gridSize?: number;
  palette?: { id?: string; colors?: number[] };
};

type ApiIndex = {
  series?: Array<{ seriesId?: string; name?: string }>;
  cards?: string[];
  cardMap?: Record<
    string,
    { seriesId?: string; slotIndex?: number; role?: string }
  >;
};

type ApiCard = {
  cardId?: string;
  seriesId?: string;
  slotIndex?: number;
  role?: string;
  label?: string;
  renderPayload?: { gridSize?: number; gridB64?: string };
};

type ApiPackResponse = {
  packId: string;
  issuedAt: string;
  collectionId: string;
  collectionVersion: string;
  dropId: string;
  entry?: {
    kind?: string;
    payload?: Record<string, any>;
    signature?: string;
  };
  cards: ApiCard[];
  receipt?: { segmentKey?: string | null; segmentHash?: string | null };
  issuance?: {
    mode?: string;
    reused?: boolean;
    override?: boolean;
    untracked?: boolean;
  };
  packRoot?: string;
  itemHashes?: string[];
};

type ApiReceiptVerify = {
  ok?: boolean;
  error?: string;
  event?: {
    entry?: {
      payload?: Record<string, any>;
      signature?: string;
    };
  };
};

const DEFAULT_PALETTE: PackPalette16 = {
  id: "default-palette",
  colors: [
    0x00000000, 0xff111111, 0xffffffff, 0xffef4444, 0xff22c55e, 0xff3b82f6,
    0xfff59e0b, 0xffa855f7, 0xff06b6d4, 0xfff97316, 0xff84cc16, 0xffec4899,
    0xff8b5cf6, 0xfff5d0fe, 0xffbae6fd, 0xfffde68a,
  ],
};

function parseCollectionRefs(): CollectionRef[] {
  const raw = String(
    import.meta.env.VITE_PIXPAX_PUBLIC_COLLECTIONS || "",
  ).trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry: any) => ({
            collectionId: String(entry?.collectionId || "").trim(),
            version: String(entry?.version || "").trim(),
          }))
          .filter((entry) => entry.collectionId && entry.version);
      }
    } catch {
      // fall through to default
    }
  }

  return [{ collectionId: "premier-league-2026", version: "v2" }];
}

const refs = parseCollectionRefs();

const collections = ref<Collection[]>([]);
const indexByCollection = ref<Record<string, ApiIndex>>({});
const selectedCollectionId = ref("");
const selectedSeries = ref("all");
const loadingCollections = ref(false);
const loadingCards = ref(false);
const status = ref("Loading public collections...");
const loadError = ref("");

const activeTab = ref<"book" | "swaps">("book");
const tabItems = [
  { value: "book", label: "Pixbook" },
  { value: "swaps", label: "Swaps" },
];
const isSeriesSelectionDisabled = computed(() => activeTab.value === "swaps");

const packPhase = ref<"idle" | "opening" | "reveal" | "done">("idle");
const packError = ref("");
const packCards = ref<Sticker[]>([]);
const packRevealIndex = ref(0);
const revealDismissed = ref(false);
const anonUserKey = useLocalStorage("pixpax/collections/anon-user-key", "");
const { publicKey, receivedPacks, recordPackAndCommit } = useStickerbook();
const route = useRoute();
const router = useRouter();
const overrideCode = ref("");
const devUntrackedPackEnabled =
  import.meta.env.DEV ||
  String(import.meta.env.VITE_PIXPAX_DEV_UNTRACKED_PACKS || "")
    .trim()
    .toLowerCase() === "true";
const packMode = useLocalStorage<"weekly" | "dev-untracked">(
  "pixpax/collections/pack-mode",
  devUntrackedPackEnabled ? "dev-untracked" : "weekly",
);
const now = ref(Date.now());
let nowTimer: number | null = null;

const selectedCollection = computed(
  () =>
    collections.value.find(
      (entry) => entry.id === selectedCollectionId.value,
    ) || null,
);
const selectedCollectionRef = computed(
  () =>
    refs.find((entry) => entry.collectionId === selectedCollectionId.value) ||
    null,
);
const currentDropId = computed(() => `week-${toIsoWeek(new Date(now.value))}`);
const openedForCurrentDrop = computed(() => {
  const refEntry = selectedCollectionRef.value;
  if (!refEntry) return null;
  return (
    (receivedPacks.value as any[]).find((pack) => {
      const payload = pack?.data?.issuerIssuePayload || {};
      if (String(payload?.packModel || "") !== "album") return false;
      if (String(payload?.collectionId || "") !== refEntry.collectionId)
        return false;
      if (String(payload?.collectionVersion || "") !== refEntry.version)
        return false;
      return String(payload?.dropId || "") === currentDropId.value;
    }) || null
  );
});
const ownedStickerIds = computed(() => {
  const refEntry = selectedCollectionRef.value;
  if (!refEntry) return [];
  const ids = new Set<string>();
  for (const pack of receivedPacks.value as any[]) {
    const payload = pack?.data?.issuerIssuePayload || {};
    if (String(payload?.packModel || "") !== "album") continue;
    if (String(payload?.collectionId || "") !== refEntry.collectionId) continue;
    if (String(payload?.collectionVersion || "") !== refEntry.version) continue;
    const cardIds = Array.isArray(payload?.cardIds) ? payload.cardIds : [];
    for (const cardId of cardIds) {
      const normalized = String(cardId || "").trim();
      if (normalized) ids.add(normalized);
    }
  }
  return Array.from(ids);
});
const ownedStickerIdSet = computed(() => new Set(ownedStickerIds.value));

const seriesOptions = computed(() => {
  const set = new Set<string>();
  for (const sticker of selectedCollection.value?.stickers || []) {
    if (sticker.meta.series) set.add(sticker.meta.series);
  }
  return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
});
const selectedSeriesIndex = computed(() =>
  Math.max(0, seriesOptions.value.indexOf(selectedSeries.value)),
);
const selectedSeriesLabel = computed(() =>
  selectedSeries.value === "all" ? "All series" : selectedSeries.value,
);

const visibleStickers = computed(() => {
  const stickers = selectedCollection.value?.stickers || [];
  if (selectedSeries.value === "all") return stickers;
  return stickers.filter(
    (sticker) => sticker.meta.series === selectedSeries.value,
  );
});

const collectionTotalCreatures = computed(
  () => selectedCollection.value?.stickers.length || 0,
);
const collectionCollectedCount = computed(() => {
  const owned = new Set(ownedStickerIds.value);
  return (selectedCollection.value?.stickers || []).filter((sticker) =>
    owned.has(sticker.meta.id),
  ).length;
});
const collectionProgressPercent = computed(() => {
  if (!collectionTotalCreatures.value) return 0;
  return Math.min(
    100,
    Math.round(
      (collectionCollectedCount.value / collectionTotalCreatures.value) * 100,
    ),
  );
});
const isCollectionComplete = computed(
  () =>
    collectionTotalCreatures.value > 0 &&
    collectionCollectedCount.value >= collectionTotalCreatures.value,
);

const seriesTotalCreatures = computed(() => visibleStickers.value.length);
const seriesCollectedCount = computed(() => {
  const owned = new Set(ownedStickerIds.value);
  return visibleStickers.value.filter((sticker) => owned.has(sticker.meta.id))
    .length;
});
const seriesProgressPercent = computed(() => {
  if (!seriesTotalCreatures.value) return 0;
  return Math.min(
    100,
    Math.round((seriesCollectedCount.value / seriesTotalCreatures.value) * 100),
  );
});
const isSeriesComplete = computed(
  () =>
    seriesTotalCreatures.value > 0 &&
    seriesCollectedCount.value >= seriesTotalCreatures.value,
);
const duplicateCardGroups = computed(() => {
  const refEntry = selectedCollectionRef.value;
  if (!refEntry) return [];
  const counts = new Map<string, { count: number; card: Sticker | null }>();
  for (const pack of receivedPacks.value as any[]) {
    const payload = pack?.data?.issuerIssuePayload || {};
    if (String(payload?.packModel || "") !== "album") continue;
    if (String(payload?.collectionId || "") !== refEntry.collectionId) continue;
    if (String(payload?.collectionVersion || "") !== refEntry.version) continue;
    const cardIds = Array.isArray(payload?.cardIds) ? payload.cardIds : [];
    for (const rawCardId of cardIds) {
      const cardId = String(rawCardId || "").trim();
      if (!cardId) continue;
      const existing = counts.get(cardId) || { count: 0, card: null };
      existing.count += 1;
      counts.set(cardId, existing);
    }
  }
  const byId = new Map(
    (selectedCollection.value?.stickers || []).map((s) => [s.meta.id, s]),
  );
  const output = [];
  for (const [cardId, data] of counts.entries()) {
    if (data.count <= 1) continue;
    output.push({
      cardId,
      copies: data.count,
      spare: data.count - 1,
      card: byId.get(cardId) || null,
    });
  }
  output.sort((a, b) => b.spare - a.spare || a.cardId.localeCompare(b.cardId));
  return output;
});

const revealPlan = computed(() => {
  const seen = new Set<string>();
  const needs: Sticker[] = [];
  const duplicates: Sticker[] = [];

  for (const sticker of packCards.value) {
    if (seen.has(sticker.meta.id)) {
      duplicates.push(sticker);
    } else {
      seen.add(sticker.meta.id);
      needs.push(sticker);
    }
  }

  return { needs, duplicates };
});

const revealNeeds = computed(() => revealPlan.value.needs);
const revealDuplicates = computed(() => revealPlan.value.duplicates);
const revealComplete = computed(
  () => packRevealIndex.value >= revealNeeds.value.length,
);
const isPackRevealOpen = computed(
  () =>
    (packPhase.value === "reveal" || packPhase.value === "done") &&
    packCards.value.length > 0 &&
    !revealDismissed.value,
);
const remainingPackCards = computed(() =>
  revealNeeds.value.slice(packRevealIndex.value, packRevealIndex.value + 3),
);

const canOpenPack = computed(
  () =>
    !!selectedCollection.value &&
    selectedCollection.value.stickers.length > 0 &&
    (packMode.value === "dev-untracked" ||
      !openedForCurrentDrop.value ||
      !!overrideCode.value.trim()) &&
    packPhase.value !== "opening" &&
    packPhase.value !== "reveal",
);

const openPackLabel = computed(() => {
  if (packPhase.value === "opening" || packPhase.value === "reveal") {
    return "Opening pack...";
  }
  if (packMode.value === "dev-untracked") return "Open dev pack";
  if (overrideCode.value.trim()) return "Redeem code pack";
  if (openedForCurrentDrop.value) return "Open next weekly pack";
  return "Open pack";
});
const nextWeeklyDropAtMs = computed(() => {
  const cursor = new Date(now.value);
  const day = cursor.getUTCDay() || 7;
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCDate(cursor.getUTCDate() + (8 - day));
  return cursor.getTime();
});
const secondsUntilNextWeeklyDrop = computed(() =>
  Math.max(0, Math.ceil((nextWeeklyDropAtMs.value - now.value) / 1000)),
);
const nextDropLabel = computed(() => {
  const total = secondsUntilNextWeeklyDrop.value;
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
});
const packActionLabel = computed(() => {
  if (canOpenPack.value) return openPackLabel.value;
  if (
    packMode.value !== "dev-untracked" &&
    openedForCurrentDrop.value &&
    !overrideCode.value.trim()
  ) {
    return `Next pack in ${nextDropLabel.value}`;
  }
  return openPackLabel.value;
});

function selectPrevSeries() {
  if (isSeriesSelectionDisabled.value) return;
  if (!seriesOptions.value.length) return;
  const nextIndex =
    selectedSeriesIndex.value <= 0
      ? seriesOptions.value.length - 1
      : selectedSeriesIndex.value - 1;
  selectedSeries.value = seriesOptions.value[nextIndex] || "all";
}

function selectNextSeries() {
  if (isSeriesSelectionDisabled.value) return;
  if (!seriesOptions.value.length) return;
  const nextIndex =
    selectedSeriesIndex.value >= seriesOptions.value.length - 1
      ? 0
      : selectedSeriesIndex.value + 1;
  selectedSeries.value = seriesOptions.value[nextIndex] || "all";
}

function setStatus(message: string, detail?: unknown) {
  status.value = detail
    ? `${message}\n${JSON.stringify(detail, null, 2)}`
    : message;
}

function resolveIssuedUserKey() {
  const normalizedPublicKey = String(publicKey.value || "").trim();
  if (normalizedPublicKey) {
    return `concord:${normalizedPublicKey}`;
  }
  if (!anonUserKey.value) {
    anonUserKey.value = `anon:${Math.random().toString(36).slice(2, 12)}`;
  }
  return anonUserKey.value;
}

function normalizePalette(input?: ApiCollection["palette"]): PackPalette16 {
  const colors = Array.isArray(input?.colors) ? input!.colors : [];
  if (colors.length !== 16) return DEFAULT_PALETTE;
  return {
    id: String(input?.id || "palette"),
    colors: colors.map((value) => Number(value) >>> 0),
  };
}

function toSticker(args: {
  collection: Collection;
  card: ApiCard;
  fallbackSeries?: string;
}): Sticker {
  const cardId = String(args.card.cardId || "").trim();
  const seriesId = String(
    args.card.seriesId || args.fallbackSeries || "",
  ).trim();
  const gridB64 = String(args.card.renderPayload?.gridB64 || "").trim();
  const name = String(
    args.card.label || cardId || `${args.collection.name} Card`,
  );

  const meta: StickerMeta = {
    id: cardId,
    contentHash: "",
    name,
    collectionId: args.collection.id,
    collectionName: args.collection.name,
    series: seriesId,
    rarity: "common",
    finish: "matte",
    shiny: false,
  };

  return {
    meta,
    art: {
      v: 1,
      w: 16,
      h: 16,
      fmt: "idx4",
      px: gridB64,
    },
  };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${response.status} ${response.statusText}: ${text || "request failed"}`,
    );
  }
  return response.json() as Promise<T>;
}

async function fetchCollectionAndIndex(
  refEntry: CollectionRef,
): Promise<Collection> {
  const encodedCollectionId = encodeURIComponent(refEntry.collectionId);
  const encodedVersion = encodeURIComponent(refEntry.version);
  const [collectionJson, indexJson] = await Promise.all([
    fetchJson<ApiCollection>(
      `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/collection`,
    ),
    fetchJson<ApiIndex>(
      `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/index`,
    ),
  ]);

  indexByCollection.value[refEntry.collectionId] = indexJson;

  return {
    id: refEntry.collectionId,
    name: String(collectionJson.name || refEntry.collectionId),
    series: String(collectionJson.description || ""),
    palette: normalizePalette(collectionJson.palette),
    stickers: [],
  };
}

async function fetchCardsForCollection(collection: Collection) {
  const refEntry = refs.find((entry) => entry.collectionId === collection.id);
  if (!refEntry) return;
  const index = indexByCollection.value[collection.id];
  const cardIds = Array.isArray(index?.cards)
    ? index.cards.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  if (!cardIds.length) {
    collection.stickers = [];
    return;
  }

  loadingCards.value = true;
  try {
    const encodedCollectionId = encodeURIComponent(collection.id);
    const encodedVersion = encodeURIComponent(refEntry.version);

    const concurrency = 8;
    const stickers: Sticker[] = new Array(cardIds.length);
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < cardIds.length) {
        const current = nextIndex;
        nextIndex += 1;
        const cardId = cardIds[current];
        const encodedCardId = encodeURIComponent(cardId);
        const cardJson = await fetchJson<ApiCard>(
          `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/cards/${encodedCardId}`,
        );
        const mapping = index?.cardMap?.[cardId];
        stickers[current] = toSticker({
          collection,
          card: {
            ...cardJson,
            cardId,
            seriesId: cardJson.seriesId || mapping?.seriesId,
            slotIndex: cardJson.slotIndex ?? mapping?.slotIndex,
            role: cardJson.role || mapping?.role,
          },
          fallbackSeries: mapping?.seriesId,
        });
      }
    }

    await Promise.all(
      new Array(Math.min(concurrency, cardIds.length)).fill(null).map(worker),
    );
    collection.stickers = stickers;
  } finally {
    loadingCards.value = false;
  }
}

function toKitParts(cards: Sticker[]) {
  return cards.map((card) => ({
    cardId: card.meta.id,
    seriesId: card.meta.series || null,
    role: "player",
    renderPayload: {
      gridSize: card.art.w,
      gridB64: card.art.px,
    },
  }));
}

async function loadCollections() {
  loadingCollections.value = true;
  loadError.value = "";

  try {
    const loaded = await Promise.all(refs.map(fetchCollectionAndIndex));
    collections.value = loaded;
    if (
      !collections.value.find(
        (entry) => entry.id === selectedCollectionId.value,
      )
    ) {
      selectedCollectionId.value = collections.value[0]?.id || "";
    }
    setStatus("Loaded public collections.", {
      count: collections.value.length,
      refs,
    });
  } catch (error: any) {
    loadError.value = error?.message || String(error);
    setStatus("Failed to load public collections.", { error: loadError.value });
  } finally {
    loadingCollections.value = false;
  }
}

async function ensureSelectedCardsLoaded() {
  if (!selectedCollection.value || selectedCollection.value.stickers.length)
    return;
  try {
    await fetchCardsForCollection(selectedCollection.value);
    setStatus("Loaded collection cards.", {
      collectionId: selectedCollection.value.id,
      cards: selectedCollection.value.stickers.length,
    });
  } catch (error: any) {
    packError.value = error?.message || "Failed to load cards.";
    setStatus("Failed to load cards.", { error: packError.value });
  }
}

watch(
  () => selectedCollectionId.value,
  async () => {
    selectedSeries.value = "all";
    await ensureSelectedCardsLoaded();
  },
);

watch(
  () => activeTab.value,
  (nextTab) => {
    if (nextTab === "swaps") selectedSeries.value = "all";
  },
);

async function openPack() {
  if (!canOpenPack.value || !selectedCollection.value) return;

  packError.value = "";
  packPhase.value = "opening";

  const refEntry = refs.find(
    (entry) => entry.collectionId === selectedCollection.value?.id,
  );
  if (!refEntry) {
    packError.value = "Missing collection reference.";
    packPhase.value = "idle";
    return;
  }

  try {
    const payload = {
      userKey: resolveIssuedUserKey(),
      issuanceMode: packMode.value,
    };
    const normalizedOverrideCode = overrideCode.value.trim();
    if (normalizedOverrideCode && packMode.value !== "dev-untracked") {
      (payload as any).overrideCode = normalizedOverrideCode;
    }

    const response = await fetchJson<ApiPackResponse>(
      `/v1/pixpax/collections/${encodeURIComponent(
        refEntry.collectionId,
      )}/${encodeURIComponent(refEntry.version)}/packs`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const index = indexByCollection.value[selectedCollection.value.id];
    const nextCards = (Array.isArray(response.cards) ? response.cards : []).map(
      (card) => {
        const cardId = String(card.cardId || "").trim();
        const mapping = index?.cardMap?.[cardId];
        return toSticker({
          collection: selectedCollection.value!,
          card: {
            ...card,
            cardId,
            seriesId: card.seriesId || mapping?.seriesId,
            slotIndex: card.slotIndex ?? mapping?.slotIndex,
            role: card.role || mapping?.role,
          },
          fallbackSeries: mapping?.seriesId,
        });
      },
    );

    packCards.value = nextCards;
    packRevealIndex.value = 0;
    revealDismissed.value = false;
    packPhase.value = "reveal";

    setTimeout(() => {
      if (packPhase.value === "reveal") packPhase.value = "done";
    }, 650);

    const responsePayload = response.entry?.payload || {};
    const responseSignature = String(response.entry?.signature || "").trim();
    const responseIssuerKeyId = String(
      responsePayload?.issuerKeyId || "",
    ).trim();
    const receiptSegmentKey = String(response.receipt?.segmentKey || "").trim();
    let receiptVerified: boolean | null = null;
    let commitRecorded = false;
    let commitError = "";
    try {
      const canRecordDevUntrackedPack =
        String(response.issuance?.mode || "").trim() === "dev-untracked";
      if (responseSignature && responseIssuerKeyId) {
        await recordPackAndCommit({
          type: "pack.received",
          packId: response.packId,
          issuerIssuePayload: responsePayload,
          renderPayload: {
            kitParts: toKitParts(nextCards),
          },
          receiptRef: {
            segmentKey: response.receipt?.segmentKey || "",
            segmentHash: response.receipt?.segmentHash || "",
          },
          issuerSignature: responseSignature,
          issuerKeyId: responseIssuerKeyId,
        });
        commitRecorded = true;
      } else if (receiptSegmentKey) {
        const verify = await fetchJson<ApiReceiptVerify>(
          `/v1/pixpax/receipt/${encodeURIComponent(
            response.packId,
          )}?segmentKey=${encodeURIComponent(receiptSegmentKey)}`,
        );
        receiptVerified = !!verify?.ok;
        const issuePayload = verify?.event?.entry?.payload || {};
        const issueSignature = String(
          verify?.event?.entry?.signature || "",
        ).trim();
        const issuerKeyId = String(issuePayload?.issuerKeyId || "").trim();
        if (receiptVerified && issueSignature && issuerKeyId) {
          await recordPackAndCommit({
            type: "pack.received",
            packId: response.packId,
            issuerIssuePayload: issuePayload,
            renderPayload: {
              kitParts: toKitParts(nextCards),
            },
            receiptRef: {
              segmentKey: response.receipt?.segmentKey || "",
              segmentHash: response.receipt?.segmentHash || "",
            },
            issuerSignature: issueSignature,
            issuerKeyId,
          });
          commitRecorded = true;
        }
      } else if (canRecordDevUntrackedPack) {
        await recordPackAndCommit({
          type: "pack.received",
          packId: response.packId,
          issuerIssuePayload: responsePayload,
          renderPayload: {
            kitParts: toKitParts(nextCards),
          },
          receiptRef: {
            segmentKey: response.receipt?.segmentKey || "",
            segmentHash: response.receipt?.segmentHash || "",
          },
        });
        commitRecorded = true;
      }
    } catch (error: any) {
      commitError = error?.message || String(error);
      packError.value = `Pack opened, but commit recording failed: ${commitError}`;
      console.error("[pixpax/collections] commit record failed:", error);
    }

    setStatus("Pack opened via API.", {
      packId: response.packId,
      receipt: response.receipt,
      receiptVerified,
      commitRecorded,
      commitError: commitError || null,
      packRoot: response.packRoot,
      cardCount: response.cards?.length || 0,
    });
    if (normalizedOverrideCode) {
      overrideCode.value = "";
      if (route.query?.code) {
        const nextQuery = { ...route.query };
        delete (nextQuery as any).code;
        router.replace({ query: nextQuery });
      }
    }
  } catch (error: any) {
    packPhase.value = "idle";
    packError.value = error?.message || "Pack opening failed.";
    setStatus("Failed to open pack.", { error: packError.value });
  }
}

function collectNextPackCard() {
  packRevealIndex.value += 1;
}

function skipPackReveal() {
  packRevealIndex.value = revealNeeds.value.length;
}

function closePackReveal() {
  revealDismissed.value = true;
}

function isOwned(stickerId: string): boolean {
  return ownedStickerIdSet.value.has(stickerId);
}

onMounted(async () => {
  if (!devUntrackedPackEnabled && packMode.value === "dev-untracked") {
    packMode.value = "weekly";
  }
  nowTimer = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);

  const queryCode = route.query?.code;
  if (typeof queryCode === "string" && queryCode.trim()) {
    overrideCode.value = queryCode.trim();
  } else if (Array.isArray(queryCode) && queryCode[0]?.trim()) {
    overrideCode.value = String(queryCode[0]).trim();
  }
  await loadCollections();
  await ensureSelectedCardsLoaded();
});

onUnmounted(() => {
  if (nowTimer) window.clearInterval(nowTimer);
});

watch(
  () => route.query?.code,
  (queryCode) => {
    if (typeof queryCode === "string" && queryCode.trim()) {
      overrideCode.value = queryCode.trim();
      return;
    }
    if (Array.isArray(queryCode) && queryCode[0]?.trim()) {
      overrideCode.value = String(queryCode[0]).trim();
    }
  },
);

watch(
  () => packMode.value,
  (mode) => {
    if (mode === "dev-untracked") {
      overrideCode.value = "";
    }
  },
);
</script>

<template>
  <div
    ref="routeShellRef"
    class="route-shell flex flex-1 flex-col max-w-5xl mx-auto w-full"
  >
    <div class="flex flex-1 flex-col gap-2">
      <section
        class="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 relative backdrop-blur-xl p-4 border-b border-[var(--ui-border)]"
      >
        <div class="header-main">
          <div class="flex items-center justify-between gap-4">
            <span
              class="text-[10px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]"
            >
              Collection
            </span>
            <select
              v-model="selectedCollectionId"
              class="rounded-full border border-[var(--ui-border)] px-3 py-1 text-xs text-[var(--ui-fg)]"
            >
              <option
                v-for="entry in collections"
                :key="entry.id"
                :value="entry.id"
              >
                {{ entry.name }}
              </option>
            </select>
          </div>

          <div class="flex flex-col w-full">
            <h1
              class="collection-title z-1 text-[var(--ui-fg)] font-[900] no-underline tracking-[-0.08em] brand"
            >
              {{ selectedCollection?.name }}
            </h1>

            <div class="flex flex-col gap-2">
              <div
                class="h-1.5 lg:h-2 w-full rounded-full bg-[var(--ui-fg)]/10 ring-1 ring-[var(--ui-fg)]/20"
              >
                <div
                  class="h-full rounded-full bg-[var(--ui-fg)]/80 transition-[width] duration-300"
                  :style="{ width: `${collectionProgressPercent}%` }"
                ></div>
              </div>
              <div
                class="flex items-center gap-2 text-xs text-[var(--ui-fg-muted)]"
              >
                <span>
                  {{ collectionCollectedCount }} /
                  {{ collectionTotalCreatures }}
                  collected
                </span>
                <span
                  v-if="isCollectionComplete"
                  class="rounded-full border border-[var(--ui-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]"
                >
                  Completed
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col justify-center items-center gap-2">
            <span
              class="text-[10px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
            >
              Pack drop
            </span>
            <select
              v-if="devUntrackedPackEnabled"
              v-model="packMode"
              class="rounded-full border border-[var(--ui-border)] px-3 py-1 text-xs text-[var(--ui-fg)]"
            >
              <option value="weekly">Weekly tracked</option>
              <option value="dev-untracked">Dev untracked</option>
            </select>
            <Button
              class="!px-5 !py-2 !tracking-[-0.02em] !bg-[var(--ui-accent)]"
              :disabled="!canOpenPack"
              @click="openPack"
            >
              {{ packActionLabel }}
            </Button>
            <input
              class="override-input rounded-xl border border-[var(--ui-border)] text-xs px-3 py-1 flex w-full"
              v-model="overrideCode"
              type="text"
              placeholder="Paste gift code (PPX-XXXX-...)"
              :disabled="packMode === 'dev-untracked'"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <span class="uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]">
              {{ selectedSeriesLabel }}
            </span>
            <div class="series-progress-track">
              <div
                class="series-progress-fill"
                :style="{ width: `${seriesProgressPercent}%` }"
              ></div>
            </div>
            <span class="text-[10px] text-[var(--ui-fg-muted)]">
              {{ seriesCollectedCount }}/{{ seriesTotalCreatures }}
            </span>
            <span
              v-if="isSeriesComplete"
              class="text-[10px] uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
            >
              completed
            </span>
          </div>

          <div class="flex flex-col gap-2 items-end">
            <div class="series-nav">
              <button
                type="button"
                class="series-arrow"
                aria-label="Previous series"
                :disabled="isSeriesSelectionDisabled"
                @click="selectPrevSeries"
              >
                ‹
              </button>
              <select
                v-model="selectedSeries"
                class="rounded-full border border-[var(--ui-border)] px-3 py-1 text-xs text-[var(--ui-fg)]"
                aria-label="Filter by series"
                :disabled="isSeriesSelectionDisabled"
              >
                <option
                  v-for="entry in seriesOptions"
                  :key="entry"
                  :value="entry"
                >
                  {{ entry === "all" ? "All series" : entry }}
                </option>
              </select>
              <button
                type="button"
                class="series-arrow"
                aria-label="Next series"
                :disabled="isSeriesSelectionDisabled"
                @click="selectNextSeries"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>
      <div
        class="flex items-center justify-center px-4 max-w-4xl mx-auto w-full py-4"
      >
        <SSegmentedControl v-model="activeTab" :items="tabItems" />
      </div>
      <section
        v-if="activeTab === 'book'"
        class="mx-auto w-full max-w-4xl pb-8"
      >
        <div class="flex flex-col gap-6" v-if="!isPackRevealOpen">
          <p v-if="packError" class="text-sm font-semibold text-red-600">
            {{ packError }}
          </p>
          <p v-if="loadError" class="text-sm font-semibold text-red-600">
            {{ loadError }}
          </p>
          <p
            v-if="loadingCollections || loadingCards"
            class="text-xs text-[var(--ui-fg-muted)]"
          >
            {{
              loadingCollections ? "Loading collections..." : "Loading cards..."
            }}
          </p>
          <div class="flex gap-3 justify-items-center flex-wrap justify-center">
            <PixPaxStickerCard
              v-for="sticker in visibleStickers"
              :key="sticker.meta.id"
              :sticker="sticker"
              :palette="selectedCollection!.palette"
              :missing="!isOwned(sticker.meta.id)"
            />
          </div>
        </div>
      </section>

      <section v-else class="mx-auto w-full max-w-4xl">
        <div
          v-if="!duplicateCardGroups.length"
          class="text-sm text-[var(--ui-fg-muted)]"
        >
          No duplicates yet. Open packs in Pixbook to build swap inventory.
        </div>
        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 justify-items-center"
        >
          <div
            v-for="group in duplicateCardGroups"
            :key="group.cardId"
            class="flex flex-col items-center gap-1"
          >
            <PixPaxStickerCard
              v-if="group.card"
              :sticker="group.card"
              :palette="selectedCollection!.palette"
              compact
            />
            <div
              class="text-xs text-[var(--ui-fg-muted)] uppercase tracking-[0.14em]"
            >
              Spare x{{ group.spare }}
            </div>
          </div>
        </div>
      </section>

      <div
        v-if="isPackRevealOpen"
        class="absolute inset-0 z-50 flex items-center justify-center bg-[color-mix(in srgb, var(--ui-bg) 78%, transparent)] px-4 py-10 backdrop-blur-lg"
      >
        <div class="flex w-full max-w-3xl flex-col gap-6">
          <div class="flex items-center justify-between">
            <div
              class="flex items-center gap-3 text-xs uppercase tracking-[0.16em] bg-[var(--ui-surface)] rounded-full px-3 py-1 text-[var(--ui-fg-muted)]"
            >
              <span v-if="revealNeeds.length">
                {{ Math.min(packRevealIndex + 1, revealNeeds.length) }}/{{
                  revealNeeds.length
                }}
              </span>
              <span v-else>Duplicates</span>
              <span
                v-if="revealDuplicates.length"
                class="text-[var(--ui-fg-muted)]"
              >
                +{{ revealDuplicates.length }} dupes
              </span>
            </div>
            <button
              type="button"
              class="text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]"
              @click="revealComplete ? closePackReveal() : skipPackReveal()"
            >
              {{ revealComplete ? "End" : "Skip" }}
            </button>
          </div>

          <div
            class="relative mx-auto h-[360px] w-[260px]"
            v-if="!revealComplete"
          >
            <div
              v-for="(sticker, idx) in remainingPackCards"
              :key="`${sticker.meta.id}-${idx}`"
              class="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
              :style="{
                transform: `translateY(${idx * 8}px) translateX(${
                  idx * 5
                }px) rotate(${idx * 1.5}deg)`,
                zIndex: remainingPackCards.length - idx,
              }"
            >
              <button
                type="button"
                class="relative rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[0_16px_28px_rgba(15,23,42,0.22)] reveal-flip"
                @click="collectNextPackCard"
              >
                <PixPaxStickerCard
                  :sticker="sticker"
                  :palette="selectedCollection!.palette"
                />
                <span
                  class="mt-3 block text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
                >
                  Tap to collect
                </span>
              </button>
            </div>
          </div>

          <div
            v-else
            class="flex flex-col gap-3 rounded-2xl p-3 items-center"
            @click="closePackReveal"
          >
            <div class="text-sm text-[var(--ui-fg-muted)]">
              Pack complete. Tap to close.
            </div>
            <div class="text-xs text-[var(--ui-fg-muted)]">
              {{ revealDuplicates.length }} duplicates in this pack.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-main {
  display: grid;
  gap: 16px;
  transition: gap 0.22s ease;
}

.collection-title {
  font-size: clamp(2rem, 4.8vw, 3.2rem);
  line-height: 0.96;
  /* transition: font-size 0.22s ease, letter-spacing 0.22s ease; */
}

.pack-controls {
  transition: transform 0.22s ease;
}

.series-controls {
  display: grid;
  gap: 8px;
}

.series-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.series-arrow {
  width: 30px;
  height: 30px;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  color: var(--ui-fg);
  font-size: 18px;
  line-height: 1;
}

.series-arrow:disabled,
.series-nav select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.series-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.series-progress-track {
  width: 82px;
  height: 4px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ui-fg) 16%, transparent);
  overflow: hidden;
}

.series-progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ui-fg) 76%, transparent);
  transition: width 0.22s ease;
}

.override-input {
  max-width: 340px;
  transition: max-width 0.22s ease;
}

/* .sticky-controls.is-compact {
  position: absolute;
  top: 0;

  padding: 10px 12px;
  gap: 8px;
  z-index: 45;
  border-top: 1px solid var(--ui-border);
} */

.sticky-controls.is-compact .header-main {
  gap: 10px;
}

.sticky-controls.is-compact .collection-title {
  font-size: clamp(1.05rem, 2.4vw, 1.35rem);
  letter-spacing: -0.03em;
}

.sticky-controls.is-compact .pack-controls {
  transform: scale(0.9);
  transform-origin: top center;
}

.sticky-controls.is-compact .override-input {
  max-width: 270px;
}

@keyframes revealFlip {
  0% {
    opacity: 0;
    transform: rotateY(90deg) scale(0.96);
  }
  40% {
    opacity: 1;
    transform: rotateY(-8deg) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: rotateY(0deg) scale(1);
  }
}

.reveal-flip {
  transform-style: preserve-3d;
  animation: revealFlip 0.6s ease-out both;
}
</style>
