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
};
</script>
<template>
  <RouterLink
    v-if="to"
    :to="to"
    role="button"
    v-bind="$attrs"
    class="btn mx-1"
    :class="classMap[type]"
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
