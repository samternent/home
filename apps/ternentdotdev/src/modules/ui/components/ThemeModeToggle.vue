<script setup lang="ts">
import { SThemeToggle } from "ternent-ui/components";
import { useThemeMode } from "@/modules/ui";

const { mode } = useThemeMode();
</script>

<template>
  <SThemeToggle v-model="mode" />
</template>
