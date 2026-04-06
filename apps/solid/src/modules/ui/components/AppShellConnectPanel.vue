<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "ternent-ui/primitives";
import AppShellIdentityPanel from "@/modules/ui/components/AppShellIdentityPanel.vue";
import AppShellProvidersPanel from "@/modules/ui/components/AppShellProvidersPanel.vue";
import { useAppShellProvidersModel } from "@/modules/ui/useAppShellProvidersModel";
import { useAppShellState } from "@/modules/ui/useAppShellState";

const shellState = useAppShellState();
const providers = useAppShellProvidersModel();
const showProviders = ref(false);

const hasConnectedProvider = computed(() => providers.runtime.auth.isAuthenticated.value);
const providersSummary = computed(() => {
  if (providers.runtime.auth.isAuthenticated.value) {
    return providers.runtime.auth.webId.value ?? "Solid connected";
  }

  return "Local storage stays on by default. Connect Solid only when you want remote storage or recovery.";
});

watch(
  () => shellState.activePanel.value,
  (panel) => {
    if (panel !== "connect") {
      return;
    }

    showProviders.value = hasConnectedProvider.value;
  },
  { immediate: true },
);
</script>

<template>
  <aside
    v-if="shellState.activePanel.value === 'connect'"
    class="flex h-full w-full max-w-[400px] flex-col border-l border-white/10 bg-black/10"
  >
    <div class="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
      <div>
        <p class="text-[11px] uppercase tracking-[0.24em] text-white/35">
          Connect
        </p>
        <h2 class="mt-2 text-lg font-medium text-white/90">
          Identity first
        </h2>
        <p class="mt-2 m-0 text-sm text-white/55">
          Create or load an identity when you want to make changes. Provider connection is optional.
        </p>
      </div>
      <Button size="sm" variant="plain-secondary" @click="shellState.closePanel()">
        Close
      </Button>
    </div>

    <div class="min-h-0 flex-1 overflow-auto px-6 py-6">
      <div class="space-y-8">
        <section class="space-y-4">
          <div class="space-y-1">
            <p class="m-0 text-xs uppercase tracking-[0.22em] text-white/40">
              Identity
            </p>
            <p class="m-0 text-sm text-white/55">
              Create, import, recover, and switch the signer used for local changes.
            </p>
          </div>
          <AppShellIdentityPanel />
        </section>

        <section class="space-y-4">
          <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <p class="m-0 text-xs uppercase tracking-[0.22em] text-white/40">
                  Providers
                </p>
                <p class="m-0 text-sm text-white/55">
                  {{ providersSummary }}
                </p>
              </div>
              <Button
                size="xs"
                variant="plain-secondary"
                @click="showProviders = !showProviders"
              >
                {{ showProviders ? "Hide" : "Show" }}
              </Button>
            </div>
          </div>
          <AppShellProvidersPanel v-if="showProviders" />
        </section>
      </div>
    </div>
  </aside>
</template>
