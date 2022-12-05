<script setup>
import { toRefs, computed } from "vue";
import PlayerKit from "./PlayerKit.vue";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: String,
    required: true,
  },
  nationality: {
    type: String,
    required: true,
  },
  colors: {
    type: String,
    default: "White / Black",
  },
  shirtNumber: {
    type: String,
    default: null,
  },
});

const { colors } = toRefs(props);
</script>
<template>
  <h2 class="lg:text-xl font-light">
    {{ name }}
  </h2>
  <div class="flex flex-col items-center justify-center">
    <PlayerKit :colors="colors" :shirtNumber="shirtNumber" />
  </div>
</template>
