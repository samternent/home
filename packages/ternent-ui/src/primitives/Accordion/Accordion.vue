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
const modelValue = computed<string[]>(() => {
  if (Array.isArray(props.value)) return props.value;
  if (typeof props.value === "string" && props.value.length > 0) return [props.value];
  return [];
});
const rootAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function handleValueChange(value: string[]) {
  emit("update:value", props.multiple ? value : value[0]);
}
</script>

<template>
  <ArkAccordion.Root
    :class="rootClass"
    :multiple="props.multiple"
    :collapsible="props.collapsible"
    :lazy-mount="props.lazyMount"
    :model-value="modelValue"
    unmount-on-exit
    v-bind="rootAttrs"
    @update:model-value="handleValueChange"
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
