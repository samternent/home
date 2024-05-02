<script setup>
import { provideCurrentUser } from "./composables/useCurrentUser";
import { provideAppVersion } from "./composables/useAppVersion";

provideAppVersion();
provideCurrentUser();
</script>

<template><slot /></template>
