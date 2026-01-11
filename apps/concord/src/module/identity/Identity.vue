<script setup>
import { computed, onMounted } from "vue";
import { provideIdentity } from "./useIdentity";
const { publicKey, privateKey, createIdentity, ready } = provideIdentity();

const hasIdentity = computed(() => !!publicKey.value && !!privateKey.value);
onMounted(() => {
  if (ready.value && !hasIdentity.value) {
    createIdentity();
  }
});
</script>
<template>
  <slot v-if="hasIdentity" />
</template>
