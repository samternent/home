<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { provideAppBuilder } from "@/module/builder/useAppBuilder";

// Set up breadcrumbs
useBreadcrumbs({
  path: "/builder",
  name: "App Builder",
});

// Provide app builder context to all child routes
provideAppBuilder();
</script>

<template>
  <div class="flex-1 flex w-full bg-base-100">
    <RouterView :key="$route.fullPath" />
  </div>
</template>
