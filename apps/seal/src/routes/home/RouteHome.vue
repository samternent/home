<script setup lang="ts">
import { LandingPage } from "ternent-ui/patterns";
import { appConfig, landingPageConfig } from "@/app/config/app.config";
import PublishedSiteProofPreview from "@/modules/proof/components/PublishedSiteProofPreview.vue";

const publishedSiteBaseUrl = import.meta.env.DEV
  ? "/_seal"
  : `https://${appConfig.defaultHost}`;
</script>

<template>
  <LandingPage :config="landingPageConfig">
    <template #hero-preview>
      <PublishedSiteProofPreview
        mode="details"
        headline="Verified proof"
        :base-url="publishedSiteBaseUrl"
        variant="full"
      />
    </template>

    <template #footer-meta>
      <PublishedSiteProofPreview
        mode="badge"
        :base-url="publishedSiteBaseUrl"
        with-popover
      />
    </template>
  </LandingPage>
</template>
