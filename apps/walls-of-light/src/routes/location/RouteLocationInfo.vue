<script setup>
import { computed } from "vue";
import bearwood from "@/module/locations/bearwood";

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
});

const info = computed(() =>
  bearwood.find((location) => location.slug === props.slug)
);
</script>
<template>
  <div class="flex flex-col">
    <h1 class="text-3xl">{{ info.artist }}</h1>
  </div>
</template>
