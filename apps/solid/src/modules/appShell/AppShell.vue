<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { useAppApi } from "@/app/api";
import { EntityDetailsView } from "@/runtime/entities";
import SideNav from "./SideNav.vue";
import Console from "./Console.vue";
import IdentityOnboardingDialog from "./IdentityOnboardingDialog.vue";

const breakpoints = useBreakpoints(breakpointsTailwind);
const appApi = useAppApi();
const contentArea = shallowRef<HTMLElement | null>();

const smallerThanMd = breakpoints.smaller("md");

const stagedCount = computed(() => appApi.getState().stagedCount);
const integrityValid = computed(() => appApi.getState().integrityValid);
const runtimeStatus = computed(() => appApi.status.value);
const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "Identity locked",
);
const activeIdentityKey = computed(
  () =>
    appApi.identity.activeIdentity.value?.identityKey ??
    appApi.identity.activeIdentity.value?.identityId ??
    "no-active-identity",
);

const statusDotColor = computed(() => {
  if (runtimeStatus.value === "ready") {
    return "var(--ui-success)";
  }
  if (runtimeStatus.value === "error") {
    return "var(--ui-critical)";
  }
  return "var(--ui-warning)";
});
</script>
<template>
  <div class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden bg-[var(--ui-bg)] text-[var(--ui-fg)] antialiased">
    <div ref="contentArea" class="relative z-10 flex h-full flex-1 overflow-hidden">
      <SideNav />

      <slot name="drawer" />
      <div class="flex h-full w-full flex-1 flex-col overflow-hidden">
        <header class="flex h-16 items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-6 md:px-8">
          <div :class="['flex-1', { 'pl-12': smallerThanMd }]" />

          <!-- <div class="relative w-[380px] max-w-full">
            <Input
              placeholder="Search workspace..."
              size="md"
              class="!h-10 !rounded-xl !border-[var(--ui-border)] !bg-[var(--ui-tonal-tertiary)] !pl-11 !text-[13px] !font-medium placeholder:!font-medium"
              aria-label="Search workspace"
            >
              <template #leading>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[var(--ui-fg-muted)]">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </template>
            </Input>
          </div>

          <div class="flex flex-1 justify-end">
            <div class="flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 py-1.5 shadow-[var(--ui-shadow-sm)]">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)]">
                <IdentityGlyph :identity="activeIdentityKey" size="xs" />
              </div>
              <div class="pr-1 text-xs font-semibold tracking-[0.01em] text-[var(--ui-fg)]">{{ activeIdentityLabel }}</div>
            </div>
          </div> -->
        </header>

        <div class="flex h-full w-full flex-1 overflow-auto bg-[color-mix(in_srgb,var(--ui-bg)_86%,var(--ui-surface)_14%)]">
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
          <template #panel-control>
            <div class="flex w-full items-center justify-between text-[10px] tracking-[0.01em] text-[var(--ui-fg-muted)]">
              <span>
                <span class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: statusDotColor }"></span>
                <span class="capitalize" data-test="console-status-runtime">{{ runtimeStatus }}</span>
              </span>
              
              <span class="capitalize bg-[var(--ui-secondary)]/20 w-5 h-5 flex items-center justify-center rounded-full">
                {{ stagedCount }}
              </span>
            </div>
          </template>
          <slot name="console" />
        </Console>
      </div>
    </div>
    <IdentityOnboardingDialog />
    <EntityDetailsView />
  </div>
</template>
