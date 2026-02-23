<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Button } from "ternent-ui/primitives";
import CanvasSticker16 from "../../module/pixpax/CanvasSticker16.vue";
import PixPaxRedeemCodeCard from "../../module/pixpax/ui/PixPaxRedeemCodeCard.vue";
import {
  type PixPaxCodeCardItem,
  getPixpaxCollectionBundle,
  PixPaxApiError,
  createCodeCardsJson,
  createCodeToken,
  listPixpaxAdminCollections,
} from "../../module/pixpax/api/client";
import { usePixpaxAuth } from "../../module/pixpax/auth/usePixpaxAuth";
import type {
  PackPalette16,
  StickerArt16,
} from "../../module/pixpax/sticker-types";

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

type SheetLine = {
  id: number;
  kind: "pack" | "fixed-card";
  quantity: number;
  count: number;
  cardId: string;
};

type CollectionCardOption = {
  cardId: string;
  label: string;
  seriesId: string;
  slotIndex: number | null;
  art: StickerArt16 | null;
};

type GeneratedSheetItem = Awaited<
  ReturnType<typeof createCodeCardsJson>
>["items"][number] & {
  lineId: number;
};

type GeneratedSheetArtifact = {
  ok: boolean;
  collectionId: string;
  version: string;
  dropId: string;
  expiresInSeconds: number;
  generatedAt: string;
  quantity: number;
  lines: Array<{
    id: number;
    kind: "pack" | "fixed-card";
    quantity: number;
    cardId?: string;
    count?: number;
  }>;
  items: GeneratedSheetItem[];
};

const DEFAULT_PALETTE: PackPalette16 = {
  id: "pixpax-default",
  colors: [
    0x00000000, 0xff1f2937, 0xfff9fafb, 0xff9ca3af, 0xff111827, 0xff2563eb,
    0xff16a34a, 0xfff59e0b, 0xffef4444, 0xff8b5cf6, 0xff06b6d4, 0xfffff0c2,
    0xff4b5563, 0xffe5e7eb, 0xfff97316, 0xff22c55e,
  ],
};

const EMPTY_ART_16: StickerArt16 = {
  v: 1,
  w: 16,
  h: 16,
  fmt: "idx4",
  px: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
};

function isDeprecatedCollectionRef(entry: CollectionRef) {
  return entry.collectionId === "pixel-animals" && entry.version === "v1";
}

function parseCollectionRefs(): CollectionRef[] {
  const raw = String(
    import.meta.env.VITE_PIXPAX_PUBLIC_COLLECTIONS || "",
  ).trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const refs = parsed
          .map((entry: any) => ({
            collectionId: String(entry?.collectionId || "").trim(),
            version: String(entry?.version || "").trim(),
          }))
          .filter(
            (entry) =>
              entry.collectionId &&
              entry.version &&
              !isDeprecatedCollectionRef(entry),
          );
        if (refs.length) return refs;
      }
    } catch {
      // fallback below
    }
  }
  return [{ collectionId: "pixel-animals", version: "v2" }];
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof PixPaxApiError) {
    const body = error.body as { error?: string } | null;
    const message = String(body?.error || error.message || "").trim();
    if (message) return message;
  }
  return String((error as Error)?.message || fallback);
}

const router = useRouter();
const auth = usePixpaxAuth();
const refs = ref<CollectionRef[]>(parseCollectionRefs());
const selectedRef = ref("");
const refsLoading = ref(false);
const refsError = ref("");

const loggedIn = computed(() => auth.isAuthenticated.value);

const dropId = ref(`week-${toIsoWeek(new Date())}`);
const count = ref(5);
const fixedCardId = ref("");
const expiresInSeconds = ref(86400);
const quickMinting = ref<"" | "pack" | "fixed-card">("");

let nextSheetLineId = 1;
const sheetLines = ref<SheetLine[]>([
  { id: nextSheetLineId, kind: "pack", quantity: 4, count: 5, cardId: "" },
]);

const minting = ref(false);
const mintError = ref("");
const mintStatus = ref("");
const minted = ref<Awaited<ReturnType<typeof createCodeToken>> | null>(null);
const copied = ref<"" | "code" | "link">("");
const generatingCards = ref(false);
const cardError = ref("");
const cardStatus = ref("");
const cardsLoading = ref(false);
const cardsError = ref("");
const collectionCards = ref<CollectionCardOption[]>([]);
const collectionPalette = ref<PackPalette16>(DEFAULT_PALETTE);
const generatedSheet = ref<GeneratedSheetArtifact | null>(null);
const isSheetPrintDialogOpen = ref(false);

function ensureSelectedRef() {
  const available = refs.value;
  if (!available.length) {
    selectedRef.value = "";
    return;
  }
  const current = String(selectedRef.value || "").trim();
  if (
    current &&
    available.some(
      (entry) => `${entry.collectionId}::${entry.version}` === current,
    )
  ) {
    return;
  }
  selectedRef.value = `${available[0].collectionId}::${available[0].version}`;
}

async function loadAdminCollectionRefs() {
  refsLoading.value = true;
  refsError.value = "";
  try {
    const response = await listPixpaxAdminCollections(
      auth.token.value || undefined,
    );
    const nextRefs = Array.isArray(response?.refs)
      ? response.refs
          .map((entry) => ({
            collectionId: String(entry?.collectionId || "").trim(),
            version: String(entry?.version || "").trim(),
          }))
          .filter((entry) => entry.collectionId && entry.version)
      : [];
    refs.value = nextRefs.length ? nextRefs : parseCollectionRefs();
  } catch (error) {
    refs.value = parseCollectionRefs();
    refsError.value =
      "Unable to load all admin collections. Showing fallback list.";
  } finally {
    refsLoading.value = false;
    ensureSelectedRef();
  }
}

ensureSelectedRef();

const activeRef = computed(() => {
  const [collectionId, version] = String(selectedRef.value || "").split("::");
  return {
    collectionId: String(collectionId || "").trim(),
    version: String(version || "").trim(),
  };
});

const hasCollectionCards = computed(() => collectionCards.value.length > 0);

const redeemCode = computed(() => String(minted.value?.token || "").trim());

const shareLink = computed(() => {
  const mintedLink = String(minted.value?.redeemUrl || "").trim();
  if (mintedLink) return mintedLink;
  if (!redeemCode.value) return "";
  const resolved = router.resolve({
    name: "pixpax-redeem",
    query: { token: redeemCode.value },
  });
  if (typeof window === "undefined") return resolved.fullPath;
  return `${window.location.origin}${resolved.fullPath}`;
});

const mintedCodeCardItem = computed<PixPaxCodeCardItem | null>(() => {
  const value = minted.value;
  if (!value) return null;
  return {
    token: value.token,
    tokenHash: value.tokenHash,
    label: value.label,
    redeemUrl: value.redeemUrl,
    qrSvg: value.qrSvg,
    qrErrorCorrection: value.qrErrorCorrection,
    qrQuietZoneModules: value.qrQuietZoneModules,
    codeId: value.codeId,
    issuedAt: value.issuedAt,
    expiresAt: value.expiresAt,
    collectionId: value.collectionId,
    version: value.version,
    kind: value.kind,
    cardId: String(value.cardId || "").trim() || undefined,
    count:
      typeof value.count === "number" && Number.isFinite(value.count)
        ? value.count
        : undefined,
    dropId: String(value.dropId || "").trim() || undefined,
  };
});

const mintedCodeCardArt = computed<StickerArt16 | null>(() => {
  const value = mintedCodeCardItem.value;
  if (!value || value.kind !== "fixed-card") return null;
  return getCollectionCardById(value.cardId)?.art || null;
});

function toStickerArtFromRenderPayload(payload: unknown): StickerArt16 | null {
  if (!payload || typeof payload !== "object") return null;
  const gridB64 = String(
    (payload as { gridB64?: unknown }).gridB64 || "",
  ).trim();
  const gridSize = Number((payload as { gridSize?: unknown }).gridSize || 16);
  if (!gridB64 || gridSize !== 16) return null;
  return {
    v: 1,
    w: 16,
    h: 16,
    fmt: "idx4",
    px: gridB64,
  };
}

function normalizePalette(input: unknown): PackPalette16 {
  if (!input || typeof input !== "object") return DEFAULT_PALETTE;
  const id =
    String((input as { id?: unknown }).id || "palette").trim() || "palette";
  const colorsRaw = (input as { colors?: unknown }).colors;
  if (!Array.isArray(colorsRaw) || colorsRaw.length !== 16) {
    return DEFAULT_PALETTE;
  }
  const colors = colorsRaw.map((entry) => Number(entry) >>> 0);
  return { id, colors };
}

function normalizeCollectionCard(input: unknown): CollectionCardOption | null {
  if (!input || typeof input !== "object") return null;
  const cardId = String((input as { cardId?: unknown }).cardId || "").trim();
  if (!cardId) return null;
  const label =
    String((input as { label?: unknown }).label || cardId).trim() || cardId;
  const seriesId = String(
    (input as { seriesId?: unknown }).seriesId || "",
  ).trim();
  const slotValue = Number((input as { slotIndex?: unknown }).slotIndex);
  const slotIndex = Number.isFinite(slotValue) ? slotValue : null;
  const art = toStickerArtFromRenderPayload(
    (input as { renderPayload?: unknown }).renderPayload,
  );
  return {
    cardId,
    label,
    seriesId,
    slotIndex,
    art,
  };
}

function getDefaultCardId() {
  return collectionCards.value[0]?.cardId || "";
}

function getCollectionCardById(cardId: string | undefined) {
  const normalized = String(cardId || "").trim();
  if (!normalized) return null;
  return (
    collectionCards.value.find((entry) => entry.cardId === normalized) || null
  );
}

function getSheetItemArt(item: GeneratedSheetItem): StickerArt16 | null {
  if (item.kind !== "fixed-card") return null;
  return getCollectionCardById(item.cardId)?.art || null;
}

function hasSheetItemArt(item: GeneratedSheetItem) {
  return Boolean(getSheetItemArt(item));
}

function getSheetItemArtOrDefault(item: GeneratedSheetItem) {
  return getSheetItemArt(item) || EMPTY_ART_16;
}

function syncFixedCardSelections() {
  const validIds = new Set(collectionCards.value.map((card) => card.cardId));
  const defaultCardId = getDefaultCardId();
  if (fixedCardId.value && validIds.has(fixedCardId.value)) {
    // keep explicit selection
  } else {
    fixedCardId.value = defaultCardId;
  }

  if (!defaultCardId) {
    return;
  }
  sheetLines.value = sheetLines.value.map((line) => {
    if (line.kind !== "fixed-card") return line;
    if (line.cardId && validIds.has(line.cardId)) return line;
    return {
      ...line,
      cardId: defaultCardId,
    };
  });
}

function handleSheetLineKindChange(line: SheetLine) {
  if (line.kind !== "fixed-card") return;
  if (line.cardId) return;
  const defaultCardId = getDefaultCardId();
  if (!defaultCardId) return;
  line.cardId = defaultCardId;
}

async function loadCollectionCards() {
  const { collectionId, version } = activeRef.value;
  if (!collectionId || !version) {
    collectionCards.value = [];
    collectionPalette.value = DEFAULT_PALETTE;
    cardsError.value = "";
    return;
  }

  cardsLoading.value = true;
  cardsError.value = "";
  try {
    const bundle = await getPixpaxCollectionBundle(collectionId, version);
    const cards = Array.isArray(bundle?.cards)
      ? bundle.cards
          .map((entry) => normalizeCollectionCard(entry))
          .filter((entry): entry is CollectionCardOption => Boolean(entry))
          .sort((a, b) => {
            if (a.slotIndex != null && b.slotIndex != null) {
              return a.slotIndex - b.slotIndex;
            }
            if (a.slotIndex != null) return -1;
            if (b.slotIndex != null) return 1;
            return a.cardId.localeCompare(b.cardId);
          })
      : [];
    collectionCards.value = cards;
    const paletteInput =
      bundle?.collection && typeof bundle.collection === "object"
        ? (bundle.collection as { palette?: unknown }).palette
        : null;
    collectionPalette.value = normalizePalette(paletteInput);
    syncFixedCardSelections();
  } catch (error) {
    collectionCards.value = [];
    collectionPalette.value = DEFAULT_PALETTE;
    cardsError.value = extractError(error, "Unable to load collection cards.");
  } finally {
    cardsLoading.value = false;
  }
}

async function ensureAdmin() {
  const ok = await auth.ensurePermission("pixpax.admin.manage");
  if (!ok) {
    await router.replace({
      name: "pixpax-control-login",
      query: {
        redirect: router.resolve({ name: "pixpax-control-admin" }).fullPath,
      },
    });
    return false;
  }
  return true;
}

async function copyText(value: string, kind: "code" | "link") {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    copied.value = kind;
    setTimeout(() => {
      if (copied.value === kind) copied.value = "";
    }, 1200);
  } catch {
    mintError.value = "Copy failed. Clipboard access was denied.";
  }
}

function addSheetLine(kind: "pack" | "fixed-card") {
  nextSheetLineId += 1;
  sheetLines.value.push({
    id: nextSheetLineId,
    kind,
    quantity: kind === "pack" ? 4 : 5,
    count: 5,
    cardId: kind === "fixed-card" ? getDefaultCardId() : "",
  });
}

function removeSheetLine(lineId: number) {
  if (sheetLines.value.length <= 1) return;
  sheetLines.value = sheetLines.value.filter((line) => line.id !== lineId);
}

function openSheetPrintDialog() {
  if (!generatedSheet.value?.items?.length) return;
  isSheetPrintDialogOpen.value = true;
}

function closeSheetPrintDialog() {
  isSheetPrintDialogOpen.value = false;
}

function printGeneratedSheet() {
  if (typeof window === "undefined") return;
  window.print();
}

function validateExpiresInSeconds() {
  const expires = Number(expiresInSeconds.value || 0);
  if (!Number.isInteger(expires) || expires < 60 || expires > 2592000) {
    return "Expires in seconds must be between 60 and 2592000.";
  }
  return "";
}

async function mintSingleCodeToken(kind: "pack" | "fixed-card") {
  const canMint = await auth.ensurePermission("pixpax.admin.manage");
  if (!canMint) {
    mintError.value = "Admin permission required.";
    await router.replace({
      name: "pixpax-control-login",
      query: {
        redirect: router.resolve({ name: "pixpax-control-admin" }).fullPath,
      },
    });
    return;
  }

  const { collectionId, version } = activeRef.value;
  if (!collectionId || !version) {
    mintError.value = "Select a collection and version.";
    return;
  }

  minting.value = true;
  quickMinting.value = kind;
  mintError.value = "";
  mintStatus.value = "";
  minted.value = null;

  try {
    const expiresError = validateExpiresInSeconds();
    if (expiresError) {
      mintError.value = expiresError;
      return;
    }
    if (kind === "fixed-card" && !String(fixedCardId.value || "").trim()) {
      mintError.value = "cardId is required for a designated card.";
      return;
    }
    if (
      kind === "pack" &&
      (!Number.isInteger(Number(count.value || 0)) ||
        Number(count.value || 0) < 1)
    ) {
      mintError.value = "Card count must be at least 1.";
      return;
    }

    const requestPayload = {
      kind,
      dropId: String(dropId.value || "").trim(),
      expiresInSeconds: Number(expiresInSeconds.value || 0),
      ...(kind === "fixed-card"
        ? { cardId: String(fixedCardId.value || "").trim() }
        : { count: Number(count.value || 0) }),
    };

    const payload = await createCodeToken(
      collectionId,
      version,
      requestPayload,
      auth.token.value || undefined,
    );
    minted.value = payload;
    const payloadDropId = String(payload?.dropId || "").trim();
    const payloadKind = String(payload?.kind || kind);
    const payloadCardId = String(payload?.cardId || "").trim();
    mintStatus.value = `Issued 1 code (${payloadKind}${
      payloadCardId ? `:${payloadCardId}` : ""
    }) for ${payload.collectionId}/${payload.version}${
      payloadDropId ? ` (${payloadDropId})` : ""
    }.`;
  } catch (error: unknown) {
    if (
      error instanceof PixPaxApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      auth.logout();
      mintError.value = "Admin session expired. Login again.";
      await router.replace({
        name: "pixpax-control-login",
        query: {
          redirect: router.resolve({ name: "pixpax-control-admin" }).fullPath,
        },
      });
    } else {
      mintError.value = String(
        (error as Error)?.message || "Failed to mint code token.",
      );
    }
  } finally {
    minting.value = false;
    quickMinting.value = "";
  }
}

async function generateCodeCardsJsonArtifact() {
  const canMint = await auth.ensurePermission("pixpax.admin.manage");
  if (!canMint) {
    cardError.value = "Admin permission required.";
    return;
  }
  const { collectionId, version } = activeRef.value;
  if (!collectionId || !version) {
    cardError.value = "Select a collection and version.";
    return;
  }
  const expiresError = validateExpiresInSeconds();
  if (expiresError) {
    cardError.value = expiresError;
    return;
  }

  generatingCards.value = true;
  cardError.value = "";
  cardStatus.value = "";
  generatedSheet.value = null;
  try {
    const lines = sheetLines.value.map((line) => ({
      id: line.id,
      kind: line.kind,
      quantity: Number(line.quantity || 0),
      count: Number(line.count || 0),
      cardId: String(line.cardId || "").trim(),
    }));
    if (!lines.length) {
      cardError.value = "Add at least one sheet line.";
      return;
    }

    for (const line of lines) {
      if (
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 500
      ) {
        cardError.value = `Line ${line.id}: quantity must be between 1 and 500.`;
        return;
      }
      if (line.kind === "pack") {
        if (
          !Number.isInteger(line.count) ||
          line.count < 1 ||
          line.count > 50
        ) {
          cardError.value = `Line ${line.id}: pack card count must be between 1 and 50.`;
          return;
        }
      } else if (!line.cardId) {
        cardError.value = `Line ${line.id}: cardId is required for designated cards.`;
        return;
      }
    }

    const responses = [];
    for (const line of lines) {
      const response = await createCodeCardsJson(
        collectionId,
        version,
        {
          kind: line.kind,
          quantity: line.quantity,
          dropId: String(dropId.value || "").trim(),
          expiresInSeconds: Number(expiresInSeconds.value || 0),
          ...(line.kind === "fixed-card"
            ? { cardId: line.cardId }
            : { count: line.count }),
        },
        auth.token.value || undefined,
      );
      responses.push({
        line,
        response,
      });
    }

    const items = responses.flatMap((entry) =>
      Array.isArray(entry.response.items)
        ? entry.response.items.map((item) => ({
            ...item,
            lineId: entry.line.id,
          }))
        : [],
    );
    const response = {
      ok: true,
      collectionId,
      version,
      dropId: String(dropId.value || "").trim(),
      expiresInSeconds: Number(expiresInSeconds.value || 0),
      generatedAt: new Date().toISOString(),
      quantity: items.length,
      lines: responses.map((entry) => ({
        id: entry.line.id,
        kind: entry.line.kind,
        quantity: entry.response.quantity,
        ...(entry.line.kind === "fixed-card"
          ? { cardId: entry.line.cardId }
          : { count: entry.line.count }),
      })),
      items,
    };
    generatedSheet.value = response;
    isSheetPrintDialogOpen.value = true;
    cardStatus.value = `Generated ${response.quantity} code cards across ${responses.length} line(s). Preview rendered below.`;
  } catch (error: unknown) {
    cardError.value = extractError(
      error,
      "Failed to generate code cards JSON.",
    );
  } finally {
    generatingCards.value = false;
  }
}

watch(generatedSheet, (nextValue) => {
  if (!nextValue?.items?.length) {
    isSheetPrintDialogOpen.value = false;
  }
});

onMounted(async () => {
  const ok = await ensureAdmin();
  if (!ok) return;
  await loadAdminCollectionRefs();
});

watch(
  () => activeRef.value,
  async () => {
    await loadCollectionCards();
  },
  { immediate: true },
);
</script>

<template>
  <div class="pixpax-admin-root mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h1 class="text-xl font-semibold mb-2">PixPax Admin</h1>
      <p class="text-sm text-[var(--ui-fg-muted)] mb-3">
        Redeem-code issuance and sheet generation tools.
      </p>
      <p class="text-xs text-[var(--ui-fg-muted)]">
        Identity and Pixbook management is available in Settings.
      </p>
      <p class="text-xs text-[var(--ui-fg-muted)]">
        Auth: {{ loggedIn ? "authenticated" : "not authenticated" }}
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <Button class="!px-4 !py-2" @click="loadAdminCollectionRefs">
          Reload Collections
        </Button>
      </div>
    </section>

    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h2 class="text-lg font-medium mb-3">Redeem Code Issuance</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field">
          <span>Collection/version</span>
          <select
            v-model="selectedRef"
            :disabled="refsLoading || refs.length === 0"
          >
            <option v-if="refsLoading" value="">Loading collections...</option>
            <option v-else-if="refs.length === 0" value="">
              No collections found
            </option>
            <option
              v-for="entry in refs"
              :key="`${entry.collectionId}::${entry.version}`"
              :value="`${entry.collectionId}::${entry.version}`"
            >
              {{ entry.collectionId }} / {{ entry.version }}
            </option>
          </select>
        </label>
        <p v-if="refsError" class="text-xs text-amber-600 md:col-span-2">
          {{ refsError }}
        </p>

        <label class="field">
          <span>Drop id</span>
          <input v-model="dropId" type="text" placeholder="week-2026-W06" />
        </label>

        <label class="field">
          <span>Pack card count</span>
          <input v-model.number="count" type="number" min="1" max="50" />
        </label>

        <label class="field">
          <span>Designated card id</span>
          <select
            v-model="fixedCardId"
            :disabled="cardsLoading || !hasCollectionCards"
          >
            <option v-if="cardsLoading" value="">Loading cards...</option>
            <option v-else-if="!hasCollectionCards" value="">
              No cards available
            </option>
            <option
              v-for="card in collectionCards"
              :key="`single-${card.cardId}`"
              :value="card.cardId"
            >
              {{ card.label }} ({{ card.cardId }})
            </option>
          </select>
        </label>

        <label class="field">
          <span>Expires in seconds</span>
          <input
            v-model.number="expiresInSeconds"
            type="number"
            min="60"
            max="2592000"
          />
        </label>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <Button
          class="!px-5 !py-2 !bg-[var(--ui-accent)]"
          :disabled="minting"
          @click="mintSingleCodeToken('pack')"
        >
          {{
            quickMinting === "pack" ? "Issuing..." : "Issue 1 random pack code"
          }}
        </Button>
        <Button
          class="!px-5 !py-2"
          :disabled="minting"
          @click="mintSingleCodeToken('fixed-card')"
        >
          {{
            quickMinting === "fixed-card"
              ? "Issuing..."
              : "Issue 1 designated card code"
          }}
        </Button>
      </div>

      <p v-if="mintError" class="mt-3 text-sm font-semibold text-red-600">
        {{ mintError }}
      </p>
      <p v-if="mintStatus" class="mt-3 text-sm text-[var(--ui-fg-muted)]">
        {{ mintStatus }}
      </p>

      <div v-if="minted" class="mt-4 grid gap-3">
        <PixPaxRedeemCodeCard
          v-if="mintedCodeCardItem"
          :item="mintedCodeCardItem"
          :art="mintedCodeCardArt"
          :palette="collectionPalette"
        />
        <label class="field">
          <span>Label</span>
          <input :value="minted.label" readonly />
        </label>
        <label class="field">
          <span>Signed code token</span>
          <input :value="redeemCode" readonly class="mono" />
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <Button class="!px-4 !py-2" @click="copyText(redeemCode, 'code')">
            {{ copied === "code" ? "Copied token" : "Copy token" }}
          </Button>
          <Button class="!px-4 !py-2" @click="copyText(shareLink, 'link')">
            {{ copied === "link" ? "Copied link" : "Copy redeem link" }}
          </Button>
        </div>
        <label class="field">
          <span>Redeem link</span>
          <input :value="shareLink" readonly class="mono" />
        </label>
      </div>

      <div class="mt-6 rounded-lg border border-[var(--ui-border)] p-3">
        <h3 class="text-sm font-semibold">Collection Card Preview</h3>
        <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
          Source for designated card ids. Shows available cards and basic
          metadata.
        </p>
        <p v-if="cardsLoading" class="mt-2 text-xs text-[var(--ui-fg-muted)]">
          Loading card previews...
        </p>
        <p v-else-if="cardsError" class="mt-2 text-xs text-red-700">
          {{ cardsError }}
        </p>
        <p
          v-else-if="!hasCollectionCards"
          class="mt-2 text-xs text-[var(--ui-fg-muted)]"
        >
          No cards found for the selected collection/version.
        </p>
        <div v-else class="card-preview-grid mt-3">
          <article
            v-for="card in collectionCards"
            :key="`preview-${card.cardId}`"
            class="card-preview-item"
          >
            <div class="card-preview-art">
              <CanvasSticker16
                v-if="card.art"
                :art="card.art"
                :palette="collectionPalette"
                :scale="6"
                class="card-preview-canvas"
              />
              <div v-else class="card-preview-fallback">No 16x16 render</div>
            </div>
            <p class="item-title">{{ card.label }}</p>
            <p class="item-sub mono">{{ card.cardId }}</p>
            <p class="item-sub">
              series {{ card.seriesId || "—" }} · slot
              {{ card.slotIndex != null ? card.slotIndex : "—" }}
            </p>
          </article>
        </div>
      </div>

      <div class="mt-6 rounded-lg border border-[var(--ui-border)] p-3">
        <h3 class="text-sm font-semibold">Sheet Builder (Mixed)</h3>
        <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
          Build mixed issuance lines, for example 4x packs, 10x card A, 5x card
          B. Generate one combined response and render all QR/meta items below
          for print preview.
        </p>

        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <label class="field">
            <span>Collection/version for sheet</span>
            <select
              v-model="selectedRef"
              :disabled="refsLoading || refs.length === 0"
            >
              <option v-if="refsLoading" value="">
                Loading collections...
              </option>
              <option v-else-if="refs.length === 0" value="">
                No collections found
              </option>
              <option
                v-for="entry in refs"
                :key="`sheet-${entry.collectionId}::${entry.version}`"
                :value="`${entry.collectionId}::${entry.version}`"
              >
                {{ entry.collectionId }} / {{ entry.version }}
              </option>
            </select>
          </label>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <Button class="!px-4 !py-2" @click="addSheetLine('pack')">
            + Add pack line
          </Button>
          <Button class="!px-4 !py-2" @click="addSheetLine('fixed-card')">
            + Add designated-card line
          </Button>
        </div>

        <div class="mt-3 grid gap-3">
          <div v-for="line in sheetLines" :key="line.id" class="sheet-line">
            <label class="field">
              <span>Kind</span>
              <select
                v-model="line.kind"
                @change="handleSheetLineKindChange(line)"
              >
                <option value="pack">Pack</option>
                <option value="fixed-card">Designated card</option>
              </select>
            </label>

            <label class="field">
              <span>Quantity</span>
              <input
                v-model.number="line.quantity"
                type="number"
                min="1"
                max="500"
              />
            </label>

            <label v-if="line.kind === 'pack'" class="field">
              <span>Pack card count</span>
              <input
                v-model.number="line.count"
                type="number"
                min="1"
                max="50"
              />
            </label>
            <label v-else class="field">
              <span>Card id</span>
              <select
                v-model="line.cardId"
                :disabled="cardsLoading || !hasCollectionCards"
              >
                <option v-if="cardsLoading" value="">Loading cards...</option>
                <option v-else-if="!hasCollectionCards" value="">
                  No cards available
                </option>
                <option
                  v-for="card in collectionCards"
                  :key="`line-${line.id}-${card.cardId}`"
                  :value="card.cardId"
                >
                  {{ card.label }} ({{ card.cardId }})
                </option>
              </select>
            </label>

            <div class="flex items-end">
              <Button
                class="!px-3 !py-2"
                :disabled="sheetLines.length <= 1"
                @click="removeSheetLine(line.id)"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div class="mt-3">
          <Button
            class="!px-4 !py-2"
            :disabled="generatingCards"
            @click="generateCodeCardsJsonArtifact"
          >
            {{
              generatingCards
                ? "Generating preview..."
                : "Generate code sheet preview"
            }}
          </Button>
        </div>
        <p v-if="cardError" class="mt-2 text-sm text-red-700">
          {{ cardError }}
        </p>
        <p
          v-else-if="cardStatus"
          class="mt-2 text-xs text-[var(--ui-fg-muted)]"
        >
          {{ cardStatus }}
        </p>

        <div
          v-if="generatedSheet && generatedSheet.items.length"
          class="mt-4 rounded-lg border border-[var(--ui-border)] p-3"
        >
          <h4 class="text-sm font-semibold">Sheet Preview</h4>
          <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
            {{ generatedSheet.collectionId }} / {{ generatedSheet.version }} ·
            {{ generatedSheet.quantity }} code(s)
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <Button class="!px-4 !py-2" @click="openSheetPrintDialog">
              Open print dialog
            </Button>
          </div>
          <div class="sheet-preview-grid mt-3">
            <PixPaxRedeemCodeCard
              class="bg-white text-black p-4"
              v-for="(item, idx) in generatedSheet.items"
              :key="`${item.codeId}-${idx}`"
              :item="item"
              :art="hasSheetItemArt(item) ? getSheetItemArtOrDefault(item) : null"
              :palette="collectionPalette"
            />
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="isSheetPrintDialogOpen && generatedSheet?.items?.length"
      class="sheet-print-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Sheet print preview"
    >
      <div class="sheet-print-dialog">
        <header class="sheet-print-toolbar">
          <div class="sheet-print-heading">
            <h4 class="text-sm font-semibold">Sheet print preview</h4>
            <p class="text-xs text-[var(--ui-fg-muted)]">
              {{ generatedSheet.collectionId }} / {{ generatedSheet.version }} ·
              {{ generatedSheet.quantity }} code(s)
            </p>
          </div>
          <div class="sheet-print-actions">
            <Button class="!px-4 !py-2" @click="printGeneratedSheet">
              Print
            </Button>
            <Button class="!px-4 !py-2" @click="closeSheetPrintDialog">
              Close
            </Button>
          </div>
        </header>
        <div class="sheet-print-body">
          <div class="sheet-print-grid">
            <PixPaxRedeemCodeCard
              v-for="(item, idx) in generatedSheet.items"
              :key="`print-${item.codeId}-${idx}`"
              :item="item"
              :art="hasSheetItemArt(item) ? getSheetItemArtOrDefault(item) : null"
              :palette="collectionPalette"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ui-fg-muted);
}

.field input,
.field select,
.field textarea {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: var(--ui-bg);
  color: var(--ui-fg);
  padding: 10px 12px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}

.item-title {
  font-size: 13px;
  color: var(--ui-fg);
  margin: 0;
}

.item-sub {
  font-size: 11px;
  color: var(--ui-fg-muted);
  margin: 0;
  overflow-wrap: anywhere;
}

.sheet-line {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 10px;
}

.sheet-preview-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.sheet-print-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  padding: 1rem;
  background: color-mix(in oklch, var(--ui-bg) 78%, black);
}

.sheet-print-dialog {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: var(--ui-bg);
}

.sheet-print-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--ui-border);
}

.sheet-print-heading {
  display: grid;
  gap: 0.25rem;
}

.sheet-print-heading h4,
.sheet-print-heading p {
  margin: 0;
}

.sheet-print-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sheet-print-body {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  background: #fff;
}

.sheet-print-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.card-preview-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.card-preview-item {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 6px;
}

.card-preview-art {
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: var(--ui-bg);
  display: grid;
  place-items: center;
}

.card-preview-canvas {
  width: 96px;
  height: 96px;
}

.card-preview-fallback {
  font-size: 11px;
  color: var(--ui-fg-muted);
}

@media (min-width: 768px) {
  .sheet-line {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media print {
  .pixpax-admin-root > :not(.sheet-print-overlay) {
    display: none !important;
  }

  .sheet-print-overlay {
    position: static;
    inset: auto;
    padding: 0;
    background: #fff;
  }

  .sheet-print-dialog {
    border: 0;
    border-radius: 0;
  }

  .sheet-print-toolbar {
    display: none !important;
  }

  .sheet-print-body {
    overflow: visible;
    padding: 0;
  }

  .sheet-print-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6mm;
  }
}
</style>
