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
  Button: {
    textColor: "#FF0000",
  },
  Select: {
    peers: {
      InternalSelection: {
        textColor: "#FF0000",
      },
    },
  },
  // ...
};

const { user, profile, ready } = provideCurrentUser();
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="themeOverrides">
    <div class="text-white absolute inset-0 flex flex-col">
      <div class="flex-1 flex flex-col" v-if="ready">
        <Encryption>
          <Identity>
            <App v-if="ready" />
          </Identity>
        </Encryption>
      </div>
    </div>
  </NConfigProvider>
</template>
