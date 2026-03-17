<script setup lang="ts">
import { LandingPage } from "ternent-ui/patterns";
import { appConfig, landingPageConfig } from "@/app/config/app.config";
import ArmourHeroEnvelopeCard from "@/modules/landing/components/ArmourHeroEnvelopeCard.vue";
import LiveArmourEnvelopeJson from "@/modules/landing/components/LiveArmourEnvelopeJson.vue";
import PublishedSiteProofBadge from "@/modules/site-proof/components/PublishedSiteProofBadge.vue";

const publishedSiteBaseUrl = import.meta.env.DEV
  ? ""
  : `https://${appConfig.defaultHost}`;
</script>

<template>
  <LandingPage :config="landingPageConfig">
    <template #hero-preview>
      <ArmourHeroEnvelopeCard />
    </template>

    <template #proofJson>
      <LiveArmourEnvelopeJson />
    </template>

    <template #footer-meta>
      <PublishedSiteProofBadge
        :base-url="publishedSiteBaseUrl"
        with-popover
      />
    </template>
  </LandingPage>
</template>
