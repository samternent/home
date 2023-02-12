<script setup>
import { provideCurrentUser } from "./composables/useCurrentUser";
import { Identity } from "@/modules/identity";
import { Encryption } from "@/modules/encryption";
import App from "./App.vue";
import { NConfigProvider, darkTheme } from "naive-ui";

const { ready } = provideCurrentUser();
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="themeOverrides">
    <Encryption v-if="ready">
      <Identity>
        <App />
      </Identity>
    </Encryption>
  </NConfigProvider>
</template>
