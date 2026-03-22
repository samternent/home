<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Button, Card } from "ternent-ui/primitives";
import { usePixbookSession } from "@/modules/pixbook/usePixbookSession";
import { usePendingRedeems } from "@/modules/redeem/usePendingRedeems";
import { useRedeemComposer } from "@/modules/redeem/useRedeemComposer";
import { formatRedeemCode, normalizeRedeemCode } from "@/modules/redeem/code-format";
import { usePixpaxCollections } from "@/modules/collections/usePixpaxCollections";
import { useOfflineSync } from "@/modules/offline";
import StickerbookCollectionScene from "@/modules/stickerbook/components/StickerbookCollectionScene.vue";

const router = useRouter();
const pixbook = usePixbookSession();
const collections = usePixpaxCollections();
const { addPendingRedeem } = usePendingRedeems();
const redeemComposer = useRedeemComposer();
const { isOnline } = useOfflineSync();
const loadingBook = ref(false);
const activeBundle = ref<Awaited<ReturnType<typeof collections.loadBundle>> | null>(null);
const redeemExpanded = ref(false);
const redeemCode = ref("");
const redeemMessage = ref("");

const replayState = computed(() => pixbook.replayState.value);
const claims = computed(() =>
  Object.values(replayState.value.claimedPacksByEntryId).sort((left, right) =>
    String(right.claimedAt).localeCompare(String(left.claimedAt)),
  ),
);
const latestClaim = computed(() => claims.value[0] || null);
const activeCollection = computed(() => {
  const primary = collections.primaryCollection.value;
  if (primary) {
    return {
      collectionId: primary.collectionId,
      resolvedVersion: primary.resolvedVersion,
    };
  }
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

async function beginRedeem() {
  const normalizedCode = normalizeRedeemCode(redeemCode.value);
  if (!normalizedCode) {
    redeemMessage.value = "Enter a code from a printed PixPax card.";
    return;
  }
  if (!isOnline.value) {
    addPendingRedeem(normalizedCode);
    redeemMessage.value = "Saved for later. Connect to the internet to finish the claim.";
    return;
  }
  redeemMessage.value = "";
  redeemComposer.closeComposer();
  await router.push({
    path: "/redeem",
    query: {
      code: normalizedCode,
    },
  });
}

watch(activeCollection, async () => {
  await loadActiveBundle();
});

watch(
  () => redeemComposer.open.value,
  (value) => {
    redeemExpanded.value = value;
  },
  { immediate: true },
);

onMounted(async () => {
  await pixbook.ensureReady().catch(() => undefined);
  await collections.loadCatalog().catch(() => undefined);
  await loadActiveBundle().catch(() => undefined);
});
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-14">
    <div class="mx-auto flex max-w-xl flex-col items-center gap-6 pt-2 text-center">
      <Button
        size="hero"
        variant="accent"
        class="!w-full !font-mono"
        @click="redeemExpanded ? redeemComposer.closeComposer() : redeemComposer.openComposer()"
      >
        {{ latestClaim ? "Open another pack" : "Redeem your first pack" }}
      </Button>
      <Card
        v-if="redeemExpanded"
        variant="showcase"
        padding="sm"
        class="w-full space-y-4 text-left"
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
      </Card>
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
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">Loading stickerbook…</p>
        </Card>

        <Card v-else variant="subtle" padding="sm">
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            This book is in your Pixbook, but its sticker pages are not loaded yet.
          </p>
        </Card>
      </div>

      <Card v-else variant="subtle" padding="sm">
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          No Pixbook is live yet. Issue the production book, then redeem a printed code to begin.
        </p>
      </Card>
    </section>
  </section>
</template>
