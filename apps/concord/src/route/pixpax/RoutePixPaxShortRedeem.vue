<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PixPaxApiError, resolvePixpaxRedeemCode } from "../../module/pixpax/api/client";
import { resolveShortRedeemInput } from "../../module/pixpax/domain/short-redeem";

const route = useRoute();
const router = useRouter();
const status = ref("Resolving redeem code...");

function tryExtractCodeIdFromToken(token: string) {
  const raw = String(token || "").trim();
  if (!raw) return "";
  const parts = raw.split(".");
  if (parts.length !== 2) return "";
  const payloadPart = String(parts[0] || "").trim();
  if (!payloadPart) return "";
  try {
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    const binary = atob(`${normalized}${pad}`);
    const payload = JSON.parse(binary) as { c?: unknown };
    return String(payload?.c || "").trim();
  } catch {
    return "";
  }
}

async function goToCollectionRedeem(params: {
  collectionId?: string | null;
  version?: string | null;
  token: string;
}) {
  const collectionId = String(params.collectionId || "").trim();
  if (!collectionId) {
    await router.replace({
      name: "pixpax-redeem",
      query: { token: params.token },
    });
    return;
  }
  const version = String(params.version || "").trim();
  await router.replace({
    name: "pixpax-collection",
    params: { collectionId },
    query: {
      token: params.token,
      ...(version ? { version } : {}),
      redeem: "1",
    },
  });
}

onMounted(async () => {
  const resolved = resolveShortRedeemInput({
    queryT: route.query?.t,
    queryToken: route.query?.token,
    queryCode: route.query?.c,
    paramCode: route.params?.code || route.params?.token,
  });

  if (resolved.token) {
    const codeId = tryExtractCodeIdFromToken(resolved.token);
    if (codeId) {
      try {
        const resolvedCode = await resolvePixpaxRedeemCode(codeId);
        await goToCollectionRedeem({
          collectionId: resolvedCode.collectionId || null,
          version: resolvedCode.version || null,
          token: resolved.token,
        });
        return;
      } catch {
        // Fallback to token-only redeem screen below.
      }
    }
    await router.replace({
      name: "pixpax-redeem",
      query: { token: resolved.token },
    });
    return;
  }

  if (!resolved.code) {
    status.value = "Missing redeem code.";
    await router.replace({ name: "pixpax-redeem" });
    return;
  }

  try {
    const response = await resolvePixpaxRedeemCode(resolved.code);
    await goToCollectionRedeem({
      collectionId: response.collectionId || null,
      version: response.version || null,
      token: response.token,
    });
  } catch (error: any) {
    if (error instanceof PixPaxApiError) {
      const body = error.body as any;
      status.value = String(body?.error || error.message || "Failed to resolve redeem code.");
    } else {
      status.value = String(error?.message || "Failed to resolve redeem code.");
    }
  }
});
</script>

<template>
  <div class="mx-auto w-full max-w-3xl p-4 text-sm text-[var(--ui-fg-muted)]">
    {{ status }}
  </div>
</template>
