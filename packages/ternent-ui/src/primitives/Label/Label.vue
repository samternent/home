<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { labelProps } from "./Label.props";
import {
  labelBaseClass,
  labelRequiredClass,
  labelSizeClasses,
  labelStateClasses,
} from "./Label.variants";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const props = defineProps(labelProps);

const classes = computed(() =>
  twMerge(
    labelBaseClass,
    labelSizeClasses[props.size],
    props.disabled ? labelStateClasses.disabled : "",
    props.invalid ? labelStateClasses.invalid : labelStateClasses.default,
    normalizeClass(attrs.class),
  ),
);

const labelAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <label :for="props.for" :class="classes" v-bind="labelAttrs">
    <slot />
    <span v-if="props.required" :class="labelRequiredClass" aria-hidden="true">*</span>
  </label>
</template>
