<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PixPaxApiError, resolvePixpaxRedeemCode } from "../../module/pixpax/api/client";
import { resolveShortRedeemInput } from "../../module/pixpax/domain/short-redeem";

const route = useRoute();
const router = useRouter();
const status = ref("Resolving redeem code...");

onMounted(async () => {
  const resolved = resolveShortRedeemInput({
    queryT: route.query?.t,
    queryToken: route.query?.token,
    queryCode: route.query?.c,
    paramCode: route.params?.code || route.params?.token,
  });

  if (resolved.token) {
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
    await router.replace({
      name: "pixpax-redeem",
      query: { token: response.token },
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
