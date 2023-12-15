<script setup>
import { SBrandHeader } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/about/services",
  name: "Services",
});
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <SBrandHeader class="font-light">First hire / App starter</SBrandHeader>
    <p>We can scaffold a tech stack of your chosing.</p>
  </div>
</template>
