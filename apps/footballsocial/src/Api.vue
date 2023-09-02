<script setup>
import { provideAxios } from "./composables/useAxios";
import PredictionService from "./routes/PredictionService.vue";

provideAxios();
</script>

<template>
  <PredictionService>
    <slot />
  </PredictionService>
</template>
