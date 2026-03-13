<script setup lang="ts">
import AccordionItem from "../Accordion/AccordionItem.vue";

defineOptions({ inheritAttrs: false });
</script>

<template>
  <AccordionItem v-bind="$attrs">
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <slot />
  </AccordionItem>
</template>
