<script setup lang="ts">
import { useSlots } from "vue";
import { Badge, Button } from "ternent-ui/primitives";

const slots = useSlots();

defineProps<{
  navItems: Array<{ to: string; label: string }>;
  currentPath: string;
  appLabel: string;
  sectionLabel: string;
  statusLabel: string;
  statusTone: "neutral" | "success" | "warning";
  webIdLabel: string;
  podLabel: string;
  sidebarCollapsed: boolean;
  consoleOpen: boolean;
  inspectorOpen?: boolean;
  consolePulse?: boolean;
}>();

defineEmits<{
  (event: "toggle-sidebar"): void;
  (event: "toggle-console"): void;
  (event: "toggle-inspector"): void;
}>();
</script>

<template>
  <div class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-bg)_94%,black)_0%,color-mix(in_srgb,var(--ui-bg)_96%,black)_100%)]">
    <header
      class="sticky top-0 z-20 w-full border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-bg)_78%,rgba(4,8,18,0.92))] backdrop-blur-[12px]"
    >
      <div class="flex items-center justify-between gap-4 px-4 py-3">
        <div class="flex min-w-0 items-center gap-3">
          <RouterLink
            to="/"
            class="truncate text-sm font-semibold tracking-[0.02em] text-[var(--ui-fg)] no-underline"
          >
            {{ appLabel }}
          </RouterLink>
          <span class="text-[11px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">
            {{ sectionLabel }}
          </span>
          <Badge :tone="statusTone" variant="soft">
            {{ statusLabel }}
          </Badge>
        </div>

        <div class="flex items-center gap-2">
          <Button
            size="xs"
            variant="plain-secondary"
            aria-label="Toggle navigation"
            @click="$emit('toggle-sidebar')"
          >
            {{ sidebarCollapsed ? "Rail" : "Collapse" }}
          </Button>
          <slot name="header-actions" />
        </div>
      </div>

    </header>

    <div class="relative z-10 flex h-full flex-1 overflow-hidden">
      <aside
        class="shrink-0 border-r border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-bg)_92%,black)] transition-[width] duration-200"
        :class="sidebarCollapsed ? 'w-[4.5rem]' : 'w-[11rem]'"
      >
        <div class="flex h-full flex-col overflow-hidden">
          <nav class="flex-1 space-y-1 overflow-auto p-2">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left no-underline transition"
              :class="currentPath.startsWith(item.to)
                ? 'bg-[color-mix(in_srgb,var(--ui-primary-muted)_20%,rgba(9,18,36,0.88))] text-[var(--ui-fg)]'
                : 'text-[var(--ui-fg-muted)] hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_14%,rgba(8,14,28,0.56))] hover:text-[var(--ui-fg)]'"
            >
              <span
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--ui-border)_70%,transparent)] text-[11px] uppercase tracking-[0.16em]"
              >
                {{ item.label.slice(0, 2) }}
              </span>
              <span v-if="!sidebarCollapsed" class="truncate text-[11px] uppercase tracking-[0.14em]">
                {{ item.label }}
              </span>
            </RouterLink>
          </nav>
        </div>
      </aside>

      <div class="flex w-full flex-1 flex-col overflow-hidden">
        <div class="flex h-full flex-1 overflow-hidden">
          <main class="relative flex-1 overflow-hidden">
            <div class="flex h-full flex-col overflow-hidden">
              <div
                v-if="slots['context-tabs']"
                class="border-b border-[var(--ui-border)] px-4 py-2"
              >
                <slot name="context-tabs" />
              </div>

              <div class="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] px-4 py-3">
                <div class="min-w-0">
                  <p class="m-0 truncate text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                    Workspace
                  </p>
                  <h1 class="m-0 truncate text-sm font-medium tracking-[0.02em] text-[var(--ui-fg)]">
                    {{ sectionLabel }}
                  </h1>
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="plain-secondary"
                    @click="$emit('toggle-inspector')"
                  >
                    {{ inspectorOpen ? "Hide inspector" : "Show inspector" }}
                  </Button>
                  <Button
                    size="xs"
                    variant="plain-secondary"
                    @click="$emit('toggle-console')"
                  >
                    {{ consoleOpen ? "Hide console" : "Show console" }}
                  </Button>
                </div>
              </div>

              <div class="min-h-0 flex-1 overflow-hidden">
                <slot />
              </div>
            </div>
          </main>

          <aside
            v-if="$slots['right-side'] && inspectorOpen"
            class="w-[20rem] shrink-0 border-l border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-bg)_88%,black)]"
          >
            <div class="flex h-full min-h-0 flex-col overflow-hidden">
              <div class="border-b border-[var(--ui-border)] px-4 py-3">
                <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                  Inspector
                </p>
              </div>
              <div class="min-h-0 flex-1 overflow-auto">
                <slot name="right-side" />
              </div>
            </div>
          </aside>
        </div>

        <div
          v-if="consoleOpen"
          class="border-t border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-bg)_90%,black)]"
        >
          <div class="px-4 py-3">
            <div class="mb-2 flex items-center justify-between gap-3">
              <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                Console
              </p>
              <slot name="console-actions" />
            </div>
            <div
              class="rounded-2xl border bg-[rgba(0,0,0,0.38)] px-3 py-3 font-mono text-xs transition-colors duration-300"
              :class="consolePulse
                ? 'border-[color-mix(in_srgb,var(--ui-primary)_42%,var(--ui-border))]'
                : 'border-[color-mix(in_srgb,var(--ui-border)_74%,transparent)]'"
            >
              <slot name="console" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
