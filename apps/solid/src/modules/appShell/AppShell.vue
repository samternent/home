<script setup lang="ts">
import { shallowRef } from "vue";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import SideNav from "./SideNav.vue";
import Console from "./Console.vue";
import IdentityOnboardingDialog from "./IdentityOnboardingDialog.vue";

const breakpoints = useBreakpoints(breakpointsTailwind);
const contentArea = shallowRef<HTMLElement | null>();

const smallerThanMd = breakpoints.smaller("md");
</script>
<template>
  <div
    class="max-h-screen max-w-screen w-screen h-screen overflow-hidden flex flex-col"
  >
    <div
      ref="contentArea"
      class="flex-1 h-full relative flex z-10 overflow-hidden font-mono text-xs"
    >
      <SideNav />

      <slot name="drawer" />
      <div class="flex flex-col flex-1 w-full h-full overflow-hidden">
        <header
          class="sticky top-0 z-20 bg-[color-mix(in srgb, var(--ui-bg) 58%, transparent)] backdrop-blur-[12px] border-b border-[var(--ui-border)] w-full"
        >
          <div class="mx-auto flex items-center w-full justify-between">
            <div
              :class="[
                'flex items-start gap-2 w-64 px-4 py-2',
                { 'pl-16': smallerThanMd },
              ]"
            ></div>

            <nav
              class="flex items-center justify-between text-xs font-mono px-4 py-2"
            ></nav>
          </div>
        </header>

        <div class="flex flex-1 h-full w-full overflow-auto">
          <div class="flex-1 relative">
            <slot />
          </div>
          <div
            v-if="$slots['right-side']"
            class="w-64 border-l border-[var(--ui-border)] sticky top-0"
          >
            <slot name="right-side" />
          </div>
        </div>

        <Console />
      </div>
    </div>
    <IdentityOnboardingDialog />
  </div>
</template>
