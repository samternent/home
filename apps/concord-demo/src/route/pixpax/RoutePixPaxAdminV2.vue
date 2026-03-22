<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Button } from "ternent-ui/primitives";
import PixPaxRedeemCodeCard from "../../module/pixpax/ui/PixPaxRedeemCodeCard.vue";
import {
  PixPaxApiError,
  getPixpaxCollectionBundle,
  getPixpaxV2Meta,
  issuePixpaxV2DesignatedPack,
  issuePixpaxV2DeterministicPack,
  listPixpaxAdminCollections,
  previewPixpaxV2DeterministicIssue,
  verifyPixpaxV2Proof,
  type PixPaxV2MetaResponse,
} from "../../module/pixpax/api/client";
import { usePixpaxAuth } from "../../module/pixpax/auth/usePixpaxAuth";
import type {
  PackPalette16,
  StickerArt16,
} from "../../module/pixpax/sticker-types";

type CollectionRef = {
  collectionId: string;
  version: string;
};

type CollectionCardOption = {
  cardId: string;
  label: string;
  seriesId: string;
  slotIndex: number | null;
  art: StickerArt16 | null;
};

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

function extractError(error: unknown, fallback: string) {
  if (error instanceof PixPaxApiError) {
    const body = error.body as { error?: string } | null;
    const message = String(body?.error || error.message || "").trim();
    if (message) return message;
  }
  return String((error as Error)?.message || fallback);
}

const DEFAULT_PALETTE: PackPalette16 = {
  id: "pixpax-default",
  colors: [
    0x00000000, 0xff1f2937, 0xfff9fafb, 0xff9ca3af, 0xff111827, 0xff2563eb,
    0xff16a34a, 0xfff59e0b, 0xffef4444, 0xff8b5cf6, 0xff06b6d4, 0xfffff0c2,
    0xff4b5563, 0xffe5e7eb, 0xfff97316, 0xff22c55e,
  ],
};

type SheetLine = {
  id: number;
  kind: "pack" | "fixed-card";
  quantity: number;
  count: number;
  cardId: string;
};

type GeneratedSheetItem = {
  lineId: number;
  label: string;
  codeId: string;
  redeemUrl: string;
  qrSvg: string;
  kind: "pack" | "fixed-card";
  collectionId: string;
  version: string;
  dropId: string;
  count?: number;
  cardId?: string;
  art?: StickerArt16 | null;
  artifact: Record<string, unknown>;
};

function toStickerArtFromRenderPayload(payload: unknown): StickerArt16 | null {
  if (!payload || typeof payload !== "object") return null;
  const gridB64 = String((payload as { gridB64?: unknown }).gridB64 || "").trim();
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
  const id = String((input as { id?: unknown }).id || "palette").trim() || "palette";
  const colorsRaw = (input as { colors?: unknown }).colors;
  if (!Array.isArray(colorsRaw) || colorsRaw.length !== 16) {
    return DEFAULT_PALETTE;
  }
  return {
    id,
    colors: colorsRaw.map((entry) => Number(entry) >>> 0),
  };
}

function normalizeCollectionCard(input: unknown): CollectionCardOption | null {
  if (!input || typeof input !== "object") return null;
  const cardId = String((input as { cardId?: unknown }).cardId || "").trim();
  if (!cardId) return null;
  const label = String((input as { label?: unknown }).label || cardId).trim() || cardId;
  const seriesId = String((input as { seriesId?: unknown }).seriesId || "").trim();
  const slotValue = Number((input as { slotIndex?: unknown }).slotIndex);
  return {
    cardId,
    label,
    seriesId,
    slotIndex: Number.isFinite(slotValue) ? slotValue : null,
    art: toStickerArtFromRenderPayload((input as { renderPayload?: unknown }).renderPayload),
  };
}

function createOpaqueSourceCodeId(prefix = "card") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const router = useRouter();
const auth = usePixpaxAuth();

const meta = ref<PixPaxV2MetaResponse | null>(null);
const refs = ref<CollectionRef[]>([]);
const selectedRef = ref("");
const collectionCards = ref<CollectionCardOption[]>([]);
const collectionPalette = ref<PackPalette16>(DEFAULT_PALETTE);
const claimantPublicKey = ref("");
const dropId = ref(`week-${toIsoWeek(new Date())}`);
const count = ref(5);
const fixedCardId = ref("");
const copied = ref<"" | "code" | "link">("");
const loading = ref(false);
const status = ref("");
const error = ref("");
const latestArtifact = ref<Record<string, unknown> | null>(null);
const latestVerification = ref<Record<string, unknown> | null>(null);
const latestPreview = ref<Record<string, unknown> | null>(null);
const latestCodeId = ref("");
const latestRedeemUrl = ref("");
const latestQrSvg = ref("");

let nextSheetLineId = 1;
const sheetLines = ref<SheetLine[]>([
  { id: nextSheetLineId, kind: "pack", quantity: 4, count: 5, cardId: "" },
]);
const generatingSheet = ref(false);
const generatedSheet = ref<GeneratedSheetItem[]>([]);

const activeRef = computed(() => {
  const [collectionId, version] = String(selectedRef.value || "").split("::");
  return {
    collectionId: String(collectionId || "").trim(),
    version: String(version || "").trim(),
  };
});

function ensureSelectedRef() {
  if (!refs.value.length) {
    selectedRef.value = "";
    return;
  }
  if (
    refs.value.some(
      (entry) => `${entry.collectionId}::${entry.version}` === selectedRef.value,
    )
  ) {
    return;
  }
  selectedRef.value = `${refs.value[0].collectionId}::${refs.value[0].version}`;
}

async function requireAdmin() {
  const ok = await auth.ensurePermission("pixpax.admin.manage");
  if (ok) return true;
  await router.replace({
    name: "pixpax-control-login",
    query: {
      redirect: router.resolve({ name: "pixpax-control-admin-v2" }).fullPath,
    },
  });
  return false;
}

async function loadMeta() {
  try {
    meta.value = await getPixpaxV2Meta();
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to load PixPax v2 metadata.");
  }
}

async function loadRefs() {
  const ok = await requireAdmin();
  if (!ok) return;

  loading.value = true;
  error.value = "";
  try {
    const response = await listPixpaxAdminCollections(auth.token.value || undefined);
    refs.value = Array.isArray(response?.refs)
      ? response.refs
          .map((entry) => ({
            collectionId: String(entry?.collectionId || "").trim(),
            version: String(entry?.version || "").trim(),
          }))
          .filter((entry) => entry.collectionId && entry.version)
      : [];
    ensureSelectedRef();
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to load admin collections.");
  } finally {
    loading.value = false;
  }
}

async function loadBundleCards() {
  const { collectionId, version } = activeRef.value;
  if (!collectionId || !version) {
    collectionCards.value = [];
    collectionPalette.value = DEFAULT_PALETTE;
    return;
  }

  try {
    const bundle = await getPixpaxCollectionBundle(collectionId, version);
    collectionCards.value = Array.isArray(bundle?.cards)
      ? bundle.cards
          .map((card) => normalizeCollectionCard(card))
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
    const paletteInput =
      bundle?.collection && typeof bundle.collection === "object"
        ? (bundle.collection as { palette?: unknown }).palette
        : null;
    collectionPalette.value = normalizePalette(paletteInput);
    if (!collectionCards.value.find((entry) => entry.cardId === fixedCardId.value)) {
      fixedCardId.value = collectionCards.value[0]?.cardId || "";
    }
    sheetLines.value = sheetLines.value.map((line) => {
      if (line.kind !== "fixed-card") return line;
      if (collectionCards.value.find((entry) => entry.cardId === line.cardId)) {
        return line;
      }
      return {
        ...line,
        cardId: collectionCards.value[0]?.cardId || "",
      };
    });
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to load collection cards.");
    collectionCards.value = [];
    collectionPalette.value = DEFAULT_PALETTE;
  }
}

function resetOutputs() {
  status.value = "";
  error.value = "";
  latestPreview.value = null;
  latestVerification.value = null;
  latestCodeId.value = "";
  latestRedeemUrl.value = "";
  latestQrSvg.value = "";
}

async function previewDeterministic() {
  resetOutputs();
  const { collectionId, version } = activeRef.value;
  loading.value = true;
  try {
    const response = await previewPixpaxV2DeterministicIssue(
      {
        collectionId,
        collectionVersion: version,
        dropId: dropId.value.trim(),
        claimantPublicKey: claimantPublicKey.value.trim(),
        count: Number(count.value || 1),
      },
      auth.token.value || undefined,
    );
    latestPreview.value = response.issuance;
    status.value = "Deterministic preview created.";
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to preview deterministic issuance.");
  } finally {
    loading.value = false;
  }
}

async function issueDeterministic() {
  resetOutputs();
  const { collectionId, version } = activeRef.value;
  loading.value = true;
  try {
    const response = await issuePixpaxV2DeterministicPack(
      {
        collectionId,
        collectionVersion: version,
        dropId: dropId.value.trim(),
        claimantPublicKey: claimantPublicKey.value.trim(),
        count: Number(count.value || 1),
      },
      auth.token.value || undefined,
    );
    latestArtifact.value = response.artifact;
    latestVerification.value = response.verification as Record<string, unknown>;
    status.value = "Deterministic issuance artifact created and verified.";
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to issue deterministic pack.");
  } finally {
    loading.value = false;
  }
}

function shuffleCardIds(cardIds: string[]) {
  const next = [...cardIds];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }
  return next;
}

function pickPackCardIds(quantity: number) {
  const available = collectionCards.value.map((entry) => entry.cardId);
  const normalizedCount = Math.max(1, Math.floor(Number(quantity || 1)));
  if (!available.length) {
    throw new Error("No collection cards are available.");
  }

  const picked: string[] = [];
  while (picked.length < normalizedCount) {
    const shuffled = shuffleCardIds(available);
    for (const cardId of shuffled) {
      picked.push(cardId);
      if (picked.length >= normalizedCount) break;
    }
  }
  return picked.slice(0, normalizedCount);
}

function getCollectionCardById(cardId: string) {
  return collectionCards.value.find((entry) => entry.cardId === String(cardId || "").trim()) || null;
}

function createCodeCardLabel(cardIds: string[]) {
  if (cardIds.length === 1) {
    return getCollectionCardById(cardIds[0])?.label || cardIds[0];
  }
  return `Pack (${cardIds.length} cards)`;
}

async function issueDesignatedArtifact(cardIds: string[], sourceCodeId: string) {
  const { collectionId, version } = activeRef.value;
  const response = await issuePixpaxV2DesignatedPack(
    {
      collectionId,
      collectionVersion: version,
      dropId: dropId.value.trim(),
      sourceCodeId,
      cardIds,
    },
    auth.token.value || undefined,
  );
  return response;
}

async function issueQuickPack() {
  resetOutputs();
  loading.value = true;
  try {
    const cardIds = pickPackCardIds(count.value);
    const response = await issueDesignatedArtifact(cardIds, createOpaqueSourceCodeId("pack"));
    latestArtifact.value = response.artifact;
    latestVerification.value = response.verification as Record<string, unknown>;
    latestCodeId.value = String(response.codeId || "").trim();
    latestRedeemUrl.value = String(response.redeemUrl || "").trim();
    latestQrSvg.value = String(response.qrSvg || "").trim();
    status.value = `Issued 1 pack code (${cardIds.length} cards) for ${activeRef.value.collectionId}/${activeRef.value.version}.`;
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to issue pack code.");
  } finally {
    loading.value = false;
  }
}

async function issueQuickFixedCard() {
  resetOutputs();
  loading.value = true;
  try {
    const cardId = String(fixedCardId.value || "").trim();
    if (!cardId) {
      throw new Error("Select a designated card id first.");
    }
    const response = await issueDesignatedArtifact([cardId], createOpaqueSourceCodeId("fixed"));
    latestArtifact.value = response.artifact;
    latestVerification.value = response.verification as Record<string, unknown>;
    latestCodeId.value = String(response.codeId || "").trim();
    latestRedeemUrl.value = String(response.redeemUrl || "").trim();
    latestQrSvg.value = String(response.qrSvg || "").trim();
    status.value = `Issued 1 designated code for ${cardId}.`;
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to issue designated code.");
  } finally {
    loading.value = false;
  }
}

async function verifyLatestArtifact() {
  if (!latestArtifact.value) return;
  loading.value = true;
  error.value = "";
  try {
    const response = await verifyPixpaxV2Proof(latestArtifact.value);
    latestVerification.value = response.verification as Record<string, unknown>;
    status.value = "Latest artifact verified.";
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to verify artifact.");
  } finally {
    loading.value = false;
  }
}

function copyText(value: string, kind: "" | "code" | "link") {
  const text = String(value || "").trim();
  if (!text || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    copied.value = kind;
    window.setTimeout(() => {
      if (copied.value === kind) copied.value = "";
    }, 1500);
  });
}

function addSheetLine(kind: "pack" | "fixed-card") {
  nextSheetLineId += 1;
  sheetLines.value.push({
    id: nextSheetLineId,
    kind,
    quantity: 1,
    count: kind === "pack" ? 5 : 1,
    cardId: kind === "fixed-card" ? fixedCardId.value : "",
  });
}

function removeSheetLine(lineId: number) {
  if (sheetLines.value.length <= 1) return;
  sheetLines.value = sheetLines.value.filter((line) => line.id !== lineId);
}

function getSheetLineCardIds(line: SheetLine) {
  if (line.kind === "fixed-card") {
    const cardId = String(line.cardId || "").trim();
    if (!cardId) {
      throw new Error(`Line ${line.id}: cardId is required for designated cards.`);
    }
    return [cardId];
  }
  return pickPackCardIds(line.count);
}

async function generateSheetPreview() {
  resetOutputs();
  generatingSheet.value = true;
  generatedSheet.value = [];
  try {
    const items: GeneratedSheetItem[] = [];
    for (const line of sheetLines.value) {
      const quantity = Math.max(1, Math.floor(Number(line.quantity || 1)));
      for (let index = 0; index < quantity; index += 1) {
        const cardIds = getSheetLineCardIds(line);
        const response = await issueDesignatedArtifact(
          cardIds,
          createOpaqueSourceCodeId(line.kind === "pack" ? "sheet-pack" : "sheet-card"),
        );
        const cardId = line.kind === "fixed-card" ? cardIds[0] : undefined;
        items.push({
          lineId: line.id,
          label: createCodeCardLabel(cardIds),
          codeId: String(response.codeId || "").trim(),
          redeemUrl: String(response.redeemUrl || "").trim(),
          qrSvg: String(response.qrSvg || "").trim(),
          kind: line.kind,
          collectionId: activeRef.value.collectionId,
          version: activeRef.value.version,
          dropId: dropId.value.trim(),
          count: line.kind === "pack" ? cardIds.length : undefined,
          cardId,
          art: cardId ? getCollectionCardById(cardId)?.art || null : null,
          artifact: response.artifact,
        });
      }
    }
    generatedSheet.value = items;
    status.value = `Generated ${items.length} code card${items.length === 1 ? "" : "s"} across ${sheetLines.value.length} line(s).`;
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to generate code sheet.");
  } finally {
    generatingSheet.value = false;
  }
}

const latestCodeCardItem = computed(() => {
  if (!latestCodeId.value || !latestRedeemUrl.value || !latestQrSvg.value) {
    return null;
  }
  const artifactPayload =
    latestArtifact.value && typeof latestArtifact.value === "object"
      ? (latestArtifact.value as { payload?: Record<string, unknown> }).payload
      : null;
  const cards = Array.isArray(artifactPayload?.cards) ? artifactPayload.cards : [];
  const firstCardId =
    cards.length === 1 && cards[0] && typeof cards[0] === "object"
      ? String((cards[0] as { cardId?: unknown }).cardId || "").trim()
      : "";
  return {
    token: latestCodeId.value,
    tokenHash: latestCodeId.value,
    label: createCodeCardLabel(
      cards
        .map((entry) =>
          entry && typeof entry === "object"
            ? String((entry as { cardId?: unknown }).cardId || "").trim()
            : "",
        )
        .filter(Boolean),
    ),
    redeemUrl: latestRedeemUrl.value,
    qrSvg: latestQrSvg.value,
    qrErrorCorrection: "M",
    qrQuietZoneModules: 2,
    codeId: latestCodeId.value,
    issuedAt: String(artifactPayload?.issuedAt || new Date().toISOString()),
    expiresAt: new Date(Date.now() + 31536000000).toISOString(),
    collectionId: activeRef.value.collectionId,
    version: activeRef.value.version,
    kind: firstCardId ? "fixed-card" : "pack",
    cardId: firstCardId || undefined,
    count: cards.length > 1 ? cards.length : undefined,
    dropId: dropId.value.trim() || undefined,
  };
});

const latestCodeCardArt = computed(() => {
  const item = latestCodeCardItem.value;
  if (!item?.cardId) return null;
  return getCollectionCardById(item.cardId)?.art || null;
});

watch(
  () => selectedRef.value,
  () => {
    void loadBundleCards();
  },
  { immediate: true },
);

onMounted(async () => {
  await loadMeta();
  await loadRefs();
});
</script>

<template>
  <div class="mx-auto w-full max-w-6xl p-6 pixpax-admin-root">
    <section class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">Redeem Code Issuance</h1>
          <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
            Pre-issue and sign packs now, then hand out printed QR cards or redeem links manually.
            Claim happens later in the player app and never signs a new pack.
          </p>
        </div>
        <div class="text-xs text-[var(--ui-fg-muted)]">
          <p>Seal issuer configured: <strong>{{ meta?.issuer?.sealIdentityConfigured ? "yes" : "no" }}</strong></p>
          <p>API version: <strong>{{ meta?.version || "unknown" }}</strong></p>
        </div>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-2">
        <label class="field">
          <span>Collection / version</span>
          <select v-model="selectedRef">
            <option v-if="!refs.length" value="">No collections loaded</option>
            <option
              v-for="entry in refs"
              :key="`${entry.collectionId}::${entry.version}`"
              :value="`${entry.collectionId}::${entry.version}`"
            >
              {{ entry.collectionId }} / {{ entry.version }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Drop id</span>
          <input v-model="dropId" type="text" />
        </label>

        <label class="field">
          <span>Pack card count</span>
          <input v-model.number="count" type="number" min="1" max="50" />
        </label>

        <label class="field">
          <span>Designated card id</span>
          <select v-model="fixedCardId">
            <option v-if="!collectionCards.length" value="">No cards loaded</option>
            <option
              v-for="card in collectionCards"
              :key="card.cardId"
              :value="card.cardId"
            >
              {{ card.label }} ({{ card.cardId }})
            </option>
          </select>
        </label>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        <Button class="!px-5 !py-2 !bg-[var(--ui-accent)]" :disabled="loading" @click="issueQuickPack">
          Issue 1 random pack code
        </Button>
        <Button class="!px-5 !py-2" :disabled="loading" @click="issueQuickFixedCard">
          Issue 1 designated sticker code
        </Button>
        <Button class="!px-4 !py-2" :disabled="loading || !latestArtifact" @click="verifyLatestArtifact">
          Verify latest artifact
        </Button>
      </div>

      <p v-if="status" class="mt-4 text-sm text-emerald-700">{{ status }}</p>
      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>

      <div v-if="latestCodeCardItem" class="mt-6 grid gap-3">
        <PixPaxRedeemCodeCard
          :item="latestCodeCardItem"
          :art="latestCodeCardArt"
          :palette="collectionPalette"
        />
        <label class="field">
          <span>Code id</span>
          <input :value="latestCodeId" readonly class="mono" />
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <Button class="!px-4 !py-2" @click="copyText(latestCodeId, 'code')">
            {{ copied === "code" ? "Copied code" : "Copy code id" }}
          </Button>
          <Button class="!px-4 !py-2" @click="copyText(latestRedeemUrl, 'link')">
            {{ copied === "link" ? "Copied link" : "Copy redeem link" }}
          </Button>
          <a
            v-if="latestRedeemUrl"
            :href="latestRedeemUrl"
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center rounded-md border border-[var(--ui-border)] px-4 py-2 text-sm"
          >
            Open redeem page
          </a>
        </div>
        <label class="field">
          <span>Redeem link</span>
          <input :value="latestRedeemUrl" readonly class="mono" />
        </label>
      </div>
    </section>

    <section class="mt-6 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4">
      <h2 class="text-sm font-semibold">Sheet Builder (Mixed)</h2>
      <p class="mt-2 text-xs text-[var(--ui-fg-muted)]">
        Build a printable batch like 4 pack codes, 2 penguin codes, 3 duck codes. Each card is
        pre-issued immediately on the v2 contract and previewed below.
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        <Button class="!px-4 !py-2" @click="addSheetLine('pack')">
          + Add pack line
        </Button>
        <Button class="!px-4 !py-2" @click="addSheetLine('fixed-card')">
          + Add designated-card line
        </Button>
      </div>

      <div class="mt-4 grid gap-3">
        <div v-for="line in sheetLines" :key="line.id" class="sheet-line">
          <label class="field">
            <span>Kind</span>
            <select v-model="line.kind">
              <option value="pack">Pack</option>
              <option value="fixed-card">Designated card</option>
            </select>
          </label>

          <label class="field">
            <span>Quantity</span>
            <input v-model.number="line.quantity" type="number" min="1" max="200" />
          </label>

          <label v-if="line.kind === 'pack'" class="field">
            <span>Pack card count</span>
            <input v-model.number="line.count" type="number" min="1" max="50" />
          </label>

          <label v-else class="field">
            <span>Card id</span>
            <select v-model="line.cardId">
              <option v-if="!collectionCards.length" value="">No cards loaded</option>
              <option
                v-for="card in collectionCards"
                :key="`${line.id}-${card.cardId}`"
                :value="card.cardId"
              >
                {{ card.label }} ({{ card.cardId }})
              </option>
            </select>
          </label>

          <div class="flex items-end">
            <Button class="!px-3 !py-2" :disabled="sheetLines.length <= 1" @click="removeSheetLine(line.id)">
              Remove
            </Button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <Button class="!px-4 !py-2" :disabled="generatingSheet" @click="generateSheetPreview">
          {{ generatingSheet ? "Generating…" : "Generate code sheet preview" }}
        </Button>
        <Button
          v-if="generatedSheet.length"
          class="!px-4 !py-2"
          @click="window.print()"
        >
          Open print dialog
        </Button>
      </div>

      <div v-if="generatedSheet.length" class="mt-4 rounded-xl border border-[var(--ui-border)] p-4">
        <h3 class="text-sm font-semibold">Sheet Preview</h3>
        <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
          {{ activeRef.collectionId }} / {{ activeRef.version }} · {{ generatedSheet.length }} code(s)
        </p>
        <div class="sheet-preview-grid mt-3">
          <PixPaxRedeemCodeCard
            v-for="item in generatedSheet"
            :key="item.codeId"
            :item="{
              token: item.codeId,
              tokenHash: item.codeId,
              label: item.label,
              redeemUrl: item.redeemUrl,
              qrSvg: item.qrSvg,
              qrErrorCorrection: 'M',
              qrQuietZoneModules: 2,
              codeId: item.codeId,
              issuedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 31536000000).toISOString(),
              collectionId: item.collectionId,
              version: item.version,
              kind: item.kind,
              cardId: item.cardId,
              count: item.count,
              dropId: item.dropId,
            }"
            :art="item.art || null"
            :palette="collectionPalette"
          />
        </div>
      </div>
    </section>

    <section class="mt-6 grid gap-6 lg:grid-cols-3">
      <article class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4">
        <h2 class="text-sm font-semibold">Invariants</h2>
        <ul class="mt-3 list-disc pl-5 text-xs text-[var(--ui-fg-muted)]">
          <li v-for="item in meta?.invariants || []" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4">
        <h2 class="text-sm font-semibold">Deterministic Issue (Advanced)</h2>
        <div class="mt-3 grid gap-3">
          <label class="field">
            <span>Claimant public key</span>
            <textarea
              v-model="claimantPublicKey"
              rows="3"
              placeholder="Paste the Pixbook identity public key"
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <Button class="!px-4 !py-2" :disabled="loading" @click="previewDeterministic">
              Preview deterministic
            </Button>
            <Button class="!px-4 !py-2" :disabled="loading" @click="issueDeterministic">
              Issue deterministic
            </Button>
          </div>
        </div>
      </article>

      <article class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4">
        <h2 class="text-sm font-semibold">Verification</h2>
        <pre class="mt-3 overflow-auto rounded bg-black/5 p-3 text-xs">{{ JSON.stringify(latestVerification, null, 2) }}</pre>
      </article>
    </section>

    <section class="mt-6 grid gap-6 lg:grid-cols-2">
      <article class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4">
        <h2 class="text-sm font-semibold">Preview</h2>
        <pre class="mt-3 overflow-auto rounded bg-black/5 p-3 text-xs">{{ JSON.stringify(latestPreview, null, 2) }}</pre>
      </article>

      <article class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4">
        <h2 class="text-sm font-semibold">Latest Artifact</h2>
        <pre class="mt-3 overflow-auto rounded bg-black/5 p-3 text-xs">{{ JSON.stringify(latestArtifact, null, 2) }}</pre>
      </article>
    </section>
  </div>
</template>

<style scoped>
.sheet-line {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  align-items: end;
  border: 1px solid var(--ui-border);
  border-radius: 0.85rem;
  padding: 0.75rem;
}

.sheet-preview-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
}

.field {
  display: grid;
  gap: 0.375rem;
}

.field span {
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ui-fg-muted);
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--ui-bg-elevated) 86%, transparent);
  color: var(--ui-fg);
  padding: 0.7rem 0.85rem;
  font: inherit;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

@media print {
  .pixpax-admin-root > :not(:nth-child(2)) {
    display: none !important;
  }

  .sheet-preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
