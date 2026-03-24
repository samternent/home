<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Badge, Button, Card, Spinner } from "ternent-ui/primitives";
import ConcordTodoWorkspace from "@/modules/concord-os/components/ConcordTodoWorkspace.vue";
import {
  useConcordOsAppHost,
  useConcordTodoWorkingCopy,
} from "@/modules/concord-os";

const route = useRoute();
const router = useRouter();
const host = useConcordOsAppHost();
const todoDraft = useConcordTodoWorkingCopy();

const scope = computed(() => String(route.params.scope || "private") as "private" | "shared" | "public");
const appId = computed(() => String(route.params.appId || ""));
const encodedPath = computed(() => String(route.params.encodedPath || ""));

watch(
  () => [scope.value, appId.value, encodedPath.value] as const,
  async ([nextScope, nextAppId, nextEncodedPath]) => {
    if (!nextAppId || !nextEncodedPath) {
      return;
    }

    await host.loadHostedApp({
      scope: nextScope,
      appId: nextAppId,
      encodedPath: nextEncodedPath,
    });
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  void host.destroyActiveApp();
});

const hostStatus = computed(() => {
  if (host.error.value) {
    return {
      label: "Error",
      tone: "warning" as const,
      detail: host.error.value,
    };
  }

  if (todoDraft.error.value) {
    return {
      label: "Error",
      tone: "warning" as const,
      detail: todoDraft.error.value,
    };
  }

  if (todoDraft.saving.value) {
    return {
      label: "Committing",
      tone: "accent" as const,
      detail: "Writing staged Concord changes to the ledger.",
    };
  }

  if (todoDraft.stagedCount.value > 0) {
    return {
      label: "Pending",
      tone: "warning" as const,
      detail: `${todoDraft.stagedCount.value} local change${todoDraft.stagedCount.value === 1 ? "" : "s"} staged. Replay is current; commit when ready.`,
    };
  }

  if (host.status.value === "loading") {
    return {
      label: "Loading",
      tone: "neutral" as const,
      detail: "Preparing the hosted app from the selected ledger.",
    };
  }

  return {
    label: "Ready",
    tone: "success" as const,
    detail: todoDraft.lastAction.value || "Ledger state is ready to work with.",
  };
});
</script>

<template>
  <div class="h-full min-h-0 overflow-auto">
    <template v-if="host.status.value === 'loading'">
      <div class="flex h-full min-h-[22rem] items-center justify-center">
        <div class="space-y-3 text-center">
          <div class="flex justify-center">
            <Spinner size="lg" />
          </div>
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Hosted app
          </p>
          <p class="m-0 text-sm text-[var(--ui-fg)]">
            Loading ledger workspace...
          </p>
        </div>
      </div>
    </template>

    <template v-else-if="host.status.value === 'error'">
      <div class="flex h-full min-h-[22rem] items-center justify-center p-4">
        <Card variant="subtle" padding="sm" class="w-full max-w-lg space-y-4">
          <div class="space-y-2">
            <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              Hosted app
            </p>
            <p class="m-0 text-sm text-[var(--ui-fg)]">
              This ledger could not be opened.
            </p>
            <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              {{ host.error.value }}
            </p>
          </div>
          <Button size="sm" variant="secondary" @click="host.backToLibrary(router)">
            Back to library
          </Button>
        </Card>
      </div>
    </template>

    <template v-else-if="host.activeAppId.value === 'todo' && host.activeTarget.value">
      <div class="flex h-full min-h-0 flex-col overflow-hidden">
        <div class="border-b border-[var(--ui-border)] px-4 py-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-1">
              <p class="m-0 text-sm text-[var(--ui-fg)]">
                {{ host.activeTarget.value.title }} · {{ host.activeAppLabel.value }}
              </p>
              <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                {{ hostStatus.detail }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Badge :tone="hostStatus.tone" variant="soft">{{ hostStatus.label }}</Badge>
              <Button size="xs" variant="plain-secondary" @click="host.backToLibrary(router)">
                Back
              </Button>
            </div>
          </div>
        </div>

        <ConcordTodoWorkspace
          :items="todoDraft.items.value"
          :error="todoDraft.error.value"
          :app-label="host.activeAppLabel.value || 'Todo'"
          :status-label="hostStatus.label"
          :status-detail="hostStatus.detail"
          :last-action="todoDraft.lastAction.value"
          :ledger-title="host.activeTarget.value.title"
          :ledger-url="host.activeTarget.value.url"
          @create="todoDraft.createTodo"
          @toggle="todoDraft.toggleTodo"
          @delete="todoDraft.deleteTodo"
        />
      </div>
    </template>
  </div>
</template>
