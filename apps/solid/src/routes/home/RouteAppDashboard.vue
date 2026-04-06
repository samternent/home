<script setup lang="ts">
import { useRouter } from "vue-router";
import { Button, Card } from "ternent-ui/primitives";
import { useRunDashboardSurface } from "@/modules/run/surfaces";
import { useAppShellState } from "@/modules/ui/useAppShellState";

const router = useRouter();
const dashboard = useRunDashboardSurface();
const shellState = useAppShellState();

async function openTasks(url: string) {
  const ok = await dashboard.openTasks(url);
  if (ok) {
    await router.push("/tasks");
  }
}
</script>

<template>
  <section class="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 px-6 py-8">
    <Card variant="panel" padding="md" class="border border-[var(--ui-border)] bg-[var(--ui-bg)]/85">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <p class="m-0 text-xs uppercase tracking-[0.22em] text-[var(--ui-fg-muted)]">
            Home
          </p>
          <h1 class="m-0 text-3xl font-semibold text-[var(--ui-fg)]">
            {{ dashboard.activeLedgerLabel.value }}
          </h1>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            {{ dashboard.activeLedgerSummary.value }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            v-if="dashboard.hasActiveLedger.value"
            @click="$router.push('/tasks')"
          >
            Continue in Tasks
          </Button>
          <Button variant="plain-secondary" @click="shellState.openPanel('explorer')">
            Browse ledgers
          </Button>
        </div>
      </div>
    </Card>

    <Card variant="panel" padding="md" class="border border-[var(--ui-border)] bg-[var(--ui-bg)]/85">
      <div class="space-y-4">
        <div class="space-y-1">
          <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">
            Recent task lists
          </p>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            Open a recent ledger and keep working in Tasks.
          </p>
        </div>

        <div v-if="dashboard.recentLedgers.value.length" class="divide-y divide-[var(--ui-border)]/60">
          <div
            v-for="ledger in dashboard.recentLedgers.value"
            :key="ledger.id"
            class="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
          >
            <div class="min-w-0 space-y-1">
              <div class="flex items-center gap-2">
                <p class="m-0 truncate text-base font-medium text-[var(--ui-fg)]">
                  {{ ledger.title }}
                </p>
                <span
                  v-if="ledger.active"
                  class="rounded-full border border-[var(--ui-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
                >
                  Current
                </span>
              </div>
              <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                {{ ledger.scope ?? "workspace" }} · {{ ledger.verificationSummary }}
              </p>
            </div>
            <Button :variant="ledger.active ? 'secondary' : 'plain-secondary'" @click="openTasks(ledger.url)">
              Open Tasks
            </Button>
          </div>
        </div>

        <div v-else class="rounded-xl border border-dashed border-[var(--ui-border)] p-4 text-sm text-[var(--ui-fg-muted)]">
          No task ledgers yet. Open Explorer to create your first ledger, then come back here to continue quickly.
        </div>
      </div>
    </Card>
  </section>
</template>
