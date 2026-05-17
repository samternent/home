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
  <section class="p-4" data-test="runtime-task-list-v0">
    <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
      Tasks list surface placeholder. Audience contract is shared with board.
    </p>
    <p
      class="m-0 mt-2 text-xs text-[var(--ui-fg-muted)]"
      data-test="runtime-task-list-audience-state"
    >
      {{ locked ? "no key" : "key ready" }}
    </p>
  </section>
</template>
