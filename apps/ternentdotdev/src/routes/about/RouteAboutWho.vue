<script setup>
import { SBrandHeader } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/about/who",
  name: "Who?",
});
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <SBrandHeader class="font-light"
      >Specialists in Frontend and Platform Engineering</SBrandHeader
    >
    <div class="my-6"></div>
  </div>
</template>
