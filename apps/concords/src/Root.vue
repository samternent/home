<script setup>
import { provideCurrentUser } from "@/api/useCurrentUser";
import { Identity } from "@/modules/identity";
import { Encryption } from "@/modules/encryption";
import App from "@/App.vue";

const { ready } = provideCurrentUser();
</script>

<template>
  <Encryption v-if="ready">
    <Identity>
      <App />
    </Identity>
  </Encryption>
</template>
