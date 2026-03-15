<script setup lang="ts">
import { LandingPage } from "ternent-ui/patterns";
import { appConfig, landingPageConfig } from "@/app/config/app.config";
</script>

<template>
  <LandingPage :app-title="appConfig.appTitle" :config="landingPageConfig" />
</template>
