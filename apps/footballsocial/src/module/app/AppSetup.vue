<script setup>
import { provideCurrentUser } from "../auth/useCurrentUser";
import { provideAppVersion } from "./useAppVersion";

provideAppVersion();
provideCurrentUser();
</script>

<template>
  <slot />
</template>
