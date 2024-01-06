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
  <div class="drawer drawer-start">
    <input
      id="my-drawer-4"
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', !modelValue)"
      class="drawer-toggle"
    />
    <div class="drawer-content">
      <RouterView />
    </div>
    <div class="drawer-side z-20">
      <label
        for="my-drawer-4"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <div class="p-4 w-full min-h-full bg-base-200 text-base-content">
        <slot />
      </div>
    </div>
  </div>
</template>
