<script setup>
import { providePredictionService } from "../composables/usePredictionService";

providePredictionService();
</script>

<template>
  <slot />
</template>
