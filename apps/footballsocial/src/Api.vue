<script setup>
import { provideAxios } from "./composables/useAxios";
import PredictionService from "./PredictionService.vue";

provideAxios();
</script>

<template>
  <PredictionService>
    <slot />
  </PredictionService>
</template>
