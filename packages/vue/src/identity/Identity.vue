<script setup>
import { provideIdentity } from "./useIdentity";

provideIdentity();
</script>
<template>
  <slot />
</template>
