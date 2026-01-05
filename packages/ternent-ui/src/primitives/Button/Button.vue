<script setup lang="ts">
import { computed } from "vue";
import { buttonProps } from "./Button.props";
import { buttonVariants } from "./Button.variants";

const props = defineProps(buttonProps);

const classes = computed(() => [
  buttonVariants.base,
  buttonVariants.interaction,
  buttonVariants.variants.variant[props.variant],
  buttonVariants.variants.size[props.size],
]);
</script>

<template>
  <component
    :is="as"
    :class="classes"
    :disabled="as === 'button' ? disabled : undefined"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>
