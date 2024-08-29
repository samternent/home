<script setup>
defineProps({
  activeLabel: {
    type: String,
    default: "ON",
  },
  inactiveLabel: {
    type: String,
    default: "OFF",
  },
});

const modelValue = defineModel({
  type: Boolean,
  default: false,
});
</script>
<template>
  <label class="swap">
    <input type="checkbox" v-model="modelValue" />
    <div class="swap-on">{{ activeLabel }}</div>
    <div class="swap-off">{{ inactiveLabel }}</div>
  </label>
</template>
