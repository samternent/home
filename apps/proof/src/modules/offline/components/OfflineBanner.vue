<script setup lang="ts">
import { computed } from "vue";
import { Badge, Card } from "ternent-ui/primitives";
import { useOfflineSync } from "@/modules/offline";

const { isOnline } = useOfflineSync();

const bannerText = computed(() => {
  return isOnline.value
    ? "Online. The app shell is cached for offline use."
    : "Offline mode active. Signing and verification continue locally.";
});
</script>

<template>
  <Card
    :variant="isOnline ? 'subtle' : 'panel'"
    padding="sm"
    class="flex items-start gap-3 border-[color-mix(in_srgb,var(--ui-border)_86%,transparent)]"
  >
    <Badge :tone="isOnline ? 'neutral' : 'warning'" variant="outline">
      {{ isOnline ? "Online" : "Offline" }}
    </Badge>
    <p class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]">
      {{ bannerText }}
    </p>
  </Card>
</template>
