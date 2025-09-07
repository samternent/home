<script setup>
import { useLocalStorage } from "@vueuse/core";
import { SBrandHeader, SBrowserMockup, SCard } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/work/football-social",
  name: "Football Social",
});

const viewType = useLocalStorage("work/footballSocial/viewType", "mobile");
</script>
<template>
  <div class="h-full flex-1 p-micro">
    <SCard>
      <h1 class="gradient-heading text-heading-lg mb-micro">Football Social</h1>
      <p class="text-body-md text-foreground mb-micro">
        A free-to-play, open-source football predictions app.
      </p>
      <p class="text-body-md text-foreground">
        This projects serves as the base for the ternent.dev application stack. It
        is a playground to try and deploy new ideas and create a reusable
        infrastructure.
      </p>
    </SCard>
  </div>
</template>
