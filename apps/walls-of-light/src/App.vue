<script setup>
// DS components
import { SFooter, SBrandHeader, SButton } from "ternent-ui/components";

const links = [
  {
    title: "Privacy",
    to: "/legal/privacy",
  },
  {
    title: "Terms",
    to: "/legal/terms",
  },
];
</script>

<template>
  <div
    class="min-h-screen max-h-screen h-screen flex flex-col"
    :data-theme="'wallsOfLight'"
  >
    <RouterView />
  </div>
</template>
