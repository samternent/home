<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
useBreadcrumbs({
  path: "/portfolio",
  name: "Portfolio",
});
</script>
<template>
  <RouterView />
</template>
