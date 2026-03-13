<script setup lang="ts">
import { SButton } from "ternent-ui/components";
import { useThemeMode } from "@/modules/ui";

const { isDark, toggleTheme } = useThemeMode();
</script>

<template>
  <SButton type="secondary" @click="toggleTheme">
    {{ isDark ? "Use light mode" : "Use dark mode" }}
  </SButton>
</template>
