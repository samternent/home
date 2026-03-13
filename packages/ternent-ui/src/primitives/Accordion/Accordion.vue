<script setup lang="ts">
import { Accordion as ArkAccordion } from "@ark-ui/vue/accordion";
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { accordionProps } from "./Accordion.props";
import type { AccordionValue } from "./Accordion.types";
import { accordionRootClass } from "./Accordion.variants";

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  "update:value": [value: AccordionValue];
}>();

const attrs = useAttrs();
const props = defineProps(accordionProps);

const rootClass = computed(() => twMerge(accordionRootClass, normalizeClass(attrs.class)));
const rootAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function handleValueChange(value: AccordionValue) {
  emit("update:value", value);
}
</script>

<template>
  <ArkAccordion.Root
    :class="rootClass"
    :multiple="props.multiple"
    :collapsible="props.collapsible"
    :lazy-mount="props.lazyMount"
    :value="props.value"
    unmount-on-exit
    v-bind="rootAttrs"
    @update:value="handleValueChange"
  >
    <slot />
  </ArkAccordion.Root>
</template>

<style scoped>
@keyframes accordion-down {
  from {
    height: 0;
    opacity: 0.01;
  }
  to {
    height: var(--height);
    opacity: 1;
  }
}

@keyframes accordion-up {
  from {
    height: var(--height);
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0.01;
  }
}
</style>
