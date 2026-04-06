<script setup lang="ts">
import { Button, Card, Input, Tabs, Textarea } from "ternent-ui/primitives";
import { useAppShellIdentityModel } from "@/modules/ui/useAppShellIdentityModel";

const identity = useAppShellIdentityModel();
</script>

<template>
  <div class="space-y-4">
    <Card
      variant="panel"
      padding="md"
      class="space-y-4 border border-white/10 bg-white/[0.04]"
    >
      <div class="space-y-1">
        <p class="m-0 text-sm font-medium text-white/90">
          {{ identity.connectIntro.value.title }}
        </p>
        <p class="m-0 text-xs text-white/45">
          {{ identity.connectIntro.value.body }}
        </p>
      </div>

      <div
        v-if="identity.shellState.connectIntent.value"
        class="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-3"
      >
        <p class="m-0 text-xs uppercase tracking-[0.18em] text-white/45">
          Start here
        </p>
        <div class="flex flex-wrap gap-2">
          <Button size="xs" variant="secondary" @click="identity.shellState.openConnect('create')">
            Create new
          </Button>
          <Button size="xs" variant="plain-secondary" @click="identity.shellState.openConnect('mnemonic')">
            Import words
          </Button>
          <Button size="xs" variant="plain-secondary" @click="identity.shellState.openConnect('json')">
            Import JSON
          </Button>
          <Button
            v-if="identity.runtime.identity.bootstrapCandidates.value.length > 0"
            size="xs"
            variant="plain-secondary"
            @click="identity.shellState.openConnect('recover')"
          >
            Recover saved
          </Button>
        </div>
        <p
          v-if="identity.activeIdentity.value"
          class="m-0 text-xs text-emerald-200/80"
        >
          Identity ready. Go back to Explorer or Tasks to continue.
        </p>
      </div>

      <Tabs
        v-model="identity.identityTab.value"
        :items="identity.identityTabs.value"
        variant="pill"
      >
        <template #panel-create>
          <div class="space-y-4 pt-4">
            <Input
              v-model="identity.createIdentityLabel.value"
              placeholder="Second signer"
            />
            <div class="flex justify-end">
              <Button
                size="xs"
                variant="secondary"
                @click="identity.handleCreateIdentity"
              >
                Create
              </Button>
            </div>
          </div>
        </template>

        <template #panel-mnemonic>
          <div class="space-y-4 pt-4">
            <Input
              v-model="identity.importMnemonicLabel.value"
              placeholder="Recovered signer"
            />
            <Textarea
              v-model="identity.importMnemonicValue.value"
              rows="4"
              placeholder="word1 word2 word3 ..."
            />
            <div class="flex justify-end">
              <Button
                size="xs"
                variant="secondary"
                @click="identity.handleImportMnemonic"
              >
                Import mnemonic
              </Button>
            </div>
          </div>
        </template>

        <template #panel-json>
          <div class="space-y-4 pt-4">
            <Input
              v-model="identity.importJsonLabel.value"
              placeholder="Imported signer"
            />
            <Textarea
              v-model="identity.importJsonValue.value"
              rows="6"
              placeholder='{"keyId":"..."}'
            />
            <div class="flex justify-end">
              <Button
                size="xs"
                variant="secondary"
                @click="identity.handleImportJson"
              >
                Import JSON
              </Button>
            </div>
          </div>
        </template>

        <template #panel-recover>
          <div class="space-y-3 pt-4">
            <Button
              size="xs"
              variant="plain-secondary"
              class="self-start"
              @click="identity.refreshRecoveryOptions"
            >
              Refresh recovery
            </Button>

            <div
              v-for="candidate in identity.runtime.identity.bootstrapCandidates.value"
              :key="candidate.id"
              class="rounded-2xl border border-white/10 bg-black/10 p-3"
            >
              <p class="m-0 text-sm font-medium text-white/90">
                {{ candidate.label }}
              </p>
              <p class="m-0 text-xs text-white/45">
                {{ candidate.providerId }} · {{ candidate.keyId ?? 'unknown key' }}
              </p>
              <p
                v-if="candidate.error"
                class="mt-2 mb-0 text-xs text-rose-300"
              >
                {{ candidate.error }}
              </p>
              <div class="mt-3 flex justify-end">
                <Button
                  size="xs"
                  variant="secondary"
                  :disabled="!candidate.valid"
                  @click="identity.handleAdoptCandidate(candidate.id)"
                >
                  Use this identity
                </Button>
              </div>
            </div>
          </div>
        </template>
      </Tabs>
    </Card>

    <Card
      variant="panel"
      padding="md"
      class="space-y-4 border border-white/10 bg-white/[0.04]"
    >
      <div class="space-y-1">
        <p class="m-0 text-sm font-medium text-white/90">
          Active identity
        </p>
        <p class="m-0 text-xs text-white/45">
          {{ identity.activeIdentity.value?.profile.label ?? "No active identity" }}
        </p>
      </div>

      <div class="space-y-2 text-xs text-white/55">
        <p class="m-0">
          Status: {{ identity.runtime.identity.status.value }}
        </p>
        <p class="m-0">
          Key: {{ identity.activeIdentity.value?.identity.keyId ?? "Unavailable" }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="plain-secondary"
          :disabled="!identity.activeIdentity.value"
          @click="identity.handleExportActiveIdentity"
        >
          Export active
        </Button>
        <Button
          size="xs"
          variant="plain-secondary"
          @click="identity.refreshRecoveryOptions"
        >
          Refresh recovery
        </Button>
      </div>

      <Textarea
        v-if="identity.exportedIdentity.value"
        :model-value="identity.exportedIdentity.value"
        rows="8"
        readonly
      />
    </Card>

    <Card
      variant="panel"
      padding="md"
      class="space-y-4 border border-white/10 bg-white/[0.04]"
    >
      <div class="space-y-1">
        <p class="m-0 text-sm font-medium text-white/90">
          Local identities
        </p>
        <p class="m-0 text-xs text-white/45">
          One identity is active at a time. Switching resets the runtime but preserves provider connections.
        </p>
      </div>

      <div class="space-y-3">
        <div
          v-for="record in identity.runtime.identity.identities.value"
          :key="record.id"
          class="rounded-2xl border border-white/10 bg-black/10 p-3"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="m-0 text-sm font-medium text-white/90">
                {{ record.profile.label }}
              </p>
              <p class="m-0 text-xs text-white/45">
                {{ record.identity.keyId }}
              </p>
            </div>
            <span class="text-[10px] uppercase tracking-[0.16em] text-white/45">
              {{ identity.activeIdentity.value?.id === record.id ? "Active" : "Local" }}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <Button
              size="xs"
              variant="plain-secondary"
              :disabled="identity.activeIdentity.value?.id === record.id"
              @click="identity.handleSwitchIdentity(record.id)"
            >
              Switch
            </Button>
            <Button
              size="xs"
              variant="plain-secondary"
              @click="identity.handleRemoveIdentity(record.id)"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
