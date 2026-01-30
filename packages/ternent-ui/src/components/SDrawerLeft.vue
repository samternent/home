<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});
defineEmits(["update:modelValue"]);
</script>
<template>
  <div class="relative min-h-full">
    <div class="min-h-full">
      <RouterView />
    </div>
    <div v-if="modelValue" class="fixed inset-0 z-20">
      <button
        type="button"
        class="absolute inset-0 bg-[var(--ui-bg)]/60 backdrop-blur-sm"
        aria-label="close sidebar"
        @click="$emit('update:modelValue', false)"
      ></button>
      <div
        class="relative h-full w-80 max-w-[80vw] border-r border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] p-4 shadow-[var(--ui-shadow-md)]"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
