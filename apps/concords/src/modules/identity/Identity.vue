<script setup>
import { provideIdentity } from "./useIdentity";
const { ready } = provideIdentity();
</script>
<template>
  <slot v-if="ready" />
</template>
