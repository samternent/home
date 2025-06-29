<script setup>
defineProps({
  type: {
    type: String,
    default: "secondary",
    validator: (value) => ["primary", "secondary", "accent", "info", "success", "warning", "error", "neutral", "ghost"].includes(value),
  },
  size: {
    type: String,
    default: "sm",
    validator: (value) => ["xs", "sm", "md", "lg"].includes(value),
  },
});
</script>
<template>
  <span :class="['badge', `badge-${size}`, `badge-${type}`]">
    <slot />
  </span>
</template>
