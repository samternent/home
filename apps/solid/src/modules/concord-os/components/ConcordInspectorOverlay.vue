<script setup lang="ts">
import { Button, Badge, Separator } from "ternent-ui/primitives";
import { useConcordOsKernel } from "@/modules/concord-os";

const kernel = useConcordOsKernel();
const library = kernel.library;
</script>

<template>
  <div class="space-y-4 p-4">
    <div class="flex items-center gap-1 rounded-lg bg-[color-mix(in_srgb,var(--ui-bg-muted)_12%,transparent)] p-1">
      <Button size="xs" :variant="kernel.inspectorMode.value === 'meta' ? 'secondary' : 'plain-secondary'" @click="kernel.setInspectorMode('meta')">
        Meta
      </Button>
      <Button size="xs" :variant="kernel.inspectorMode.value === 'history' ? 'secondary' : 'plain-secondary'" @click="kernel.setInspectorMode('history')">
        History
      </Button>
      <Button size="xs" :variant="kernel.inspectorMode.value === 'threads' ? 'secondary' : 'plain-secondary'" @click="kernel.setInspectorMode('threads')">
        Threads
      </Button>
    </div>

    <div v-if="kernel.inspectorMode.value === 'meta'" class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
          {{ kernel.surface.value === 'app' ? 'Active context' : 'Selected work' }}
        </p>
        <Badge tone="neutral" variant="soft">
          {{ kernel.surface.value === 'app' ? kernel.appHost.activeAppLabel.value || 'app' : library.selectedItem.value?.kind || 'system' }}
        </Badge>
      </div>

      <div class="space-y-1">
        <p class="m-0 text-sm text-[var(--ui-fg)]">{{ kernel.inspectorMeta.value.title }}</p>
        <p
          v-if="kernel.surface.value === 'home' && library.selectedItem.value?.modifiedLabel"
          class="m-0 text-[11px] text-[var(--ui-fg-muted)]"
        >
          {{ library.selectedItem.value.modifiedLabel }}
        </p>
      </div>

      <div class="space-y-0 text-[11px] text-[var(--ui-fg-muted)]">
        <div
          v-for="row in kernel.inspectorMeta.value.rows"
          :key="row.label"
          class="flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--ui-border)_45%,transparent)] py-2 last:border-b-0"
        >
          <span>{{ row.label }}</span>
          <span class="truncate text-right text-[var(--ui-fg)]">{{ row.value }}</span>
        </div>
      </div>

      <template v-if="kernel.surface.value === 'home' && library.selectedItem.value?.kind === 'ledger'">
        <Separator />
        <div class="space-y-2">
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">Capabilities</p>
          <div
            v-for="capability in library.selectedItem.value.capabilities"
            :key="capability.id"
            class="border-b border-[color-mix(in_srgb,var(--ui-border)_45%,transparent)] py-2 last:border-b-0"
          >
            <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ capability.label }}</p>
            <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">{{ capability.description }}</p>
          </div>
        </div>
      </template>
    </div>

    <div v-else-if="kernel.inspectorMode.value === 'history'" class="space-y-3">
      <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">Recent activity</p>
      <div class="space-y-2">
        <div
          v-for="entry in kernel.eventLog.value.slice(0, 6)"
          :key="entry.id"
          class="border-b border-[color-mix(in_srgb,var(--ui-border)_45%,transparent)] py-2 last:border-b-0"
        >
          <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ entry.message }}</p>
          <p v-if="entry.detail" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">{{ entry.detail }}</p>
        </div>
        <p v-if="!kernel.eventLog.value.length" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
          No system events yet.
        </p>
      </div>
    </div>

    <div v-else class="space-y-3">
      <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">Threads</p>
      <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
        Threads will follow the current ledger and capability context. Nothing is attached here yet.
      </p>
    </div>
  </div>
</template>
