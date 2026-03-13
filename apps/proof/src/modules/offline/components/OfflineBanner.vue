<script setup lang="ts">
import { computed } from "vue";
import { useOfflineSync } from "@/modules/offline";

const { isOnline } = useOfflineSync();

const bannerText = computed(() => {
  return isOnline.value
    ? "Online. The app shell is cached for offline use."
    : "Offline mode active. Signing and verification continue locally.";
});
</script>

<template>
  <div
    class="rounded-xl border px-4 py-3 text-sm"
    :class="
      isOnline
        ? 'border-border bg-[var(--ui-surface-2)] text-fg-muted'
        : 'border-[rgba(255,90,90,0.22)] bg-[rgba(255,90,90,0.1)] text-fg'
    "
  >
    {{ bannerText }}
  </div>
</template>
