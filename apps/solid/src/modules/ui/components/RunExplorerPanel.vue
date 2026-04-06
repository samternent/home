<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Button, Card, Input } from "ternent-ui/primitives";
import { useRunCoreRuntime } from "@/modules/run/core";
import { useAppShellState } from "@/modules/ui/useAppShellState";

const router = useRouter();
const runtime = useRunCoreRuntime();
const shellState = useAppShellState();
const creatorMode = ref<"folder" | "ledger" | null>(null);
const creatorName = ref("");
const fileQuery = ref("");
const openLoadingUrl = ref<string | null>(null);
const createMessage = ref<string | null>(null);
const createError = ref<string | null>(null);

const activeScope = computed(() => runtime.workspace.selection.value.activeScope);
const scopes = computed(() => runtime.workspace.mounts.value);
const items = computed(() => runtime.explorer.items.value);

const visibleItems = computed(() => {
  const query = fileQuery.value.trim().toLowerCase();
  if (!query) {
    return items.value;
  }

  return items.value.filter((item) =>
    [item.name, item.title, item.url, item.kind]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
});

function clearCreateFeedback() {
  createMessage.value = null;
  createError.value = null;
}

function openCreator(mode: "folder" | "ledger") {
  clearCreateFeedback();
  creatorMode.value = mode;
  creatorName.value = "";
}

function closeCreator() {
  creatorMode.value = null;
  creatorName.value = "";
}

function scopeCount(scope: string | null): number {
  return items.value.filter((item) => item.scope === scope).length;
}

function formatModified(value: string | null): string {
  if (!value) {
    return "Unknown";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const date = new Date(timestamp);
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.floor((midnight - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86_400_000);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function kindLabel(kind: "container" | "ledger" | "file"): string {
  if (kind === "container") {
    return "Folder";
  }

  if (kind === "ledger") {
    return "Ledger";
  }

  return "File";
}

function kindGlyph(kind: "container" | "ledger" | "file"): string {
  if (kind === "container") {
    return "⊞";
  }

  return "{ }";
}

async function activateItem(url: string, kind: "container" | "ledger" | "file") {
  if (kind === "container") {
    await runtime.explorer.navigateItem(url);
    return;
  }

  if (kind === "file") {
    await runtime.explorer.selectItem(url);
  }
}

async function goUp() {
  await runtime.explorer.goUp();
}

async function submitCreate() {
  clearCreateFeedback();
  const value = creatorName.value.trim();
  if (!value || !creatorMode.value) {
    return;
  }

  if (creatorMode.value === "folder") {
    const ok = await runtime.explorer.createFolder(value);
    if (ok) {
      createMessage.value = "Folder created.";
      closeCreator();
      return;
    }

    createError.value = "Folder could not be created.";
    return;
  }

  const ok = await runtime.explorer.createLedger(value);
  if (ok) {
    createMessage.value = "Ledger created.";
    closeCreator();
    return;
  }

  if (!runtime.identity.ready.value) {
    createMessage.value = "Create or import an identity to create a ledger.";
    shellState.openConnect("create");
    return;
  }

  createError.value = "Ledger could not be created.";
}

async function openTasks(url: string) {
  openLoadingUrl.value = url;
  try {
    const ok = await runtime.explorer.openTasks(url);
    if (!ok) {
      return;
    }

    shellState.closePanel();
    if (!router.currentRoute.value.path.startsWith("/tasks")) {
      await router.push("/tasks");
    }
  } finally {
    if (openLoadingUrl.value === url) {
      openLoadingUrl.value = null;
    }
  }
}
</script>

<template>
  <section class="flex h-full w-full flex-col font-mono">
    <div class="flex items-center justify-between border-b border-[var(--ui-border)] px-5 py-4 sm:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <Button
          :disabled="!runtime.explorer.canGoUp.value"
          aria-label="Explorer up"
          size="sm"
          variant="plain-secondary"
          class="h-9 w-9 rounded-lg px-0"
          @click="goUp"
        >
          ←
        </Button>
        <div class="min-w-0">
          <p class="m-0 truncate text-[11px] tracking-[0.08em] text-[var(--ui-fg-muted)]">
            {{ runtime.explorer.currentPath.value }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          aria-label="New folder"
          size="sm"
          variant="plain-secondary"
          class="rounded-lg"
          @click="openCreator('folder')"
        >
          New folder
        </Button>
        <Button
          aria-label="New ledger"
          size="sm"
          class="rounded-lg"
          @click="openCreator('ledger')"
        >
          New ledger
        </Button>
        <Button
          size="sm"
          variant="plain-secondary"
          class="h-9 w-9 rounded-lg px-0"
          aria-label="Close explorer"
          @click="shellState.closePanel()"
        >
          ×
        </Button>
      </div>
    </div>

    <div class="flex-1 overflow-auto px-5 py-5 sm:px-6">
      <div class="flex flex-col gap-5">
        <Card
          v-if="creatorMode"
          variant="panel"
          padding="md"
          class="border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)]"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="min-w-0 flex-1">
              <p class="m-0 text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]">
                {{ creatorMode === "folder" ? "New folder" : "New ledger" }}
              </p>
              <Input
                v-model="creatorName"
                :placeholder="creatorMode === 'folder' ? 'New folder' : 'New ledger'"
                class="mt-3 font-mono"
                @keydown.enter.prevent="submitCreate"
              />
            </div>
            <div class="flex flex-wrap gap-2 lg:pt-5">
              <Button
                :aria-label="creatorMode === 'folder' ? 'Create folder' : 'Create ledger'"
                class="rounded-lg"
                @click="submitCreate"
              >
                {{ creatorMode === "folder" ? "Create folder" : "Create ledger" }}
              </Button>
              <Button variant="plain-secondary" class="rounded-lg" @click="closeCreator">Cancel</Button>
            </div>
          </div>
        </Card>

        <Card
          v-if="createMessage || createError"
          variant="panel"
          padding="md"
          :class="createError
            ? 'border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)]'
            : 'border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)]'"
        >
          <div class="flex flex-col gap-2">
            <p
              v-if="createMessage"
              class="m-0 text-sm text-[var(--ui-fg)]"
            >
              {{ createMessage }}
            </p>
            <p
              v-if="createError"
              class="m-0 text-sm text-[var(--ui-critical)]"
            >
              {{ createError }}
            </p>
            <Button
              v-if="createMessage === 'Create or import an identity to create a ledger.'"
              size="sm"
              variant="plain-secondary"
              class="self-start rounded-lg"
              @click="shellState.openConnect('create')"
            >
              Create or load identity
            </Button>
          </div>
        </Card>

        <div class="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside class="space-y-2">
            <p class="px-3 text-[11px] tracking-[0.08em] text-[var(--ui-fg-muted)]">Locations</p>
            <button
              v-for="scope in scopes"
              :key="scope.id"
              :aria-label="`Select scope ${scope.scope}`"
              class="flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition"
              :class="activeScope === scope.scope
                ? 'border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] text-[var(--ui-fg)]'
                : 'border-transparent text-[var(--ui-fg-muted)] hover:bg-[var(--ui-tonal-tertiary)]'"
              @click="runtime.actions.selectScope(scope.scope)"
            >
              <span class="flex items-center gap-3">
                <span
                  class="h-2 w-2 rounded-full"
                  :class="activeScope === scope.scope ? 'bg-[var(--ui-fg)]' : 'bg-[var(--ui-fg-muted)]/50'"
                />
                <span class="text-[15px]">{{ scope.label }}</span>
              </span>
              <span class="text-xs text-[var(--ui-fg-muted)]">
                {{ scopeCount(scope.scope) }}
              </span>
            </button>
          </aside>

          <section class="min-w-0">
            <div class="mb-3 flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="m-0 text-[11px] tracking-[0.08em] text-[var(--ui-fg-muted)]">Files</p>
              <Input
                v-model="fileQuery"
                placeholder="Search files"
                class="sm:max-w-xs font-mono"
              />
            </div>

            <Card
              variant="panel"
              padding="none"
              class="overflow-hidden border border-[var(--ui-border)] bg-[var(--ui-surface)]"
            >
              <div class="grid grid-cols-[minmax(0,1fr)_120px_120px_100px] gap-4 border-b border-[var(--ui-border)] px-4 py-3 text-[11px] tracking-[0.08em] text-[var(--ui-fg-muted)] sm:px-5">
                <span>Name</span>
                <span>Kind</span>
                <span>Modified</span>
                <span class="text-right">Open</span>
              </div>

              <div v-if="visibleItems.length" class="divide-y divide-[var(--ui-border)]/50">
                <div
                  v-for="item in visibleItems"
                  :key="item.id"
                  class="grid grid-cols-[minmax(0,1fr)_120px_120px_100px] items-center gap-4 px-4 py-3 transition hover:bg-[var(--ui-tonal-secondary)]/70 sm:px-5"
                >
                  <div class="min-w-0 flex items-center gap-3">
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] text-[11px] font-medium text-[var(--ui-fg-muted)]"
                    >
                      {{ kindGlyph(item.kind) }}
                    </span>
                    <div class="min-w-0">
                      <button
                        v-if="item.kind === 'container'"
                        :aria-label="`Navigate explorer item ${item.name}`"
                        class="truncate text-left text-[15px] text-[var(--ui-fg)]"
                        @click="activateItem(item.url, item.kind)"
                      >
                        {{ item.name }}
                      </button>
                      <p
                        v-else
                        class="m-0 truncate text-[15px] text-[var(--ui-fg)]"
                      >
                        {{ item.name }}
                      </p>
                      <p class="m-0 truncate text-sm text-[var(--ui-fg-muted)]">
                        {{ item.kind === "container" ? "folder" : item.contentType || "local file" }}
                      </p>
                    </div>
                  </div>
                  <p class="m-0 text-sm text-[var(--ui-fg-muted)]">{{ kindLabel(item.kind) }}</p>
                  <p class="m-0 text-sm text-[var(--ui-fg-muted)]">{{ formatModified(item.lastModified) }}</p>
                  <div class="text-right">
                    <Button
                      v-if="item.kind === 'container'"
                      size="sm"
                      variant="plain-secondary"
                      :aria-label="`Open explorer item ${item.name}`"
                      class="rounded-lg"
                      @click="activateItem(item.url, item.kind)"
                    >
                      Open
                    </Button>
                    <Button
                      v-else-if="item.kind === 'ledger'"
                      size="sm"
                      :variant="item.active ? 'secondary' : 'plain-secondary'"
                      :aria-label="`Open tasks for explorer item ${item.name}`"
                      :disabled="openLoadingUrl === item.url"
                      class="rounded-lg"
                      @click="openTasks(item.url)"
                    >
                      {{ openLoadingUrl === item.url ? "Opening..." : "Open" }}
                    </Button>
                    <Button
                      v-else
                      size="sm"
                      variant="plain-secondary"
                      :aria-label="`Select explorer item ${item.name}`"
                      class="rounded-lg"
                      @click="activateItem(item.url, item.kind)"
                    >
                      Select
                    </Button>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="px-5 py-10 text-center text-sm text-[var(--ui-fg-muted)]"
              >
                No files match the current view.
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
