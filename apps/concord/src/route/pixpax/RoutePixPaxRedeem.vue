<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";
import { useRoute, useRouter } from "vue-router";
import { stripIdentityKey } from "ternent-utils";
import {
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
const issuerPublicKeysById = ref<Record<string, string>>({});
const identity = useIdentity() as any;

const collectorPubKey = computed(() => {
  const normalizedPublicKey = String(publicKey.value || "").trim();
  if (normalizedPublicKey) return normalizedPublicKey;
  if (!anonCollector.value) {
    anonCollector.value = `anon:${Math.random().toString(36).slice(2, 12)}`;
  }
  return anonCollector.value;
});

const canRedeem = computed(() => offlineStatus.value === "official" || offlineStatus.value === "expired");

async function loadIssuers() {
  const response = await listPixpaxIssuers();
  const nextMap: Record<string, string> = {};
  for (const issuer of response.issuers || []) {
    if (issuer.status !== "active") continue;
    if (!issuer.issuerKeyId || !issuer.publicKeyPem) continue;
    nextMap[String(issuer.issuerKeyId)] = String(issuer.publicKeyPem);
  }
  issuerPublicKeysById.value = nextMap;
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
      issuerPublicKeysById: issuerPublicKeysById.value,
    });
    tokenHash.value = String(verified.tokenHash || "");
    if (!verified.ok || !verified.official) {
      offlineStatus.value = "not-official";
      offlineDetail.value = "Not official. Signature could not be verified.";
      return;
    }
    if (verified.isExpired) {
      offlineStatus.value = "expired";
      offlineDetail.value = "Official signature verified. Token appears expired; server will decide final status.";
      return;
    }
    offlineStatus.value = "official";
    offlineDetail.value = "Official signature verified. Claimed/unused status requires server redemption.";
  } catch (error: any) {
    offlineStatus.value = "not-official";
    offlineDetail.value = String(error?.message || "Offline verification failed.");
  } finally {
    verifying.value = false;
  }
}

async function redeem() {
  const value = String(token.value || "").trim();
  if (!value) return;
  redeeming.value = true;
  redeemError.value = "";
  redeemInfo.value = "";
  redeemResult.value = null;

  try {
    let collectorSig: string | undefined;
    const identityPrivateKey = identity?.privateKey?.value as CryptoKey | null;
    const identityPublicKey = String(stripIdentityKey(String(identity?.publicKeyPEM?.value || ""))).trim();
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
      redeemInfo.value = "Collector proof not attached (identity private key unavailable on this device).";
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

    const newCards = Array.isArray(response.cards)
      ? response.cards
          .map((card) => String(card?.cardId || "").trim())
          .filter(Boolean)
      : [];
    await router.push({
      name: "pixpax-collection",
      params: {
        collectionId: String(response.collectionId || "").trim(),
      },
      query: {
        ...(newCards.length ? { newCards: newCards.join(",") } : {}),
      },
    });
  } catch (error: any) {
    if (error instanceof PixPaxApiError) {
      const body = error.body as any;
      redeemError.value = String(body?.error || error.message || "Redeem failed.");
      return;
    }
    redeemError.value = String(error?.message || "Redeem failed.");
  } finally {
    redeeming.value = false;
  }
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
  }
);
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
    <section class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/70 p-4">
      <h1 class="text-lg font-semibold">Redeem PixPax Token</h1>
      <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
        Offline authenticity only confirms the issuer signature. Claimed/unused state is determined by server redemption.
      </p>

      <label class="field mt-4">
        <span>Token</span>
        <textarea v-model="token" rows="5" placeholder="paste payload.signature token" class="mono" />
      </label>

      <div class="mt-3 text-xs">
        <p v-if="offlineStatus === 'official'" class="text-green-700">Official</p>
        <p v-else-if="offlineStatus === 'expired'" class="text-amber-700">Official (expired candidate)</p>
        <p v-else-if="offlineStatus === 'not-official'" class="text-red-700">Not official</p>
        <p v-else class="text-[var(--ui-fg-muted)]">Verification pending</p>
        <p class="text-[var(--ui-fg-muted)] mt-1">{{ offlineDetail }}</p>
        <p v-if="tokenHash" class="mono mt-1 text-[10px] text-[var(--ui-fg-muted)]">tokenHash: {{ tokenHash }}</p>
      </div>

      <div class="mt-4 flex items-center gap-2">
        <Button class="!px-4 !py-2" :disabled="redeeming || verifying || !canRedeem" @click="redeem">
          {{ redeeming ? "Redeeming..." : "Redeem" }}
        </Button>
      </div>

      <p v-if="redeemError" class="mt-3 text-sm text-red-700">{{ redeemError }}</p>
      <p v-else-if="redeemInfo" class="mt-3 text-xs text-[var(--ui-fg-muted)]">{{ redeemInfo }}</p>
    </section>

    <section v-if="redeemResult" class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/70 p-4">
      <h2 class="text-sm font-semibold">Redeemed</h2>
      <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
        Receipt is the canonical mint proof.
      </p>
      <p class="mt-2 mono text-xs">packId: {{ redeemResult.packId }}</p>
      <p class="mono text-xs">receiptKeyId: {{ redeemResult.receipt?.receiptKeyId }}</p>
      <p class="mono text-xs">tokenHash: {{ redeemResult.receipt?.tokenHash }}</p>
      <p class="mono text-xs">cards: {{ redeemResult.cards?.map((c) => c.cardId).join(", ") }}</p>
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
</style>
