<script setup>
defineProps({
  to: {
    type: String,
    default: undefined,
  },
  type: {
    type: String,
    default: "ghost",
  },
});
defineEmits(["click"]);

const classMap = {
  neutral: "btn-neutral",
  ghost: "btn-ghost",
  success: "btn-success",
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  error: "btn-error",
};
</script>
<template>
  <RouterLink
    v-if="to"
    :to="to"
    role="button"
    v-bind="$attrs"
    class="btn mx-1 flex truncate flex-nowrap"
    :class="classMap[type]"
    activeClass="btn-active"
    ><slot
  /></RouterLink>
  <button
    v-else
    @click="$emit('click')"
    role="button"
    v-bind="$attrs"
    class="btn mx-1"
    :class="classMap[type]"
  >
    <slot />
  </button>
</template>
