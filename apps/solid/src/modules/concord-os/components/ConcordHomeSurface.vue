<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Button, Input, Popover } from "ternent-ui/primitives";
import { buildConcordOsHostedAppRoute, createConcordOsOpenTarget } from "@/modules/concord-os/apps";
import { useConcordOsKernel } from "@/modules/concord-os";

const kernel = useConcordOsKernel();
const workspace = kernel.workspace;
const appHost = kernel.appHost;
const library = kernel.library;
const workbench = kernel.workbench;
const router = useRouter();

const folderName = ref("");
const ledgerName = ref("");
const searchQuery = ref("");

const scopeItems = [
  { id: "private", label: "Private" },
  { id: "shared", label: "Shared" },
  { id: "public", label: "Public" },
] as const;

const filteredRecentWork = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const items = [
    ...(workbench.currentWork.value ? [workbench.currentWork.value] : []),
    ...workbench.recentWork.value,
  ];

  if (!query) {
    return items.slice(0, 4);
  }

  return items
    .filter((item) => item.title.toLowerCase().includes(query))
    .slice(0, 4);
});

const filteredLedgers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return library.ledgers.value;
  }

  return library.ledgers.value.filter((item) => {
    const capabilityMatch = item.capabilities.some((app) =>
      `${app.label} ${app.description}`.toLowerCase().includes(query),
    );
    return (
      item.title.toLowerCase().includes(query) ||
      item.modifiedLabel.toLowerCase().includes(query) ||
      capabilityMatch
    );
  });
});

const filteredSpaces = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return library.spaces.value;
  }

  return library.spaces.value.filter((item) =>
    `${item.title} ${item.summary}`.toLowerCase().includes(query),
  );
});

const currentScopeLabel = computed(() => {
  const value = workspace.currentScope.value;
  return value.charAt(0).toUpperCase() + value.slice(1);
});

const itemCountLabel = computed(() => {
  const ledgerCount = filteredLedgers.value.length;
  const spaceCount = filteredSpaces.value.length;
  return `${ledgerCount} ledger${ledgerCount === 1 ? "" : "s"}${spaceCount ? `, ${spaceCount} space${spaceCount === 1 ? "" : "s"}` : ""}`;
});

async function createFolder() {
  if (!folderName.value.trim()) {
    return;
  }
  await workspace.createFolder(folderName.value);
  folderName.value = "";
}

async function createLedger() {
  if (!ledgerName.value.trim()) {
    return;
  }
  await workspace.createLedger(ledgerName.value);
  ledgerName.value = "";
}

async function openWith(item = library.selectedItem.value) {
  if (!item || item.kind !== "ledger") {
    return;
  }

  const capabilities = item.capabilities || [];
  const summary =
    workspace.preview.value?.entry.url === item.entry.url
      ? workspace.preview.value.ledger
      : null;

  if (capabilities.length <= 1) {
    const appId = item.primaryCapability?.appId || capabilities[0]?.appId;
    if (!appId) {
      return;
    }
    await router.push(
      buildConcordOsHostedAppRoute(createConcordOsOpenTarget(item.entry, summary), appId),
    );
    return;
  }

  appHost.openChooser(item.entry, summary);
}

async function openRecent(url: string, appId: string | null = null) {
  const entry = await workspace.lookupEntry(url);
  if (!entry) {
    return;
  }

  if (appId && entry.isLedger) {
    await router.push(buildConcordOsHostedAppRoute(createConcordOsOpenTarget(entry), appId));
    return;
  }

  await workspace.selectEntry(entry);
}

function isChooserOpen(url: string) {
  return appHost.chooserOpen.value && appHost.chooserTarget.value?.url === url;
}
</script>

<template>
  <div class="flex h-full min-h-0 overflow-hidden bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-bg)_72%,white)_0%,color-mix(in_srgb,var(--ui-bg)_92%,white)_100%)] text-[var(--ui-fg)]">
    <aside class="flex w-[16rem] shrink-0 flex-col border-r border-[color-mix(in_srgb,var(--ui-border)_28%,white)] bg-[color-mix(in_srgb,var(--ui-bg)_42%,white)] px-4 py-5">
      <div class="space-y-1">
        <p class="m-0 text-2xl font-semibold tracking-[-0.03em]">Library</p>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">{{ currentScopeLabel }} workspace</p>
      </div>

      <div class="mt-6 space-y-1">
        <p class="px-2 text-[11px] text-[var(--ui-fg-muted)]">Locations</p>
        <button
          v-for="scope in scopeItems"
          :key="scope.id"
          type="button"
          class="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition"
          :class="workspace.currentScope.value === scope.id
            ? 'bg-[color-mix(in_srgb,var(--ui-primary-muted)_28%,white)] text-[var(--ui-primary)]'
            : 'text-[var(--ui-fg-muted)] hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_10%,white)] hover:text-[var(--ui-fg)]'"
          @click="workspace.selectScope(scope.id)"
        >
          <span>{{ scope.label }}</span>
          <span class="text-[11px]">{{ scope.id === workspace.currentScope.value ? "Active" : "" }}</span>
        </button>
      </div>

      <div v-if="filteredSpaces.length" class="mt-6 space-y-1">
        <p class="px-2 text-[11px] text-[var(--ui-fg-muted)]">Spaces</p>
        <button
          v-for="item in filteredSpaces.slice(0, 6)"
          :key="item.entry.url"
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-[var(--ui-fg-muted)] transition hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_10%,white)] hover:text-[var(--ui-fg)]"
          @click="workspace.openEntry(item.entry)"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--ui-primary-muted)_18%,white)] text-xs font-medium text-[var(--ui-primary)]">
            {{ item.title.slice(0, 2).toUpperCase() }}
          </span>
          <span class="truncate">{{ item.title }}</span>
        </button>
      </div>

      <div class="mt-auto space-y-3 rounded-[1.5rem] border border-[color-mix(in_srgb,var(--ui-border)_24%,white)] bg-[color-mix(in_srgb,var(--ui-bg)_52%,white)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
        <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">New</p>
        <Input v-model="folderName" aria-label="New space name" placeholder="New space" />
        <Input
          v-model="ledgerName"
          aria-label="New ledger name"
          placeholder="New ledger"
          :disabled="!workspace.identityReady.value"
        />
        <div class="grid grid-cols-2 gap-2">
          <Button size="xs" variant="plain-secondary" @click="createFolder">Space</Button>
          <Button size="xs" variant="secondary" :disabled="!workspace.identityReady.value" @click="createLedger">Ledger</Button>
        </div>
      </div>
    </aside>

    <section class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div class="flex items-center justify-between gap-4 border-b border-[color-mix(in_srgb,var(--ui-border)_24%,white)] px-6 py-5">
        <div>
          <p class="m-0 text-lg font-medium tracking-[-0.02em]">Recents</p>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">{{ itemCountLabel }}</p>
        </div>
        <div class="w-full max-w-sm">
          <Input
            v-model="searchQuery"
            aria-label="Search library"
            placeholder="Search ledgers and spaces"
          />
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div class="space-y-8">
          <section v-if="filteredRecentWork.length" class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">Recent</p>
            </div>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <button
                v-for="item in filteredRecentWork"
                :key="item.url"
                type="button"
                class="flex items-center gap-3 rounded-[1.5rem] border border-[color-mix(in_srgb,var(--ui-border)_22%,white)] bg-[color-mix(in_srgb,var(--ui-bg)_48%,white)] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] transition hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
                @click="openRecent(item.url, item.appId)"
              >
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-primary-muted)_52%,white),color-mix(in_srgb,var(--ui-primary)_16%,white))] text-xs font-semibold text-[var(--ui-primary)]">
                  {{ item.title.slice(0, 2).toUpperCase() }}
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-sm font-medium text-[var(--ui-fg)]">{{ item.title }}</span>
                  <span class="block truncate text-xs text-[var(--ui-fg-muted)]">
                    {{ item.appLabel || item.scope }}
                  </span>
                </span>
              </button>
            </div>
          </section>

          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">Ledgers</p>
                <p class="m-0 text-sm text-[var(--ui-fg-muted)]">Portable Concord work ready for compatible apps</p>
              </div>
            </div>

            <div
              v-if="filteredLedgers.length"
              class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4"
            >
              <div
                v-for="item in filteredLedgers"
                :key="item.entry.url"
                class="group rounded-[1.75rem] border border-[color-mix(in_srgb,var(--ui-border)_22%,white)] bg-[color-mix(in_srgb,var(--ui-bg)_44%,white)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                :class="workspace.selectedEntry.value?.url === item.entry.url
                  ? 'border-[color-mix(in_srgb,var(--ui-primary)_18%,white)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_18%,white)]'
                  : ''"
              >
                <button
                  type="button"
                  class="w-full text-left"
                  @click="workspace.selectEntry(item.entry)"
                  @dblclick="openWith(item)"
                >
                  <span class="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-primary-muted)_54%,white),color-mix(in_srgb,var(--ui-primary)_18%,white))] text-lg font-semibold text-[var(--ui-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                    {{ item.title.slice(0, 2).toUpperCase() }}
                  </span>
                  <span class="block truncate text-sm font-medium text-[var(--ui-fg)]">{{ item.title }}</span>
                  <span class="mt-1 block text-xs text-[var(--ui-fg-muted)]">{{ item.modifiedLabel }}</span>
                  <span class="mt-3 block text-xs text-[var(--ui-fg-muted)]">
                    {{ item.capabilities.length }} app{{ item.capabilities.length === 1 ? "" : "s" }}
                  </span>
                </button>

                <div class="mt-4">
                  <Button
                    v-if="item.capabilities.length <= 1"
                    size="xs"
                    variant="plain-secondary"
                    @click.stop="openWith(item)"
                  >
                    {{ item.primaryCapability?.actionLabel || "Open" }}
                  </Button>

                  <Popover
                    v-else
                    :open="isChooserOpen(item.entry.url)"
                    placement="bottom-start"
                    title="Open ledger"
                    description="Choose a capability for this ledger."
                    show-arrow
                    show-close
                    @update:open="(next) => { if (!next) appHost.closeChooser(); }"
                  >
                    <template #trigger>
                      <Button size="xs" variant="plain-secondary" @click.stop="openWith(item)">
                        Open with...
                      </Button>
                    </template>

                    <div class="space-y-2">
                      <button
                        v-for="app in appHost.chooserApps.value"
                        :key="app.appId"
                        type="button"
                        class="flex w-full items-start justify-between gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--ui-border)_30%,white)] px-3 py-3 text-left transition hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_10%,white)]"
                        @click="appHost.openChosenApp(router, app.appId)"
                      >
                        <span class="min-w-0">
                          <span class="block text-sm font-medium text-[var(--ui-fg)]">{{ app.label }}</span>
                          <span class="block text-xs text-[var(--ui-fg-muted)]">{{ app.description }}</span>
                        </span>
                        <span class="text-xs text-[var(--ui-fg-muted)]">{{ app.openLabel }}</span>
                      </button>

                      <Button size="xs" variant="plain-secondary" disabled>
                        + Install app
                      </Button>
                    </div>
                  </Popover>
                </div>
              </div>
            </div>

            <div
              v-else
              class="rounded-[1.75rem] border border-dashed border-[color-mix(in_srgb,var(--ui-border)_26%,white)] bg-[color-mix(in_srgb,var(--ui-bg)_42%,white)] px-5 py-8 text-center"
            >
              <p class="m-0 text-sm text-[var(--ui-fg)]">{{ workbench.libraryEmptyLabel.value }}</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
