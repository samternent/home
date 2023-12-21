<script setup>
import { SBrandHeader, SBrowserMockup } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/work/concords",
  name: "Concords",
});
</script>
<template>
  <div class="h-full flex-1 p-4">
    <SBrandHeader class="font-light">Concords</SBrandHeader>
  </div>
</template>
