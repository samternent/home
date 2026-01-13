<script setup lang="ts">
import { Accordion } from "@ark-ui/vue/accordion";
import { ref } from "vue";

const items = ref(["React", "Solid", "Vue", "Svelte"]);
</script>

<template>
  <Accordion.Root multiple>
    <slot />
  </Accordion.Root>
</template>
