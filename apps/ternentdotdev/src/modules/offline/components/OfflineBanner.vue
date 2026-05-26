<script setup lang="ts">
import { computed } from "vue";
import { useOfflineSync } from "@/modules/offline";

const { isOnline, lastOnlineAt } = useOfflineSync();

const lastOnlineLabel = computed(() => {
  if (!lastOnlineAt.value) return "No recent sync yet";
  return `Last online: ${new Date(lastOnlineAt.value).toLocaleTimeString()}`;
});
</script>

<template>
  <div
    class="rounded-md border px-3 py-2 text-sm"
    :class="isOnline ? 'bg-surface border-border text-fg-muted' : 'bg-danger-muted border-danger text-fg'"
  >
    <span v-if="isOnline">Online and ready for sync.</span>
    <span v-else>Offline mode enabled. Cached data remains available.</span>
    <span class="ml-2 opacity-80">{{ lastOnlineLabel }}</span>
  </div>
</template>
