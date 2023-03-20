<script setup>
import { provideCurrentUser } from "@/api/useCurrentUser";
import App from "@/App.vue";

provideCurrentUser();
</script>

<template>
  <App />
</template>
