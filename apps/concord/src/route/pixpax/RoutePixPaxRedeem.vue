<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";
import { useRoute, useRouter } from "vue-router";
import { stripIdentityKey } from "ternent-utils";
import CanvasSticker16 from "../../module/pixpax/CanvasSticker16.vue";
import {
  getPixpaxCollectionBundle,
  listPixpaxIssuers,
  PixPaxApiError,
  redeemPixpaxToken,
  type PixPaxRedeemResponse,
} from "../../module/pixpax/api/client";
import {
  signCollectorProofFromTokenHash,
  verifyPixpaxTokenOffline,
} from "../../module/pixpax/domain/code-token";
import { useIdentity } from "../../module/identity/useIdentity";
import { usePixbook } from "../../module/pixpax/state/usePixbook";
import type { PackPalette16, StickerArt16 } from "../../module/pixpax/sticker-types";

type RevealCard = {
  cardId: string;
  label: string;
  seriesId: string;
  slotIndex: number | null;
  art: StickerArt16 | null;
};

const DEFAULT_PALETTE: PackPalette16 = {
  id: "pixpax-default",
  colors: [
    0x00000000, 0xff1f2937, 0xfff9fafb, 0xff9ca3af, 0xff111827, 0xff2563eb, 0xff16a34a, 0xfff59e0b,
    0xffef4444, 0xff8b5cf6, 0xff06b6d4, 0xfffff0c2, 0xff4b5563, 0xffe5e7eb, 0xfff97316, 0xff22c55e,
  ],
};

const route = useRoute();
const router = useRouter();
const { publicKey, recordPackAndCommit } = usePixbook();
const anonCollector = useLocalStorage("pixpax/redeem/anon-collector", "");

const token = ref("");
const offlineStatus = ref<"idle" | "official" | "not-official" | "expired">("idle");
const offlineDetail = ref("");
const tokenHash = ref("");
const verifying = ref(false);
const redeeming = ref(false);
const redeemError = ref("");
const redeemInfo = ref("");
const redeemResult = ref<PixPaxRedeemResponse | null>(null);
const issuerPublicKeysByKid = ref<Record<string, string>>({});
const revealCards = ref<RevealCard[]>([]);
const revealPalette = ref<PackPalette16>(DEFAULT_PALETTE);
const revealLoading = ref(false);
const identity = useIdentity() as any;

const collectorPubKey = computed(() => {
  const normalizedPublicKey = String(publicKey.value || "").trim();
  if (normalizedPublicKey) return normalizedPublicKey;
  if (!anonCollector.value) {
    anonCollector.value = `anon:${Math.random().toString(36).slice(2, 12)}`;
  }
  return anonCollector.value;
});

const canRedeem = computed(
  () => offlineStatus.value === "official" || offlineStatus.value === "expired",
);
const redeemedCollectionId = computed(() =>
  String(redeemResult.value?.collectionId || "").trim(),
);
const canGoToCollection = computed(() => Boolean(redeemedCollectionId.value));

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
    colors: colorsRaw.map((value) => Number(value) >>> 0),
  };
}

async function clearTokenQueryIfPresent() {
  if (!route.query?.token) return;
  const nextQuery = { ...route.query };
  delete (nextQuery as Record<string, unknown>).token;
  await router.replace({ query: nextQuery });
}

async function loadIssuers() {
  const response = await listPixpaxIssuers();
  const nextMap: Record<string, string> = {};
  for (const issuer of response.issuers || []) {
    if (issuer.status !== "active") continue;
    if (!issuer.kid || !issuer.publicKeyPem) continue;
    nextMap[String(issuer.kid)] = String(issuer.publicKeyPem);
  }
  issuerPublicKeysByKid.value = nextMap;
}

async function verifyOffline() {
  const value = String(token.value || "").trim();
  if (!value) {
    offlineStatus.value = "idle";
    offlineDetail.value = "Paste a token to verify authenticity offline.";
    tokenHash.value = "";
    return;
  }

  verifying.value = true;
  try {
    const verified = await verifyPixpaxTokenOffline({
      token: value,
      issuerPublicKeysByKid: issuerPublicKeysByKid.value,
    });
    tokenHash.value = String(verified.tokenHash || "");
    if (!verified.ok || !verified.official) {
      offlineStatus.value = "not-official";
      offlineDetail.value =
        verified.reason === "legacy-token-unsupported"
          ? "Legacy token format is no longer supported. Remint a new code token."
          : "Not official. Signature could not be verified.";
      return;
    }
    if (verified.isExpired) {
      offlineStatus.value = "expired";
      offlineDetail.value =
        "Official signature verified. Token appears expired; server will decide final status.";
      return;
    }
    offlineStatus.value = "official";
    offlineDetail.value =
      "Official signature verified. Claimed/unused status is only known after server redemption.";
  } catch (error: any) {
    offlineStatus.value = "not-official";
    offlineDetail.value = String(error?.message || "Offline verification failed.");
  } finally {
    verifying.value = false;
  }
}

async function hydrateRevealFromRedeem(response: PixPaxRedeemResponse) {
  revealLoading.value = true;
  try {
    const cards = Array.isArray(response.cards) ? response.cards : [];
    const collectionId = String(response.collectionId || "").trim();
    const version = String(response.collectionVersion || "").trim();
    const labelsById = new Map<string, { label: string; seriesId: string; slotIndex: number | null }>();

    if (collectionId && version) {
      try {
        const bundle = await getPixpaxCollectionBundle(collectionId, version);
        const bundleCards = Array.isArray(bundle?.cards) ? bundle.cards : [];
        for (const entry of bundleCards) {
          const cardId = String(entry?.cardId || "").trim();
          if (!cardId) continue;
          labelsById.set(cardId, {
            label: String(entry?.label || cardId).trim() || cardId,
            seriesId: String(entry?.seriesId || "").trim(),
            slotIndex: Number.isFinite(Number(entry?.slotIndex))
              ? Number(entry?.slotIndex)
              : null,
          });
        }
        const paletteInput =
          bundle?.collection && typeof bundle.collection === "object"
            ? (bundle.collection as { palette?: unknown }).palette
            : null;
        revealPalette.value = normalizePalette(paletteInput);
      } catch {
        revealPalette.value = DEFAULT_PALETTE;
      }
    }

    revealCards.value = cards.map((card) => {
      const cardId = String(card?.cardId || "").trim();
      const meta = labelsById.get(cardId);
      return {
        cardId,
        label: meta?.label || cardId,
        seriesId: meta?.seriesId || String(card?.seriesId || "").trim(),
        slotIndex:
          meta?.slotIndex ??
          (Number.isFinite(Number(card?.slotIndex)) ? Number(card?.slotIndex) : null),
        art: toStickerArtFromRenderPayload(card?.renderPayload || null),
      };
    });
  } finally {
    revealLoading.value = false;
  }
}

async function redeem() {
  const value = String(token.value || "").trim();
  if (!value) return;
  redeeming.value = true;
  redeemError.value = "";
  redeemInfo.value = "";
  redeemResult.value = null;
  revealCards.value = [];
  revealPalette.value = DEFAULT_PALETTE;

  try {
    let collectorSig: string | undefined;
    const identityPrivateKey = identity?.privateKey?.value as CryptoKey | null;
    const identityPublicKey = String(
      stripIdentityKey(String(identity?.publicKeyPEM?.value || "")),
    ).trim();
    if (
      tokenHash.value &&
      identityPrivateKey &&
      identityPublicKey &&
      identityPublicKey === collectorPubKey.value
    ) {
      collectorSig = await signCollectorProofFromTokenHash({
        tokenHash: tokenHash.value,
        privateKey: identityPrivateKey,
      });
      redeemInfo.value = "Collector proof attached.";
    } else {
      redeemInfo.value =
        "Collector proof not attached (identity private key unavailable on this device).";
    }

    const response = await redeemPixpaxToken({
      token: value,
      collectorPubKey: collectorPubKey.value,
      ...(collectorSig ? { collectorSig } : {}),
    });
    redeemResult.value = response;

    const payload = response.entry?.payload || {};
    const signature = String(response.entry?.signature || "").trim();
    const issuerKeyId = String(payload?.issuerKeyId || "").trim();
    if (signature && issuerKeyId) {
      await recordPackAndCommit({
        type: "pixpax.pack.received",
        packId: response.packId,
        issuerIssuePayload: payload,
        receiptRef: {
          segmentKey: response.receipt?.segmentKey || "",
          segmentHash: response.receipt?.segmentHash || "",
        },
        issuerSignature: signature,
        issuerKeyId,
      });
    }

    await clearTokenQueryIfPresent();
    await hydrateRevealFromRedeem(response);
    redeemInfo.value = "Pack redeemed. Cards are revealed below.";
  } catch (error: any) {
    if (error instanceof PixPaxApiError) {
      const body = error.body as Record<string, any>;
      const reason = String(body?.reason || "").trim();
      if (reason === "legacy-token-unsupported" || body?.code === "legacy_token_unsupported") {
        redeemError.value =
          "This code uses a retired legacy format. Remint a new code token and try again.";
        return;
      }
      if (String(body?.status || "") === "already-claimed") {
        const usedAt = String(body?.claimed?.usedAt || "").trim();
        redeemError.value = usedAt
          ? `This code was already claimed on ${usedAt}.`
          : "This code was already claimed.";
        return;
      }
      redeemError.value = String(body?.error || error.message || "Redeem failed.");
      return;
    }
    redeemError.value = String(error?.message || "Redeem failed.");
  } finally {
    redeeming.value = false;
  }
}

async function goToCollection() {
  if (!redeemResult.value) return;
  const newCards = revealCards.value
    .map((card) => String(card.cardId || "").trim())
    .filter(Boolean);
  await router.push({
    name: "pixpax-collection",
    params: {
      collectionId: String(redeemResult.value.collectionId || "").trim(),
    },
    query: {
      ...(newCards.length ? { newCards: newCards.join(",") } : {}),
    },
  });
}

async function redeemAnother() {
  token.value = "";
  offlineStatus.value = "idle";
  offlineDetail.value = "Paste a token to verify authenticity offline.";
  tokenHash.value = "";
  redeemError.value = "";
  redeemInfo.value = "";
  redeemResult.value = null;
  revealCards.value = [];
  revealPalette.value = DEFAULT_PALETTE;
  await clearTokenQueryIfPresent();
}

onMounted(async () => {
  const queryToken = route.query?.token;
  if (typeof queryToken === "string" && queryToken.trim()) {
    token.value = queryToken.trim();
  } else if (Array.isArray(queryToken) && queryToken[0]?.trim()) {
    token.value = String(queryToken[0]).trim();
  }

  await loadIssuers();
  await verifyOffline();
});

watch(
  () => token.value,
  () => {
    verifyOffline();
  },
);
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
    <section class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/70 p-4">
      <h1 class="text-lg font-semibold">Redeem Code</h1>
      <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
        Offline check only confirms signature authenticity. Claimed status is server-verified when you redeem.
      </p>

      <label class="field mt-4">
        <span>Token</span>
        <textarea
          v-model="token"
          rows="5"
          placeholder="paste payload.signature token"
          class="mono"
        />
      </label>

      <div class="mt-3 text-xs">
        <p v-if="offlineStatus === 'official'" class="text-green-700">Official</p>
        <p v-else-if="offlineStatus === 'expired'" class="text-amber-700">Official (expired candidate)</p>
        <p v-else-if="offlineStatus === 'not-official'" class="text-red-700">Not official</p>
        <p v-else class="text-[var(--ui-fg-muted)]">Verification pending</p>
        <p class="mt-1 text-[var(--ui-fg-muted)]">{{ offlineDetail }}</p>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <Button class="!px-4 !py-2" :disabled="redeeming || verifying || !canRedeem" @click="redeem">
          {{ redeeming ? "Redeeming..." : "Redeem and open pack" }}
        </Button>
        <Button
          v-if="canGoToCollection"
          class="!px-4 !py-2"
          @click="goToCollection"
        >
          View collection
        </Button>
        <Button
          v-if="redeemResult"
          class="!px-4 !py-2"
          @click="redeemAnother"
        >
          Redeem another code
        </Button>
      </div>

      <p v-if="redeemError" class="mt-3 text-sm text-red-700">{{ redeemError }}</p>
      <p v-else-if="redeemInfo" class="mt-3 text-xs text-[var(--ui-fg-muted)]">{{ redeemInfo }}</p>
    </section>

    <section
      v-if="redeemResult"
      class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/70 p-4"
    >
      <h2 class="text-sm font-semibold">Pack Opened</h2>
      <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
        {{ redeemResult.cards?.length || 0 }} card(s) minted. Receipt is the canonical mint proof.
      </p>
      <p class="mt-2 mono text-[10px] text-[var(--ui-fg-muted)]">
        packId: {{ redeemResult.packId }} · receiptKeyId: {{ redeemResult.receipt?.receiptKeyId }}
      </p>

      <div v-if="revealLoading" class="mt-3 text-xs text-[var(--ui-fg-muted)]">
        Loading card metadata...
      </div>
      <div v-else-if="!revealCards.length" class="mt-3 text-xs text-[var(--ui-fg-muted)]">
        No card data available for reveal.
      </div>
      <div v-else class="reveal-grid mt-3">
        <article
          v-for="(card, idx) in revealCards"
          :key="`${card.cardId}-${idx}`"
          class="reveal-card"
        >
          <div class="reveal-art">
            <CanvasSticker16
              v-if="card.art"
              :art="card.art"
              :palette="revealPalette"
              :scale="6"
              class="reveal-canvas"
            />
            <div v-else class="reveal-art-fallback">No preview</div>
          </div>
          <p class="reveal-title">{{ card.label || card.cardId }}</p>
          <p class="reveal-sub mono">{{ card.cardId }}</p>
          <p class="reveal-sub">
            series {{ card.seriesId || "—" }} · slot {{ card.slotIndex != null ? card.slotIndex : "—" }}
          </p>
        </article>
      </div>
    </section>
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

.field textarea {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: var(--ui-bg);
  color: var(--ui-fg);
  padding: 10px 12px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.reveal-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.reveal-card {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 6px;
}

.reveal-art {
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: var(--ui-bg);
  display: grid;
  place-items: center;
}

.reveal-canvas {
  width: 96px;
  height: 96px;
}

.reveal-art-fallback {
  font-size: 11px;
  color: var(--ui-fg-muted);
}

.reveal-title {
  margin: 0;
  font-size: 13px;
  color: var(--ui-fg);
}

.reveal-sub {
  margin: 0;
  font-size: 11px;
  color: var(--ui-fg-muted);
  overflow-wrap: anywhere;
}
</style>
