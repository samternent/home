<script setup>
import AppSetup from "@/module/app/AppSetup.vue";
import ApiSetup from "@/module/app/ApiSetup.vue";
import AppShell from "@/module/app/AppShell.vue";
</script>

<template>
  <AppSetup>
    <ApiSetup>
      <AppShell />
    </ApiSetup>
  </AppSetup>
</template>
