<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { Badge, Button, Card } from "ternent-ui/primitives";
import { usePixpaxAdminAuth } from "@/modules/admin-auth";
import PackPrintCard from "@/modules/admin/components/PackPrintCard.vue";
import {
  exportPackBatchImages,
  type PackBatchExportFailure,
} from "@/modules/admin/print/exportPackBatchImages";
import {
  createPackPrintBatchId,
} from "@/modules/admin/print/print-config";
import {
  mapGeneratedPackToPrintModel,
} from "@/modules/admin/print/mapGeneratedPackToPrintModel";
import {
  PixpaxApiError,
  fetchAdminCollectionBundle,
  getPixpaxV2Meta,
  issuePixpaxV2DesignatedPack,
  issuePixpaxV2DeterministicPack,
  listPixpaxV2DesignatedCodes,
  listPixpaxAdminCollections,
  previewPixpaxV2DeterministicIssue,
  revokePixpaxV2DesignatedCode,
  type PixpaxPublicCollectionCard,
  type PixpaxV2DesignatedCodeSummary,
  type PixpaxV2MetaResponse,
  verifyIssuedArtifact,
} from "@/modules/api/client";
import AdminRedeemCodeCard from "@/modules/admin/components/AdminRedeemCodeCard.vue";
import { formatRedeemCode } from "@/modules/redeem/code-format";

type CollectionRef = {
  collectionId: string;
  version: string;
};

type CollectionCardOption = {
  cardId: string;
  label: string;
  seriesId: string;
  slotIndex: number | null;
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
};

function toIsoWeek(date = new Date()) {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof PixpaxApiError) {
    const body = error.body as { error?: string } | null;
    const message = String(body?.error || error.message || "").trim();
    if (message) {
      return message;
    }
  }
  return String((error as Error)?.message || fallback);
}

function normalizeCollectionCard(input: PixpaxPublicCollectionCard): CollectionCardOption | null {
  const cardId = String(input?.cardId || "").trim();
  if (!cardId) {
    return null;
  }
  const label =
    String(input?.label || input?.title || input?.name || cardId).trim() || cardId;
  const seriesId = String(input?.seriesId || "").trim();
  const slotValue = Number((input as PixpaxPublicCollectionCard & { slotIndex?: unknown }).slotIndex);
  return {
    cardId,
    label,
    seriesId,
    slotIndex: Number.isFinite(slotValue) ? slotValue : null,
  };
}

function createOpaqueSourceCodeId(prefix = "pack") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const auth = usePixpaxAdminAuth();
const meta = ref<PixpaxV2MetaResponse | null>(null);
const refs = ref<CollectionRef[]>([]);
const selectedRef = ref("");
const collectionCards = ref<CollectionCardOption[]>([]);
const claimantPublicKey = ref("");
const dropId = ref(`week-${toIsoWeek(new Date())}`);
const count = ref(5);
const fixedCardId = ref("");
const copied = ref<"" | "code" | "link">("");
const loading = ref(false);
const generatingSheet = ref(false);
const status = ref("");
const error = ref("");
const latestArtifact = ref<Record<string, unknown> | null>(null);
const latestVerification = ref<Record<string, unknown> | null>(null);
const latestPreview = ref<Record<string, unknown> | null>(null);
const latestCodeId = ref("");
const latestRedeemUrl = ref("");
const latestQrSvg = ref("");
const generatedSheet = ref<GeneratedSheetItem[]>([]);
const generatedSheetBatchId = ref("");
const selectedGeneratedCodeId = ref("");
const exportingSheet = ref(false);
const exportFailures = ref<PackBatchExportFailure[]>([]);
const exportProgress = ref({ completed: 0, total: 0, current: "" });
const issuedCodes = ref<PixpaxV2DesignatedCodeSummary[]>([]);
const loadingIssuedCodes = ref(false);
const revokeBusyCodeId = ref("");
const revokeReason = ref("");
const selectedIssuedCodeId = ref("");

let nextSheetLineId = 1;
const sheetLines = ref<SheetLine[]>([
  { id: nextSheetLineId, kind: "pack", quantity: 4, count: 5, cardId: "" },
]);

const hasAdminPermission = computed(() => auth.hasPermission("pixpax.admin.manage"));
const activeRef = computed(() => {
  const [collectionId, version] = String(selectedRef.value || "").split("::");
  return {
    collectionId: String(collectionId || "").trim(),
    version: String(version || "").trim(),
  };
});

const latestCodeCardItem = computed(() => {
  if (!latestCodeId.value || !latestRedeemUrl.value || !latestQrSvg.value) {
    return null;
  }

  const artifactPayload =
    latestArtifact.value && typeof latestArtifact.value === "object"
      ? (latestArtifact.value as { payload?: Record<string, unknown> }).payload
      : null;
  const cards = Array.isArray(artifactPayload?.cards) ? artifactPayload.cards : [];
  return {
    label: cards.length === 1 ? getCollectionCardById(String((cards[0] as { cardId?: unknown })?.cardId || ""))?.label || "Sticker" : `Pack (${cards.length} cards)`,
    codeId: latestCodeId.value,
    redeemUrl: latestRedeemUrl.value,
    qrSvg: latestQrSvg.value,
    collectionId: activeRef.value.collectionId,
    version: activeRef.value.version,
    expiresAt: new Date(Date.now() + 31536000000).toISOString(),
  };
});
const selectedIssuedCode = computed(
  () => issuedCodes.value.find((entry) => entry.codeId === selectedIssuedCodeId.value) || null,
);
const generatedPrintModels = computed(() =>
  generatedSheet.value.map((item, index) =>
    mapGeneratedPackToPrintModel(item, {
      batchId: generatedSheetBatchId.value || "preview",
      index,
    }),
  ),
);
const selectedGeneratedIndex = computed(() =>
  generatedPrintModels.value.findIndex((entry) => entry.id === selectedGeneratedCodeId.value),
);
const selectedGeneratedPrintModel = computed(() => {
  return (
    generatedPrintModels.value.find((entry) => entry.id === selectedGeneratedCodeId.value) ||
    generatedPrintModels.value[0] ||
    null
  );
});

const exportRenderNodes = new Map<string, HTMLElement>();

function ensureSelectedRef() {
  if (!refs.value.length) {
    selectedRef.value = "";
    return;
  }
  if (refs.value.some((entry) => `${entry.collectionId}::${entry.version}` === selectedRef.value)) {
    return;
  }
  selectedRef.value = `${refs.value[0].collectionId}::${refs.value[0].version}`;
}

function resetOutputs() {
  status.value = "";
  error.value = "";
  latestPreview.value = null;
  latestVerification.value = null;
  latestArtifact.value = null;
  latestCodeId.value = "";
  latestRedeemUrl.value = "";
  latestQrSvg.value = "";
  exportFailures.value = [];
}

function getCollectionCardById(cardId: string) {
  return collectionCards.value.find((entry) => entry.cardId === String(cardId || "").trim()) || null;
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
      if (picked.length >= normalizedCount) {
        break;
      }
    }
  }
  return picked.slice(0, normalizedCount);
}

function createCodeCardLabel(cardIds: string[]) {
  if (cardIds.length === 1) {
    return getCollectionCardById(cardIds[0])?.label || cardIds[0];
  }
  return `Pack (${cardIds.length} cards)`;
}

async function loadMeta() {
  try {
    meta.value = await getPixpaxV2Meta();
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to load PixPax v2 metadata.");
  }
}

async function loadRefs() {
  if (!hasAdminPermission.value) {
    return;
  }
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
  if (!collectionId || !version || !hasAdminPermission.value) {
    collectionCards.value = [];
    return;
  }

  try {
    const bundle = await fetchAdminCollectionBundle(collectionId, version);
    collectionCards.value = Array.isArray(bundle?.cards)
      ? bundle.cards
          .map((card) => normalizeCollectionCard(card))
          .filter((entry): entry is CollectionCardOption => Boolean(entry))
          .sort((left, right) => {
            if (left.slotIndex != null && right.slotIndex != null) {
              return left.slotIndex - right.slotIndex;
            }
            if (left.slotIndex != null) return -1;
            if (right.slotIndex != null) return 1;
            return left.cardId.localeCompare(right.cardId);
          })
      : [];

    if (!collectionCards.value.find((entry) => entry.cardId === fixedCardId.value)) {
      fixedCardId.value = collectionCards.value[0]?.cardId || "";
    }
    sheetLines.value = sheetLines.value.map((line) => {
      if (line.kind !== "fixed-card") {
        return line;
      }
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
  }
}

async function loadIssuedCodes() {
  const { collectionId, version } = activeRef.value;
  if (!hasAdminPermission.value || !collectionId || !version) {
    issuedCodes.value = [];
    return;
  }

  loadingIssuedCodes.value = true;
  try {
    const response = await listPixpaxV2DesignatedCodes(
      {
        collectionId,
        collectionVersion: version,
        dropId: dropId.value.trim(),
        limit: 24,
      },
      auth.token.value || undefined,
    );
    issuedCodes.value = Array.isArray(response.codes) ? response.codes : [];
    if (!issuedCodes.value.find((entry) => entry.codeId === selectedIssuedCodeId.value)) {
      selectedIssuedCodeId.value = issuedCodes.value[0]?.codeId || "";
    }
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to load recent designated codes.");
  } finally {
    loadingIssuedCodes.value = false;
  }
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
    latestArtifact.value = response.artifact as Record<string, unknown>;
    latestVerification.value = response.verification as Record<string, unknown>;
    status.value = "Deterministic issuance artifact created and verified.";
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to issue deterministic pack.");
  } finally {
    loading.value = false;
  }
}

async function issueDesignatedArtifact(cardIds: string[], sourceCodeId: string) {
  const { collectionId, version } = activeRef.value;
  return issuePixpaxV2DesignatedPack(
    {
      collectionId,
      collectionVersion: version,
      dropId: dropId.value.trim(),
      sourceCodeId,
      cardIds,
    },
    auth.token.value || undefined,
  );
}

async function issueQuickPack() {
  resetOutputs();
  loading.value = true;
  try {
    const cardIds = pickPackCardIds(count.value);
    const response = await issueDesignatedArtifact(cardIds, createOpaqueSourceCodeId("pack"));
    latestArtifact.value = response.artifact as Record<string, unknown>;
    latestVerification.value = response.verification as Record<string, unknown>;
    latestCodeId.value = String(response.codeId || "").trim();
    latestRedeemUrl.value = String(response.redeemUrl || "").trim();
    latestQrSvg.value = String(response.qrSvg || "").trim();
    status.value = `Issued 1 pack code (${cardIds.length} cards) for ${activeRef.value.collectionId}/${activeRef.value.version}.`;
    await loadIssuedCodes();
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
    latestArtifact.value = response.artifact as Record<string, unknown>;
    latestVerification.value = response.verification as Record<string, unknown>;
    latestCodeId.value = String(response.codeId || "").trim();
    latestRedeemUrl.value = String(response.redeemUrl || "").trim();
    latestQrSvg.value = String(response.qrSvg || "").trim();
    status.value = `Issued 1 designated code for ${cardId}.`;
    await loadIssuedCodes();
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to issue designated code.");
  } finally {
    loading.value = false;
  }
}

async function verifyLatestArtifact() {
  if (!latestArtifact.value) {
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    latestVerification.value = await verifyIssuedArtifact(latestArtifact.value as never) as Record<string, unknown>;
    status.value = "Latest artifact verified.";
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to verify artifact.");
  } finally {
    loading.value = false;
  }
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
  if (sheetLines.value.length <= 1) {
    return;
  }
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
  selectedGeneratedCodeId.value = "";
  try {
    const items: GeneratedSheetItem[] = [];
    const batchId = createPackPrintBatchId();
    for (const line of sheetLines.value) {
      const quantity = Math.max(1, Math.floor(Number(line.quantity || 1)));
      for (let index = 0; index < quantity; index += 1) {
        const cardIds = getSheetLineCardIds(line);
        const response = await issueDesignatedArtifact(
          cardIds,
          createOpaqueSourceCodeId(line.kind === "pack" ? "sheet-pack" : "sheet-card"),
        );
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
          cardId: line.kind === "fixed-card" ? cardIds[0] : undefined,
        });
      }
    }
    generatedSheet.value = items;
    generatedSheetBatchId.value = batchId;
    selectedGeneratedCodeId.value = items[0]?.codeId || "";
    status.value = `Generated ${items.length} code card${items.length === 1 ? "" : "s"} across ${sheetLines.value.length} line(s).`;
    await loadIssuedCodes();
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to generate code sheet.");
  } finally {
    generatingSheet.value = false;
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
      if (copied.value === kind) {
        copied.value = "";
      }
    }, 1500);
  });
}

function selectGeneratedPrintModel(codeId: string) {
  selectedGeneratedCodeId.value = String(codeId || "").trim();
}

function stepGeneratedPreview(direction: -1 | 1) {
  if (!generatedPrintModels.value.length) {
    return;
  }
  const currentIndex = selectedGeneratedIndex.value >= 0 ? selectedGeneratedIndex.value : 0;
  const nextIndex =
    (currentIndex + direction + generatedPrintModels.value.length) %
    generatedPrintModels.value.length;
  selectedGeneratedCodeId.value = generatedPrintModels.value[nextIndex]?.id || "";
}

function setExportRenderNode(id: string, node: Element | null) {
  const key = String(id || "").trim();
  if (!key) {
    return;
  }
  if (node instanceof HTMLElement) {
    exportRenderNodes.set(key, node);
    return;
  }
  exportRenderNodes.delete(key);
}

async function exportGeneratedSheet() {
  if (!generatedPrintModels.value.length) {
    return;
  }
  exportingSheet.value = true;
  error.value = "";
  exportFailures.value = [];
  exportProgress.value = { completed: 0, total: generatedPrintModels.value.length, current: "" };

  try {
    await nextTick();
    const result = await exportPackBatchImages({
      batchId: generatedSheetBatchId.value || createPackPrintBatchId(),
      models: generatedPrintModels.value,
      getElement: (id) => exportRenderNodes.get(id) || null,
      onProgress: (value) => {
        exportProgress.value = value;
      },
    });

    exportFailures.value = result.failures;
    status.value = result.failures.length
      ? `Exported ${result.successCount} print card${result.successCount === 1 ? "" : "s"} with ${result.failures.length} failure${result.failures.length === 1 ? "" : "s"}.`
      : `Exported ${result.successCount} print card${result.successCount === 1 ? "" : "s"} as ${result.zipFilename}.`;
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to export print cards.");
  } finally {
    exportingSheet.value = false;
    exportProgress.value = { completed: 0, total: generatedPrintModels.value.length, current: "" };
  }
}

async function revokeIssuedCode(codeId: string) {
  revokeBusyCodeId.value = codeId;
  error.value = "";
  try {
    const response = await revokePixpaxV2DesignatedCode(
      codeId,
      { reason: String(revokeReason.value || "").trim() },
      auth.token.value || undefined,
    );
    status.value = response.alreadyRevoked
      ? `Code ${response.code.codeId} was already revoked.`
      : `Code ${response.code.codeId} revoked successfully.`;
    revokeReason.value = "";
    await loadIssuedCodes();
  } catch (nextError) {
    error.value = extractError(nextError, "Unable to revoke designated code.");
  } finally {
    revokeBusyCodeId.value = "";
  }
}

watch(
  () => selectedRef.value,
  () => {
    void loadBundleCards();
    void loadIssuedCodes();
  },
  { immediate: true },
);

watch(
  () => dropId.value,
  () => {
    void loadIssuedCodes();
  },
  { immediate: true },
);

onMounted(async () => {
  await auth.validateToken({ force: true });
  await loadMeta();
  await loadRefs();
});
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-2">
      <p class="m-0 text-[11px] uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
        admin issuance
      </p>
      <h1 class="m-0 font-mono text-[clamp(2rem,5vw,3.8rem)] uppercase tracking-[-0.08em]">
        PixPax control
      </h1>
      <p class="m-0 max-w-3xl text-sm text-[var(--ui-fg-muted)]">
        Pre-issue signed packs now, then hand out QR cards or links manually. Claim happens later
        in the player app and never signs a new pack.
      </p>
    </div>

    <Card
      v-if="!hasAdminPermission"
      variant="showcase"
      padding="sm"
      class="space-y-4"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Access
          </p>
          <h2 class="m-0 text-xl font-semibold">Permission required</h2>
        </div>
        <Badge tone="warning" variant="soft">
          {{ auth.source.value || "guest" }}
        </Badge>
      </div>

      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        You are signed in, but this session does not have <code>pixpax.admin.manage</code>.
      </p>

      <div class="flex flex-wrap gap-2">
        <Button as="RouterLink" to="/app/admin/login" size="sm" variant="secondary">
          Try another admin login
        </Button>
        <Button size="sm" variant="plain-secondary" @click="auth.logout()">
          Clear fallback token
        </Button>
      </div>
    </Card>

    <template v-else>
      <Card variant="showcase" padding="sm" class="space-y-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              Issue codes
            </p>
            <h2 class="m-0 text-2xl font-semibold">Redeem card workshop</h2>
          </div>
          <div class="text-right text-xs text-[var(--ui-fg-muted)]">
            <p class="m-0">Auth: <strong>{{ auth.source.value }}</strong></p>
            <p class="m-0">Seal issuer: <strong>{{ meta?.issuer?.sealIdentityConfigured ? "ready" : "missing" }}</strong></p>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="grid gap-2">
            <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Collection / version</span>
            <select
              v-model="selectedRef"
              class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
            >
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

          <label class="grid gap-2">
            <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Drop id</span>
            <input
              v-model="dropId"
              type="text"
              class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
            />
          </label>

          <label class="grid gap-2">
            <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Pack card count</span>
            <input
              v-model.number="count"
              type="number"
              min="1"
              max="50"
              class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
            />
          </label>

          <label class="grid gap-2">
            <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Designated card id</span>
            <select
              v-model="fixedCardId"
              class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
            >
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

        <div class="flex flex-wrap gap-2">
          <Button size="lg" variant="secondary" :disabled="loading" @click="issueQuickPack">
            Issue 1 random pack code
          </Button>
          <Button size="lg" variant="plain-secondary" :disabled="loading" @click="issueQuickFixedCard">
            Issue 1 designated sticker code
          </Button>
          <Button size="lg" variant="plain-secondary" :disabled="loading || !latestArtifact" @click="verifyLatestArtifact">
            Verify latest artifact
          </Button>
        </div>

        <p v-if="status" class="m-0 text-sm text-emerald-500">{{ status }}</p>
        <p v-if="error" class="m-0 text-sm text-[var(--ui-danger)]">{{ error }}</p>

        <div v-if="latestCodeCardItem" class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
          <AdminRedeemCodeCard :item="latestCodeCardItem" />

          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" @click="copyText(latestCodeId, 'code')">
                {{ copied === "code" ? "Copied code" : "Copy redeem code" }}
              </Button>
              <Button size="sm" variant="plain-secondary" @click="copyText(latestRedeemUrl, 'link')">
                {{ copied === "link" ? "Copied link" : "Copy redeem link" }}
              </Button>
              <a
                v-if="latestRedeemUrl"
                :href="latestRedeemUrl"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center rounded-full border border-[var(--ui-border)] px-4 py-2 text-sm text-[var(--ui-fg)] no-underline"
              >
                Open redeem page
              </a>
            </div>

            <label class="grid gap-2">
              <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Redeem code</span>
              <input
                readonly
                :value="formatRedeemCode(latestCodeId)"
                class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 font-mono text-sm text-[var(--ui-fg)]"
              />
            </label>

            <label class="grid gap-2">
              <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Redeem link</span>
              <input
                readonly
                :value="latestRedeemUrl"
                class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 font-mono text-xs text-[var(--ui-fg)]"
              />
            </label>
          </div>
        </div>
      </Card>

      <Card variant="subtle" padding="sm" class="space-y-5">
        <div class="space-y-1">
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Sheet builder
          </p>
          <h2 class="m-0 text-xl font-semibold">Mixed printable batches</h2>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            Generate a live batch like 4 pack codes and 2 fixed-card codes, then print the full sheet.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" @click="addSheetLine('pack')">
            + Add pack line
          </Button>
          <Button size="sm" variant="plain-secondary" @click="addSheetLine('fixed-card')">
            + Add designated-card line
          </Button>
        </div>

        <div class="grid gap-3">
          <div
            v-for="line in sheetLines"
            :key="line.id"
            class="grid gap-3 rounded-[1.15rem] border border-[var(--ui-border)] p-3 md:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
          >
            <label class="grid gap-2">
              <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Kind</span>
              <select
                v-model="line.kind"
                class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
              >
                <option value="pack">Pack</option>
                <option value="fixed-card">Designated card</option>
              </select>
            </label>
            <label class="grid gap-2">
              <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Quantity</span>
              <input
                v-model.number="line.quantity"
                type="number"
                min="1"
                max="200"
                class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
              />
            </label>
            <label v-if="line.kind === 'pack'" class="grid gap-2">
              <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Pack card count</span>
              <input
                v-model.number="line.count"
                type="number"
                min="1"
                max="50"
                class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
              />
            </label>
            <label v-else class="grid gap-2">
              <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Card id</span>
              <select
                v-model="line.cardId"
                class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
              >
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
              <Button size="sm" variant="plain-secondary" :disabled="sheetLines.length <= 1" @click="removeSheetLine(line.id)">
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" :disabled="generatingSheet" @click="generateSheetPreview">
            {{ generatingSheet ? "Generating…" : "Generate code sheet preview" }}
          </Button>
          <Button
            v-if="generatedPrintModels.length"
            size="sm"
            variant="plain-secondary"
            :disabled="exportingSheet"
            @click="exportGeneratedSheet"
          >
            {{ exportingSheet ? "Exporting…" : "Export print cards (.zip)" }}
          </Button>
        </div>

        <div v-if="generatedPrintModels.length" class="space-y-4 rounded-[1.15rem] border border-[var(--ui-border)] p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
            <h3 class="m-0 text-lg font-semibold">Sheet preview</h3>
            <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                {{ activeRef.collectionId }} / {{ activeRef.version }} · {{ generatedSheet.length }} code(s) · Batch {{ generatedSheetBatchId }}
            </p>
            </div>
            <p
              v-if="exportingSheet && exportProgress.total"
              class="m-0 text-xs text-[var(--ui-fg-muted)]"
            >
              Exporting {{ exportProgress.completed + 1 > exportProgress.total ? exportProgress.total : exportProgress.completed + 1 }}/{{ exportProgress.total }}
            </p>
          </div>

          <div
            v-if="selectedGeneratedPrintModel"
            class="grid gap-5 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:items-start"
          >
            <div class="space-y-4">
              <div class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <PackPrintCard :model="selectedGeneratedPrintModel" preview />
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="plain-secondary" @click="stepGeneratedPreview(-1)">
                  Prev
                </Button>
                <Button size="sm" variant="plain-secondary" @click="stepGeneratedPreview(1)">
                  Next
                </Button>
                <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                  {{ Math.max(1, selectedGeneratedIndex + 1) }} / {{ generatedPrintModels.length }}
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="grid gap-2 sm:grid-cols-2">
                <button
                  v-for="model in generatedPrintModels"
                  :key="model.id"
                  type="button"
                  class="grid gap-1 rounded-[1rem] border p-3 text-left transition"
                  :class="
                    model.id === selectedGeneratedPrintModel.id
                      ? 'border-[var(--ui-accent)] bg-[rgba(255,255,255,0.06)]'
                      : 'border-[var(--ui-border)] bg-[rgba(255,255,255,0.02)]'
                  "
                  @click="selectGeneratedPrintModel(model.id)"
                >
                  <strong class="font-mono text-sm">{{ formatRedeemCode(model.shortCode) }}</strong>
                  <span class="text-xs text-[var(--ui-fg-muted)]">{{ model.packName }}</span>
                  <span class="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">{{ model.subtitle }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="exportFailures.length" class="space-y-2 rounded-[1rem] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger-muted)]/30 p-3">
            <h4 class="m-0 text-sm font-semibold">Export issues</h4>
            <ul class="m-0 list-disc space-y-1 pl-5 text-xs text-[var(--ui-fg-muted)]">
              <li v-for="failure in exportFailures" :key="failure.id">
                {{ failure.filename }} · {{ failure.message }}
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <Card variant="subtle" padding="sm" class="space-y-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              Issued codes
            </p>
            <h2 class="m-0 text-xl font-semibold">Recent designated codes</h2>
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Track which codes are unused, claimed, or revoked. Redeem links always point to the player app.
            </p>
          </div>
          <Button size="sm" variant="plain-secondary" :disabled="loadingIssuedCodes" @click="loadIssuedCodes">
            {{ loadingIssuedCodes ? "Refreshing…" : "Refresh codes" }}
          </Button>
        </div>

        <label class="grid gap-2 md:max-w-xl">
          <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Revoke reason</span>
          <input
            v-model="revokeReason"
            type="text"
            placeholder="lost batch / leak / test cleanup"
            class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          />
        </label>

        <div v-if="issuedCodes.length" class="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <div class="grid gap-3">
            <button
              v-for="entry in issuedCodes"
              :key="entry.codeId"
              type="button"
              class="grid gap-2 rounded-[1.2rem] border p-4 text-left transition"
              :class="selectedIssuedCodeId === entry.codeId ? 'border-[var(--ui-accent)] bg-[rgba(255,255,255,0.05)]' : 'border-[var(--ui-border)] bg-[rgba(255,255,255,0.02)]'"
              @click="selectedIssuedCodeId = entry.codeId"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <strong class="font-mono text-sm">{{ formatRedeemCode(entry.codeId) }}</strong>
                  <Badge
                    :tone="entry.status === 'claimed' ? 'success' : entry.status === 'revoked' ? 'warning' : 'accent'"
                    variant="soft"
                  >
                    {{ entry.status }}
                  </Badge>
                </div>
                <span class="text-xs text-[var(--ui-fg-muted)]">{{ entry.issuedAt ? new Date(entry.issuedAt).toLocaleString() : "" }}</span>
              </div>
              <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                {{ entry.collectionId }} / {{ entry.collectionVersion }}<span v-if="entry.dropId"> · {{ entry.dropId }}</span>
              </p>
            </button>
          </div>

          <div v-if="selectedIssuedCode" class="space-y-4 rounded-[1.2rem] border border-[var(--ui-border)] bg-[rgba(255,255,255,0.03)] p-4">
            <div class="space-y-1">
              <p class="m-0 text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Selected redeem code</p>
              <h3 class="m-0 text-lg font-semibold">{{ formatRedeemCode(selectedIssuedCode.codeId) }}</h3>
            </div>

            <label class="grid gap-2">
              <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Redeem link</span>
              <input
                readonly
                :value="selectedIssuedCode.redeemUrl || ''"
                class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 font-mono text-xs text-[var(--ui-fg)]"
              />
            </label>

            <div class="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" @click="copyText(selectedIssuedCode.codeId, 'code')">
                Copy redeem code
              </Button>
              <Button size="sm" variant="plain-secondary" @click="copyText(selectedIssuedCode.redeemUrl || '', 'link')">
                Copy redeem link
              </Button>
              <Button
                size="sm"
                variant="plain-secondary"
                :disabled="revokeBusyCodeId === selectedIssuedCode.codeId || selectedIssuedCode.status === 'revoked'"
                @click="revokeIssuedCode(selectedIssuedCode.codeId)"
              >
                {{ revokeBusyCodeId === selectedIssuedCode.codeId ? "Revoking…" : selectedIssuedCode.status === "revoked" ? "Already revoked" : "Revoke code" }}
              </Button>
            </div>

            <p v-if="selectedIssuedCode.claimedAt" class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Claimed {{ new Date(selectedIssuedCode.claimedAt).toLocaleString() }}
            </p>
            <p v-if="selectedIssuedCode.revokedAt" class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Revoked {{ new Date(selectedIssuedCode.revokedAt).toLocaleString() }}<span v-if="selectedIssuedCode.revokedReason"> · {{ selectedIssuedCode.revokedReason }}</span>
            </p>
          </div>
        </div>

        <p v-else class="m-0 text-sm text-[var(--ui-fg-muted)]">
          No designated codes found for this collection and drop yet.
        </p>
      </Card>

      <div class="grid gap-6 lg:grid-cols-3">
        <Card variant="subtle" padding="sm">
          <h2 class="m-0 text-sm font-semibold">Invariants</h2>
          <ul class="mt-3 list-disc pl-5 text-xs text-[var(--ui-fg-muted)]">
            <li v-for="item in meta?.invariants || []" :key="item">{{ item }}</li>
          </ul>
        </Card>

        <Card variant="subtle" padding="sm" class="space-y-3">
          <h2 class="m-0 text-sm font-semibold">Deterministic issue</h2>
          <label class="grid gap-2">
            <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">Claimant public key</span>
            <textarea
              v-model="claimantPublicKey"
              rows="3"
              placeholder="Paste the Pixbook identity public key"
              class="rounded-[1.15rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-xs text-[var(--ui-fg)]"
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" :disabled="loading" @click="previewDeterministic">
              Preview deterministic
            </Button>
            <Button size="sm" variant="plain-secondary" :disabled="loading" @click="issueDeterministic">
              Issue deterministic
            </Button>
          </div>
        </Card>

        <Card variant="subtle" padding="sm" class="space-y-3">
          <h2 class="m-0 text-sm font-semibold">Verification</h2>
          <pre class="overflow-auto rounded-[1rem] bg-[rgba(12,12,18,0.48)] p-3 text-xs text-[var(--ui-fg-muted)]">{{ JSON.stringify(latestVerification, null, 2) }}</pre>
        </Card>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <Card variant="subtle" padding="sm">
          <h2 class="m-0 text-sm font-semibold">Preview</h2>
          <pre class="mt-3 overflow-auto rounded-[1rem] bg-[rgba(12,12,18,0.48)] p-3 text-xs text-[var(--ui-fg-muted)]">{{ JSON.stringify(latestPreview, null, 2) }}</pre>
        </Card>

        <Card variant="subtle" padding="sm">
          <h2 class="m-0 text-sm font-semibold">Latest artifact</h2>
          <pre class="mt-3 overflow-auto rounded-[1rem] bg-[rgba(12,12,18,0.48)] p-3 text-xs text-[var(--ui-fg-muted)]">{{ JSON.stringify(latestArtifact, null, 2) }}</pre>
        </Card>
      </div>
    </template>
  </section>

  <div class="pointer-events-none fixed left-[-99999px] top-0">
    <div
      v-for="model in generatedPrintModels"
      :key="`export-${model.id}`"
      :ref="(node) => setExportRenderNode(model.id, node)"
    >
      <PackPrintCard :model="model" />
    </div>
  </div>
</template>
