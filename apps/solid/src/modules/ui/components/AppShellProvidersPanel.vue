<script setup lang="ts">
import { computed } from "vue";
import { Button, Card, Input } from "ternent-ui/primitives";
import { useAppShellProvidersModel } from "@/modules/ui/useAppShellProvidersModel";

const providers = useAppShellProvidersModel();
const isBusy = computed(() => providers.runtime.auth.status.value === "authenticating");

async function login() {
  await providers.runtime.auth.login();
}

async function logout() {
  await providers.runtime.auth.logout();
}
</script>

<template>
  <div class="space-y-4">
    <Card
      v-for="provider in providers.providerCards.value"
      :key="provider.id"
      variant="panel"
      padding="md"
      class="space-y-4 border border-white/10 bg-white/[0.04]"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <p class="m-0 text-sm font-medium text-white/90">
            {{ provider.label }}
          </p>
          <p class="m-0 text-xs text-white/45">
            <template v-if="provider.id === 'browser-local'">
              Default workspace in this browser
            </template>
            <template v-else-if="provider.id === 'solid'">
              {{ provider.mounts.length }} remote mount{{ provider.mounts.length === 1 ? "" : "s" }}
            </template>
            <template v-else>
              {{ provider.mounts.length }} mount{{ provider.mounts.length === 1 ? "" : "s" }}
            </template>
          </p>
        </div>
        <span
          class="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/75"
        >
          {{ provider.status }}
        </span>
      </div>

      <template v-if="provider.id === 'browser-local'">
        <p class="m-0 text-sm leading-6 text-white/65">
          Your folders, ledgers, and task lists stay in this browser even when nothing else is connected.
        </p>
      </template>

      <template v-if="provider.id === 'solid'">
        <p class="m-0 text-sm leading-6 text-white/65">
          Connect Solid if you want remote storage, shared mounts, or saved identity recovery.
        </p>

        <div class="space-y-2">
          <label
            class="block text-[11px] uppercase tracking-[0.18em] text-white/40"
          >
            OIDC issuer
          </label>

          <Input
            v-model="providers.providerInput.value"
            aria-label="OIDC issuer"
            placeholder="https://login.inrupt.com"
            autocomplete="url"
          />
        </div>

        <div class="space-y-2">
          <p class="m-0 text-[11px] uppercase tracking-[0.18em] text-white/40">
            Suggested providers
          </p>

          <div class="flex flex-wrap gap-2">
            <Button
              v-for="providerOption in providers.runtime.auth.providers"
              :key="providerOption"
              size="xs"
              variant="plain-secondary"
              class="rounded-full"
              @click="providers.runtime.auth.setIssuer(providerOption)"
            >
              {{ providerOption.replace(/^https?:\/\//, "") }}
            </Button>
          </div>
        </div>

        <div
          v-if="providers.runtime.auth.error.value"
          class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[12px] leading-5 text-white/75"
        >
          {{ providers.runtime.auth.error.value }}
        </div>

        <div class="space-y-2 text-sm text-white/65">
          <p class="m-0">
            {{ providers.runtime.auth.isAuthenticated.value ? providers.runtime.auth.webId.value : "Not connected." }}
          </p>
          <p
            v-if="providers.matchingBootstrapCandidate.value"
            class="m-0 text-xs text-emerald-200/80"
          >
            Saved Solid identity matches the active local identity.
          </p>
        </div>

        <div class="flex items-center justify-between gap-3">
          <p class="m-0 text-xs text-white/45">
            Connect when you want remote mounts or provider-backed identity recovery.
          </p>

          <Button
            v-if="providers.runtime.auth.isAuthenticated.value"
            size="sm"
            variant="plain-secondary"
            class="shrink-0"
            @click="logout"
          >
            Disconnect
          </Button>

          <Button
            v-else
            size="sm"
            variant="secondary"
            :disabled="isBusy"
            class="shrink-0"
            @click="login"
          >
            {{
              providers.runtime.auth.status.value === "authenticating"
                ? "Connecting..."
                : "Connect Solid"
            }}
          </Button>
        </div>

        <div
          v-if="
            provider.capabilities.includes('identity-cache') &&
            provider.status === 'ready' &&
            providers.activeIdentity.value
          "
          class="flex justify-end"
        >
          <Button
            size="xs"
            variant="plain-secondary"
            @click="providers.handleSyncIdentity(provider.id)"
          >
            Sync active identity
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>
