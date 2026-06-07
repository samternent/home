<script setup lang="ts">
import { computed, useSlots } from "vue";

const props = withDefaults(
  defineProps<{
    rootClass?: string;
    railClass?: string;
    mainClass?: string;
    showRail?: boolean;
    dataTestPrefix?: string;
  }>(),
  {
    rootClass: "",
    railClass: "",
    mainClass: "",
    showRail: true,
    dataTestPrefix: "workspace-layout",
  },
);
const slots = useSlots();

const rootClasses = computed(() => ["flex h-full min-h-0", props.rootClass]);
const railClasses = computed(() => [
  "hidden w-64 shrink-0 overflow-auto border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 lg:block",
  props.railClass,
]);
const mainClasses = computed(() => [
  "flex min-w-0 flex-1 flex-col bg-[color-mix(in_srgb,var(--ui-surface)_86%,transparent)] backdrop-blur",
  props.mainClass,
]);
const shouldRenderRail = computed(() => props.showRail && Boolean(slots.rail));
</script>

<template>
  <div :class="rootClasses" :data-test="dataTestPrefix">
    <aside v-if="shouldRenderRail" :class="railClasses" :data-test="`${dataTestPrefix}-rail`">
      <slot name="rail" />
    </aside>

    <section :class="mainClasses" :data-test="`${dataTestPrefix}-main`">
      <slot />
    </section>
  </div>
</template>
