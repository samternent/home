<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { Button } from "ternent-ui/primitives";
import { SSegmentedControl } from "ternent-ui/components";
import { useLocalStorage } from "@vueuse/core";
import { stripIdentityKey } from "ternent-utils";
import { useRoute, useRouter } from "vue-router";
import PackDropCard from "../../module/pixpax/PackDropCard.vue";
import PixPaxStickerCard from "../../module/pixpax/PixPaxStickerCard.vue";
import type {
  Collection,
  PackPalette16,
  Sticker,
  StickerMeta,
} from "../../module/pixpax/sticker-types";
import { usePixbook } from "../../module/pixpax/state/usePixbook";
import { usePixpaxActivityLock } from "../../module/pixpax/context/usePixpaxActivityLock";
import { usePixpaxCloudSync } from "../../module/pixpax/context/usePixpaxCloudSync";
import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import { signCollectorProofFromTokenHash } from "../../module/pixpax/domain/code-token";
import { pickCollectionRouteTarget } from "../../module/pixpax/domain/collection-discovery";

function resolveApiBase() {
  if (import.meta.env.DEV) return "";
  const configured = String(import.meta.env.VITE_TERNENT_API_URL || "").trim();
  if (/^https?:\/\//i.test(configured)) return configured;
  return "https://api.ternent.dev";
}

const apiBase = resolveApiBase();

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

type ApiCollection = {
  collectionId?: string;
  name?: string;
  description?: string;
  version?: string;
  gridSize?: number;
  palette?: { id?: string; colors?: number[] };
};

type CollectionRef = {
  collectionId: string;
  version: string;
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
  attributes?: {
    shiny?: boolean | string | number | null;
    shiney?: boolean | string | number | null;
  };
  tags?: string[];
  meta?: {
    tags?: string[];
  };
  renderPayload?: { gridSize?: number; gridB64?: string };
};

type ApiCollectionBundle = {
  collection?: ApiCollection;
  index?: ApiIndex;
  cards?: ApiCard[];
  missingCardIds?: string[];
  settings?: {
    visibility?: "public" | "unlisted";
    issuanceMode?: "scheduled" | "codes-only";
    [key: string]: unknown;
  };
};

type ApiCollectionResolve = {
  ok?: boolean;
  collectionId?: string;
  resolvedVersion?: string;
  settings?: {
    visibility?: "public" | "unlisted";
    issuanceMode?: "scheduled" | "codes-only";
    [key: string]: unknown;
  };
  issuer?: {
    name?: string;
    avatarUrl?: string;
  };
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

const props = withDefaults(
  defineProps<{
    forcedCollectionId?: string;
  }>(),
  {
    forcedCollectionId: "",
  },
);

const DEFAULT_COLLECTION_SETTINGS = {
  visibility: "public",
  issuanceMode: "scheduled",
} as const;

const collections = ref<Collection[]>([]);
const indexByCollection = ref<Record<string, ApiIndex>>({});
const selectedCollectionId = ref("");
const selectedCollectionVersion = ref("");
const selectedCollectionSettings = ref<Record<string, unknown>>({
  ...DEFAULT_COLLECTION_SETTINGS,
});
const issuerDisplay = ref<{ name: string; avatarUrl?: string }>({
  name: "PixPax",
});
const selectedSeries = ref("all");
const loadingCollections = ref(false);
const status = ref("Loading collection...");
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
const packMeta = ref<{ packId: string } | null>(null);
const packRevealIndex = ref(0);
const revealDismissed = ref(false);
const packOwnedCountSnapshot = ref<Map<string, number> | null>(null);
const anonUserKey = useLocalStorage("pixpax/collections/anon-user-key", "");
const { publicKey, receivedPacks, recordPackAndCommit } = usePixbook();
const identity = useIdentity() as any;
const activityLock = usePixpaxActivityLock();
const cloudSync = usePixpaxCloudSync();
const { ledger } = useLedger();
const route = useRoute();
const router = useRouter();
const redeemToken = ref("");
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
  () => {
    if (!selectedCollectionId.value || !selectedCollectionVersion.value) return null;
    return {
      collectionId: selectedCollectionId.value,
      version: selectedCollectionVersion.value,
    };
  },
);
const selectedCollectionIssuanceMode = computed(() =>
  String(selectedCollectionSettings.value?.issuanceMode || "scheduled") === "codes-only"
    ? "codes-only"
    : "scheduled",
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
const seriesGroupsForBook = computed(() => {
  const stickers = selectedCollection.value?.stickers || [];
  const owned = new Set(ownedStickerIds.value);
  const bySeries = new Map<string, Sticker[]>();
  for (const sticker of stickers) {
    const key = String(sticker.meta.series || "").trim() || "Unassigned";
    const list = bySeries.get(key) || [];
    list.push(sticker);
    bySeries.set(key, list);
  }
  const sortedSeries = Array.from(bySeries.keys()).sort((a, b) =>
    a.localeCompare(b),
  );
  return sortedSeries.map((series) => {
    const entries = bySeries.get(series) || [];
    const collected = entries.filter((sticker) =>
      owned.has(sticker.meta.id),
    ).length;
    const total = entries.length;
    const progressPercent = total
      ? Math.min(100, Math.round((collected / total) * 100))
      : 0;
    return {
      series,
      stickers: entries,
      collected,
      total,
      progressPercent,
      complete: total > 0 && collected >= total,
    };
  });
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

function getOwnedCountsForSelectedCollection(
  options: { excludePackId?: string | null } = {},
) {
  const refEntry = selectedCollectionRef.value;
  const map = new Map<string, number>();
  if (!refEntry) return map;
  const excludePackId = String(options.excludePackId || "").trim();
  for (const pack of receivedPacks.value as any[]) {
    const payload = pack?.data?.issuerIssuePayload || {};
    if (String(payload?.packModel || "") !== "album") continue;
    if (String(payload?.collectionId || "") !== refEntry.collectionId) continue;
    if (String(payload?.collectionVersion || "") !== refEntry.version) continue;
    const packId = String(payload?.packId || pack?.data?.packId || "").trim();
    if (excludePackId && packId === excludePackId) continue;
    const cardIds = Array.isArray(payload?.cardIds) ? payload.cardIds : [];
    for (const rawCardId of cardIds) {
      const cardId = String(rawCardId || "").trim();
      if (!cardId) continue;
      map.set(cardId, (map.get(cardId) || 0) + 1);
    }
  }
  return map;
}

const ownedCountByStickerId = computed(() => {
  const activePackId = isPackRevealOpen.value ? packMeta.value?.packId : null;
  return getOwnedCountsForSelectedCollection({ excludePackId: activePackId });
});
const revealPlan = computed(() => {
  const counts = new Map(
    packOwnedCountSnapshot.value || ownedCountByStickerId.value,
  );
  const needs: Sticker[] = [];
  const duplicates: Sticker[] = [];

  for (const sticker of packCards.value) {
    const key = sticker.meta.id;
    const count = counts.get(key) || 0;
    if (count === 0) {
      needs.push(sticker);
    } else {
      duplicates.push(sticker);
    }
    counts.set(key, count + 1);
  }

  needs.sort((a, b) => {
    const aRank = a.meta.shiny ? 1 : 0;
    const bRank = b.meta.shiny ? 1 : 0;
    if (aRank !== bRank) return aRank - bRank;
    return a.meta.id.localeCompare(b.meta.id);
  });

  return { needs, duplicates };
});
const revealNeeds = computed(() => revealPlan.value.needs);
const revealDuplicates = computed(() => revealPlan.value.duplicates);
const revealSnapshotOwnedCounts = computed(
  () => packOwnedCountSnapshot.value || ownedCountByStickerId.value,
);
const revealDuplicateGroups = computed(() => {
  const byId = new Map<string, { card: Sticker; count: number }>();
  for (const card of revealDuplicates.value) {
    const key = card.meta.id;
    const existing = byId.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    byId.set(key, { card, count: 1 });
  }
  return Array.from(byId.values());
});
const revealNewGroups = computed(() => {
  const byId = new Map<string, { card: Sticker; count: number }>();
  for (const card of revealNeeds.value) {
    const key = card.meta.id;
    const existing = byId.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    byId.set(key, { card, count: 1 });
  }
  return Array.from(byId.values());
});
const activePackCard = computed(
  () => revealNeeds.value[packRevealIndex.value] || null,
);
const revealComplete = computed(
  () => packRevealIndex.value >= revealNeeds.value.length,
);
const isPackRevealOpen = computed(
  () => !revealDismissed.value && packPhase.value !== "idle",
);
const remainingPackCards = computed(() =>
  revealNeeds.value.slice(packRevealIndex.value),
);

const canOpenPack = computed(
  () => {
    if (!selectedCollection.value || selectedCollection.value.stickers.length === 0) return false;
    if (packPhase.value === "opening" || packPhase.value === "reveal") return false;
    if (packMode.value === "dev-untracked") return true;
    if (selectedCollectionIssuanceMode.value === "codes-only") {
      return Boolean(redeemToken.value.trim());
    }
    return !openedForCurrentDrop.value || !!redeemToken.value.trim();
  },
);
const canUsePackCta = computed(() => {
  if (selectedCollectionIssuanceMode.value === "codes-only" && packMode.value !== "dev-untracked") {
    return true;
  }
  return canOpenPack.value;
});

const openPackLabel = computed(() => {
  if (packPhase.value === "opening" || packPhase.value === "reveal") {
    return "Opening pack...";
  }
  if (packMode.value === "dev-untracked") return "Open dev pack";
  if (redeemToken.value.trim()) return "Redeem token pack";
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
const packCtaLabel = computed(() => {
  if (selectedCollectionIssuanceMode.value === "codes-only" && packMode.value !== "dev-untracked") {
    return "Redeem code";
  }
  if (
    packMode.value !== "dev-untracked" &&
    openedForCurrentDrop.value &&
    !redeemToken.value.trim() &&
    !canOpenPack.value
  ) {
    return "Next pack";
  }
  return openPackLabel.value;
});

const packCtaSubtext = computed(() => {
  if (selectedCollectionIssuanceMode.value === "codes-only" && packMode.value !== "dev-untracked") {
    return "Redeem a code to collect from this series";
  }
  if (packMode.value === "dev-untracked") return "";
  if (
    packMode.value !== "dev-untracked" &&
    openedForCurrentDrop.value &&
    !redeemToken.value.trim() &&
    !canOpenPack.value
  ) {
    return `Available in ${nextDropLabel.value}`;
  }
  return "";
});

const packCtaChip = computed(() =>
  packMode.value === "dev-untracked" ? "Dev: untracked" : "",
);

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

function resolveCollectorPubKeyForRedeem() {
  const normalizedPublicKey = String(publicKey.value || "").trim();
  if (normalizedPublicKey) return normalizedPublicKey;
  if (!anonUserKey.value) {
    anonUserKey.value = `anon:${Math.random().toString(36).slice(2, 12)}`;
  }
  return anonUserKey.value;
}

function base64UrlDecodeToBytes(input: string) {
  const normalized = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${pad}`);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function computeTokenHashHexFromToken(token: string) {
  const parts = String(token || "").trim().split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid token format.");
  }
  const payloadBytes = base64UrlDecodeToBytes(parts[0] || "");
  const digest = await crypto.subtle.digest("SHA-256", payloadBytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePalette(input?: ApiCollection["palette"]): PackPalette16 {
  const colors = Array.isArray(input?.colors) ? input!.colors : [];
  if (colors.length !== 16) return DEFAULT_PALETTE;
  return {
    id: String(input?.id || "palette"),
    colors: colors.map((value) => Number(value) >>> 0),
  };
}

function isTruthyShiny(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function hasShinyTag(tags: unknown): boolean {
  if (!Array.isArray(tags)) return false;
  return tags.some((tag) => {
    const normalized = String(tag || "")
      .trim()
      .toLowerCase();
    return normalized === "shiny" || normalized === "shiney";
  });
}

function isCardShiny(card: ApiCard): boolean {
  if (isTruthyShiny(card.attributes?.shiny)) return true;
  if (isTruthyShiny(card.attributes?.shiney)) return true;
  if (hasShinyTag(card.tags)) return true;
  if (hasShinyTag(card.meta?.tags)) return true;
  return false;
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
    shiny: isCardShiny(args.card),
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
    const error = new Error(
      `${response.status} ${response.statusText}: ${text || "request failed"}`,
    ) as Error & { status?: number; responseText?: string };
    error.status = response.status;
    error.responseText = text;
    throw error;
  }
  return response.json() as Promise<T>;
}

function buildCollectionFromPayloads(args: {
  refEntry: CollectionRef;
  collectionJson: any;
  indexJson: any;
  cards: ApiCard[];
  missingCardIds?: string[];
}): Collection {
  const { refEntry, collectionJson, indexJson, cards } = args;
  const missingCardIds = Array.isArray(args.missingCardIds)
    ? args.missingCardIds
    : [];

  indexByCollection.value[refEntry.collectionId] = indexJson;

  const collection: Collection = {
    id: refEntry.collectionId,
    name: String(collectionJson?.name || refEntry.collectionId),
    series: String(collectionJson?.description || ""),
    palette: normalizePalette(collectionJson?.palette),
    stickers: [],
  };

  const cardsById = new Map(
    cards
      .map((card) => {
        const cardId = String(card?.cardId || "").trim();
        if (!cardId) return null;
        return [cardId, { ...card, cardId }] as const;
      })
      .filter(Boolean) as Array<readonly [string, ApiCard]>,
  );

  const cardIds = Array.isArray(indexJson?.cards)
    ? indexJson.cards.map((value) => String(value || "").trim()).filter(Boolean)
    : Array.from(cardsById.keys());

  collection.stickers = cardIds
    .map((cardId) => {
      const card = cardsById.get(cardId);
      if (!card) return null;
      const mapping = indexJson?.cardMap?.[cardId];
      return toSticker({
        collection,
        card: {
          ...card,
          cardId,
          seriesId: card.seriesId || mapping?.seriesId,
          slotIndex: card.slotIndex ?? mapping?.slotIndex,
          role: card.role || mapping?.role,
        },
        fallbackSeries: mapping?.seriesId,
      });
    })
    .filter(Boolean) as Sticker[];

  if (missingCardIds.length) {
    setStatus("Collection is missing card payloads.", {
      collectionId: refEntry.collectionId,
      version: refEntry.version,
      missingCardIds,
    });
  }

  return collection;
}

async function fetchCollectionLegacy(refEntry: CollectionRef): Promise<Collection> {
  const encodedCollectionId = encodeURIComponent(refEntry.collectionId);
  const encodedVersion = encodeURIComponent(refEntry.version);

  const [collectionJson, indexJson] = await Promise.all([
    fetchJson<any>(
      `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/collection`,
    ),
    fetchJson<any>(
      `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/index`,
    ),
  ]);

  const cardIds = Array.isArray(indexJson?.cards)
    ? indexJson.cards.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  const missingCardIds: string[] = [];
  const cards = (
    await Promise.all(
      cardIds.map(async (cardId) => {
        try {
          const payload = await fetchJson<ApiCard>(
            `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/cards/${encodeURIComponent(
              cardId,
            )}`,
          );
          return {
            ...payload,
            cardId,
          };
        } catch (error) {
          const status = (error as { status?: number })?.status;
          if (status === 404) {
            missingCardIds.push(cardId);
            return null;
          }
          throw error;
        }
      }),
    )
  ).filter(Boolean) as ApiCard[];

  return buildCollectionFromPayloads({
    refEntry,
    collectionJson,
    indexJson,
    cards,
    missingCardIds,
  });
}

async function fetchCollectionBundle(refEntry: CollectionRef): Promise<Collection> {
  const encodedCollectionId = encodeURIComponent(refEntry.collectionId);
  const encodedVersion = encodeURIComponent(refEntry.version);
  try {
    const bundle = await fetchJson<ApiCollectionBundle>(
      `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/bundle`,
    );
    return buildCollectionFromPayloads({
      refEntry,
      collectionJson: bundle.collection || {},
      indexJson: bundle.index || {},
      cards: Array.isArray(bundle.cards) ? bundle.cards : [],
      missingCardIds: Array.isArray(bundle.missingCardIds)
        ? bundle.missingCardIds
        : [],
    });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status === 404) {
      setStatus("Bundle endpoint unavailable. Falling back to legacy collection fetch.", {
        collectionId: refEntry.collectionId,
        version: refEntry.version,
      });
      return fetchCollectionLegacy(refEntry);
    }
    throw error;
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

function resolveRequestedCollectionId() {
  return pickCollectionRouteTarget({
    forcedCollectionId: props.forcedCollectionId,
    routeCollectionId: String(route.params?.collectionId || "").trim(),
    houseCollectionId: String(import.meta.env.VITE_PIXPAX_HOUSE_COLLECTION_ID || "").trim(),
    fallbackCollectionId: "pixel-animals",
  });
}

function normalizeSettings(input?: Record<string, unknown>) {
  const source =
    input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const visibility = String(source.visibility || "").trim().toLowerCase();
  const issuanceMode = String(source.issuanceMode || "").trim().toLowerCase();
  return {
    ...source,
    visibility: visibility === "unlisted" ? "unlisted" : "public",
    issuanceMode: issuanceMode === "codes-only" ? "codes-only" : "scheduled",
  };
}

async function loadCollection() {
  loadingCollections.value = true;
  loadError.value = "";

  try {
    const requestedCollectionId = resolveRequestedCollectionId();
    const requestedVersion = String(route.query?.version || "").trim();
    const resolveQuery = new URLSearchParams();
    if (requestedVersion) resolveQuery.set("version", requestedVersion);
    const resolve = await fetchJson<ApiCollectionResolve>(
      `/v1/pixpax/collections/${encodeURIComponent(requestedCollectionId)}/resolve${
        resolveQuery.toString() ? `?${resolveQuery.toString()}` : ""
      }`,
    );
    const resolvedCollectionId = String(resolve.collectionId || requestedCollectionId).trim();
    const resolvedVersion = String(resolve.resolvedVersion || "").trim();
    if (!resolvedCollectionId || !resolvedVersion) {
      throw new Error("Collection resolve returned an invalid payload.");
    }

    const refEntry = {
      collectionId: resolvedCollectionId,
      version: resolvedVersion,
    };
    const loaded = await fetchCollectionBundle(refEntry);

    const mergedSettings = normalizeSettings({
      ...((resolve.settings as Record<string, unknown>) || {}),
      ...((loaded.settings as Record<string, unknown>) || {}),
    });
    selectedCollectionSettings.value = mergedSettings;
    issuerDisplay.value = {
      name: String(resolve.issuer?.name || "").trim() || "PixPax",
      ...(String(resolve.issuer?.avatarUrl || "").trim()
        ? { avatarUrl: String(resolve.issuer?.avatarUrl || "").trim() }
        : {}),
    };
    loaded.settings = mergedSettings as any;
    loaded.issuer = issuerDisplay.value;

    collections.value = [loaded];
    selectedCollectionId.value = resolvedCollectionId;
    selectedCollectionVersion.value = resolvedVersion;

    setStatus("Loaded collection and cards.", {
      collectionId: resolvedCollectionId,
      version: resolvedVersion,
      issuanceMode: mergedSettings.issuanceMode,
    });
  } catch (error: any) {
    loadError.value = error?.message || String(error);
    setStatus("Failed to load collection.", { error: loadError.value });
  } finally {
    loadingCollections.value = false;
  }
}

watch(
  () => selectedCollectionId.value,
  () => {
    selectedSeries.value = "all";
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
  packCards.value = [];
  packMeta.value = null;
  packRevealIndex.value = 0;
  revealDismissed.value = false;
  packOwnedCountSnapshot.value = getOwnedCountsForSelectedCollection();
  packPhase.value = "opening";

  const refEntry = selectedCollectionRef.value;
  if (!refEntry) {
    packError.value = "Missing collection reference.";
    packOwnedCountSnapshot.value = null;
    packMeta.value = null;
    packPhase.value = "idle";
    return;
  }

  try {
    const payload = {
      userKey: resolveIssuedUserKey(),
      issuanceMode: packMode.value,
    };
    const normalizedRedeemToken = redeemToken.value.trim();

    const response =
      normalizedRedeemToken
        ? await fetchJson<ApiPackResponse>("/v1/pixpax/redeem", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(
              await (async () => {
                const collectorPubKey = resolveCollectorPubKeyForRedeem();
                let collectorSig: string | undefined;
                try {
                  const tokenHash = await computeTokenHashHexFromToken(normalizedRedeemToken);
                  const identityPrivateKey = identity?.privateKey?.value as CryptoKey | null;
                  const identityPublicKey = String(
                    stripIdentityKey(String(identity?.publicKeyPEM?.value || ""))
                  ).trim();
                  if (
                    tokenHash &&
                    identityPrivateKey &&
                    identityPublicKey &&
                    identityPublicKey === collectorPubKey
                  ) {
                    collectorSig = await signCollectorProofFromTokenHash({
                      tokenHash,
                      privateKey: identityPrivateKey,
                    });
                  }
                } catch {
                  // Redeem can proceed without collector proof.
                }
                return {
                  token: normalizedRedeemToken,
                  collectorPubKey,
                  ...(collectorSig ? { collectorSig } : {}),
                };
              })(),
            ),
          })
        : await fetchJson<ApiPackResponse>(
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
    const existingById = new Map(
      (selectedCollection.value.stickers || []).map((sticker) => [
        sticker.meta.id,
        sticker,
      ]),
    );
    const nextCards = (Array.isArray(response.cards) ? response.cards : []).map(
      (card) => {
        const cardId = String(card.cardId || "").trim();
        const mapping = index?.cardMap?.[cardId];
        const sticker = toSticker({
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
        const existing = existingById.get(cardId);
        if (existing?.meta?.shiny) {
          sticker.meta.shiny = true;
        }
        return sticker;
      },
    );

    packCards.value = nextCards;
    packMeta.value = { packId: response.packId };
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
          type: "pixpax.pack.received",
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
            type: "pixpax.pack.received",
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
          type: "pixpax.pack.received",
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
    if (commitRecorded) {
      cloudSync.notePackLedgerMutation(String(ledger.value?.head || "").trim());
    }
    if (normalizedRedeemToken) {
      redeemToken.value = "";
      if (route.query?.token) {
        const nextQuery = { ...route.query };
        delete (nextQuery as any).token;
        router.replace({ query: nextQuery });
      }
    }
  } catch (error: any) {
    packOwnedCountSnapshot.value = null;
    packMeta.value = null;
    packPhase.value = "idle";
    packError.value = error?.message || "Pack opening failed.";
    setStatus("Failed to open pack.", { error: packError.value });
  }
}

async function redeemPack(token: string) {
  redeemToken.value = token;
  if (!canOpenPack.value || !selectedCollection.value) {
    throw new Error("Pack not available yet.");
  }
  await openPack();
  if (packError.value) {
    throw new Error(packError.value);
  }
}

function collectNextPackCard() {
  if (!activePackCard.value) return;
  packRevealIndex.value += 1;
}

function skipPackReveal() {
  packRevealIndex.value = revealNeeds.value.length;
}

function closePackReveal() {
  revealDismissed.value = true;
  packPhase.value = "idle";
  packCards.value = [];
  packMeta.value = null;
  packOwnedCountSnapshot.value = null;
}

function isOwned(stickerId: string): boolean {
  return ownedStickerIdSet.value.has(stickerId);
}

const newlyRedeemedCardIdSet = computed(() => {
  const raw = route.query?.newCards;
  if (typeof raw === "string") {
    return new Set(
      raw
        .split(",")
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    );
  }
  if (Array.isArray(raw)) {
    return new Set(
      raw
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    );
  }
  return new Set<string>();
});

function isNewlyRedeemed(stickerId: string) {
  return newlyRedeemedCardIdSet.value.has(stickerId);
}

onMounted(async () => {
  if (!devUntrackedPackEnabled && packMode.value === "dev-untracked") {
    packMode.value = "weekly";
  }
  nowTimer = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);

  const queryToken = route.query?.token;
  if (typeof queryToken === "string" && queryToken.trim()) {
    redeemToken.value = queryToken.trim();
  } else if (Array.isArray(queryToken) && queryToken[0]?.trim()) {
    redeemToken.value = String(queryToken[0]).trim();
  }
  await loadCollection();
});

onUnmounted(() => {
  if (nowTimer) window.clearInterval(nowTimer);
  activityLock.setActivityLock("pack-open", false);
});

watch(
  () => route.query?.token,
  (queryToken) => {
    if (typeof queryToken === "string" && queryToken.trim()) {
      redeemToken.value = queryToken.trim();
      return;
    }
    if (Array.isArray(queryToken) && queryToken[0]?.trim()) {
      redeemToken.value = String(queryToken[0]).trim();
    }
  },
);

watch(
  () => [route.params?.collectionId, route.query?.version, props.forcedCollectionId],
  () => {
    void loadCollection();
  },
);

watch(
  () => isPackRevealOpen.value,
  (open) => {
    activityLock.setActivityLock("pack-open", open);
  },
  { immediate: true }
);
</script>

<template>
  <div
    ref="routeShellRef"
    class="route-shell flex flex-1 flex-col max-w-5xl mx-auto w-full"
  >
    <div class="flex flex-1 flex-col gap-2">
      <section
        class="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 relative backdrop-blur-xl p-4"
      >
        <div>
          <!-- <div class="flex items-center justify-between gap-4">
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
          </div> -->

          <PackDropCard
            :cta-label="packCtaLabel"
            :cta-subtext="packCtaSubtext"
            :cta-disabled="!canUsePackCta"
            :cta-chip="packCtaChip"
            :primary-action="selectedCollectionIssuanceMode === 'codes-only' && packMode !== 'dev-untracked' ? 'redeem-code' : 'open-pack'"
            :prefill-code="redeemToken"
            :can-redeem="true"
            :show-dev-options="devUntrackedPackEnabled"
            :on-open-pack="openPack"
            :on-redeem-code="redeemPack"
          >
            <template #dev-options>
              <select
                v-model="packMode"
                class="rounded-full border border-[var(--ui-border)] px-3 py-1 text-xs text-[var(--ui-fg)]"
              >
                <option value="weekly">Weekly tracked</option>
                <option value="dev-untracked">Dev untracked</option>
              </select>
            </template>
          </PackDropCard>
        </div>
        <div class="flex flex-col w-full">
          <h1
            class="uppercase text-5xl font-thin z-1 text-[var(--ui-fg)] font-[900] no-underline tracking-[-0.08em] brand"
          >
            {{ selectedCollection?.name }}
          </h1>
          <p class="text-xs text-[var(--ui-fg-muted)]">Issued by {{ issuerDisplay.name || "PixPax" }}</p>
          <div class="flex flex-col gap-2">
            <div
              class="h-1 lg:h-1.5 w-full rounded-full bg-[var(--ui-fg)]/10 ring-1 ring-[var(--ui-fg)]/20"
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
      </section>

      <div class="flex items-center justify-end px-4 max-w-4xl mx-auto w-full">
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
          <p v-if="loadingCollections" class="text-xs text-[var(--ui-fg-muted)]">
            Loading collections...
          </p>
          <div
            class="flex gap-6 justify-items-center flex-wrap justify-center p-4"
            v-if="selectedSeries !== 'all'"
          >
            <PixPaxStickerCard
              v-for="sticker in visibleStickers"
              :key="sticker.meta.id"
              :sticker="sticker"
              :palette="selectedCollection!.palette"
              :missing="!isOwned(sticker.meta.id)"
              :class="[
                'w-full max-w-48',
                isNewlyRedeemed(sticker.meta.id) ? 'ring-2 ring-emerald-300/70 rounded-2xl' : '',
              ]"
            />
          </div>
          <div v-else class="flex flex-col gap-8 p-4">
            <section
              v-for="group in seriesGroupsForBook"
              :key="group.series"
              class="flex flex-col gap-3"
            >
              <div class="sticky top-20 z-0">
                <span
                  class="uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
                >
                  {{ group.series }}
                </span>
                <div class="series-progress-track">
                  <div
                    class="series-progress-fill"
                    :style="{ width: `${group.progressPercent}%` }"
                  ></div>
                </div>
                <span class="text-[10px] text-[var(--ui-fg-muted)]">
                  {{ group.collected }}/{{ group.total }}
                </span>
                <span
                  v-if="group.complete"
                  class="text-[10px] uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
                >
                  completed
                </span>
              </div>
              <div
                class="flex gap-6 justify-items-center flex-wrap justify-center"
              >
                <PixPaxStickerCard
                  v-for="sticker in group.stickers"
                  :key="`${group.series}-${sticker.meta.id}`"
                  :sticker="sticker"
                  :palette="selectedCollection!.palette"
                  :missing="!isOwned(sticker.meta.id)"
                  :class="[
                    'max-w-38 sm:max-w-48',
                    isNewlyRedeemed(sticker.meta.id) ? 'ring-2 ring-emerald-300/70 rounded-2xl' : '',
                  ]"
                  :sparkles="sticker.meta.shiny"
                  :glow="sticker.meta.shiny"
                  :shimmer="true"
                  :animated="true"
                  :finish-fx="true"
                />
              </div>
            </section>
          </div>
        </div>
      </section>

      <section v-else class="mx-auto w-full max-w-4xl">
        <div class="py-4">
          <div class="space-y-1 text-center">
            <h3 class="text-lg font-semibold text-[var(--ui-fg)]">
              Swaps pile
            </h3>
            <p class="text-sm text-[var(--ui-fg-muted)]">
              Duplicates you can trade without affecting collection totals.
            </p>
          </div>
          <div class="flex flex-col items-center gap-2 text-center py-2">
            <Button size="sm" variant="secondary" disabled>
              Trading coming soon
            </Button>
            <p class="text-xs text-[var(--ui-fg-muted)]">
              Trade duplicate cards with friends to complete your Pixbook.
            </p>
          </div>
        </div>
        <div
          v-if="!duplicateCardGroups.length"
          class="text-sm text-[var(--ui-fg-muted)]"
        >
          No duplicates yet. Open packs in Pixbook to build swap inventory.
        </div>
        <div v-else class="flex gap-6 w-full flex-wrap justify-center py-8">
          <div
            v-for="group in duplicateCardGroups"
            :key="group.cardId"
            class="flex flex-col items-center gap-2 w-34 md:w-48"
          >
            <PixPaxStickerCard
              v-if="group.card"
              :sticker="group.card"
              :palette="selectedCollection!.palette"
              class="w-full"
              :sparkles="group.card.meta.shiny"
              :glow="group.card.meta.shiny"
              :shimmer="group.card.meta.shiny"
              :animated="true"
              :finish-fx="true"
            />
            <div
              class="text-[var(--ui-fg)] font-bold px-3 rounded-full py-0.5 uppercase tracking-[0.14em]"
            >
              x{{ group.spare }}
            </div>
          </div>
        </div>
      </section>

      <div
        v-if="isPackRevealOpen"
        class="absolute inset-0 z-50 flex items-center justify-center px-4 py-10 backdrop-blur-lg"
      >
        <div class="flex w-full max-w-3xl flex-col gap-6">
          <div
            v-if="packPhase === 'opening'"
            class="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-[var(--ui-border)] p-6 text-center"
          >
            <p
              class="text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
            >
              Opening pack
            </p>
            <p class="text-sm text-[var(--ui-fg)]">Preparing reveal...</p>
          </div>

          <template v-else>
            <div class="relative mx-auto flex-1 p-2" v-if="!revealComplete">
              <div
                v-for="(card, index) in remainingPackCards"
                :key="`${card.meta.id}-${index}`"
                class="w-full absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                :style="{
                  transform: `translateY(${index * 8}px) translateX(${
                    index * 5
                  }px) rotate(${index * 1.5}deg)`,
                  zIndex: remainingPackCards.length - index,
                }"
              >
                <button
                  type="button"
                  class="relative rounded-2xl min-w-64 border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[0_16px_28px_rgba(15,23,42,0.22)]"
                  @click="collectNextPackCard"
                  :class="{
                    'reveal-shiny': activePackCard?.meta.shiny && index === 0,
                  }"
                  :key="packRevealIndex"
                >
                  <span
                    v-if="activePackCard?.meta.shiny && index === 0"
                    class="absolute inset-0 rounded-2xl pointer-events-none shiny-glow"
                  ></span>
                  <PixPaxStickerCard
                    :sticker="card"
                    :palette="selectedCollection!.palette"
                    :sparkles="card.meta.shiny"
                    :glow="card.meta.shiny"
                    :shimmer="card.meta.shiny"
                    :animated="true"
                    :finish-fx="true"
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
              class="flex flex-col gap-4 items-center overflow-hidden"
            >
              <p
                class="text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
              >
                Pack summary
              </p>
              <div v-if="revealNewGroups.length" class="space-y-2 w-full">
                <p class="text-sm font-semibold text-[var(--ui-fg)]">
                  New cards ({{ revealNeeds.length }})
                </p>
                <div class="flex flex-nowrap gap-2 overflow-x-auto w-full py-4">
                  <div
                    v-for="(group, index) in revealNewGroups"
                    :key="`new-${group.card.meta.id}-${index}`"
                    class="min-w-40"
                  >
                    <PixPaxStickerCard
                      :sticker="group.card"
                      :palette="selectedCollection!.palette"
                      compact
                      :sparkles="group.card.meta.shiny"
                      :glow="group.card.meta.shiny"
                      :shimmer="group.card.meta.shiny"
                      :animated="true"
                      :finish-fx="true"
                    />
                  </div>
                </div>
              </div>
              <div v-if="revealDuplicateGroups.length" class="space-y-2 w-full">
                <p class="text-sm font-semibold text-[var(--ui-fg)]">
                  Owned duplicates ({{ revealDuplicates.length }})
                </p>
                <div class="flex flex-nowrap gap-2 overflow-x-auto w-full py-4">
                  <div
                    v-for="(group, index) in revealDuplicateGroups"
                    :key="`dup-${group.card.meta.id}-${index}`"
                    class="relative min-w-34"
                  >
                    <span
                      v-if="group.count > 1"
                      class="absolute bottom-0 right-0 z-20 rounded-full bg-[var(--ui-fg)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-bg)]"
                    >
                      x{{ group.count }}
                    </span>
                    <PixPaxStickerCard
                      :sticker="group.card"
                      :palette="selectedCollection!.palette"
                      compact
                      :sparkles="group.card.meta.shiny"
                      :glow="group.card.meta.shiny"
                      :shimmer="group.card.meta.shiny"
                      :animated="true"
                      :finish-fx="true"
                    />
                  </div>
                </div>
              </div>
              <div
                v-if="!revealNewGroups.length && !revealDuplicateGroups.length"
                class="text-sm text-[var(--ui-fg-muted)]"
              >
                Pack had no revealable cards.
              </div>
              <Button size="xs" variant="secondary" @click="closePackReveal">
                Done
              </Button>
            </div>
          </template>
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

.reveal-shiny {
  animation: mythicShake 0.9s ease-in-out infinite;
}

.shiny-glow {
  animation: mythicGlow 1.4s ease-in-out infinite;
}

.reveal-shiny.reveal-flip {
  animation-delay: 3s;
}

@keyframes mythicShake {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  20% {
    transform: translateY(-2px) rotate(-0.9deg);
  }
  40% {
    transform: translateY(2px) rotate(0.9deg);
  }
  60% {
    transform: translateY(-1px) rotate(-0.5deg);
  }
  80% {
    transform: translateY(1px) rotate(0.5deg);
  }
}

@keyframes mythicGlow {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--ui-accent) 0%, transparent),
      0 14px 26px color-mix(in srgb, var(--ui-accent) 24%, transparent);
    opacity: 0.9;
  }
  50% {
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--ui-accent) 35%, transparent),
      0 20px 32px color-mix(in srgb, var(--ui-accent) 42%, transparent);
    opacity: 1;
  }
}
</style>
