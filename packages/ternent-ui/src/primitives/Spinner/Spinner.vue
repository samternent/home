<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { spinnerProps } from "./Spinner.props";
import { spinnerBaseClass, spinnerSizeClasses, spinnerToneClasses } from "./Spinner.variants";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const props = defineProps(spinnerProps);

const classes = computed(() =>
  twMerge(
    spinnerBaseClass,
    spinnerSizeClasses[props.size],
    spinnerToneClasses[props.tone],
    normalizeClass(attrs.class),
  ),
);
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" :class="classes" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      class="opacity-90"
    />
  </svg>
</template>
