<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { fieldMessageProps } from "./FieldMessage.props";
import {
  fieldMessageBaseClass,
  fieldMessageSizeClasses,
  fieldMessageToneClasses,
} from "./FieldMessage.variants";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const props = defineProps(fieldMessageProps);

const classes = computed(() =>
  twMerge(
    fieldMessageBaseClass,
    fieldMessageSizeClasses[props.size],
    fieldMessageToneClasses[props.tone],
    normalizeClass(attrs.class),
  ),
);

const fieldMessageAttrs = computed(() => {
  const { class: _class, role: _role, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <p
    :id="props.id"
    :class="classes"
    :role="props.tone === 'critical' ? 'alert' : undefined"
    v-bind="fieldMessageAttrs"
  >
    <slot />
  </p>
</template>
