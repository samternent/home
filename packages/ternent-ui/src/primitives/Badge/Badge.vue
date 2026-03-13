<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { badgeProps } from "./Badge.props";
import { badgeBaseClass, badgeSizeClasses, badgeToneVariantClasses } from "./Badge.variants";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const props = defineProps(badgeProps);

const classes = computed(() =>
  twMerge(
    badgeBaseClass,
    badgeSizeClasses[props.size],
    badgeToneVariantClasses[props.tone][props.variant],
    normalizeClass(attrs.class),
  ),
);

const badgeAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <span :class="classes" v-bind="badgeAttrs">
    <slot />
  </span>
</template>
