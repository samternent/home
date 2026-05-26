<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Button, Input } from "ternent-ui/primitives";
import { useAppApi } from "@/app/api";
import type { AppStorageProviderInfo } from "@/app/api/types";

const appApi = useAppApi();

const loadError = ref<string | null>(null);
const actionError = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const providers = ref<AppStorageProviderInfo[]>([]);
const activeRef = ref({
  providerId: "local",
  workspaceId: "solid-workspace",
  pointer: "local://concord",
});

const selectedProviderId = ref("local");
const selectedWorkspaceId = ref("solid-workspace");
const selectedPointer = ref("local://concord");

const httpBaseUrl = ref("");
const httpMode = ref<"shared" | "single-writer" | "test">("shared");
const httpSupportsCas = ref(true);
const httpAllowUnsafeSharedPush = ref(false);
const httpWorkspaceId = ref("solid-workspace");
const httpPointer = ref("https://example.com/ledger.json");

const providerById = computed(
  () => new Map(providers.value.map((provider) => [provider.id, provider] as const)),
);

const selectedProvider = computed(() => providerById.value.get(selectedProviderId.value) ?? null);

const providerRows = computed(() => providers.value);

function formatCapabilityLabel(value: string): string {
  return value.replace(/^supports/, "").replace(/[A-Z]/g, (c) => ` ${c.toLowerCase()}`).trim();
}

async function refreshStorageState(): Promise<void> {
  const [nextProviders, nextActiveRef] = await Promise.all([
    appApi.storage.listProviders(),
    appApi.storage.getActiveRef(),
  ]);

  providers.value = nextProviders;
  activeRef.value = {
    providerId: nextActiveRef.providerId,
    workspaceId: nextActiveRef.workspaceId,
    pointer: nextActiveRef.pointer,
  };

  selectedProviderId.value = nextActiveRef.providerId;
  selectedWorkspaceId.value = nextActiveRef.workspaceId;
  selectedPointer.value = nextActiveRef.pointer;
}

async function ensureLoaded(): Promise<void> {
  loadError.value = null;
  actionError.value = null;

  try {
    await appApi.load();
    await appApi.identity.ensureActiveIdentity();
    await refreshStorageState();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
  }
}

async function applyActiveRef(): Promise<void> {
  actionError.value = null;
  successMessage.value = null;

  try {
    await appApi.storage.setActiveRef({
      providerId: selectedProviderId.value,
      workspaceId: selectedWorkspaceId.value,
      pointer: selectedPointer.value,
    });

    await refreshStorageState();
    successMessage.value = "Active storage reference updated.";
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}

async function configureHttpProvider(): Promise<void> {
  actionError.value = null;
  successMessage.value = null;

  try {
    await appApi.storage.configureProvider({
      sync: {
        providerId: "http",
        baseUrl: httpBaseUrl.value.trim() || undefined,
        mode: httpMode.value,
        supportsCompareAndSwap: httpSupportsCas.value,
        allowUnsafeSharedPush: httpAllowUnsafeSharedPush.value,
      },
      ref: {
        providerId: "http",
        workspaceId: httpWorkspaceId.value.trim() || "solid-workspace",
        pointer: httpPointer.value.trim(),
      },
    });

    await refreshStorageState();
    successMessage.value = "HTTP provider configured and activated.";
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}

onMounted(() => {
  void ensureLoaded();
});
</script>

<template>
  <section class="space-y-5 p-4" data-test="storage-providers-v1">
    <header class="space-y-1">
      <h1 class="m-0 text-base font-semibold text-[var(--ui-fg)]">Storage Providers</h1>
      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        Configure runtime storage providers and choose the active workspace storage reference.
      </p>
    </header>

    <p
      v-if="loadError || appApi.lastError.value"
      class="m-0 text-sm text-[var(--ui-critical)]"
      data-test="storage-providers-load-error"
    >
      {{ loadError ?? appApi.lastError.value }}
    </p>

    <p v-if="actionError" class="m-0 text-sm text-[var(--ui-critical)]" data-test="storage-providers-action-error">
      {{ actionError }}
    </p>

    <p
      v-if="successMessage"
      class="m-0 text-sm text-[var(--ui-success)]"
      data-test="storage-providers-success"
    >
      {{ successMessage }}
    </p>

    <article class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4" data-test="storage-providers-active-card">
      <h2 class="m-0 text-sm font-semibold text-[var(--ui-fg)]">Active Workspace Storage Reference</h2>
      <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
        Current: {{ activeRef.providerId }} · {{ activeRef.workspaceId }} · {{ activeRef.pointer }}
      </p>

      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <label class="space-y-1">
          <span class="text-xs font-medium text-[var(--ui-fg-muted)]">Provider</span>
          <select
            v-model="selectedProviderId"
            class="h-9 w-full rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-2 text-sm text-[var(--ui-fg)]"
            data-test="storage-provider-select"
          >
            <option v-for="provider in providerRows" :key="provider.id" :value="provider.id">
              {{ provider.label }} ({{ provider.id }})
            </option>
          </select>
        </label>

        <label class="space-y-1">
          <span class="text-xs font-medium text-[var(--ui-fg-muted)]">Workspace Id</span>
          <Input v-model="selectedWorkspaceId" data-test="storage-workspace-id-input" />
        </label>

        <label class="space-y-1">
          <span class="text-xs font-medium text-[var(--ui-fg-muted)]">Pointer</span>
          <Input v-model="selectedPointer" data-test="storage-pointer-input" />
        </label>
      </div>

      <div class="mt-3">
        <Button size="sm" variant="secondary" data-test="storage-apply-active-ref" @click="applyActiveRef">
          Apply active ref
        </Button>
      </div>
    </article>

    <article class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4" data-test="storage-http-config-card">
      <h2 class="m-0 text-sm font-semibold text-[var(--ui-fg)]">HTTP Provider</h2>
      <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
        Register or update the HTTP provider from system routes.
      </p>

      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <label class="space-y-1">
          <span class="text-xs font-medium text-[var(--ui-fg-muted)]">Base URL (optional)</span>
          <Input v-model="httpBaseUrl" placeholder="https://api.example.com" data-test="storage-http-base-url" />
        </label>

        <label class="space-y-1">
          <span class="text-xs font-medium text-[var(--ui-fg-muted)]">Mode</span>
          <select
            v-model="httpMode"
            class="h-9 w-full rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-2 text-sm text-[var(--ui-fg)]"
            data-test="storage-http-mode"
          >
            <option value="shared">shared</option>
            <option value="single-writer">single-writer</option>
            <option value="test">test</option>
          </select>
        </label>

        <label class="space-y-1">
          <span class="text-xs font-medium text-[var(--ui-fg-muted)]">Workspace Id</span>
          <Input v-model="httpWorkspaceId" data-test="storage-http-workspace-id" />
        </label>

        <label class="space-y-1">
          <span class="text-xs font-medium text-[var(--ui-fg-muted)]">Pointer URL/path</span>
          <Input v-model="httpPointer" data-test="storage-http-pointer" />
        </label>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--ui-fg-muted)]">
        <label class="inline-flex items-center gap-2">
          <input v-model="httpSupportsCas" type="checkbox" data-test="storage-http-cas" />
          supports compare-and-swap
        </label>

        <label class="inline-flex items-center gap-2">
          <input v-model="httpAllowUnsafeSharedPush" type="checkbox" data-test="storage-http-unsafe" />
          allow unsafe shared push
        </label>
      </div>

      <div class="mt-3">
        <Button size="sm" variant="primary" data-test="storage-http-configure" @click="configureHttpProvider">
          Configure HTTP provider
        </Button>
      </div>
    </article>

    <article class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4" data-test="storage-providers-list-card">
      <h2 class="m-0 text-sm font-semibold text-[var(--ui-fg)]">Registered Providers</h2>

      <div class="mt-3 space-y-3">
        <div
          v-for="provider in providerRows"
          :key="provider.id"
          class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] p-3"
          :data-test="`storage-provider-row-${provider.id}`"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="m-0 text-sm font-semibold text-[var(--ui-fg)]">
              {{ provider.label }} <span class="text-xs font-normal text-[var(--ui-fg-muted)]">({{ provider.id }})</span>
            </p>
            <span
              v-if="activeRef.providerId === provider.id"
              class="rounded-full border border-[var(--ui-primary)]/40 bg-[var(--ui-tonal-primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ui-primary)]"
            >
              active
            </span>
          </div>

          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="([capability, enabled]) in Object.entries(provider.capabilities)"
              :key="capability"
              class="rounded-md px-2 py-1 text-[10px] font-medium"
              :class="enabled ? 'bg-[var(--ui-tonal-primary)] text-[var(--ui-primary)]' : 'bg-[var(--ui-tonal-secondary)] text-[var(--ui-fg-muted)]'"
            >
              {{ formatCapabilityLabel(capability) }}: {{ enabled ? 'yes' : 'no' }}
            </span>
          </div>
        </div>
      </div>

      <p v-if="!selectedProvider" class="mt-3 mb-0 text-xs text-[var(--ui-fg-muted)]">
        No provider selected.
      </p>
    </article>
  </section>
</template>
