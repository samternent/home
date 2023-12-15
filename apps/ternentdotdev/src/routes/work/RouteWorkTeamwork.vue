<script setup>
import { SBrandHeader, STimeline } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/work/teamwork",
  name: "Teamwork",
});
</script>
<template>
  <div class="h-full flex-1 p-4">
    <SBrandHeader class="font-light">Teamwork.com</SBrandHeader>
    <p class="my-4 text-lg">Permanent / full-time employment</p>
    <SBrandHeader size="md" class="my-4 font-light"
      >Career journey</SBrandHeader
    >
    <STimeline class="max-w-4xl" />
  </div>
</template>
