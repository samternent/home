<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { Badge, Input } from "ternent-ui/primitives";
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

const statusTone = computed<"success" | "warning" | "critical">(() => {
  if (appApi.status.value === "ready") {
    return "success";
  }
  if (appApi.status.value === "error") {
    return "critical";
  }
  return "warning";
});

const integrityTone = computed<"success" | "critical">(() =>
  integrityValid.value ? "success" : "critical",
);

const stagedTone = computed<"warning" | "neutral">(() =>
  stagedCount.value > 0 ? "warning" : "neutral",
);

const statusDotColor = computed(() => `var(--ui-${statusTone.value})`);
const integrityDotColor = computed(() => `var(--ui-${integrityTone.value})`);
</script>
<template>
  <div class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden">
    <div ref="contentArea" class="relative z-10 flex h-full flex-1 overflow-hidden">
      <SideNav />

      <slot name="drawer" />
      <div class="flex h-full w-full flex-1 flex-col overflow-hidden">
        <header
          class="sticky top-0 z-20 w-full border-b border-[var(--ui-border)] bg-[var(--ui-bg)] backdrop-blur-[12px]"
        >
          <div class="mx-auto flex w-full items-center justify-between px-4 py-2">
            <div :class="['w-64', { 'pl-12': smallerThanMd }]"></div>

            <nav class="flex items-center justify-between gap-2">
              <Input placeholder="Search..." size="sm" class="w-56" aria-label="Search" />
            </nav>
          </div>
        </header>

        <div class="flex h-full w-full flex-1 overflow-auto bg-[var(--ui-surface)]">
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
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] px-2 py-1 text-[var(--ui-fg-muted)]"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full"
                  :style="{ backgroundColor: statusDotColor }"
                ></span>
                <span data-test="console-status-runtime">{{ appApi.status.value }}</span>
              </div>

              <div
                class="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] px-2 py-1 text-[var(--ui-fg-muted)]"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full"
                  :style="{ backgroundColor: integrityDotColor }"
                ></span>
                <span data-test="console-status-integrity">
                  {{ integrityValid ? "Integrity verified" : "Integrity issue" }}
                </span>
              </div>

              <Badge :tone="stagedTone" variant="soft" size="xs" data-test="console-status-staged">
                {{
                  stagedCount > 0 ? `${stagedCount} staged · needs attention` : "No staged entries"
                }}
              </Badge>
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
