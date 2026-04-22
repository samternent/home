<script setup lang="ts">
import { shallowRef } from "vue";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { Input } from "ternent-ui/primitives";
import SideNav from "./SideNav.vue";
import Console from "./Console.vue";
import IdentityOnboardingDialog from "./IdentityOnboardingDialog.vue";

const breakpoints = useBreakpoints(breakpointsTailwind);
const contentArea = shallowRef<HTMLElement | null>();

const smallerThanMd = breakpoints.smaller("md");
</script>
<template>
  <div
    class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden"
  >
    <div
      ref="contentArea"
      class="relative z-10 flex h-full flex-1 overflow-hidden"
    >
      <SideNav />

      <slot name="drawer" />
      <div class="flex h-full w-full flex-1 flex-col overflow-hidden">
        <header
          class="sticky top-0 z-20 w-full border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-bg)_58%,transparent)] backdrop-blur-[12px]"
        >
          <div class="mx-auto flex w-full items-center justify-between px-4 py-2">
            <div
              :class="[
                'w-64',
                { 'pl-12': smallerThanMd },
              ]"
            ></div>

            <nav class="flex items-center justify-between gap-2">
              <Input
                placeholder="Search..."
                size="sm"
                class="w-56"
                aria-label="Search"
              />
            </nav>
          </div>
        </header>

        <div class="flex h-full w-full flex-1 overflow-auto">
          <div class="relative flex-1">
            <slot />
          </div>
          <div
            v-if="$slots['right-side']"
            class="sticky top-0 w-64 border-l border-[var(--ui-border)]"
          >
            <slot name="right-side" />
          </div>
        </div>

        <Console :container="contentArea">
          <slot name="console" />
        </Console>
      </div>
    </div>
    <IdentityOnboardingDialog />
  </div>
</template>
