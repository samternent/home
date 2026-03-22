<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Badge, Button, Card, Tabs } from "ternent-ui/primitives";
import type { PixbookOwnedCardInstance, PixbookReplayState } from "@ternent/pixpax-core";
import {
  acceptSwapOfferRecord,
  completeSwapOfferRecord,
  createSwapOfferRecord,
  createSwapRecipientQr,
  listIncomingSwapOffers,
  listOutgoingSwapOffers,
  type PixpaxPublicCollectionBundle,
  type PixpaxSwapOfferRecord,
} from "@/modules/api/client";
import { useIdentitySession } from "@/modules/identity";
import { usePixbookSession } from "@/modules/pixbook/usePixbookSession";
import {
  createSwapRecipientPayload,
  parseSwapRecipientPayload,
} from "@/modules/swaps/swap-share";
import StickerCard from "./StickerCard.vue";

type SwapBarcode = {
  rawValue?: string | null;
};

type SwapBarcodeDetector = {
  detect(source: HTMLVideoElement): Promise<SwapBarcode[]>;
};

type SwapBarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => SwapBarcodeDetector;

const props = withDefaults(
  defineProps<{
    bundle: PixpaxPublicCollectionBundle;
    replayState: PixbookReplayState;
    highlightedCardIds?: string[];
    compactHeader?: boolean;
  }>(),
  {
    highlightedCardIds: () => [],
    compactHeader: false,
  },
);

const activeTab = ref("book");
const pixbook = usePixbookSession();
const identities = useIdentitySession();
const selectedSwapCardId = ref("");
const recipientPublicKey = ref("");
const copiedKey = ref("");
const recipientQrSvg = ref("");
const recipientQrBusy = ref(false);
const recipientQrError = ref("");
const offerBusy = ref(false);
const receiveBusy = ref(false);
const completeBusy = ref(false);
const scanBusy = ref(false);
const scanError = ref("");
const scannerOpen = ref(false);
const swapRefreshBusy = ref(false);
const swapRefreshError = ref("");
const incomingOffers = ref<PixpaxSwapOfferRecord[]>([]);
const outgoingOffers = ref<PixpaxSwapOfferRecord[]>([]);
const activeReceiveTransferId = ref("");
const activeCompleteTransferId = ref("");
const offerMessage = ref("");
const receiveMessage = ref("");
const completeMessage = ref("");
const offerError = ref("");
const receiveError = ref("");
const completeError = ref("");
const scannerVideo = ref<HTMLVideoElement | null>(null);
let scanAnimationFrame = 0;
let scanSession = 0;
let scanStream: MediaStream | null = null;

const collectionKey = computed(
  () => `${props.bundle.collectionId}::${props.bundle.resolvedVersion}`,
);
const completion = computed(
  () =>
    props.replayState.completionByCollectionKey[collectionKey.value] || {
      totalCards: props.bundle.cards.length,
      ownedUniqueCards: 0,
      progressPercent: 0,
      complete: false,
    },
);
const ownedCardIds = computed(() => {
  const owned = new Set<string>();
  for (const item of Object.values(props.replayState.ownedCardInstancesById)) {
    if (
      item.collectionId === props.bundle.collectionId &&
      item.collectionVersion === props.bundle.resolvedVersion
    ) {
      owned.add(item.cardId);
    }
  }
  return owned;
});
const duplicateGroups = computed(() =>
  props.bundle.cards
    .map((card) => ({
      card,
      quantity: props.replayState.spareCountsByCardId[card.cardId] || 0,
    }))
    .filter((entry) => entry.quantity > 0),
);
const spareInstancesByCardId = computed(() => {
  const byCardId = new Map<string, PixbookOwnedCardInstance[]>();
  for (const instance of Object.values(props.replayState.ownedCardInstancesById)) {
    if (
      instance.collectionId !== props.bundle.collectionId ||
      instance.collectionVersion !== props.bundle.resolvedVersion
    ) {
      continue;
    }
    const current = byCardId.get(instance.cardId) || [];
    current.push(instance);
    byCardId.set(instance.cardId, current);
  }

  for (const current of byCardId.values()) {
    current.sort((left, right) => {
      const claimCompare = left.claimEntryId.localeCompare(right.claimEntryId);
      if (claimCompare !== 0) {
        return claimCompare;
      }
      if (left.slotIndex !== right.slotIndex) {
        return left.slotIndex - right.slotIndex;
      }
      return left.cardInstanceId.localeCompare(right.cardInstanceId);
    });
  }

  return new Map(
    Array.from(byCardId.entries()).map(([cardId, instances]) => [cardId, instances.slice(1)]),
  );
});
const swapGroups = computed(() =>
  duplicateGroups.value.map((entry) => ({
    ...entry,
    spareInstance: spareInstancesByCardId.value.get(entry.card.cardId)?.[0] || null,
    title:
      String(entry.card.title || entry.card.name || entry.card.label || "").trim() ||
      entry.card.cardId,
  })),
);
const groupedSeries = computed(() => {
  const bySeries = new Map<string, typeof props.bundle.cards>();
  for (const card of props.bundle.cards) {
    const key = String(card.seriesId || "unassigned");
    const current = bySeries.get(key) || [];
    current.push(card);
    bySeries.set(key, current);
  }
  return Array.from(bySeries.entries()).map(([seriesId, cards]) => {
    const progressKey = `${collectionKey.value}::${seriesId}`;
    const progress = props.replayState.completionBySeriesKey[progressKey] || {
      seriesId,
      totalCards: cards.length,
      ownedUniqueCards: cards.filter((card) => ownedCardIds.value.has(card.cardId)).length,
      progressPercent: 0,
      complete: false,
    };
    return {
      seriesId,
      cards,
      progress,
      completeLabel: progress.complete ? "Series complete" : "",
    };
  });
});
const tabs = computed(() => [
  {
    value: "book",
    label: "Pixbook",
  },
  {
    value: "swaps",
    label: "Swaps",
  },
]);
const issuerName = computed(() => "PixPax");
const currentPublicKey = computed(
  () => identities.identity.value?.serializedIdentity.publicKey || "",
);
const recipientSharePayload = computed(() => {
  try {
    return createSwapRecipientPayload(currentPublicKey.value);
  } catch {
    return "";
  }
});
const transferCount = computed(() => ({
  outgoing: props.replayState.transferHistory.outgoing.length,
  incoming: props.replayState.transferHistory.incoming.length,
}));
const localTransfersByTransferId = computed(() => {
  const next = new Map<
    string,
    PixbookReplayState["transfersByEntryId"][string]
  >();
  for (const transfer of Object.values(props.replayState.transfersByEntryId)) {
    next.set(transfer.transferId, transfer);
  }
  return next;
});
const selectedSwapGroup = computed(
  () => swapGroups.value.find((entry) => entry.card.cardId === selectedSwapCardId.value) || null,
);
const cardById = computed(() => {
  const next = new Map<string, PixpaxPublicCollectionBundle["cards"][number]>();
  for (const card of props.bundle.cards) {
    next.set(card.cardId, card);
  }
  return next;
});
const scannerSupported = computed(
  () =>
    typeof window !== "undefined" &&
    Boolean((window as { BarcodeDetector?: unknown }).BarcodeDetector) &&
    Boolean(navigator.mediaDevices?.getUserMedia),
);

function resolveSwapTitle(cardId: string) {
  const card = cardById.value.get(cardId);
  return (
    String(card?.title || card?.name || card?.label || "").trim() ||
    String(cardId || "").trim()
  );
}

function hasLocalTransfer(transferId: string) {
  return localTransfersByTransferId.value.has(String(transferId || "").trim());
}

function resetOfferFeedback() {
  offerMessage.value = "";
  offerError.value = "";
}

function resetReceiveFeedback() {
  receiveMessage.value = "";
  receiveError.value = "";
}

function resetCompleteFeedback() {
  completeMessage.value = "";
  completeError.value = "";
}

function selectSwapCard(cardId: string) {
  selectedSwapCardId.value = cardId;
  resetOfferFeedback();
}

async function copyText(value: string, key: string) {
  const text = String(value || "").trim();
  if (!text || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return;
  }
  await navigator.clipboard.writeText(text);
  copiedKey.value = key;
  window.setTimeout(() => {
    if (copiedKey.value === key) {
      copiedKey.value = "";
    }
  }, 1500);
}

function stopScannerStream() {
  scanSession += 1;
  if (scanAnimationFrame) {
    window.cancelAnimationFrame(scanAnimationFrame);
    scanAnimationFrame = 0;
  }
  if (scanStream) {
    for (const track of scanStream.getTracks()) {
      track.stop();
    }
    scanStream = null;
  }
  const video = scannerVideo.value;
  if (video) {
    video.pause();
    video.srcObject = null;
  }
  scanBusy.value = false;
}

function closeScanner() {
  stopScannerStream();
  scannerOpen.value = false;
}

async function refreshRecipientQr() {
  const payload = recipientSharePayload.value;
  recipientQrError.value = "";
  if (!payload) {
    recipientQrSvg.value = "";
    return;
  }
  recipientQrBusy.value = true;
  try {
    recipientQrSvg.value = await createSwapRecipientQr(payload);
  } catch (error) {
    recipientQrSvg.value = "";
    recipientQrError.value =
      error instanceof Error ? error.message : "Unable to generate recipient QR.";
  } finally {
    recipientQrBusy.value = false;
  }
}

async function applyScannedRecipient(rawValue: string) {
  const publicKey = parseSwapRecipientPayload(rawValue);
  recipientPublicKey.value = publicKey;
  scannerOpen.value = false;
  stopScannerStream();
  scanError.value = "";
}

async function openScanner() {
  scanError.value = "";
  if (!scannerSupported.value) {
    scanError.value = "QR scanning is not available on this browser.";
    return;
  }

  const BarcodeDetectorCtor = (window as { BarcodeDetector?: SwapBarcodeDetectorCtor })
    .BarcodeDetector;
  if (!BarcodeDetectorCtor) {
    scanError.value = "QR scanning is not available on this browser.";
    return;
  }

  try {
    scannerOpen.value = true;
    await nextTick();
    const video = scannerVideo.value;
    if (!video) {
      throw new Error("Camera view is not ready.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
      },
      audio: false,
    });
    scanStream = stream;
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play();

    const detector = new BarcodeDetectorCtor({
      formats: ["qr_code"],
    });
    const session = ++scanSession;
    scanBusy.value = true;

    const tick = async () => {
      if (session !== scanSession) {
        return;
      }
      try {
        if (!scannerVideo.value || scannerVideo.value.readyState < 2) {
          scanAnimationFrame = window.requestAnimationFrame(() => {
            void tick();
          });
          return;
        }
        const codes = await detector.detect(scannerVideo.value);
        const rawValue = String(codes[0]?.rawValue || "").trim();
        if (rawValue) {
          await applyScannedRecipient(rawValue);
          return;
        }
      } catch (error) {
        scanError.value =
          error instanceof Error ? error.message : "Unable to scan this QR code.";
      }
      scanAnimationFrame = window.requestAnimationFrame(() => {
        void tick();
      });
    };

    void tick();
  } catch (error) {
    closeScanner();
    scanError.value = error instanceof Error ? error.message : "Unable to start camera scan.";
  }
}

async function createSwapOffer() {
  resetOfferFeedback();
  const selected = selectedSwapGroup.value;
  if (!selected?.spareInstance) {
    offerError.value = "Pick a spare card first.";
    return;
  }
  if (!String(recipientPublicKey.value || "").trim()) {
    offerError.value = "Enter the receiver's Pixbook public key.";
    return;
  }

  offerBusy.value = true;
  try {
    const recipientKey = parseSwapRecipientPayload(recipientPublicKey.value);
    recipientPublicKey.value = recipientKey;
    if (recipientKey === currentPublicKey.value) {
      throw new Error("Receiver key must belong to a different Pixbook.");
    }
    const artifact = await pixbook.createTransferOffer({
      cardInstanceId: selected.spareInstance.cardInstanceId,
      recipientPublicKey: recipientKey,
    });
    await createSwapOfferRecord(artifact);
    await refreshSwapOffers();
    offerMessage.value = `Offer sent for ${selected.title}. The receiver can accept it now.`;
  } catch (error) {
    offerError.value = error instanceof Error ? error.message : "Unable to create swap offer.";
  } finally {
    offerBusy.value = false;
  }
}

async function acceptIncomingSwap(record: PixpaxSwapOfferRecord) {
  resetReceiveFeedback();
  activeReceiveTransferId.value = record.transferId;
  receiveBusy.value = true;
  try {
    const existingTransfer = localTransfersByTransferId.value.get(record.transferId);
    const acceptanceArtifact = existingTransfer?.acceptanceArtifact || record.acceptanceArtifact;
    if (!existingTransfer && acceptanceArtifact) {
      await pixbook.recordTransfer({
        offerArtifact: record.offerArtifact,
        acceptanceArtifact,
      });
    }
    const nextAcceptanceArtifact =
      acceptanceArtifact ||
      (await pixbook.acceptTransferOffer({
        offerArtifact: record.offerArtifact,
      }));
    if (record.status !== "accepted" && record.status !== "completed") {
      await acceptSwapOfferRecord({
        transferId: record.transferId,
        offerArtifact: record.offerArtifact,
        acceptanceArtifact: nextAcceptanceArtifact,
      });
    }
    await refreshSwapOffers();
    receiveMessage.value = `${resolveSwapTitle(record.cardId)} was accepted and added to this Pixbook.`;
  } catch (error) {
    receiveError.value = error instanceof Error ? error.message : "Unable to accept swap offer.";
  } finally {
    receiveBusy.value = false;
    activeReceiveTransferId.value = "";
  }
}

async function completeOutgoingSwap(record: PixpaxSwapOfferRecord) {
  resetCompleteFeedback();
  activeCompleteTransferId.value = record.transferId;
  completeBusy.value = true;
  try {
    if (!record.acceptanceArtifact) {
      throw new Error("This swap is still waiting for the receiver to accept.");
    }
    const existingTransfer = localTransfersByTransferId.value.get(record.transferId);
    if (!existingTransfer) {
      await pixbook.recordTransfer({
        offerArtifact: record.offerArtifact,
        acceptanceArtifact: record.acceptanceArtifact,
      });
    }
    await completeSwapOfferRecord({
      transferId: record.transferId,
      offerArtifact: record.offerArtifact,
    });
    await refreshSwapOffers();
    completeMessage.value = `${resolveSwapTitle(record.cardId)} has now moved out of this Pixbook.`;
  } catch (error) {
    completeError.value =
      error instanceof Error ? error.message : "Unable to complete sent swap.";
  } finally {
    completeBusy.value = false;
    activeCompleteTransferId.value = "";
  }
}

async function refreshSwapOffers() {
  const publicKey = currentPublicKey.value;
  swapRefreshError.value = "";
  if (!publicKey) {
    incomingOffers.value = [];
    outgoingOffers.value = [];
    return;
  }

  swapRefreshBusy.value = true;
  try {
    const [incoming, outgoing] = await Promise.all([
      listIncomingSwapOffers(publicKey),
      listOutgoingSwapOffers(publicKey),
    ]);
    incomingOffers.value = incoming;
    outgoingOffers.value = outgoing;
  } catch (error) {
    swapRefreshError.value =
      error instanceof Error ? error.message : "Unable to refresh swaps.";
  } finally {
    swapRefreshBusy.value = false;
  }
}

watch(
  recipientSharePayload,
  () => {
    void refreshRecipientQr();
  },
  { immediate: true },
);

watch(
  currentPublicKey,
  () => {
    void refreshSwapOffers();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopScannerStream();
});
</script>

<template>
  <section class="space-y-6">
    <header
      class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
      :class="props.compactHeader ? 'mb-1' : ''"
    >
      <div class="space-y-3">
        <p
          class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]"
          :class="props.compactHeader ? 'hidden' : ''"
        >
          Issued by {{ issuerName }}
        </p>
        <h1
          class="m-0 font-mono uppercase tracking-[-0.08em] text-[clamp(2.6rem,7vw,5.4rem)] leading-[0.9] text-[var(--ui-fg)]"
          :class="props.compactHeader ? 'text-[clamp(2rem,5vw,3.4rem)]' : ''"
        >
          {{ props.bundle.collection?.name || props.bundle.collectionId }}
        </h1>
        <div class="space-y-2">
          <div class="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)] ring-1 ring-[rgba(255,255,255,0.14)]">
            <div
              class="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--ui-fg)_92%,transparent),color-mix(in_srgb,var(--ui-primary)_58%,transparent))] transition-[width] duration-500"
              :style="{ width: `${completion.progressPercent}%` }"
            />
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs text-[var(--ui-fg-muted)]">
            <span>{{ completion.ownedUniqueCards }} / {{ completion.totalCards }} collected</span>
            <span v-if="completion.complete" class="rounded-full border border-[var(--ui-border)] px-2 py-0.5 uppercase tracking-[0.18em]">
              Completed
            </span>
          </div>
        </div>
      </div>

      <div />
    </header>

    <div
      class="flex justify-center"
      :class="props.compactHeader ? '-mt-1 pb-1' : 'pt-1'"
    >
      <div class="w-[10.5rem]" :class="props.compactHeader ? 'opacity-80' : ''">
        <Tabs v-model="activeTab" :items="tabs" variant="pill" size="sm" />
      </div>
    </div>

    <template v-if="activeTab === 'book'">
      <section
        v-for="group in groupedSeries"
        :key="group.seriesId"
        class="series-section space-y-7"
      >
        <div class="series-header mx-auto flex max-w-5xl flex-col items-center gap-3 py-2 text-center">
          <div class="series-rule" />
          <div>
            <p class="m-0 text-sm font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              {{ group.seriesId }}
            </p>
            <p class="m-0 text-[10px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">
              {{ group.progress.ownedUniqueCards }}/{{ group.progress.totalCards }}
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <Badge
              v-if="group.completeLabel"
              tone="success"
              variant="soft"
              class="!font-mono !text-[10px] !uppercase !tracking-[0.16em]"
            >
              {{ group.completeLabel }}
            </Badge>
            <div class="h-1 w-28 overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)] ring-1 ring-[rgba(255,255,255,0.14)]">
              <div
                class="h-full rounded-full bg-[var(--ui-fg)]/85"
                :style="{ width: `${group.progress.progressPercent}%` }"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap justify-center gap-x-6 gap-y-8">
          <StickerCard
            v-for="card in group.cards"
            :key="card.cardId"
            :bundle="props.bundle"
            :card="card"
            :missing="!ownedCardIds.has(card.cardId)"
            :highlighted="props.highlightedCardIds.includes(card.cardId)"
          />
        </div>
      </section>
    </template>

    <section v-else class="space-y-5">
      <Card variant="showcase" padding="sm" class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <h3 class="m-0 text-2xl font-semibold">Swaps</h3>
            <p class="m-0 max-w-2xl text-sm text-[var(--ui-fg-muted)]">
              Spare copies can move from one Pixbook to another. The sender signs an offer, the
              receiver signs acceptance, and both sides keep the finished record.
            </p>
          </div>
          <div class="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">
            <span class="rounded-full border border-[var(--ui-border)] px-3 py-1">
              {{ duplicateGroups.length }} spare groups
            </span>
            <span class="rounded-full border border-[var(--ui-border)] px-3 py-1">
              {{ transferCount.outgoing }} sent
            </span>
            <span class="rounded-full border border-[var(--ui-border)] px-3 py-1">
              {{ transferCount.incoming }} received
            </span>
          </div>
        </div>
      </Card>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Card variant="showcase" padding="sm" class="space-y-4">
          <div class="space-y-1">
            <p class="m-0 text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">
              Offer a spare
            </p>
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Choose one spare copy, then scan or paste the receiver key before sending the offer.
            </p>
          </div>

          <div
            v-if="swapGroups.length"
            class="flex flex-wrap justify-center gap-x-6 gap-y-8"
          >
            <div
              v-for="entry in swapGroups"
              :key="entry.card.cardId"
              class="flex flex-col items-center gap-3"
            >
              <StickerCard
                :bundle="props.bundle"
                :card="entry.card"
                :quantity="entry.quantity"
              />
              <Button
                size="sm"
                :variant="selectedSwapCardId === entry.card.cardId ? 'accent' : 'secondary'"
                class="!font-mono !uppercase !tracking-[0.16em]"
                @click="selectSwapCard(entry.card.cardId)"
              >
                {{ selectedSwapCardId === entry.card.cardId ? "Selected" : "Use this copy" }}
              </Button>
            </div>
          </div>

          <p v-else class="m-0 text-sm text-[var(--ui-fg-muted)]">
            No duplicates yet. Open more packs before offering a swap.
          </p>

          <div v-if="selectedSwapGroup" class="space-y-4 border-t border-[var(--ui-border)] pt-4">
            <div class="space-y-1">
              <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">
                Offering {{ selectedSwapGroup.title }}
              </p>
              <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                This uses one spare copy from your current Pixbook.
              </p>
            </div>

            <label class="grid gap-2">
              <span class="text-sm font-medium">Receiver public key</span>
              <input
                v-model="recipientPublicKey"
                type="text"
                autocomplete="off"
                spellcheck="false"
                placeholder="Scan or paste the receiver's Pixbook key"
                class="min-w-0 rounded-[1.2rem] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] bg-[rgba(14,14,18,0.4)] px-4 py-3 text-sm text-[var(--ui-fg)] outline-none transition focus:border-[var(--ui-primary)]"
              />
            </label>

            <div class="flex flex-wrap gap-2">
              <Button
                v-if="scannerSupported"
                size="sm"
                variant="plain-secondary"
                @click="scannerOpen ? closeScanner() : openScanner()"
              >
                {{ scannerOpen ? "Close scanner" : "Scan receiver QR" }}
              </Button>
              <Button
                size="sm"
                variant="accent"
                class="!font-mono !uppercase !tracking-[0.16em]"
                :disabled="offerBusy"
                @click="createSwapOffer()"
              >
                {{ offerBusy ? "Signing…" : "Create offer" }}
              </Button>
            </div>

            <div v-if="scannerOpen" class="space-y-3 rounded-[1.4rem] border border-[var(--ui-border)] bg-[var(--ui-bg)]/80 p-3">
              <video
                ref="scannerVideo"
                class="aspect-square w-full rounded-[1rem] bg-black object-cover"
                muted
              />
              <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                Point the camera at the receiver’s Pixbook QR.
              </p>
            </div>

            <p v-if="offerMessage" class="m-0 text-sm text-[var(--ui-fg-muted)]">
              {{ offerMessage }}
            </p>
            <p v-if="offerError" class="m-0 text-sm text-[var(--ui-danger)]">
              {{ offerError }}
            </p>
            <p v-if="scanError" class="m-0 text-sm text-[var(--ui-danger)]">
              {{ scanError }}
            </p>
          </div>
        </Card>

        <Card variant="subtle" padding="sm" class="space-y-4">
          <div class="space-y-1">
            <p class="m-0 text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">
              Receive a swap
            </p>
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Show this QR to the sender, or share the same key as text.
            </p>
          </div>

          <div class="rounded-[1.6rem] border border-[var(--ui-border)] bg-[var(--ui-bg)]/80 p-4">
            <div
              v-if="recipientQrSvg"
              class="mx-auto aspect-square w-full max-w-[16rem] overflow-hidden rounded-[1.2rem] bg-white p-3 text-black"
              v-html="recipientQrSvg"
            />
            <div
              v-else
              class="mx-auto flex aspect-square w-full max-w-[16rem] items-center justify-center rounded-[1.2rem] border border-dashed border-[var(--ui-border)] text-sm text-[var(--ui-fg-muted)]"
            >
              {{ recipientQrBusy ? "Generating QR…" : "QR unavailable" }}
            </div>
          </div>

          <label class="grid gap-2">
            <span class="text-sm font-medium">Your Pixbook public key</span>
            <textarea
              readonly
              :value="currentPublicKey"
              rows="4"
              class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-xs text-[var(--ui-fg)]"
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <Button size="sm" variant="plain-secondary" @click="copyText(currentPublicKey, 'key')">
              {{ copiedKey === "key" ? "Copied" : "Copy key" }}
            </Button>
            <Button
              v-if="recipientSharePayload"
              size="sm"
              variant="plain-secondary"
              @click="copyText(recipientSharePayload, 'recipient-share')"
            >
              {{ copiedKey === "recipient-share" ? "Copied" : "Copy QR text" }}
            </Button>
          </div>

          <p v-if="recipientQrError" class="m-0 text-sm text-[var(--ui-danger)]">
            {{ recipientQrError }}
          </p>

          <div class="space-y-3 border-t border-[var(--ui-border)] pt-4">
            <div class="flex items-center justify-between gap-3">
              <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">Incoming offers</p>
              <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                {{ swapRefreshBusy ? "Refreshing…" : `${incomingOffers.length} waiting` }}
              </p>
            </div>

            <div v-if="incomingOffers.length" class="space-y-3">
              <div
                v-for="offer in incomingOffers"
                :key="offer.transferId"
                class="rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-bg)]/80 p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="space-y-1">
                    <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">
                      {{ resolveSwapTitle(offer.cardId) }}
                    </p>
                    <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                      From another Pixbook
                    </p>
                  </div>
                  <Badge
                    variant="soft"
                    :tone="offer.status === 'accepted' ? 'info' : offer.status === 'completed' ? 'success' : 'neutral'"
                    class="!text-[10px] !uppercase !tracking-[0.16em]"
                  >
                    {{ offer.status }}
                  </Badge>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    :disabled="receiveBusy || (offer.status === 'completed' && hasLocalTransfer(offer.transferId))"
                    @click="acceptIncomingSwap(offer)"
                  >
                    {{
                      activeReceiveTransferId === offer.transferId && receiveBusy
                        ? "Accepting…"
                        : offer.status === "accepted"
                          ? "Confirm accepted"
                          : offer.status === "completed"
                            ? hasLocalTransfer(offer.transferId)
                              ? "Completed"
                              : "Restore locally"
                            : "Accept swap"
                    }}
                  </Button>
                </div>
              </div>
            </div>

            <p v-else class="m-0 text-sm text-[var(--ui-fg-muted)]">
              No incoming offers yet.
            </p>
          </div>

          <p v-if="receiveMessage" class="m-0 text-sm text-[var(--ui-fg-muted)]">
            {{ receiveMessage }}
          </p>
          <p v-if="receiveError" class="m-0 text-sm text-[var(--ui-danger)]">
            {{ receiveError }}
          </p>
        </Card>

        <Card variant="subtle" padding="sm" class="space-y-4">
          <div class="space-y-1">
            <p class="m-0 text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">
              Finish a sent swap
            </p>
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Once the receiver accepts, finish the transfer here to move the card out.
            </p>
          </div>

          <div class="space-y-3">
            <div
              v-for="offer in outgoingOffers"
              :key="offer.transferId"
              class="rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-bg)]/80 p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-1">
                  <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">
                    {{ resolveSwapTitle(offer.cardId) }}
                  </p>
                  <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                    {{
                      offer.status === "offered"
                        ? "Waiting for the receiver"
                        : offer.status === "accepted"
                          ? "Receiver accepted"
                          : "Transfer completed"
                    }}
                  </p>
                </div>
                <Badge
                  variant="soft"
                  :tone="offer.status === 'accepted' ? 'info' : offer.status === 'completed' ? 'success' : 'neutral'"
                  class="!text-[10px] !uppercase !tracking-[0.16em]"
                >
                  {{ offer.status }}
                </Badge>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  :disabled="completeBusy || offer.status === 'offered' || (offer.status === 'completed' && hasLocalTransfer(offer.transferId))"
                  @click="completeOutgoingSwap(offer)"
                >
                  {{
                    activeCompleteTransferId === offer.transferId && completeBusy
                      ? "Recording…"
                      : offer.status === "accepted"
                        ? "Complete swap"
                        : offer.status === "completed"
                          ? hasLocalTransfer(offer.transferId)
                            ? "Completed"
                            : "Finish locally"
                          : "Waiting"
                  }}
                </Button>
              </div>
            </div>

            <p v-if="!outgoingOffers.length" class="m-0 text-sm text-[var(--ui-fg-muted)]">
              No sent swaps yet.
            </p>
          </div>

          <p v-if="completeMessage" class="m-0 text-sm text-[var(--ui-fg-muted)]">
            {{ completeMessage }}
          </p>
          <p v-if="completeError" class="m-0 text-sm text-[var(--ui-danger)]">
            {{ completeError }}
          </p>
          <p v-if="swapRefreshError" class="m-0 text-sm text-[var(--ui-danger)]">
            {{ swapRefreshError }}
          </p>
        </Card>
      </div>
    </section>
  </section>
</template>

<style scoped>
.series-header {
  position: relative;
}

.series-rule {
  width: min(100%, 22rem);
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.22) 20%,
    rgba(255, 255, 255, 0.38) 50%,
    rgba(255, 255, 255, 0.22) 80%,
    transparent 100%
  );
}
</style>
