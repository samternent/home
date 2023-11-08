<script setup>
defineProps({
  size: {
    type: String,
    default: "lg",
    validate: ["sm", "md", "lg"],
  },
});
</script>
<template>
  <div
    class="tracking-tight font-extrabold text-default text-primary"
    :class="{
      'text-6xl': size === 'lg',
      'text-xl': size === 'md',
      'text-lg': size === 'sm',
    }"
  >
    <slot /><span class="text-accent">.</span>
  </div>
</template>
