<script setup>
defineProps({
  type: {
    type: String,
    default: "secondary",
  },
  size: {
    type: String,
    default: "sm",
    validator: (value) => ["xs", "sm", "md", "lg"].includes(value),
  },
});
</script>
<template>
  <span :class="['badge ', `badge-${size}`, `badge-${type}`]"
    ><slot>
      <span class="badge badge-xs badge-primary" />
      <span class="badge badge-sm badge-secondary" />
      <span class="badge badge-md badge-secondary" />
      <span class="badge badge-lg badge-secondary" /> </slot
  ></span>
</template>
