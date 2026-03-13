<script setup lang="ts">
import Accordion from "../Accordion/Accordion.vue";

defineOptions({ inheritAttrs: false });
</script>

<template>
  <Accordion v-bind="$attrs">
    <slot />
  </Accordion>
</template>
