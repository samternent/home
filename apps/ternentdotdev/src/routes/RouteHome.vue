<script setup>
import { computed, watch, shallowRef } from "vue";
import { SThemeToggle } from "ternent-ui/components";
import { useLocalStorage } from "@vueuse/core";
import { SBrandHeader } from "ternent-ui/components";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import Logo from "@/module/brand/Logo.vue";

const whiteLabel = useWhiteLabel();

const themeVariation = useLocalStorage("app/themeVariation", null);
</script>
<template>
  <div
    class="flex h-screen flex-col justify-end flex-1 p-4 w-full max-w-7xl relative mx-auto"
  >
    <div class="flex justify-end">
      <SThemeToggle v-model="themeVariation" size="sm" />
    </div>
    <div
      class="flex-1 bg-base-200 w-full mb-12 mt-8 border border-base-300 mx-auto max-w-6xl overflow-auto relative"
    >
      <RouterView />
    </div>
    <div class="flex items-center justify-between flex-1 max-h-20 w-full">
      <RouterLink to="/" class="flex items-center">
        <Logo class="h-auto w-16 lg:w-20 mr-2" />
        <div class="flex flex-0 flex-col justify-center">
          <SBrandHeader
            >{{ whiteLabel.name[0]
            }}<span class="font-light text-primary">{{
              whiteLabel.name[1]
            }}</span
            >{{ whiteLabel.name[2] }}</SBrandHeader
          >
          <p class="text-xl font-light px-1 flex items-center">
            <!-- {{ whiteLabel.description }}÷ -->
            <span class="text-lg bg-secondary px-1 text-base-100">{{
              whiteLabel.tag
            }}</span>
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
            class="h-16"
            src="@/assets/github-mark-white.png"
          />
          <img v-else class="h-16" src="@/assets/github-mark.png" />
        </a>
      </div>
    </div>
  </div>
</template>
