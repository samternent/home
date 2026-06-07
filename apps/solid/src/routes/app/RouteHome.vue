<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppApi } from "@/app/api";

const appApi = useAppApi();
const loadError = ref<string | null>(null);

onMounted(async () => {
  try {
    await appApi.load();
    await appApi.identity.ensureActiveIdentity();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
  }
});
</script>

<template>
  <section class="p-4" data-test="home-v2-placeholder">
    <p class="m-0 text-sm text-[var(--ui-fg-muted)]" data-test="home-v2-placeholder-text">
      Home placeholder. Runtime health, integrity, and staging indicators now live in the console
      status bar.
    </p>
    <p
      v-if="loadError || appApi.lastError.value"
      class="mt-3 text-sm text-[var(--ui-critical)]"
      data-test="home-v2-error"
    >
      {{ loadError ?? appApi.lastError.value }}
    </p>
  </section>
</template>
