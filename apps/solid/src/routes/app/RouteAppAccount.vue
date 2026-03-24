<script setup lang="ts">
import { ref } from "vue";
import { Button, Card, Dialog } from "ternent-ui/primitives";
import { useConcordOsCore } from "@/modules/concord-os";
import { useSolidSession } from "@/modules/solid-session";

const solid = useSolidSession();
const workspace = useConcordOsCore();
const revealOpen = ref(false);

function downloadMnemonic() {
  if (!workspace.lastGeneratedMnemonic.value) {
    return;
  }

  const blob = new Blob([`${workspace.lastGeneratedMnemonic.value}\n`], {
    type: "text/plain",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "concord-mnemonic.txt";
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] p-4">
    <section class="space-y-4 overflow-auto">
      <Card variant="subtle" padding="sm" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Session
        </p>
        <div class="space-y-2 text-[11px] text-[var(--ui-fg-muted)]">
          <div>webid: {{ solid.webId.value || "none" }}</div>
          <div>pod: {{ workspace.selectedPod.value || "unselected" }}</div>
          <div>status: {{ workspace.status.value }}</div>
          <div>cache: {{ workspace.cacheStatus.value }}</div>
          <div>identity: {{ workspace.identityReady.value ? "ready" : "missing" }}</div>
        </div>
      </Card>

      <Card variant="subtle" padding="sm" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Managed roots
        </p>
        <div class="space-y-2 text-[11px] text-[var(--ui-fg-muted)]">
          <div>app: {{ workspace.paths.value?.appRootUrl || "unavailable" }}</div>
          <div>system/private: {{ workspace.paths.value?.systemPrivateRootUrl || "unavailable" }}</div>
          <div>workspace/private: {{ workspace.paths.value?.workspacePrivateRootUrl || "unavailable" }}</div>
          <div>workspace/shared: {{ workspace.paths.value?.workspaceSharedRootUrl || "unavailable" }}</div>
          <div>workspace/public: {{ workspace.paths.value?.workspacePublicRootUrl || "unavailable" }}</div>
        </div>
      </Card>

      <Card variant="subtle" padding="sm" class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Pods
          </p>
          <Button size="xs" variant="plain-secondary" @click="workspace.refreshPods()">
            Refresh
          </Button>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            v-for="pod in workspace.podUrls.value"
            :key="pod"
            size="xs"
            variant="plain-secondary"
            :disabled="workspace.selectedPod.value === pod"
            @click="workspace.selectPod(pod)"
          >
            {{ pod }}
          </Button>
        </div>
      </Card>
    </section>

    <aside class="space-y-4 overflow-auto">
      <Card variant="subtle" padding="sm" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Identity
        </p>

        <Button
          size="sm"
          variant="secondary"
          :disabled="workspace.busy.value"
          @click="workspace.provisionIdentity()"
        >
          {{ workspace.identityReady.value ? "Re-provision identity" : "Create identity" }}
        </Button>

        <Dialog
          v-model:open="revealOpen"
          title="Reveal mnemonic"
          description="Only reveal or download this mnemonic when you are ready to store it safely."
          size="lg"
        >
          <template #trigger>
            <Button
              size="xs"
              variant="plain-secondary"
              :disabled="!workspace.lastGeneratedMnemonic.value"
            >
              Reveal mnemonic
            </Button>
          </template>

          <div class="space-y-3">
            <pre class="rounded-xl border border-[var(--ui-border)] px-3 py-3 text-[11px] text-[var(--ui-fg)]">{{ workspace.lastGeneratedMnemonic.value }}</pre>
            <div class="flex gap-2">
              <Button size="xs" variant="secondary" @click="downloadMnemonic">
                Download
              </Button>
            </div>
          </div>
        </Dialog>
      </Card>

      <Card variant="subtle" padding="sm" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Diagnostics
        </p>

        <div class="space-y-2 text-[11px] text-[var(--ui-fg-muted)]">
          <div>mnemonic: {{ workspace.resources.value?.mnemonicUrl || "unknown" }}</div>
          <div>wallet: {{ workspace.resources.value?.walletUrl || "unknown" }}</div>
          <div>people: {{ workspace.resources.value?.peopleUrl || "unknown" }}</div>
          <div>verification: {{ workspace.resources.value?.verificationUrl || "unknown" }}</div>
        </div>

        <div v-if="workspace.accessReport.value?.issues.length" class="space-y-2">
          <p
            v-for="issue in workspace.accessReport.value.issues"
            :key="issue"
            class="m-0 text-[11px] text-[var(--ui-fg-muted)]"
          >
            {{ issue }}
          </p>
        </div>
      </Card>
    </aside>
  </div>
</template>
