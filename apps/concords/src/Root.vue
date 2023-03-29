<script setup>
import { provideCurrentUser } from "@/api/useCurrentUser";
import Setup from "./Setup.vue";
import App from "@/App.vue";

const { ready } = provideCurrentUser();
</script>

<template>
  <Setup>
    <App v-if="ready" />
  </Setup>
</template>
