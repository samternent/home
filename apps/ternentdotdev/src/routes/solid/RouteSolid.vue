<script setup>
import { SButton } from "ternent-ui/components";
import { useSolid } from "@/module/solid/useSolid";
import Solid from "@/module/solid/Solid.vue";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/solid",
  name: "Solid",
});
const { hasSolidSession, providers, oidcIssuer, login } = useSolid();
</script>
<template>
  <div class="flex w-full flex-1 justify-center items-center">
    <div v-if="!hasSolidSession" class="flex flex-col w-96 items-center gap-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold mb-2">🌐 Connect to Solid Pod</h2>
        <p class="text-base-content/70">Choose your Solid provider to sync ledgers with your personal data pod</p>
      </div>

      <div class="w-full">
        <label class="block text-sm font-medium mb-2">Solid Provider</label>
        <select v-model="oidcIssuer" class="select select-bordered w-full">
          <option v-for="provider in providers" :key="provider" :value="provider">
            {{ provider.replace('https://', '').replace('http://', '') }}
          </option>
        </select>
        <div class="text-xs text-base-content/60 mt-1">
          Select the provider where your Solid pod is hosted
        </div>
      </div>

      <SButton @click="login" type="accent" class="w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Connect to {{ oidcIssuer.replace('https://', '').replace('http://', '') }}
      </SButton>
      
      <div class="text-xs text-base-content/60 text-center">
        <div class="mb-2">Don't have a Solid pod? Get one free at:</div>
        <div class="flex flex-wrap gap-2 justify-center">
          <a href="https://login.inrupt.com" target="_blank" class="link">login.inrupt.com</a>
          <a href="https://solidcommunity.net" target="_blank" class="link">solidcommunity.net</a>
          <a href="https://solidweb.org" target="_blank" class="link">solidweb.org</a>
        </div>
      </div>
    </div>
    <Solid v-else />
  </div>
</template>
