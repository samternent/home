<script setup lang="ts">
import { useLocalStorage, breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { computed, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppApi, type AppLedgerContainer } from "@/app/api";
import { Button, SplitButton } from "ternent-ui/primitives";
import { IdentityHandle, SidebarNav } from "ternent-ui/patterns";
import type { SidebarNavSection } from "ternent-ui/patterns";
import { buildSidebarNavigationSections } from "./navigation";
import ThemeModeToggle from "./ThemeModeToggle.vue";
import Logo from "./Logo.vue";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();
const appApi = useAppApi();

const mdAndLarger = breakpoints.greaterOrEqual("md");
const smallerThanMd = breakpoints.smaller("md");

const openSideBar = useLocalStorage("ternentdotdev/openSideBar", true);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);

watch(route, () => {
  openSideBar.value = false;
});

const appVersion = shallowRef(
  typeof document !== "undefined" ? document.querySelector("html")?.dataset.appVersion : undefined,
);

const navigationSections = computed<SidebarNavSection[]>(() =>
  buildSidebarNavigationSections(route.path),
);

const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "Identity locked",
);
const activeIdentityId = computed(
  () => appApi.identity.activeIdentity.value?.identityId ?? "no-active-identity",
);
const activeIdentityKey = computed(
  () => appApi.identity.activeIdentity.value?.identityKey ?? "invalid-identity",
);
const activeIdentityShortId = computed(() => activeIdentityId.value.slice(0, 12));
const identityTone = computed<"success" | "warning" | "critical">(() => {
  if (appApi.status.value === "ready" && appApi.identity.activeIdentity.value) {
    return "success";
  }
  if (appApi.status.value === "error") {
    return "critical";
  }
  return "warning";
});
const identityDotColor = computed(() => `var(--ui-${identityTone.value})`);

const releaseHref = computed(() =>
  appVersion.value
    ? `https://github.com/samternent/home/releases/tag/concord-demo-${appVersion.value}`
    : "https://github.com/samternent/home/releases",
);
const ledgerUploadInputRef = shallowRef<HTMLInputElement | null>(null);
const ledgerActionBusy = shallowRef(false);
const identityActionBusy = shallowRef(false);

function handleNavSelect(): void {
  if (smallerThanMd.value) {
    openSideBar.value = false;
  }
}

function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 250);
}

function triggerLedgerImport(): void {
  ledgerUploadInputRef.value?.click();
}

async function createLedger(): Promise<void> {
  const confirmed = window.confirm(
    "Create a new ledger? This replaces the current ledger and cannot be undone.",
  );
  if (!confirmed) {
    return;
  }

  ledgerActionBusy.value = true;
  try {
    await appApi.createLedger({
      source: "sidebar-control",
    });
  } catch (error) {
    window.alert(error instanceof Error ? error.message : String(error));
  } finally {
    ledgerActionBusy.value = false;
  }
}

async function importLedgerFile(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) {
    return;
  }
  target.value = "";

  let container: AppLedgerContainer;
  try {
    container = JSON.parse(await file.text()) as AppLedgerContainer;
  } catch {
    window.alert("Invalid ledger JSON file.");
    return;
  }

  const confirmed = window.confirm(
    `Import '${file.name}'? This replaces the current ledger and cannot be undone.`,
  );
  if (!confirmed) {
    return;
  }

  ledgerActionBusy.value = true;
  try {
    await appApi.importLedger(container);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : String(error));
  } finally {
    ledgerActionBusy.value = false;
  }
}

async function exportLedger(): Promise<void> {
  ledgerActionBusy.value = true;
  try {
    const ledger = await appApi.exportLedger();
    const head = ledger.head.slice(0, 12);
    const filename = `concord-ledger-${head}.json`;
    downloadJson(filename, JSON.stringify(ledger, null, 2));
  } catch (error) {
    window.alert(error instanceof Error ? error.message : String(error));
  } finally {
    ledgerActionBusy.value = false;
  }
}

async function exportIdentity(): Promise<void> {
  identityActionBusy.value = true;
  try {
    const activeIdentity = appApi.identity.getActiveIdentity();
    if (!activeIdentity) {
      throw new Error("Active identity is unavailable.");
    }
    const summary = appApi.identity.getStoredIdentitySummary();
    const payload = {
      format: "ternent-concord-public-identity",
      version: "1",
      exportedAt: new Date().toISOString(),
      identity: {
        identityId: activeIdentity.identityId,
        identityKey: activeIdentity.identityKey,
        publicKey: summary?.publicKey ?? undefined,
        label: activeIdentity.label,
      },
    };
    const suffix = activeIdentity.identityId.slice(-12);
    const filename = `concord-public-identity-${suffix}.json`;
    downloadJson(filename, JSON.stringify(payload, null, 2));
  } catch (error) {
    window.alert(error instanceof Error ? error.message : String(error));
  } finally {
    identityActionBusy.value = false;
  }
}

async function relaunchOnboarding(): Promise<void> {
  await appApi.identity.lock();
}
</script>
<template>
  <div
    v-if="showSidebar"
    class="sticky top-0"
    :class="{
      'w-64': mdAndLarger,
      'absolute z-30 h-full w-64': smallerThanMd && openSideBar,
    }"
  >
    <SidebarNav title="Concord" :sections="navigationSections" @select="handleNavSelect">
      <template #header>
        <div class="flex w-full items-center justify-between gap-2">
          <div class="flex items-center justify-start gap-2 w-full ">
            <RouterLink to="/" class="m-1.5 group hover:grayscale-0 transition duration-300">
              <Logo class="size-6 group-hover:-rotate-6 transition-all duration-300" />
            </RouterLink>
          </div>
          <Button
            v-if="smallerThanMd"
            variant="plain-secondary"
            size="xs"
            aria-label="Close navigation"
            @click="openSideBar = false"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col gap-2">
          <input
            ref="ledgerUploadInputRef"
            type="file"
            accept="application/json"
            class="hidden"
            data-test="sidebar-ledger-import-input"
            @change="importLedgerFile"
          />

          <SplitButton
            :disabled="identityActionBusy"
            menuWidth="w-56"
            data-test="sidebar-identity-management"
          >
            <template #primary>
              <div class="min-w-0 flex-1 px-3 py-2">
                <IdentityHandle
                  :identity="activeIdentityKey"
                  :label="activeIdentityLabel"
                  :identity-text="activeIdentityShortId"
                  size="sm"
                  data-test="sidebar-active-identity-handle"
                >
                  <template #status>
                    <span
                      class="inline-block h-2 w-2 rounded-full"
                      :style="{ backgroundColor: identityDotColor }"
                      data-test="sidebar-active-identity-status"
                    ></span>
                  </template>
                </IdentityHandle>
                <span class="sr-only" data-test="sidebar-active-identity-label">
                  {{ activeIdentityLabel }}
                </span>
                <span class="sr-only" data-test="sidebar-active-identity-id">
                  {{ activeIdentityShortId }}
                </span>
              </div>
            </template>
            <template #menu="{ closeMenu }">
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--ui-fg)]/5 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="identityActionBusy"
                data-test="sidebar-identity-export"
                @click="
                  exportIdentity();
                  closeMenu();
                "
              >
                Export Public Identity (JSON)
              </button>
            </template>
          </SplitButton>

          <SplitButton
            :disabled="ledgerActionBusy"
            menuWidth="w-56"
            data-test="sidebar-ledger-management"
          >
            <template #primary>
              <button
                type="button"
                class="flex-1 px-4 py-2 text-left text-xs font-medium transition-colors hover:bg-[var(--ui-fg)]/5 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="ledgerActionBusy"
                data-test="sidebar-ledger-create"
                @click="createLedger"
              >
                Create Ledger
              </button>
            </template>
            <template #menu="{ closeMenu }">
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--ui-fg)]/5 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="ledgerActionBusy"
                data-test="sidebar-ledger-import"
                @click="
                  triggerLedgerImport();
                  closeMenu();
                "
              >
                Import Ledger (JSON)
              </button>
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--ui-fg)]/5 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="ledgerActionBusy"
                data-test="sidebar-ledger-export"
                @click="
                  exportLedger();
                  closeMenu();
                "
              >
                Export Ledger (JSON)
              </button>
            </template>
          </SplitButton>

          <Button
            as="a"
            :href="releaseHref"
            target="_blank"
            rel="noreferrer noopener"
            variant="plain-secondary"
            size="xs"
            class="w-full justify-start font-mono"
          >
            v{{ appVersion ?? "dev" }}
          </Button>

          <div class="flex items-center gap-2">
            <Button class="flex-1" variant="secondary" size="sm" @click="relaunchOnboarding">
              Lock
            </Button>
            <ThemeModeToggle />
          </div>
        </div>
      </template>
    </SidebarNav>
  </div>

  <div v-if="smallerThanMd && !openSideBar" class="fixed left-0 top-0 z-40 m-2">
    <Button
      variant="plain-secondary"
      size="sm"
      aria-label="Open navigation"
      @click="openSideBar = !openSideBar"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-6"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </Button>
  </div>
</template>
