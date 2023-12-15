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
    <SBrowserMockup
      url="https://ledger-web-app-chi.vercel.app/"
      class="w-full max-w-7xl my-4 h-5/6"
    />
  </div>
</template>
