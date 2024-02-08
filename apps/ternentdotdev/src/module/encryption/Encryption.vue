<script setup>
import { provideEncryption } from "./useEncryption";

provideEncryption();
</script>
<template>
  <slot />
</template>
