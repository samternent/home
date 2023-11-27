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
    class="tracking-tight font-extrabold text-default"
    :class="{
      'text-4xl lg:text-5xl': size === 'lg',
      'text-2xl': size === 'md',
      'text-lg': size === 'sm',
    }"
  >
    <slot /><span class="text-accent">.</span>
  </div>
</template>
