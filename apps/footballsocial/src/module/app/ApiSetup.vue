<script setup>
import { provideAxios } from "./useAxios";

provideAxios();
</script>

<template>
  <slot />
</template>
