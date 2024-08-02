<script setup>
import { SButton } from "ternent-ui/components";
import { useSolid } from "@/module/solid/useSolid";
import Solid from "@/module/solid/Solid.vue";

const { hasSolidSession, providers, oidcIssuer, login } = useSolid();
</script>
<template>
  <div class="flex justify-start">
    <div v-if="!hasSolidSession">
      <select v-model="oidcIssuer" class="p-2 w-full">
        <option v-for="provider in providers" :key="provider" :value="provider">
          {{ provider }}
        </option>
      </select>

      <SButton @click="login" type="accent">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 inline mx-2"
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
        Connect to Solid Pod
      </SButton>
    </div>
    <Solid v-else />
  </div>
</template>
