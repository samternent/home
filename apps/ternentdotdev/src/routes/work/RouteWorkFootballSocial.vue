<script setup>
import { useLocalStorage } from "@vueuse/core";
import { SBrandHeader, SBrowserMockup } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/work/football-social",
  name: "Football Social",
});

const viewType = useLocalStorage("work/footballSocial/viewType", "mobile");
</script>
<template>
  <div class="h-full flex-1 p-4">
    <SBrandHeader class="font-light">Football Social</SBrandHeader>
    <p class="my-2 mx-1 text-lg">
      A free-to-play, open-source football predictions app.
    </p>
    <p class="my-2 mx-1 text-lg">
      This projects serves as the base for the ternent.dev application stack. It
      is a playground to try and deploy new ideas and create a reusable
      infrastructure.
    </p>
  </div>
</template>
