<script setup>
defineProps({
  url: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <div class="mockup-browser bg-base-300 flex flex-col shadow-lg">
    <div class="mockup-browser-toolbar">
      <div class="input border border-base-300">{{ url }}</div>
    </div>
    <div
      class="flex flex-1 flex-col items-stretch justify-center border-t border-base-300"
    >
      <iframe :src="url" class="flex-1 flex" />
    </div>
  </div>
</template>
