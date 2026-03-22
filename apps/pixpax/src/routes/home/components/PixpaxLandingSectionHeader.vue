<script setup lang="ts">
import { SectionIntro } from "ternent-ui/patterns";

withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    description?: string;
    align?: "start" | "center";
    size?: "section" | "compact";
  }>(),
  {
    eyebrow: undefined,
    description: undefined,
    align: "start",
    size: "section",
  },
);
</script>

<template>
  <SectionIntro
    :eyebrow="eyebrow"
    :title="title"
    :description="description"
    :align="align"
    :size="size"
  />
</template>
