<script setup lang="ts">
import { LandingPage } from "ternent-ui/patterns";
import { appConfig, landingPageConfig } from "@/app/config/app.config";
import HeroProofArtifactCard from "@/modules/proof/components/HeroProofArtifactCard.vue";
import LivePublishedProofJson from "@/modules/proof/components/LivePublishedProofJson.vue";
import PublishedSiteProofPreview from "@/modules/proof/components/PublishedSiteProofPreview.vue";

const publishedSiteBaseUrl = import.meta.env.DEV
  ? "/_seal"
  : `https://${appConfig.defaultHost}`;
</script>

<template>
  <LandingPage :config="landingPageConfig">
    <template #hero-preview>
      <HeroProofArtifactCard :base-url="publishedSiteBaseUrl" />
    </template>

    <template v-slot:proofJson>
      <LivePublishedProofJson :base-url="publishedSiteBaseUrl" />
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
