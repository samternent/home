<script setup>
import AppShell from "./modules/layout/AppShell.vue";
import MainNav from "./modules/nav/MainNav.vue";
</script>
<template>
  <AppShell>
    <template #side-nav>
      <MainNav />
    </template>
    <RouterView />
  </AppShell>
</template>
