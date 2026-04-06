<script setup lang="ts">
import { Button, Card, Textarea } from "ternent-ui/primitives";
import { useAppShellIdentityModel } from "@/modules/ui/useAppShellIdentityModel";

const identity = useAppShellIdentityModel();
</script>

<template>
  <Card
    v-if="identity.showIdentityBanner.value"
    variant="panel"
    padding="md"
    class="mb-4 border border-[var(--ui-border)] bg-[var(--ui-bg)]/85 backdrop-blur-xl"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="space-y-2">
        <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">
          {{
            identity.runtime.identity.ready.value
              ? `Active identity: ${identity.activeIdentity.value?.profile.label ?? "Unknown"}`
              : "Identity updated"
          }}
        </p>
        <p class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]">
          {{
            identity.runtime.identity.ready.value
              ? "Signed actions now use the active local identity."
              : identity.suggestedBootstrapCandidate.value
                ? `We found a saved identity from ${identity.suggestedBootstrapCandidate.value.providerId}. Recover it from Connect when you want to act on projections.`
                : "You can keep inspecting ledgers now and add an identity later from Connect."
          }}
        </p>
        <p
          v-if="identity.matchingBootstrapCandidate.value"
          class="m-0 text-xs text-[var(--ui-fg-muted)]"
        >
          Connected provider cache matches the active identity.
        </p>
        <p
          v-if="identity.identityError.value || identity.runtime.identity.error.value"
          class="m-0 text-sm text-[var(--ui-critical)]"
        >
          {{ identity.identityError.value ?? identity.runtime.identity.error.value }}
        </p>
        <p
          v-if="identity.identityMessage.value"
          class="m-0 text-sm text-[var(--ui-fg)]"
        >
          {{ identity.identityMessage.value }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="plain-secondary"
          @click="identity.shellState.openConnect()"
        >
          {{ identity.runtime.identity.ready.value ? "Manage in Connect" : "Open Connect" }}
        </Button>
        <Button
          v-if="identity.createdMnemonic.value"
          size="sm"
          variant="plain-secondary"
          @click="identity.acknowledgeMnemonic"
        >
          Hide phrase
        </Button>
      </div>
    </div>

    <div
      v-if="identity.createdMnemonic.value"
      class="mt-4 space-y-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4"
    >
      <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">
        Save this mnemonic now
      </p>
      <p class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]">
        {{ identity.createdIdentityLabel.value ?? "New identity" }} was created locally. Keep this phrase somewhere safe.
      </p>
      <Textarea
        :model-value="identity.createdMnemonic.value"
        rows="4"
        readonly
        resize="none"
      />
    </div>
  </Card>
</template>
