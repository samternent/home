<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { PageSurface } from "ternent-ui/patterns";
import { Badge, Button, Card, Input, Spinner } from "ternent-ui/primitives";
import { useRunCoreRuntime } from "@/modules/run/core";

const runtime = useRunCoreRuntime();
const terminalCommand = ref("");

const providerInput = computed({
  get: () => runtime.auth.issuer.value ?? "",
  set: (next: string) => runtime.auth.setIssuer(next),
});

const isBusy = computed(() => runtime.auth.status.value === "authenticating");
async function login() {
  await runtime.auth.login();
}

async function logout() {
  await runtime.auth.logout();
}

async function selectScope(scope: "private" | "shared" | "public") {
  await runtime.actions.selectScope(scope);
}

async function selectLedger(ledgerId: string) {
  await runtime.actions.selectLedger(ledgerId);
}

async function openApp() {
  await runtime.actions.openApp();
}

async function closeApp() {
  await runtime.actions.closeApp();
}

async function openExplorerItem(url: string) {
  await runtime.explorer.openItem(url);
}

async function explorerGoUp() {
  await runtime.explorer.goUp();
}

async function runTerminalCommand() {
  const next = terminalCommand.value.trim();
  if (!next) {
    return;
  }

  const handled = await runtime.terminal.run(next);
  if (handled) {
    terminalCommand.value = "";
  }
}

onMounted(async () => {
  await runtime.init();
});
</script>

<template>
  <PageSurface>
    <template v-if="!runtime.auth.isAuthenticated.value">
      <div class="flex h-full items-center justify-center px-4">
        <div
          class="w-full max-w-md rounded-[2rem] border border-[color-mix(in_srgb,var(--ui-border)_40%,white)] bg-[color-mix(in_srgb,var(--ui-bg)_78%,white)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.14)] backdrop-blur-[28px]"
        >
          <div class="space-y-4">
            <div class="space-y-1">
              <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                Solid login
              </p>
              <h2 class="m-0 text-base font-medium text-[var(--ui-fg)]">
                Sign in with Solid
              </h2>
            </div>

            <Input
              v-model="providerInput"
              aria-label="OIDC issuer"
              placeholder="https://login.inrupt.com"
              autocomplete="url"
            />

            <div class="flex flex-wrap gap-2">
              <Button
                v-for="provider in runtime.auth.providers"
                :key="provider"
                size="xs"
                variant="plain-secondary"
                @click="runtime.auth.setIssuer(provider)"
              >
                {{ provider.replace(/^https?:\/\//, "") }}
              </Button>
            </div>

            <div
              v-if="runtime.auth.error.value"
              class="rounded-xl border border-[color-mix(in_srgb,var(--ui-danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--ui-danger)_12%,transparent)] px-3 py-2 text-[11px] text-[var(--ui-fg)]"
            >
              {{ runtime.auth.error.value }}
            </div>

            <Button
              size="sm"
              variant="secondary"
              :disabled="isBusy"
              @click="login"
            >
              {{
                runtime.auth.status.value === "authenticating"
                  ? "Connecting..."
                  : "Continue with Solid"
              }}
            </Button>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="runtime.boot.status.value === 'booting'">
      <div class="flex h-full items-center justify-center">
        <div class="space-y-3 text-center">
          <div class="flex justify-center">
            <Spinner size="lg" />
          </div>
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
            Verified Concord workspace
          </p>
          <p class="m-0 text-sm text-[var(--ui-fg)]">Loading core runtime...</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div
        class="flex min-h-screen flex-col bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-bg)_94%,black)_0%,color-mix(in_srgb,var(--ui-bg)_98%,black)_100%)]"
      >
        <header class="flex items-start justify-between gap-4 px-6 pt-6">
          <div class="space-y-2">
            <p
              class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
            >
              run.ternent.dev
            </p>
            <div class="space-y-1">
              <h1
                class="m-0 text-3xl font-semibold tracking-[-0.04em] text-[var(--ui-fg)]"
              >
                Workspace Core
              </h1>
              <p class="m-0 max-w-2xl text-sm text-[var(--ui-fg-muted)]">
                The runtime comes first. This surface is only the verified Solid
                login gate and the foundational workspace core for explorer,
                terminal, and Concord host interfaces.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Badge tone="success" variant="soft">
              {{ runtime.identity.verificationMode.value }}
            </Badge>
            <Button size="xs" variant="plain-secondary" @click="logout">
              Log out
            </Button>
          </div>
        </header>

        <main class="flex-1 px-6 pb-24 pt-6">
          <div class="mx-auto max-w-5xl space-y-4">
            <div
              class="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
            >
            <Card variant="subtle" padding="sm" class="space-y-4">
              <div class="space-y-2">
                <p
                  class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                >
                  Core
                </p>
                <p class="m-0 text-lg text-[var(--ui-fg)]">
                  Multiple ledgers in one verified workspace. One active
                  projection at a time.
                </p>
                <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                  App-facing UI has been intentionally removed. The next work
                  should define the core runtime contracts and workspace state,
                  then layer explorer, terminal, and host interfaces on top.
                </p>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div
                  v-for="fact in runtime.diagnostics.facts.value"
                  :key="fact.label"
                  class="rounded-2xl border border-[var(--ui-border)] px-4 py-3"
                >
                  <p
                    class="m-0 text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]"
                  >
                    {{ fact.label }}
                  </p>
                  <p class="mt-2 break-all text-sm text-[var(--ui-fg)]">
                    {{ fact.value }}
                  </p>
                </div>
              </div>
            </Card>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <Card variant="subtle" padding="sm" class="space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="space-y-2">
                    <p
                      class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                    >
                      Explorer
                    </p>
                    <p class="m-0 text-sm text-[var(--ui-fg)]">
                      Current path
                    </p>
                    <p class="m-0 break-all text-sm text-[var(--ui-fg-muted)]">
                      {{ runtime.explorer.currentPath.value }}
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="plain-secondary"
                    :disabled="!runtime.explorer.canGoUp.value"
                    @click="explorerGoUp"
                  >
                    Up
                  </Button>
                </div>

                <div v-if="runtime.explorer.items.value.length" class="space-y-2">
                  <button
                    v-for="item in runtime.explorer.items.value"
                    :key="item.id"
                    type="button"
                    :aria-label="`Open explorer item ${item.title}`"
                    class="flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition"
                    :class="
                      item.active
                        ? 'border-[var(--ui-primary)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_16%,white)]'
                        : 'border-[var(--ui-border)]'
                    "
                    @click="openExplorerItem(item.url)"
                  >
                    <span class="min-w-0">
                      <span class="block truncate text-sm text-[var(--ui-fg)]">
                        {{ item.title }}
                      </span>
                      <span
                        class="block truncate text-[11px] uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
                      >
                        {{ item.kind }}
                      </span>
                    </span>
                    <span class="text-[11px] text-[var(--ui-fg-muted)]">
                      {{ item.kind === "container" ? "open" : "select" }}
                    </span>
                  </button>
                </div>
                <p v-else class="m-0 text-sm text-[var(--ui-fg-muted)]">
                  No explorer entries are loaded for the current path yet.
                </p>
              </Card>

              <Card variant="subtle" padding="sm" class="space-y-4">
                <div class="space-y-2">
                  <p
                    class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                  >
                    Terminal
                  </p>
                  <p class="m-0 text-sm text-[var(--ui-fg)]">
                    Command-driven workspace control
                  </p>
                  <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                    All mutations and navigation flow through terminal commands,
                    not route-local state.
                  </p>
                </div>

                <div
                  class="max-h-72 space-y-2 overflow-auto rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-bg)_86%,black)] p-3"
                >
                  <div
                    v-for="entry in runtime.terminal.history.value"
                    :key="entry.id"
                    class="space-y-1"
                  >
                    <p
                      v-for="line in entry.lines"
                      :key="line"
                      class="m-0 break-all font-mono text-[12px]"
                      :class="
                        entry.kind === 'error'
                          ? 'text-[var(--ui-danger)]'
                          : entry.kind === 'command'
                          ? 'text-[var(--ui-fg)]'
                          : 'text-[var(--ui-fg-muted)]'
                      "
                    >
                      {{ line }}
                    </p>
                  </div>
                </div>

                <form class="flex gap-2" @submit.prevent="runTerminalCommand">
                  <Input
                    v-model="terminalCommand"
                    aria-label="Terminal command"
                    placeholder="help, ls, cd private, select alpha, mkledger journal"
                  />
                  <Button size="sm" variant="secondary" type="submit">
                    Run
                  </Button>
                </form>
              </Card>
            </div>

            <Card variant="subtle" padding="sm" class="space-y-4">
              <div class="space-y-2">
                <p
                  class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                >
                  Workspace selection
                </p>
                <div class="flex flex-wrap gap-2">
                  <Button
                    v-for="mount in runtime.workspace.mounts.value"
                    :key="mount.id"
                    size="xs"
                    :variant="
                      runtime.workspace.selection.value.activeScope === mount.scope
                        ? 'secondary'
                        : 'plain-secondary'
                    "
                    @click="selectScope(mount.scope)"
                  >
                    {{ mount.label }}
                  </Button>
                </div>
              </div>

              <div class="space-y-2">
                <p
                  class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                >
                  Ledgers
                </p>
                <div v-if="runtime.workspace.ledgers.value.length" class="space-y-2">
                  <button
                    v-for="ledger in runtime.workspace.ledgers.value.slice(0, 6)"
                    :key="ledger.id"
                    type="button"
                    :aria-label="`Select ledger ${ledger.title}`"
                    class="flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition"
                    :class="
                      runtime.workspace.selection.value.activeLedgerId === ledger.id
                        ? 'border-[var(--ui-primary)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_16%,white)]'
                        : 'border-[var(--ui-border)]'
                    "
                    @click="selectLedger(ledger.id)"
                  >
                    <span class="min-w-0">
                      <span class="block truncate text-sm text-[var(--ui-fg)]">
                        {{ ledger.title }}
                      </span>
                      <span
                        class="block truncate text-[11px] text-[var(--ui-fg-muted)]"
                      >
                        {{ ledger.scope }} · verified
                      </span>
                    </span>
                    <span class="text-[11px] text-[var(--ui-fg-muted)]">
                      {{
                        runtime.workspace.activeProjection.value.ledgerId === ledger.id
                          ? "active"
                          : "select"
                      }}
                    </span>
                  </button>
                </div>
                <p v-else class="m-0 text-sm text-[var(--ui-fg-muted)]">
                  No ledgers discovered in the current workspace cache yet.
                </p>
              </div>

              <div class="space-y-2">
                <p
                  class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                >
                  App context
                </p>
                <div class="flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant="secondary"
                    :disabled="
                      !runtime.surfaces.available.value.find(
                        (item) => item.id === 'concord-host',
                      )?.available
                    "
                    @click="openApp"
                  >
                    Open app
                  </Button>
                  <Button
                    size="xs"
                    variant="plain-secondary"
                    :disabled="!runtime.apps.active.value"
                    @click="closeApp"
                  >
                    Close app
                  </Button>
                </div>
                <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                  {{
                    runtime.apps.active.value
                      ? `Open via ${runtime.apps.active.value.appId}`
                      : "No active hosted app yet."
                  }}
                </p>
              </div>
            </Card>

            <Card variant="subtle" padding="sm" class="space-y-4">
              <div class="space-y-2">
                <p
                  class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                >
                  Runtime
                </p>
                <p class="m-0 text-sm text-[var(--ui-fg)]">
                  Current core signals
                </p>
              </div>

              <div class="space-y-2 text-[13px] text-[var(--ui-fg-muted)]">
                <p
                  v-for="line in runtime.diagnostics.summaryLines.value"
                  :key="line"
                  class="m-0 rounded-xl border border-[var(--ui-border)] px-3 py-2"
                >
                  {{ line }}
                </p>
              </div>

              <div class="space-y-2">
                <p
                  class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                >
                  Runtime direction
                </p>
                <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                  1. Harden explorer and terminal against the same workspace
                  state.
                </p>
                <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                  2. Materialise `WorkspaceState` as the shared contract across
                  surfaces and services.
                </p>
                <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                  3. Add shared services for history, capability resolution, and
                  verification explanation.
                </p>
                <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                  4. Add the first hosted app only after those contracts stop
                  moving.
                </p>
              </div>
            </Card>
          </div>
        </main>

        <footer
          class="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-4 pb-6"
        >
          <div
            class="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-bg)_82%,black)] px-3 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-[18px]"
          >
            <button
              v-for="item in runtime.surfaces.available.value"
              :key="item.id"
              type="button"
              class="rounded-full px-4 py-2 text-sm transition"
              :class="
                item.id === runtime.surfaces.active.value || item.id === 'core'
                  ? 'bg-[var(--ui-primary)] text-white'
                  : item.available
                  ? 'text-[var(--ui-fg-muted)]'
                  : 'text-[color-mix(in_srgb,var(--ui-fg-muted)_55%,transparent)]'
              "
            >
              {{ item.label }}
            </button>
          </div>
        </footer>
      </div>
    </template>
  </PageSurface>
</template>
