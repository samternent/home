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
    class="tracking-tighter font-extrabold text-default"
    :class="{
      'text-3xl lg:text-4xl': size === 'lg',
      'text-2xl': size === 'md',
      'text-lg': size === 'sm',
    }"
  >
    <slot /><span class="text-accent">.</span>
  </div>
</template>
