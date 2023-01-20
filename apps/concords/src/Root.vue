<script setup>
import { provideCurrentUser } from "./composables/useCurrentUser";
import { Identity } from "@/modules/identity";
import { Encryption } from "@/modules/encryption";
import App from "./App.vue";

const { user, profile, ready } = provideCurrentUser();
</script>

<template>
  <div class="text-white absolute inset-0 flex flex-col">
    <div class="flex-1 flex flex-col" v-if="ready">
      <Encryption>
        <Identity>
          <App v-if="ready" />
        </Identity>
      </Encryption>
    </div>
  </div>
</template>
