<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Badge, Button, Card, Input, Separator, Spinner } from "ternent-ui/primitives";
import { appConfig } from "@/app/config/app.config";
import ConcordWorkspaceShell from "@/modules/concord-os/components/ConcordWorkspaceShell.vue";
import {
  useConcordOsAppHost,
  useConcordOsCore,
  useConcordOsLibrary,
  useConcordOsUi,
  useConcordTodoWorkingCopy,
} from "@/modules/concord-os";
import { useSolidSession } from "@/modules/solid-session";
import ThemeModeToggle from "@/modules/ui/components/ThemeModeToggle.vue";

const solid = useSolidSession();
const appHost = useConcordOsAppHost();
const workspace = useConcordOsCore();
const library = useConcordOsLibrary();
const ui = useConcordOsUi();
const todoWorkingCopy = useConcordTodoWorkingCopy();
const route = useRoute();
const router = useRouter();

type InspectorMode = "meta" | "history" | "threads";
type ConsoleEvent = {
  id: string;
  message: string;
  detail?: string;
};

const providerInput = computed({
  get: () => solid.issuer.value,
  set: (next: string) => solid.setIssuer(next),
});

const inspectorMode = ref<InspectorMode>("meta");
const consoleEvents = ref<ConsoleEvent[]>([]);
const consolePulse = ref(false);
let consolePulseTimer: ReturnType<typeof setTimeout> | null = null;

const navItems = [
  { to: "/app/library", label: "Library" },
  { to: "/app/sharing", label: "Sharing" },
  { to: "/app/people", label: "People" },
  { to: "/app/account", label: "Account" },
] as const;

const sectionLabel = computed(() => {
  if (route.path.startsWith("/app/open")) {
    const appLabel = appHost.activeAppLabel.value ?? "Hosted app";
    const targetLabel = appHost.activeTarget.value?.title;
    return targetLabel ? `${targetLabel} · ${appLabel}` : appLabel;
  }

  return navItems.find((item) => route.path.startsWith(item.to))?.label || "Library";
});

const shellNavPath = computed(() =>
  route.path.startsWith("/app/open") ? "/app/library" : route.path,
);

const isBusy = computed(
  () => solid.status.value === "restoring" || solid.status.value === "redirecting",
);

const shellStatus = computed(() => {
  if (solid.status.value === "restoring") return "restoring";
  if (solid.status.value === "redirecting") return "signing-in";
  if (workspace.status.value === "loading") return "loading";
  if (solid.isAuthenticated.value) return "connected";
  if (solid.error.value) return "attention";
  return "login-required";
});

const statusTone = computed(() => {
  if (solid.status.value === "error" || workspace.status.value === "error") {
    return "warning";
  }
  if (solid.isAuthenticated.value) {
    return "success";
  }
  return "neutral";
});

const webIdShort = computed(() => {
  if (!solid.webId.value) {
    return "No active WebID";
  }

  const value = solid.webId.value;
  if (value.length <= 44) {
    return value;
  }

  return `${value.slice(0, 18)}...${value.slice(-16)}`;
});

const workspaceTabs = computed(() =>
  appHost.tabs.value.map((tab) => ({
    ...tab,
    active: route.path.startsWith("/app/open") && tab.id === appHost.activeTabId.value,
  })),
);

const systemSummaryLines = computed(() => {
  if (!solid.isAuthenticated.value) {
    return ["session locked", "workspace idle", "no active context"];
  }

  return [
    `pod ${workspace.selectedPod.value || "unselected"}`,
    `scope ${workspace.currentScope.value}`,
    `target ${workspace.currentTargetUrl.value || "none"}`,
    `app ${appHost.activeAppLabel.value || "none"}`,
  ];
});

const showLibraryInspector = computed(
  () => solid.isAuthenticated.value && route.path.startsWith("/app/library"),
);
const showHostedInspector = computed(
  () =>
    solid.isAuthenticated.value &&
    route.path.startsWith("/app/open") &&
    appHost.activeTarget.value &&
    appHost.activeAppId.value === "todo",
);
const showTodoConsole = computed(
  () =>
    solid.isAuthenticated.value &&
    route.path.startsWith("/app/open") &&
    appHost.activeAppId.value === "todo" &&
    appHost.activeTarget.value,
);
const effectiveConsoleOpen = computed(
  () =>
    ui.consoleOpen.value ||
    (showTodoConsole.value &&
      (todoWorkingCopy.stagedCount.value > 0 ||
        todoWorkingCopy.saving.value ||
        Boolean(todoWorkingCopy.error.value))),
);

const inspectorMeta = computed(() => {
  if (!solid.isAuthenticated.value) {
    return {
      title: "System state",
      rows: [
        { label: "session", value: "locked" },
        { label: "workspace", value: "awaiting Solid login" },
      ],
    };
  }

  if (route.path.startsWith("/app/open") && appHost.activeTarget.value) {
    return {
      title: `${appHost.activeTarget.value.title} · ${appHost.activeAppLabel.value || "App"}`,
      rows: [
        { label: "path", value: appHost.activeTarget.value.path },
        { label: "scope", value: appHost.activeTarget.value.scope },
        { label: "status", value: hostedStatusLabel.value },
        { label: "open", value: String(openTodoCount.value) },
        { label: "completed", value: String(completedTodoCount.value) },
      ],
    };
  }

  if (workspace.selectedEntry.value) {
    return {
      title: library.selectedItem.value?.title || workspace.selectedEntry.value.name,
      rows: [
        { label: "path", value: workspace.selectedEntry.value.path },
        { label: "scope", value: workspace.selectedEntry.value.scope },
        {
          label: "kind",
          value: library.selectedItem.value?.kind || workspace.selectedEntry.value.kind,
        },
      ],
    };
  }

  return {
    title: "System state",
    rows: [
      { label: "session", value: "ready" },
      { label: "workspace", value: workspace.status.value },
      { label: "scope", value: workspace.currentScope.value },
    ],
  };
});

function pulseConsole() {
  consolePulse.value = true;
  if (consolePulseTimer) {
    clearTimeout(consolePulseTimer);
  }
  consolePulseTimer = setTimeout(() => {
    consolePulse.value = false;
  }, 1200);
}

function pushConsoleEvent(message: string, detail?: string) {
  consoleEvents.value = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      detail,
    },
    ...consoleEvents.value,
  ].slice(0, 12);
  pulseConsole();
}

const openTodoCount = computed(
  () => todoWorkingCopy.items.value.filter((item) => !item.completed).length,
);
const completedTodoCount = computed(
  () => todoWorkingCopy.items.value.filter((item) => item.completed).length,
);

const hostedStatusLabel = computed(() => {
  if (appHost.error.value || todoWorkingCopy.error.value) return "error";
  if (todoWorkingCopy.saving.value) return "committing";
  if (todoWorkingCopy.stagedCount.value > 0) return "pending";
  if (appHost.status.value === "loading") return "loading";
  return "ready";
});

async function login() {
  await solid.login();
}

async function logout() {
  await solid.logout();
}

onMounted(async () => {
  await workspace.init();
});

watch(
  () => solid.isAuthenticated.value,
  (next, previous) => {
    if (next === previous) {
      return;
    }

    if (next) {
      pushConsoleEvent("Solid session active", solid.webId.value || undefined);
      return;
    }

    if (previous) {
      pushConsoleEvent("Solid session closed");
    }
  },
);

watch(
  () => workspace.status.value,
  (next, previous) => {
    if (next === previous) {
      return;
    }

    if (next === "ready" && solid.isAuthenticated.value) {
      pushConsoleEvent("Workspace mounted", workspace.currentTargetUrl.value || undefined);
    }
  },
);

watch(
  () => `${appHost.activeTarget.value?.url || ""}:${appHost.activeAppLabel.value || ""}`,
  (next, previous) => {
    if (!next || next === previous || !appHost.activeTarget.value) {
      return;
    }

    pushConsoleEvent(
      `Opened ${appHost.activeTarget.value.title}`,
      appHost.activeAppLabel.value ? `capability ${appHost.activeAppLabel.value}` : undefined,
    );
  },
);

watch(
  () => todoWorkingCopy.stagedCount.value,
  (next, previous) => {
    if (next > 0 && previous === 0) {
      pushConsoleEvent(
        "Working copy staged",
        `${next} entity change${next === 1 ? "" : "s"} ready`,
      );
      return;
    }

    if (next === 0 && previous > 0 && !todoWorkingCopy.saving.value) {
      pushConsoleEvent("Working copy clean");
    }
  },
);

watch(
  () => todoWorkingCopy.saving.value,
  (next, previous) => {
    if (next && !previous) {
      pushConsoleEvent(
        "Commit started",
        todoWorkingCopy.commitMessage.value || "Writing staged changes",
      );
      return;
    }

    if (!next && previous && !todoWorkingCopy.error.value) {
      pushConsoleEvent("Commit complete", todoWorkingCopy.lastAction.value || undefined);
    }
  },
);

watch(
  () => todoWorkingCopy.error.value,
  (next, previous) => {
    if (next && next !== previous) {
      pushConsoleEvent("Commit failed", next);
    }
  },
);
</script>

<template>
  <ConcordWorkspaceShell
    :nav-items="navItems"
    :current-path="shellNavPath"
    :app-label="appConfig.appTitle"
    :section-label="sectionLabel"
    :status-label="shellStatus"
    :status-tone="statusTone"
    :web-id-label="webIdShort"
    :pod-label="appHost.activeTarget.value?.url || workspace.selectedPod.value || webIdShort"
    :sidebar-collapsed="ui.sidebarCollapsed.value"
    :console-open="effectiveConsoleOpen"
    :console-pulse="consolePulse"
    :inspector-open="ui.inspectorOpen.value"
    @toggle-sidebar="ui.toggleSidebar"
    @toggle-console="ui.toggleConsole"
    @toggle-inspector="ui.toggleInspector"
  >
    <template #header-actions>
      <ThemeModeToggle />
      <Button v-if="solid.isAuthenticated.value" size="xs" variant="secondary" @click="logout">
        Log out
      </Button>
    </template>

    <template #context-tabs>
      <div v-if="workspaceTabs.length" class="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          v-for="tab in workspaceTabs"
          :key="tab.id"
          type="button"
          class="group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition"
          :class="
            tab.active
              ? 'border-[var(--ui-primary)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_16%,transparent)] text-[var(--ui-fg)]'
              : 'border-[color-mix(in_srgb,var(--ui-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg-muted)_8%,transparent)] text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]'
          "
          @click="appHost.activateTab(router, tab.id)"
        >
          <span class="truncate">{{ tab.label }}</span>
          <span
            class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-[var(--ui-fg-muted)] transition group-hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_18%,transparent)] group-hover:text-[var(--ui-fg)]"
            @click.stop="appHost.closeTab(router, tab.id)"
          >
            ×
          </span>
        </button>
      </div>
    </template>

    <div class="h-full overflow-auto p-4">
      <div
        class="flex h-full min-h-[18rem] rounded-[1.25rem] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg)_94%,black)]"
      >
        <template v-if="!solid.isAuthenticated.value">
          <div class="m-auto w-full max-w-md space-y-4 px-4 py-6">
            <div class="space-y-1">
              <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                Solid login
              </p>
              <h2 class="m-0 text-base font-medium text-[var(--ui-fg)]">Sign in with Solid</h2>
            </div>

            <Input
              v-model="providerInput"
              aria-label="OIDC issuer"
              placeholder="https://login.inrupt.com"
              autocomplete="url"
            />

            <div class="flex flex-wrap gap-2">
              <Button
                v-for="provider in solid.providers"
                :key="provider"
                size="xs"
                variant="plain-secondary"
                @click="solid.setIssuer(provider)"
              >
                {{ provider.replace(/^https?:\/\//, "") }}
              </Button>
            </div>

            <div
              v-if="solid.error.value"
              class="rounded-xl border border-[color-mix(in_srgb,var(--ui-danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--ui-danger)_12%,transparent)] px-3 py-2 text-[11px] text-[var(--ui-fg)]"
            >
              {{ solid.error.value }}
            </div>

            <Button size="sm" variant="secondary" :disabled="isBusy" @click="login">
              {{ solid.status.value === "redirecting" ? "Redirecting..." : "Continue with Solid" }}
            </Button>
          </div>
        </template>

        <template v-else-if="workspace.status.value === 'loading'">
          <div class="m-auto space-y-3 text-center">
            <div class="flex justify-center">
              <Spinner size="lg" />
            </div>
            <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              Concord workspace
            </p>
            <p class="m-0 text-sm text-[var(--ui-fg)]">Loading managed workspace...</p>
          </div>
        </template>

        <template v-else>
          <RouterView />
        </template>
      </div>
    </div>

    <template #right-side>
      <div class="space-y-4 p-4" v-if="showLibraryInspector || showHostedInspector">
        <div class="flex items-center gap-2">
          <Button
            size="xs"
            :variant="inspectorMode === 'meta' ? 'secondary' : 'plain-secondary'"
            @click="inspectorMode = 'meta'"
          >
            Meta
          </Button>
          <Button
            size="xs"
            :variant="inspectorMode === 'history' ? 'secondary' : 'plain-secondary'"
            @click="inspectorMode = 'history'"
          >
            History
          </Button>
          <Button
            size="xs"
            :variant="inspectorMode === 'threads' ? 'secondary' : 'plain-secondary'"
            @click="inspectorMode = 'threads'"
          >
            Threads
          </Button>
        </div>

        <Card v-if="inspectorMode === 'meta'" variant="subtle" padding="sm" class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              {{ route.path.startsWith("/app/open") ? "Active context" : "Selected work" }}
            </p>
            <Badge tone="neutral" variant="soft">
              {{
                route.path.startsWith("/app/open")
                  ? appHost.activeAppLabel.value || "app"
                  : library.selectedItem.value?.kind || "system"
              }}
            </Badge>
          </div>

          <div class="space-y-1">
            <p class="m-0 text-sm text-[var(--ui-fg)]">
              {{ inspectorMeta.title }}
            </p>
            <p
              v-if="
                route.path.startsWith('/app/library') && library.selectedItem.value?.modifiedLabel
              "
              class="m-0 text-[11px] text-[var(--ui-fg-muted)]"
            >
              {{ library.selectedItem.value.modifiedLabel }}
            </p>
          </div>

          <div class="space-y-2 text-[11px] text-[var(--ui-fg-muted)]">
            <div
              v-for="row in inspectorMeta.rows"
              :key="row.label"
              class="flex items-center justify-between gap-3"
            >
              <span class="uppercase tracking-[0.16em]">{{ row.label }}</span>
              <span class="truncate text-right text-[var(--ui-fg)]">{{ row.value }}</span>
            </div>
          </div>

          <template
            v-if="
              route.path.startsWith('/app/library') && library.selectedItem.value?.kind === 'ledger'
            "
          >
            <Separator />
            <div class="space-y-2">
              <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                Capabilities
              </p>
              <div
                v-for="capability in library.selectedItem.value.capabilities"
                :key="capability.id"
                class="rounded-xl border border-[color-mix(in_srgb,var(--ui-border)_72%,transparent)] px-3 py-2"
              >
                <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ capability.label }}</p>
                <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                  {{ capability.description }}
                </p>
              </div>
            </div>
          </template>
        </Card>

        <Card
          v-else-if="inspectorMode === 'history'"
          variant="subtle"
          padding="sm"
          class="space-y-3"
        >
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Recent activity
          </p>
          <div class="space-y-2">
            <div
              v-for="entry in consoleEvents.slice(0, 6)"
              :key="entry.id"
              class="rounded-xl border border-[color-mix(in_srgb,var(--ui-border)_72%,transparent)] px-3 py-2"
            >
              <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ entry.message }}</p>
              <p v-if="entry.detail" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                {{ entry.detail }}
              </p>
            </div>
            <p v-if="!consoleEvents.length" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              No system events yet.
            </p>
          </div>
        </Card>

        <Card v-else variant="subtle" padding="sm" class="space-y-3">
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Threads
          </p>
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
            Threads will follow the current ledger and capability context. Nothing is attached here
            yet.
          </p>
        </Card>
      </div>
    </template>

    <template #console>
      <div v-if="showTodoConsole" class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <Badge :tone="todoWorkingCopy.stagedCount.value ? 'warning' : 'neutral'" variant="soft">
            {{ todoWorkingCopy.stagedCount.value }} staged
          </Badge>
          <Badge :tone="todoWorkingCopy.saving.value ? 'accent' : 'neutral'" variant="soft">
            {{ todoWorkingCopy.saving.value ? "committing" : "local replay" }}
          </Badge>
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
            Replay updates instantly. Commit when this change set is ready.
          </p>
        </div>

        <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem_auto] xl:items-end">
          <div class="space-y-1">
            <p class="m-0 text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
              Pending change set
            </p>
            <div class="max-h-28 space-y-2 overflow-auto">
              <div
                v-for="transaction in todoWorkingCopy.pendingTransactions.value.slice(-4).reverse()"
                :key="transaction.id"
                class="rounded-xl border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] px-3 py-2"
              >
                <p class="m-0 text-[11px] text-[var(--ui-fg)]">
                  {{ transaction.message }}
                </p>
                <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                  {{ transaction.stagedCount }} staged entity{{
                    transaction.stagedCount === 1 ? "" : "ies"
                  }}
                </p>
              </div>
              <p
                v-if="!todoWorkingCopy.pendingTransactions.value.length"
                class="m-0 text-[11px] text-[var(--ui-fg-muted)]"
              >
                No local changes are waiting to be committed.
              </p>
            </div>
          </div>

          <label class="space-y-1">
            <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
              Commit message
            </span>
            <Input
              :model-value="todoWorkingCopy.commitMessage.value"
              aria-label="Commit message"
              placeholder="Describe this commit"
              @update:model-value="todoWorkingCopy.setCommitMessage(String($event))"
            />
          </label>

          <Button
            size="sm"
            variant="secondary"
            :disabled="todoWorkingCopy.saving.value || todoWorkingCopy.stagedCount.value === 0"
            @click="todoWorkingCopy.commitPending"
          >
            {{ todoWorkingCopy.saving.value ? "Committing..." : "Commit" }}
          </Button>
        </div>

        <p
          v-if="todoWorkingCopy.error.value"
          class="m-0 text-[11px] text-[color-mix(in_srgb,var(--ui-danger)_88%,white)]"
        >
          {{ todoWorkingCopy.error.value }}
        </p>

        <Separator />

        <div class="space-y-2">
          <p class="m-0 text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
            System log
          </p>
          <div class="space-y-2">
            <div
              v-for="entry in consoleEvents.slice(0, 6)"
              :key="entry.id"
              class="rounded-xl border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] px-3 py-2"
            >
              <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ entry.message }}</p>
              <p v-if="entry.detail" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                {{ entry.detail }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div class="space-y-1">
          <p
            v-for="line in systemSummaryLines"
            :key="line"
            class="m-0 text-[11px] text-[var(--ui-fg-muted)]"
          >
            {{ line }}
          </p>
        </div>
        <Separator />
        <div class="space-y-2">
          <div
            v-for="entry in consoleEvents.slice(0, 6)"
            :key="entry.id"
            class="rounded-xl border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] px-3 py-2"
          >
            <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ entry.message }}</p>
            <p v-if="entry.detail" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              {{ entry.detail }}
            </p>
          </div>
          <p v-if="!consoleEvents.length" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
            System events will appear here as the workspace reacts.
          </p>
        </div>
      </div>
    </template>
  </ConcordWorkspaceShell>
</template>
