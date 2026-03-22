<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Button, Card } from "ternent-ui/primitives";
import { PageSurface } from "ternent-ui/patterns";
import {
  redeemDesignatedCode,
  type PixpaxApiError,
  type PixpaxDesignatedRedeemResponse,
} from "@/modules/api/client";
import { usePixpaxCollections } from "@/modules/collections/usePixpaxCollections";
import { useIdentitySession } from "@/modules/identity";
import { useOfflineSync } from "@/modules/offline";
import { usePixbookSession } from "@/modules/pixbook/usePixbookSession";
import { usePendingRedeems } from "@/modules/redeem/usePendingRedeems";
import { formatRedeemCode, normalizeRedeemCode } from "@/modules/redeem/code-format";
import StickerCard from "@/modules/stickerbook/components/StickerCard.vue";
import PixpaxLogoText from "@/modules/ui/components/PixpaxLogoText.vue";

type RedeemStage =
  | "idle"
  | "loading"
  | "ready"
  | "claiming"
  | "claimed"
  | "revealing"
  | "summary"
  | "error";

const route = useRoute();
const router = useRouter();
const { identity } = useIdentitySession();
const { isOnline } = useOfflineSync();
const pixbook = usePixbookSession();
const collections = usePixpaxCollections();
const { clearPendingRedeem, markPendingAttempt } = usePendingRedeems();

const code = ref("");
const stage = ref<RedeemStage>("idle");
const error = ref("");
const redeemResult = ref<PixpaxDesignatedRedeemResponse | null>(null);
const claimedBundle = ref<Awaited<ReturnType<typeof collections.loadBundle>> | null>(null);
const openedCardIds = ref<string[]>([]);
const revealIndex = ref(0);
const autoTriggeredCode = ref("");

const summaryCards = computed(() => {
  if (!claimedBundle.value) return [];
  const byId = new Map(claimedBundle.value.cards.map((card) => [card.cardId, card]));
  return openedCardIds.value.map((cardId) => byId.get(cardId)).filter(Boolean);
});
const currentCard = computed(() => summaryCards.value[revealIndex.value] || null);
const claimButtonLabel = computed(() =>
  redeemResult.value?.recovered ? "Restore to Pixbook" : "Claim this pack",
);
const nextRevealLabel = computed(() =>
  revealIndex.value >= summaryCards.value.length - 1 ? "See your stickers" : "Next sticker",
);
const collectionHref = computed(() => "/app/pixbook");

function readQueryCode() {
  const redeem = route.query.redeem;
  const queryCode = route.query.code;
  return normalizeRedeemCode(
    Array.isArray(redeem) ? redeem[0] : redeem || (Array.isArray(queryCode) ? queryCode[0] : queryCode),
  );
}

function resetFlow(nextCode: string) {
  code.value = nextCode;
  stage.value = nextCode ? "loading" : "idle";
  error.value = "";
  redeemResult.value = null;
  claimedBundle.value = null;
  openedCardIds.value = [];
  revealIndex.value = 0;
}

async function loadRedeemFlow(rawCode: string) {
  const normalizedCode = normalizeRedeemCode(rawCode);
  resetFlow(normalizedCode);

  if (!normalizedCode) {
    stage.value = "idle";
    return;
  }

  const claimantPublicKey = identity.value?.serializedIdentity.publicKey;
  if (!claimantPublicKey) {
    stage.value = "error";
    error.value = "No local identity is available.";
    return;
  }

  if (!isOnline.value) {
    stage.value = "error";
    error.value = "Connect to the internet to check this code.";
    return;
  }

  try {
    const response = await redeemDesignatedCode({
      code: normalizedCode,
      claimantPublicKey,
    });
    markPendingAttempt(normalizedCode, null);
    clearPendingRedeem(normalizedCode);
    redeemResult.value = response;
    claimedBundle.value = await collections.loadBundle(
      response.artifact.payload.collectionId,
      response.artifact.payload.collectionVersion,
    );
    stage.value = "ready";
  } catch (caught) {
    const apiError = caught as PixpaxApiError;
    const message = apiError instanceof Error ? apiError.message : "Redeem failed.";
    markPendingAttempt(normalizedCode, message);
    error.value = message;
    stage.value = "error";
  }
}

async function claimPack() {
  if (!redeemResult.value) return;
  stage.value = "claiming";
  error.value = "";

  try {
    await pixbook.claimAndOpenIssuedPack({
      artifact: redeemResult.value.artifact,
      claimedAt: redeemResult.value.claim.claimedAt,
      verification: {
        proofValidLocal: redeemResult.value.verification.ok,
        policyConfirmed: redeemResult.value.claim.policyConfirmed,
        verifiedAt: redeemResult.value.claim.claimedAt,
        source: "server-policy",
        reason: null,
      },
    });
    openedCardIds.value = redeemResult.value.artifact.payload.cards.map((card) => card.cardId);
    revealIndex.value = 0;
    stage.value = "claimed";
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Unable to claim this pack.";
    stage.value = "error";
  }
}

function openPack() {
  if (!openedCardIds.value.length) {
    stage.value = "summary";
    return;
  }
  revealIndex.value = 0;
  stage.value = "revealing";
}

function showNextCard() {
  if (revealIndex.value >= summaryCards.value.length - 1) {
    stage.value = "summary";
    return;
  }
  revealIndex.value += 1;
}

watch(
  () => route.fullPath,
  async () => {
    const queryCode = readQueryCode();
    if (autoTriggeredCode.value === queryCode) {
      return;
    }
    autoTriggeredCode.value = queryCode;
    await loadRedeemFlow(queryCode);
  },
);

onMounted(async () => {
  await pixbook.ensureReady().catch(() => undefined);
  await collections.loadCatalog().catch(() => undefined);
  const queryCode = readQueryCode();
  autoTriggeredCode.value = queryCode;
  await loadRedeemFlow(queryCode);
});
</script>

<template>
  <PageSurface>
    <div class="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div class="mb-12 flex flex-col items-center gap-5 text-center">
        <RouterLink to="/app/pixbook" class="inline-flex items-center justify-center text-inherit no-underline">
          <PixpaxLogoText class="h-6 w-auto sm:h-7" />
        </RouterLink>
        <p class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
          Pack opening
        </p>
      </div>

      <div class="mx-auto max-w-2xl">
        <Card
          v-if="stage === 'idle'"
          variant="showcase"
          padding="sm"
          class="space-y-5 text-center"
        >
          <h1 class="m-0 font-mono text-[clamp(2rem,6vw,3.5rem)] uppercase tracking-[-0.08em]">
            Bring a code here
          </h1>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            Start from your Pixbook page or scan a printed PixPax card.
          </p>
          <div class="flex justify-center">
            <Button as="RouterLink" to="/app/pixbook?redeem=1" size="sm" variant="secondary">
              Go to Pixbook
            </Button>
          </div>
        </Card>

        <Card
          v-else-if="stage === 'loading'"
          variant="showcase"
          padding="sm"
          class="space-y-6 text-center"
        >
          <p class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
            Checking code
          </p>
          <h1 class="m-0 font-mono text-[clamp(2rem,6vw,3.5rem)] uppercase tracking-[-0.08em]">
            {{ formatRedeemCode(code) }}
          </h1>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            Talking to the server to confirm first claim and fetch the signed pack.
          </p>
        </Card>

        <Card
          v-else-if="stage === 'error'"
          variant="showcase"
          padding="sm"
          class="space-y-6 text-center"
        >
          <p class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
            Redeem failed
          </p>
          <h1 class="m-0 font-mono text-[clamp(2rem,6vw,3.5rem)] uppercase tracking-[-0.08em]">
            {{ code ? formatRedeemCode(code) : "No code" }}
          </h1>
          <p class="m-0 text-sm text-[var(--ui-danger)]">{{ error }}</p>
          <div class="flex flex-wrap justify-center gap-3">
            <Button as="RouterLink" to="/app/pixbook?redeem=1" size="sm" variant="secondary">
              Try another code
            </Button>
            <Button size="sm" variant="plain-secondary" @click="loadRedeemFlow(code)">
              Try again
            </Button>
          </div>
        </Card>

        <Card
          v-else-if="stage === 'ready' && redeemResult"
          variant="showcase"
          padding="sm"
          class="space-y-7 text-center"
        >
          <p class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
            {{ redeemResult.recovered ? "Claim found" : "Pack ready" }}
          </p>
          <h1 class="m-0 font-mono text-[clamp(2rem,6vw,3.8rem)] uppercase tracking-[-0.08em]">
            {{ claimedBundle?.collection?.name || redeemResult.artifact.payload.collectionId }}
          </h1>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            {{ redeemResult.artifact.payload.cards.length }} stickers are waiting. Claim them into this Pixbook first, then open the pack.
          </p>
          <div class="flex justify-center">
            <Button
              size="hero"
              variant="accent"
              class="!font-mono"
              @click="claimPack"
            >
              {{ claimButtonLabel }}
            </Button>
          </div>
        </Card>

        <Card
          v-else-if="stage === 'claiming'"
          variant="showcase"
          padding="sm"
          class="space-y-6 text-center"
        >
          <p class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
            Writing to your Pixbook
          </p>
          <h1 class="m-0 font-mono text-[clamp(2rem,6vw,3.5rem)] uppercase tracking-[-0.08em]">
            Claiming pack
          </h1>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            This is the moment the pack becomes part of your local Pixbook.
          </p>
        </Card>

        <Card
          v-else-if="stage === 'claimed'"
          variant="showcase"
          padding="sm"
          class="space-y-7 text-center"
        >
          <p class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
            Pack claimed
          </p>
          <h1 class="m-0 font-mono text-[clamp(2rem,6vw,3.8rem)] uppercase tracking-[-0.08em]">
            Ready to open
          </h1>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            {{ openedCardIds.length }} stickers are inside.
          </p>
          <div class="flex justify-center">
            <Button
              size="hero"
              variant="accent"
              class="!font-mono"
              @click="openPack"
            >
              Open pack
            </Button>
          </div>
        </Card>

        <Card
          v-else-if="stage === 'revealing'"
          variant="showcase"
          padding="sm"
          class="space-y-7 text-center"
        >
          <p class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
            Sticker {{ revealIndex + 1 }} of {{ summaryCards.length }}
          </p>
          <div class="flex justify-center py-3">
            <StickerCard
              v-if="claimedBundle && currentCard"
              :bundle="claimedBundle"
              :card="currentCard"
              highlighted
            />
          </div>
          <div class="flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              class="!rounded-full !font-mono !uppercase !tracking-[0.16em]"
              @click="showNextCard"
            >
              {{ nextRevealLabel }}
            </Button>
          </div>
        </Card>

        <Card
          v-else-if="stage === 'summary'"
          variant="showcase"
          padding="sm"
          class="space-y-7 text-center"
        >
          <p class="m-0 text-xs uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
            Pack opened
          </p>
          <h1 class="m-0 font-mono text-[clamp(2rem,6vw,3.8rem)] uppercase tracking-[-0.08em]">
            {{ summaryCards.length }} new stickers
          </h1>
          <div
            v-if="claimedBundle && summaryCards.length"
            class="flex flex-wrap justify-center gap-5"
          >
            <StickerCard
              v-for="card in summaryCards"
              :key="card.cardId"
              :bundle="claimedBundle"
              :card="card"
              highlighted
            />
          </div>
          <div class="flex flex-wrap justify-center gap-3">
            <Button as="RouterLink" :to="collectionHref" size="sm" variant="secondary">
              Go to book
            </Button>
            <Button as="RouterLink" to="/app/pixbook?redeem=1" size="sm" variant="plain-secondary">
              Open another
            </Button>
          </div>
        </Card>
      </div>
    </div>
  </PageSurface>
</template>
