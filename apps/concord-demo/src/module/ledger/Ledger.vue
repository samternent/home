<script setup>
import { provideLedger } from "./useLedger";

provideLedger();
</script>
<template>
  <slot />
</template>
