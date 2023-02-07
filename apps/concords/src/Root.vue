<script setup>
import { provideCurrentUser } from "./composables/useCurrentUser";
import { Identity } from "@/modules/identity";
import { Encryption } from "@/modules/encryption";
import App from "./App.vue";
import { NConfigProvider, darkTheme } from "naive-ui";

/**
 * Use this for type hints under js file
 * @type import('naive-ui').GlobalThemeOverrides
 */
const themeOverrides = {
  common: {
    primaryColor: "#DB2877",
  },
  Button: {},
  Select: {
    peers: {
      InternalSelection: {
        padding: "10px",
      },
    },
  },
  // ...
};

const { user, profile, ready } = provideCurrentUser();
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
