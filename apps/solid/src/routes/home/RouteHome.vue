<script setup lang="ts">
import { LandingPage } from "ternent-ui/patterns";
import { appConfig, landingPageConfig } from "@/app/config/app.config";
import PublishedSiteProofBadge from "@/modules/site-proof/components/PublishedSiteProofBadge.vue";

const publishedSiteBaseUrl = import.meta.env.DEV
  ? ""
  : `https://${appConfig.defaultHost}`;
</script>

<template>
  <LandingPage :config="landingPageConfig">
    <template #footer-meta>
      <PublishedSiteProofBadge
        :base-url="publishedSiteBaseUrl"
        with-popover
      />
    </template>
  </LandingPage>
</template>
