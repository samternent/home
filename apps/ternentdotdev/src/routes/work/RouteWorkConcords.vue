<script setup>
import { SBrandHeader, SBrowserMockup, SCard } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/work/concords",
  name: "Concords",
});
</script>
<template>
  <div class="h-full flex-1 p-micro">
    <SCard>
      <h1 class="gradient-heading text-heading-lg">Concords</h1>
    </SCard>
  </div>
</template>
