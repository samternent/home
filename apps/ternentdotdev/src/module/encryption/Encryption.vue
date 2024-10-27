<script setup>
import { provideEncryption } from "./useEncryption";

const { isReady } = provideEncryption();
</script>
<template>
  <slot v-if="isReady" />
</template>
