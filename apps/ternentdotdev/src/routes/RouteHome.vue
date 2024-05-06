<script setup>
import { computed, watch, shallowRef } from "vue";
import { SThemeToggle } from "ternent-ui/components";
import { useLocalStorage } from "@vueuse/core";
import { SBrandHeader, SButton } from "ternent-ui/components";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import Logo from "@/module/brand/Logo.vue";

const whiteLabel = useWhiteLabel();

const themeVariation = useLocalStorage("app/themeVariation", null);
</script>
<template>
  <div
    class="flex flex-col justify-end flex-1 w-full max-w-7xl relative mx-auto"
  >
    <div
      class="flex justify-between h-14 p-2 items-center sticky top-0 z-10 bg-base-100"
    >
      <SButton
        v-if="$route.path !== '/'"
        type="secondary"
        class="btn-sm justify-left"
        to="/"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        back
      </SButton>
      <div v-else />
      <SThemeToggle v-model="themeVariation" size="sm" />
    </div>
    <div
      class="flex-1 w-full mb-12 mt-6 mx-auto max-w-6xl relative h-full flex overeflow-hidden"
    >
      <RouterView />
    </div>
    <div
      class="sticky bottom-0 flex items-center justify-between flex-1 p-4 max-h-24 w-full"
    >
      <RouterLink to="/" class="flex items-center">
        <Logo class="h-auto w-16 lg:w-18 mr-2" />
        <div class="flex flex-0 flex-col justify-center">
          <SBrandHeader class="!text-2xl lg:!text-3xl"
            >{{ whiteLabel.name[0]
            }}<span class="font-light text-secondary text-xl lg:text-2xl">{{
              whiteLabel.name[1]
            }}</span
            >{{ whiteLabel.name[2] }}</SBrandHeader
          >
          <p class="text-xl font-light px-1 flex items-center">
            <!-- {{ whiteLabel.description }}÷ -->
            <span
              class="text-xs md:!text-sm lg:!text-lg bg-primary px-2 text-base-100"
              >{{ whiteLabel.tag }}</span
            >
          </p>
          <span class="text-sm font-light"> </span>
        </div>
      </RouterLink>
      <div class="flex items-center">
        <a
          href="https://github.com/samternent"
          target="_blank"
          class="opacity-80 hover:opacity-100 transition-colors"
        >
          <img
            v-if="themeVariation === 'dark'"
            class="w-14 lg:w-16"
            src="@/assets/github-mark-white.png"
          />
          <img v-else class="w-14 lg:w-16" src="@/assets/github-mark.png" />
        </a>
      </div>
    </div>
  </div>
</template>
