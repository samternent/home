<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Button, Card } from "ternent-ui/primitives";
import { usePixbookSession } from "@/modules/pixbook/usePixbookSession";
import { usePendingRedeems } from "@/modules/redeem/usePendingRedeems";
import { useRedeemComposer } from "@/modules/redeem/useRedeemComposer";
import { formatRedeemCode, normalizeRedeemCode } from "@/modules/redeem/code-format";
import { usePixpaxCollections } from "@/modules/collections/usePixpaxCollections";
import { useOfflineSync } from "@/modules/offline";
import StickerbookCollectionScene from "@/modules/stickerbook/components/StickerbookCollectionScene.vue";

type RedeemBarcode = {
  rawValue?: string | null;
};

type RedeemBarcodeDetector = {
  detect(source: HTMLVideoElement): Promise<RedeemBarcode[]>;
};

type RedeemBarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => RedeemBarcodeDetector;

const router = useRouter();
const pixbook = usePixbookSession();
const collections = usePixpaxCollections();
const { addPendingRedeem } = usePendingRedeems();
const redeemComposer = useRedeemComposer();
const { isOnline } = useOfflineSync();
const initializing = ref(true);
const loadingBook = ref(false);
const activeBundle = ref<Awaited<ReturnType<typeof collections.loadBundle>> | null>(null);
const redeemExpanded = ref(false);
const redeemCode = ref("");
const redeemMessage = ref("");
const scanError = ref("");
const scannerOpen = ref(false);
const scannerVideo = ref<HTMLVideoElement | null>(null);
let scanAnimationFrame = 0;
let scanSession = 0;
let scanStream: MediaStream | null = null;

const replayState = computed(() => pixbook.replayState.value);
const claims = computed(() =>
  Object.values(replayState.value.claimedPacksByEntryId).sort((left, right) =>
    String(right.claimedAt).localeCompare(String(left.claimedAt)),
  ),
);
const latestClaim = computed(() => claims.value[0] || null);
const activeCollection = computed(() => {
  if (latestClaim.value) {
    return {
      collectionId: latestClaim.value.artifact.payload.collectionId,
      resolvedVersion: latestClaim.value.artifact.payload.collectionVersion,
    };
  }
  return null;
});
const highlightedCardIds = computed(() =>
  latestClaim.value?.artifact.payload.cards.map((card) => card.cardId) || [],
);
const hasClaimedBook = computed(() => Boolean(activeCollection.value));
const redeemButtonLabel = computed(() =>
  hasClaimedBook.value ? "Redeem another card" : "Enter a redeem code",
);
const scanButtonLabel = computed(() => (scannerOpen.value ? "Close scanner" : "Scan a PixPax card"));
const redeemIntroLabel = computed(() =>
  hasClaimedBook.value ? "Add to this Pixbook" : "Start with a real card",
);
const redeemIntroBody = computed(() =>
  hasClaimedBook.value
    ? "Redeem another printed PixPax card to add it to this Pixbook."
    : "PixPax starts with a printed card. Scan the QR or enter the code to begin this Pixbook.",
);
const scannerSupported = computed(
  () =>
    typeof window !== "undefined" &&
    Boolean((window as { BarcodeDetector?: unknown }).BarcodeDetector) &&
    Boolean(navigator.mediaDevices?.getUserMedia),
);

async function loadActiveBundle() {
  const currentCollection = activeCollection.value;
  if (!currentCollection?.collectionId) {
    activeBundle.value = null;
    return;
  }

  loadingBook.value = true;
  try {
    activeBundle.value = await collections.loadBundle(
      currentCollection.collectionId,
      currentCollection.resolvedVersion,
    );
  } catch {
    activeBundle.value = null;
  } finally {
    loadingBook.value = false;
  }
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
}

function closeScanner() {
  stopScannerStream();
  scannerOpen.value = false;
}

async function beginRedeem(rawValue = redeemCode.value) {
  const normalizedCode = normalizeRedeemCode(rawValue);
  if (!normalizedCode) {
    redeemMessage.value = "Enter a code from a printed PixPax card.";
    return;
  }
  redeemCode.value = normalizedCode;
  if (!isOnline.value) {
    addPendingRedeem(normalizedCode);
    redeemMessage.value = "Saved for later. Connect to the internet to finish the claim.";
    return;
  }
  redeemMessage.value = "";
  redeemComposer.closeComposer();
  closeScanner();
  await router.push({
    path: "/redeem",
    query: {
      code: normalizedCode,
    },
  });
}

async function applyScannedRedeem(rawValue: string) {
  const normalizedCode = normalizeRedeemCode(rawValue);
  if (!normalizedCode) {
    scanError.value = "Unable to scan this QR code.";
    return;
  }
  redeemCode.value = normalizedCode;
  scanError.value = "";
  closeScanner();
  await beginRedeem(normalizedCode);
}

async function openScanner() {
  scanError.value = "";
  if (!scannerSupported.value) {
    scanError.value = "QR scanning is not available on this browser.";
    return;
  }

  const BarcodeDetectorCtor = (window as { BarcodeDetector?: RedeemBarcodeDetectorCtor })
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
          await applyScannedRedeem(rawValue);
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

watch(activeCollection, async () => {
  await loadActiveBundle();
});

watch(
  () => redeemComposer.open.value,
  (value) => {
    redeemExpanded.value = value;
    if (!value) {
      closeScanner();
    }
  },
  { immediate: true },
);

onMounted(async () => {
  initializing.value = true;
  try {
    await pixbook.ensureReady().catch(() => undefined);
    await collections.loadCatalog().catch(() => undefined);
    await loadActiveBundle().catch(() => undefined);
  } finally {
    initializing.value = false;
  }
});

onBeforeUnmount(() => {
  closeScanner();
});
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-14">
    <div
      v-if="initializing"
      class="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 pt-8 text-center"
    >
      <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
        Loading Pixbook
      </p>
      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        Checking your cards and loading this book.
      </p>
    </div>

    <div
      v-else
      class="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 pt-2 text-center"
      :class="hasClaimedBook ? 'max-w-xl' : 'max-w-3xl'"
    >
      <div v-if="!hasClaimedBook" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          {{ redeemIntroLabel }}
        </p>
        <p class="mx-auto my-0 max-w-2xl text-sm text-[var(--ui-fg-muted)] sm:text-base">
          {{ redeemIntroBody }}
        </p>
      </div>

      <div v-else class="space-y-2">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          {{ redeemIntroLabel }}
        </p>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          {{ redeemIntroBody }}
        </p>
      </div>

      <div class="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          v-if="scannerSupported"
          :size="hasClaimedBook ? 'sm' : 'hero'"
          variant="accent"
          :class="hasClaimedBook ? '!font-mono !uppercase !tracking-[0.16em]' : '!w-full !font-mono'"
          @click="scannerOpen ? closeScanner() : openScanner()"
        >
          {{ scanButtonLabel }}
        </Button>
        <Button
          :size="hasClaimedBook ? 'sm' : 'hero'"
          :variant="scannerSupported ? 'secondary' : 'accent'"
          :class="hasClaimedBook ? '!font-mono !uppercase !tracking-[0.16em]' : '!w-full !font-mono'"
          @click="redeemExpanded ? redeemComposer.closeComposer() : redeemComposer.openComposer()"
        >
          {{ redeemButtonLabel }}
        </Button>
      </div>

      <div
        v-if="scannerOpen"
        class="w-full max-w-2xl space-y-3 border-t border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] pt-4"
      >
        <video
          ref="scannerVideo"
          class="aspect-square w-full rounded-[1.4rem] bg-black object-cover shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
          muted
        />
        <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
          Point the camera at a PixPax redeem QR.
        </p>
      </div>
      <p
        v-if="scanError && !redeemExpanded"
        class="m-0 w-full max-w-2xl text-left text-sm text-[var(--ui-danger)]"
      >
        {{ scanError }}
      </p>

      <div
        v-if="redeemExpanded"
        class="w-full max-w-2xl space-y-4 border-t border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] pt-4 text-left"
      >
        <form class="space-y-4" @submit.prevent="beginRedeem()">
          <label class="grid gap-3">
            <span class="text-[11px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">
              Redeem code
            </span>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                :value="formatRedeemCode(redeemCode)"
                @input="redeemCode = String(($event.target as HTMLInputElement)?.value || '')"
                type="text"
                autocomplete="off"
                spellcheck="false"
                placeholder="ABCD-EFGH-IJKL"
                class="min-w-0 flex-1 rounded-[1.4rem] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] bg-[rgba(14,14,18,0.4)] px-4 py-3 font-mono text-base uppercase tracking-[0.14em] text-[var(--ui-fg)] outline-none transition focus:border-[var(--ui-primary)]"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                class="!font-mono !uppercase !tracking-[0.16em]"
              >
                Continue
              </Button>
            </div>
          </label>
        </form>

        <p v-if="redeemMessage" class="m-0 text-sm text-[var(--ui-danger)]">
          {{ redeemMessage }}
        </p>
        <p v-if="scanError" class="m-0 text-sm text-[var(--ui-danger)]">
          {{ scanError }}
        </p>
      </div>
    </div>

    <section class="space-y-6">
      <div v-if="activeCollection" class="space-y-5">
        <StickerbookCollectionScene
          v-if="activeBundle"
          :bundle="activeBundle"
          :replay-state="replayState"
          :highlighted-card-ids="highlightedCardIds"
          compact-header
        />

        <Card v-else-if="loadingBook" variant="subtle" padding="sm">
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">Loading your Pixbook…</p>
        </Card>

        <Card v-else variant="subtle" padding="sm">
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            This Pixbook is claimed, but its sticker pages are not loaded yet.
          </p>
        </Card>
      </div>
    </section>
  </section>
</template>
