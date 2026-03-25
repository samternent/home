<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Input } from "ternent-ui/primitives";
import { buildConcordOsHostedAppRoute, createConcordOsOpenTarget } from "@/modules/concord-os/apps";
import { useConcordOsKernel } from "@/modules/concord-os";
import { useRouter } from "vue-router";

const emit = defineEmits<{
  (event: "close"): void;
}>();

const kernel = useConcordOsKernel();
const router = useRouter();
const query = ref("");

const filteredContexts = computed(() => {
  const normalized = query.value.trim().toLowerCase();
  if (!normalized) {
    return kernel.recentContexts.value;
  }

  return kernel.recentContexts.value.filter((item) =>
    `${item.title} ${item.appLabel || ""} ${item.scope}`.toLowerCase().includes(normalized),
  );
});

async function selectContext(item: (typeof filteredContexts.value)[number]) {
  const entry = await kernel.workspace.lookupEntry(item.url);
  if (!entry) {
    return;
  }

  if (item.appId && entry.isLedger) {
    await router.push(buildConcordOsHostedAppRoute(createConcordOsOpenTarget(entry), item.appId));
    emit("close");
    return;
  }

  await kernel.workspace.selectEntry(entry);
  emit("close");
}
</script>

<template>
  <div class="absolute inset-0 z-40 flex items-start justify-center bg-[color-mix(in_srgb,var(--ui-bg)_70%,rgba(10,14,22,0.48))] px-4 pt-[12vh] backdrop-blur-[18px]">
    <div class="w-full max-w-3xl rounded-[2rem] border border-[color-mix(in_srgb,var(--ui-border)_40%,white)] bg-[color-mix(in_srgb,var(--ui-bg)_72%,white)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
      <div class="border-b border-[color-mix(in_srgb,var(--ui-border)_35%,transparent)] p-5">
        <div class="flex items-center gap-3">
          <Input v-model="query" aria-label="Search Concord OS" placeholder="Search ledgers, apps, or commands..." />
          <Button size="xs" variant="plain-secondary" @click="$emit('close')">Esc</Button>
        </div>
      </div>

      <div class="space-y-5 p-5">
        <section class="space-y-3">
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">Recent contexts</p>
          <div class="space-y-2">
            <button
              v-for="item in filteredContexts"
              :key="item.url"
              type="button"
              class="flex w-full items-start gap-4 rounded-2xl px-3 py-3 text-left transition hover:bg-[color-mix(in_srgb,var(--ui-bg-muted)_12%,white)]"
              @click="selectContext(item)"
            >
              <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ui-primary-muted)_26%,white)] text-sm font-medium text-[var(--ui-primary)]">
                {{ (item.appLabel || item.title).slice(0, 2) }}
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm text-[var(--ui-fg)]">{{ item.title }}</span>
                <span class="block truncate text-[11px] text-[var(--ui-fg-muted)]">
                  {{ item.appLabel || "Library" }} · {{ item.scope }}
                </span>
              </span>
            </button>
            <p v-if="!filteredContexts.length" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              No matching contexts yet.
            </p>
          </div>
        </section>

        <section class="space-y-3">
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">System</p>
          <div class="space-y-2 text-[11px] text-[var(--ui-fg-muted)]">
            <p class="m-0">Search recent work now. Commands and app discovery can layer on top of this later.</p>
            <p class="m-0">Current surface: {{ kernel.surface.value }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
