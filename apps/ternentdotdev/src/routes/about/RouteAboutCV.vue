<script setup>
import { SBrandHeader } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/about/CV",
  name: "CV",
});
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <SBrandHeader class="font-light">Resume</SBrandHeader>
  </div>
</template>
