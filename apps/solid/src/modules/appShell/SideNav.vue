<script setup lang="ts">
import { useLocalStorage, breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { computed, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppApi, type AppLedgerContainer } from "@/app/api";
import { Button, SplitButton } from "ternent-ui/primitives";
import { IdentityGlyph, SidebarNav } from "ternent-ui/patterns";
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

const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "Identity locked",
);
const activeIdentityId = computed(
  () => appApi.identity.activeIdentity.value?.identityId ?? "no-active-identity",
);
const activeIdentityKey = computed(
  () => appApi.identity.activeIdentity.value?.identityKey ?? activeIdentityId.value,
);
const activeIdentityShortId = computed(() => activeIdentityId.value.slice(0, 12));

const taskCount = computed(() => {
  try {
    const boardId = appApi.tasks.defaultBoardId();
    return appApi.tasks.byBoard(boardId).length;
  } catch {
    return 0;
  }
});

const navigationSections = computed<SidebarNavSection[]>(() =>
  buildSidebarNavigationSections(route.path, undefined, {
    appCounts: {
      tasks: taskCount.value,
    },
  }),
);

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
      'w-72': mdAndLarger,
      'absolute z-30 h-full w-72': smallerThanMd && openSideBar,
    }"
  >
    <SidebarNav
      title="Concord"
      :sections="navigationSections"
      class="h-full bg-[var(--ui-surface)]"
      @select="handleNavSelect"
    >
      <template #header>
        <div class="flex p-2 w-full items-center">
          <RouterLink to="/" class="inline-flex min-w-0 items-center gap-2">
            <Logo class="size-8 shrink-0" />
          </RouterLink>

          <Button
            v-if="smallerThanMd"
            variant="plain-secondary"
            size="xs"
            aria-label="Close navigation"
            @click="openSideBar = false"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col gap-3">
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
            containerClass="rounded-2xl border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)]"
            toggleClass="!border-[var(--ui-border)]"
            data-test="sidebar-identity-management"
          >
            <template #primary>
              <button
                type="button"
                class="flex w-full items-center gap-3  text-left transition-colors hover:bg-[var(--ui-tonal-secondary)] px-3 py-1.5"
                :disabled="identityActionBusy"
              >
                <div class="flex shrink-0 items-center justify-center border border-[var(--ui-border)] bg-[var(--ui-surface)] rounded overflow-hidden border-2 border-[var(--ui-border)]">
                  <IdentityGlyph :identity="activeIdentityKey" size="xs" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="m-0 truncate text-sm font-semibold text-[var(--ui-fg)]">
                      {{ activeIdentityLabel }}
                    </p>
                    <span class="h-1.5 w-1.5 rounded-full bg-[var(--ui-success)]" data-test="sidebar-active-identity-status"></span>
                  </div>
                </div>
              </button>
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

          <div class="flex items-center gap-2">
            <SplitButton
              :disabled="ledgerActionBusy"
              class="min-w-0 flex-1"
              menuWidth="w-56"
              containerClass="rounded-2xl border-[var(--ui-border)]"
              toggleClass="!border-[var(--ui-border)]"
              data-test="sidebar-ledger-management"
            >
              <template #primary>
                <button
                  type="button"
                  class="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-xs font-semibold text-[var(--ui-fg)]"
                  :disabled="ledgerActionBusy"
                  data-test="sidebar-ledger-create"
                  @click="createLedger"
                >
                  Ledger
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
                  Import Ledger JSON
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
                  Export Ledger JSON
                </button>
              </template>
            </SplitButton>

            <Button
              variant="secondary"
              size="sm"
              class="h-10 w-10 shrink-0 !px-0"
              aria-label="Lock session"
              @click="relaunchOnboarding"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </Button>

            <ThemeModeToggle />
          </div>

          <span class="sr-only" data-test="sidebar-active-identity-label">
            {{ activeIdentityLabel }}
          </span>
          <span class="sr-only" data-test="sidebar-active-identity-id">
            {{ activeIdentityShortId }}
          </span>
        </div>
      </template>
    </SidebarNav>
  </div>

  <div v-if="smallerThanMd && !openSideBar" class="fixed left-0 top-0 z-40 m-2">
    <Button
      variant="secondary"
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
