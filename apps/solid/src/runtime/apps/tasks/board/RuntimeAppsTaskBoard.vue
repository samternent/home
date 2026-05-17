<script setup lang="ts">
import { computed } from "vue";
import { createEveryoneAudience, isAudienceLocked, toAudiencePayload } from "../audienceContract";

const audiencePreview = computed(() =>
  toAudiencePayload({
    selector: createEveryoneAudience(),
    keyMissing: false,
  }),
);

const locked = computed(() => isAudienceLocked(audiencePreview.value));
</script>

<template>
  <section class="p-4" data-test="runtime-task-board-v0">
    <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
      Tasks board surface placeholder. Audience contract is shared with list.
    </p>
    <p
      class="m-0 mt-2 text-xs text-[var(--ui-fg-muted)]"
      data-test="runtime-task-board-audience-state"
    >
      {{ locked ? "no key" : "key ready" }}
    </p>
  </section>
</template>
