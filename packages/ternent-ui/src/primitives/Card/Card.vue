<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { cardProps } from "./Card.props";
import { cardBaseClass, cardInteractiveClass, cardPaddingClasses, cardVariantClasses } from "./Card.variants";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const props = defineProps(cardProps);

const classes = computed(() =>
  twMerge(
    cardBaseClass,
    cardVariantClasses[props.variant],
    cardPaddingClasses[props.padding],
    props.interactive ? cardInteractiveClass : "",
    normalizeClass(attrs.class),
  ),
);

const cardAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div :class="classes" v-bind="cardAttrs">
    <slot />
  </div>
</template>
