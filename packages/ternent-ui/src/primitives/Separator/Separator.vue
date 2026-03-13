<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { separatorProps } from "./Separator.props";
import { separatorBaseClass, separatorOrientationClasses } from "./Separator.variants";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const props = defineProps(separatorProps);

const classes = computed(() =>
  twMerge(
    separatorBaseClass,
    separatorOrientationClasses[props.orientation],
    normalizeClass(attrs.class),
  ),
);
</script>

<template>
  <div
    :class="classes"
    :aria-orientation="props.orientation"
    role="separator"
  />
</template>
