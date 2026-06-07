<script setup lang="ts">
import { computed } from "vue";
import type { SplitViewRailWidth } from "./SplitView.types";
import { getSplitViewRailWidthClass } from "./SplitView.utils";

const props = withDefaults(
  defineProps<{
    divider?: boolean;
    railAriaLabel?: string;
    railWidth?: SplitViewRailWidth;
  }>(),
  {
    divider: true,
    railAriaLabel: "Section navigation",
    railWidth: "md",
  },
);

const railWidthClass = computed(() => getSplitViewRailWidthClass(props.railWidth));
</script>

<template>
  <div class="flex min-h-0 flex-col gap-4 md:flex-row!" data-pattern="split-view">
    <aside
      :class="[
        'min-h-0 pb-4 md:pb-0 md:pr-4',
        props.divider ? 'border-b border-[var(--ui-border)] md:border-b-0 md:border-r' : '',
        railWidthClass,
      ]"
      :aria-label="props.railAriaLabel"
    >
      <slot name="rail" />
    </aside>

    <section class="min-h-0 flex-1" data-slot="detail">
      <slot />
    </section>
  </div>
</template>
