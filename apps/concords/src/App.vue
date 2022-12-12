<script setup>
import { provideCurrentUser } from "./composables/useCurrentUser";

const { user, profile, ready } = provideCurrentUser();
</script>

<template>
  <div class="text-white absolute inset-0 flex flex-col">
    <div class="flex-1 flex flex-col" v-if="ready">
      <RouterView />
    </div>
  </div>
</template>
