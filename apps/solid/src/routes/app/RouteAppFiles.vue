<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Badge, Button, Card, Input, Popover, TreeView } from "ternent-ui/primitives";
import {
  buildConcordOsHostedAppRoute,
  createConcordOsOpenTarget,
  useConcordOsCore,
  useConcordOsAppHost,
  useConcordOsLibrary,
  useConcordOsWorkbenchView,
} from "@/modules/concord-os";

const workspace = useConcordOsCore();
const appHost = useConcordOsAppHost();
const library = useConcordOsLibrary();
const workbench = useConcordOsWorkbenchView();
const router = useRouter();

const folderName = ref("");
const ledgerName = ref("");
const showStructure = ref(false);

const breadcrumbSegments = computed(() => {
  const browse = workspace.currentBrowse.value;
  const paths = workspace.paths.value;
  if (!browse || !paths) {
    return [];
  }

  const rootMap = {
    private: paths.workspacePrivateRootUrl,
    shared: paths.workspaceSharedRootUrl,
    public: paths.workspacePublicRootUrl,
  } as const;
  const scopeRoot = rootMap[browse.scope];
  const relative = browse.url.startsWith(scopeRoot)
    ? browse.url.slice(scopeRoot.length)
    : "";
  const segments = relative
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  const items = [
    {
      label: browse.scope,
      url: scopeRoot,
    },
  ];

  let current = scopeRoot;
  for (const segment of segments) {
    current = new URL(`${segment}/`, current).toString();
    items.push({
      label: segment,
      url: current,
    });
  }

  return items;
});

const selectedTreeValue = computed({
  get: () => workspace.treeSelection.value,
  set: (next: string[]) => {
    const target = next[0];
    if (!target) {
      return;
    }
    void workspace.activateTreeNode(target);
  },
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
    await router.push(buildConcordOsHostedAppRoute(createConcordOsOpenTarget(item.entry, summary), appId));
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
  <div class="flex h-full min-h-0 overflow-hidden">
    <aside v-if="showStructure" class="hidden w-[18rem] shrink-0 border-r border-[var(--ui-border)] xl:flex">
      <div class="flex min-h-0 flex-1 flex-col p-4">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              Workspace
            </p>
            <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              Structure and scope
            </p>
          </div>
          <Badge tone="neutral" variant="soft">
            {{ workspace.currentScope.value }}
          </Badge>
        </div>

        <div class="mb-4 flex flex-wrap gap-2">
          <Button
            size="xs"
            variant="plain-secondary"
            :disabled="workspace.currentScope.value === 'private'"
            @click="workspace.selectScope('private')"
          >
            Private
          </Button>
          <Button
            size="xs"
            variant="plain-secondary"
            :disabled="workspace.currentScope.value === 'shared'"
            @click="workspace.selectScope('shared')"
          >
            Shared
          </Button>
          <Button
            size="xs"
            variant="plain-secondary"
            :disabled="workspace.currentScope.value === 'public'"
            @click="workspace.selectScope('public')"
          >
            Public
          </Button>
        </div>

        <Card variant="subtle" padding="sm" class="flex min-h-0 flex-1 flex-col">
          <div class="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ui-fg-muted)]">
            <button
              v-for="segment in breadcrumbSegments"
              :key="segment.url"
              type="button"
              class="rounded-full border border-[var(--ui-border)] px-2 py-1 transition hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_18%,transparent)]"
              @click="workspace.navigateTo(segment.url)"
            >
              {{ segment.label }}
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-auto">
            <TreeView
              v-model:selected-value="selectedTreeValue"
              :nodes="workspace.treeNodes.value"
              aria-label="Concord workspace structure"
              text-size="xs"
              :default-expanded-depth="2"
            />
          </div>
        </Card>
      </div>
    </aside>

    <section class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div class="border-b border-[var(--ui-border)] px-5 py-4">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
          <Card variant="subtle" padding="sm" class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                Recent
              </p>
              <Button size="xs" variant="plain-secondary" @click="showStructure = !showStructure">
                {{ showStructure ? "Hide structure" : "Show structure" }}
              </Button>
            </div>
            <template v-if="workbench.currentWork.value">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--ui-border)] px-3 py-3 text-left transition hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_12%,transparent)]"
                @click="openRecent(workbench.currentWork.value.url, workbench.currentWork.value.appId)"
              >
                <div class="min-w-0">
                  <p class="m-0 truncate text-sm text-[var(--ui-fg)]">{{ workbench.currentWork.value.title }}</p>
                  <p class="m-0 truncate text-[11px] text-[var(--ui-fg-muted)]">
                    {{ workbench.currentWork.value.appLabel || workbench.currentWork.value.scope }}
                  </p>
                </div>
                <Badge tone="neutral" variant="soft">
                  {{ workbench.currentWork.value.kind === "active-app" ? "open" : "selected" }}
                </Badge>
              </button>
            </template>
            <div v-else-if="workbench.recentWork.value.length" class="space-y-2">
              <button
                v-for="item in workbench.recentWork.value.slice(0, 3)"
                :key="item.url"
                type="button"
                class="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--ui-border)] px-3 py-3 text-left transition hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_12%,transparent)]"
                @click="openRecent(item.url, item.appId)"
              >
                <div class="min-w-0">
                  <p class="m-0 truncate text-sm text-[var(--ui-fg)]">{{ item.title }}</p>
                  <p class="m-0 truncate text-[11px] text-[var(--ui-fg-muted)]">{{ item.appLabel || item.scope }}</p>
                </div>
              </button>
            </div>
            <p v-else class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              Open a ledger and it will appear here.
            </p>
          </Card>

          <Card variant="subtle" padding="sm" class="space-y-3">
            <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              New
            </p>
            <label class="space-y-1">
              <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
                Space
              </span>
              <Input v-model="folderName" aria-label="New space name" placeholder="designs" />
            </label>
            <label class="space-y-1">
              <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
                Ledger
              </span>
              <Input
                v-model="ledgerName"
                aria-label="New ledger name"
                placeholder="project"
                :disabled="!workspace.identityReady.value"
              />
            </label>
            <div class="flex gap-2">
              <Button size="xs" variant="secondary" @click="createFolder">Create space</Button>
              <Button size="xs" variant="secondary" :disabled="!workspace.identityReady.value" @click="createLedger">
                Create ledger
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto p-5">
        <div class="space-y-5">
            <Card variant="subtle" padding="sm" class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                    Ledgers
                  </p>
                  <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                    Portable Concord histories ready for compatible apps
                  </p>
                </div>
                <Badge tone="neutral" variant="soft">
                  {{ library.ledgers.value.length }}
                </Badge>
              </div>

              <div v-if="library.ledgers.value.length" class="overflow-hidden rounded-[1rem] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)]">
                <div
                  v-for="item in library.ledgers.value"
                  :key="item.entry.url"
                  class="flex items-center gap-4 border-b border-[color-mix(in_srgb,var(--ui-border)_60%,transparent)] px-4 py-3 last:border-b-0"
                  :class="workspace.selectedEntry.value?.url === item.entry.url
                    ? 'bg-[color-mix(in_srgb,var(--ui-primary-muted)_10%,transparent)]'
                    : 'bg-transparent'"
                >
                  <button
                    type="button"
                    class="min-w-0 flex-1 text-left"
                    @click="workspace.selectEntry(item.entry)"
                    @dblclick="openWith(item)"
                  >
                    <div class="flex items-center gap-3">
                      <p class="m-0 truncate text-sm font-medium text-[var(--ui-fg)]">{{ item.title }}</p>
                      <Badge tone="neutral" variant="soft">
                        {{ item.entry.scope }}
                      </Badge>
                    </div>
                    <div class="mt-1 flex items-center gap-3 text-[11px] text-[var(--ui-fg-muted)]">
                      <span>{{ item.modifiedLabel }}</span>
                      <span>{{ item.capabilities.length }} capability{{ item.capabilities.length === 1 ? "" : "ies" }}</span>
                    </div>
                  </button>

                  <div class="shrink-0">
                    <Button
                      v-if="item.capabilities.length <= 1"
                      size="xs"
                      variant="secondary"
                      @click.stop="openWith(item)"
                    >
                      {{ item.primaryCapability?.actionLabel || "Open" }}
                    </Button>

                    <Popover
                      v-else
                      :open="isChooserOpen(item.entry.url)"
                      placement="left-start"
                      title="Open ledger"
                      description="Choose a capability for this ledger."
                      show-arrow
                      show-close
                      @update:open="(next) => { if (!next) appHost.closeChooser(); }"
                    >
                      <template #trigger>
                        <Button size="xs" variant="secondary" @click.stop="openWith(item)">
                          Open with...
                        </Button>
                      </template>

                      <div class="space-y-2">
                        <button
                          v-for="app in appHost.chooserApps.value"
                          :key="app.appId"
                          type="button"
                          class="flex w-full items-start justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] px-3 py-3 text-left transition hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_14%,transparent)]"
                          @click="appHost.openChosenApp(router, app.appId)"
                        >
                          <div class="min-w-0">
                            <p class="m-0 text-sm text-[var(--ui-fg)]">{{ app.label }}</p>
                            <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">{{ app.description }}</p>
                          </div>
                          <span class="text-[11px] text-[var(--ui-fg-muted)]">{{ app.openLabel }}</span>
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
                class="rounded-[1.25rem] border border-dashed border-[var(--ui-border)] px-4 py-5"
              >
                <p class="m-0 text-sm text-[var(--ui-fg)]">
                  {{ workbench.libraryEmptyLabel.value }}
                </p>
              </div>
            </Card>

            <Card v-if="library.spaces.value.length" variant="subtle" padding="sm" class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                    Spaces
                  </p>
                  <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                    Organise durable work without exposing raw storage
                  </p>
                </div>
                <Badge tone="neutral" variant="soft">
                  {{ library.spaces.value.length }}
                </Badge>
              </div>

              <div v-if="library.spaces.value.length" class="overflow-hidden rounded-[1rem] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)]">
                <button
                  v-for="item in library.spaces.value"
                  :key="item.entry.url"
                  type="button"
                  class="flex w-full items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--ui-border)_60%,transparent)] px-4 py-3 text-left transition last:border-b-0 hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_16%,transparent)]"
                  @click="workspace.openEntry(item.entry)"
                >
                  <div class="min-w-0">
                    <p class="m-0 truncate text-sm text-[var(--ui-fg)]">
                      {{ item.title }}
                    </p>
                    <p class="m-0 truncate text-[11px] text-[var(--ui-fg-muted)]">
                      {{ item.summary }}
                    </p>
                  </div>
                  <Badge tone="neutral" variant="soft">
                    space
                  </Badge>
                </button>
              </div>

            </Card>
        </div>
      </div>
    </section>
  </div>
</template>
