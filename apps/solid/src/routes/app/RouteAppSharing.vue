<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Badge, Button, Card, Input, Switch } from "ternent-ui/primitives";
import { useConcordOsCore } from "@/modules/concord-os";

const workspace = useConcordOsCore();

const targetMode = ref<"selection" | "folder">("selection");
const publicRead = ref(false);
const agentInput = ref("");
const agents = ref<string[]>([]);

const availableTargets = computed(() => {
  const targets: Array<{ key: "selection" | "folder"; label: string; url: string }> = [];
  if (workspace.selectedEntry.value) {
    targets.push({
      key: "selection",
      label: workspace.selectedEntry.value.name,
      url: workspace.selectedEntry.value.url,
    });
  }
  if (workspace.currentBrowse.value) {
    targets.push({
      key: "folder",
      label: "Current folder",
      url: workspace.currentBrowse.value.url,
    });
  }
  return targets;
});

const activeTargetUrl = computed(
  () =>
    availableTargets.value.find((target) => target.key === targetMode.value)?.url ??
    workspace.currentTargetUrl.value,
);

watch(
  () => workspace.accessSummary.value,
  (summary) => {
    if (!summary) {
      publicRead.value = false;
      agents.value = [];
      return;
    }
    publicRead.value = summary.publicRead === "yes";
    agents.value = summary.grants.map((grant) => grant.webId);
  },
  { immediate: true },
);

watch(
  () => activeTargetUrl.value,
  async (next) => {
    await workspace.reloadAccess(next);
  },
  { immediate: true },
);

function addAgent(webId: string) {
  const normalized = webId.trim();
  if (!normalized || agents.value.includes(normalized)) {
    return;
  }
  agents.value = [...agents.value, normalized];
  agentInput.value = "";
}

function removeAgent(webId: string) {
  agents.value = agents.value.filter((value) => value !== webId);
}

async function saveAccess() {
  if (!activeTargetUrl.value) {
    return;
  }
  await workspace.applyAccess(activeTargetUrl.value, {
    publicRead: publicRead.value,
    agents: agents.value,
  });
}
</script>

<template>
  <div class="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] p-4">
    <section class="space-y-4 overflow-auto">
      <Card variant="subtle" padding="sm" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Target</p>

        <div class="flex flex-wrap gap-2">
          <Button
            v-for="target in availableTargets"
            :key="target.url"
            size="xs"
            variant="plain-secondary"
            :disabled="target.key === targetMode"
            @click="targetMode = target.key"
          >
            {{ target.label }}
          </Button>
        </div>

        <p v-if="activeTargetUrl" class="m-0 break-all text-[11px] text-[var(--ui-fg-muted)]">
          {{ activeTargetUrl }}
        </p>
        <p v-else class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
          Select a file or folder in Files to manage its sharing.
        </p>
      </Card>

      <Card variant="subtle" padding="sm" class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              Visibility
            </p>
            <p class="m-0 text-sm text-[var(--ui-fg)]">
              {{ workspace.accessSummary.value?.visibility || "unknown" }}
            </p>
          </div>

          <Badge tone="neutral" variant="soft">
            {{ workspace.accessSummary.value?.scope || workspace.currentScope.value }}
          </Badge>
        </div>

        <div
          class="flex items-center justify-between gap-3 rounded-xl border border-[var(--ui-border)] px-3 py-2"
        >
          <div>
            <p class="m-0 text-sm text-[var(--ui-fg)]">Public read</p>
            <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              Best-effort across Solid servers.
            </p>
          </div>
          <Switch v-model="publicRead" />
        </div>

        <div class="space-y-2">
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Direct WebIDs
          </p>
          <div class="flex gap-2">
            <Input
              v-model="agentInput"
              aria-label="Share with WebID"
              placeholder="https://alice.example/profile/card#me"
            />
            <Button size="xs" variant="secondary" @click="addAgent(agentInput)"> Add </Button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="person in workspace.people.value.people"
              :key="person.webId"
              type="button"
              class="rounded-full border border-[var(--ui-border)] px-2 py-1 text-[11px] text-[var(--ui-fg-muted)]"
              @click="addAgent(person.webId)"
            >
              {{ person.label || person.webId }}
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="webId in agents"
              :key="webId"
              class="flex items-center justify-between gap-3 rounded-xl border border-[var(--ui-border)] px-3 py-2"
            >
              <p class="m-0 break-all text-[11px] text-[var(--ui-fg)]">
                {{ webId }}
              </p>
              <Button size="xs" variant="plain-secondary" @click="removeAgent(webId)">
                Remove
              </Button>
            </div>
          </div>
        </div>

        <Button size="sm" variant="secondary" :disabled="!activeTargetUrl" @click="saveAccess">
          Save sharing
        </Button>
      </Card>
    </section>

    <aside class="space-y-4 overflow-auto">
      <Card variant="subtle" padding="sm" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Current access
        </p>

        <div
          v-if="workspace.accessSummary.value"
          class="space-y-2 text-[11px] text-[var(--ui-fg-muted)]"
        >
          <div>public: {{ workspace.accessSummary.value.publicRead }}</div>
          <div>grants: {{ workspace.accessSummary.value.grants.length }}</div>
          <div>visibility: {{ workspace.accessSummary.value.visibility }}</div>
        </div>

        <div v-if="workspace.accessSummary.value?.warnings.length" class="space-y-2">
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Warnings
          </p>
          <p
            v-for="warning in workspace.accessSummary.value.warnings"
            :key="warning"
            class="m-0 text-[11px] text-[var(--ui-fg-muted)]"
          >
            {{ warning }}
          </p>
        </div>
      </Card>
    </aside>
  </div>
</template>
