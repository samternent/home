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
const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "Identity locked",
);
</script>
<template>
  <div class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden bg-slate-100/80">
    <div ref="contentArea" class="relative z-10 flex h-full flex-1 overflow-hidden">
      <SideNav />

      <slot name="drawer" />
      <div class="flex h-full w-full flex-1 flex-col overflow-hidden">
        <header
          class="sticky top-0 z-20 w-full border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-[12px]"
        >
          <div class="mx-auto flex w-full items-center gap-3 px-4 py-3 md:px-6">
            <div :class="['min-w-0 flex-1', { 'pl-12': smallerThanMd }]">
              <p class="m-0 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Workspace
              </p>
              <p class="m-0 truncate pt-0.5 text-sm font-semibold text-slate-900">
                Concord Ledger Workspace
              </p>
            </div>

            <nav class="flex min-w-0 flex-1 items-center justify-end gap-2">
              <Input
                placeholder="Search tasks, users, permissions..."
                size="sm"
                class="w-64 max-w-full"
                aria-label="Search workspace"
              >
                <template #leading>
                  <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="m14.5 14.5 3 3M16.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </template>
              </Input>
              <Badge tone="success" variant="soft" size="xs" class="hidden md:inline-flex">
                {{ activeIdentityLabel }}
              </Badge>
            </nav>
          </div>
        </header>

        <div class="flex h-full w-full flex-1 overflow-auto bg-slate-100/70">
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
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full"
                  :style="{ backgroundColor: statusDotColor }"
                ></span>
                <span data-test="console-status-runtime">{{ appApi.status.value }}</span>
              </div>

              <div
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600"
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
