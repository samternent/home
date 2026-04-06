<script setup lang="ts">
import { computed } from "vue";
import { Badge, Button, Input, Textarea } from "ternent-ui/primitives";
import { useRunTaskCommitModel } from "./useRunTaskCommitModel";

type RunTaskCommitBarTone = "default" | "demo";

const props = withDefaults(
  defineProps<{
    tone?: RunTaskCommitBarTone;
    showHelper?: boolean;
  }>(),
  {
    tone: "default",
    showHelper: true,
  },
);

const commitModel = useRunTaskCommitModel();

const rootClass = computed(() =>
  props.tone === "demo"
    ? "px-0 py-0 text-[var(--ui-fg)]"
    : "border-t border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-[var(--ui-fg)] sm:px-5",
);

const mutedClass = computed(() =>
  props.tone === "demo" ? "text-white/55" : "text-[var(--ui-fg-muted)]",
);

const inputClass = computed(() =>
  props.tone === "demo"
    ? "font-mono border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] text-[var(--ui-fg)] placeholder:text-[var(--ui-fg-muted)]"
    : "font-mono",
);

const secondaryButtonClass = computed(() =>
  props.tone === "demo"
    ? "rounded-lg border border-white/15 bg-white/8 text-white hover:bg-white/12"
    : "rounded-lg",
);

const primaryButtonClass = computed(() =>
  props.tone === "demo"
    ? "rounded-lg bg-white text-slate-950 hover:bg-white/92"
    : "rounded-lg",
);

const summaryLabel = computed(() => {
  const count = commitModel.stagedCount.value;
  return count === 1 ? "1 staged entry" : `${count} staged entries`;
});

function handleDismiss() {
  if (commitModel.hasStagedChanges.value) {
    void commitModel.discardStaged();
    return;
  }

  commitModel.clearMessage();
}
</script>

<template>
  <div :class="rootClass">
    <div v-if="props.tone === 'demo' && !props.showHelper">
      <div class="flex justify-center">
        <Badge tone="neutral" variant="soft" size="sm">
          {{ summaryLabel }}
        </Badge>
      </div>

      <div class="mt-4">
        <Textarea
          v-model="commitModel.commitMessage.value"
          resize="none"
          :rows="2"
          :class="inputClass"
          placeholder="Describe your changes..."
          :disabled="
            commitModel.busy.value !== null ||
            commitModel.mode.value !== 'interactive'
          "
        />
      </div>

      <div class="mt-4 flex items-center justify-center gap-3">
        <Button
          size="sm"
          variant="plain-secondary"
          :class="secondaryButtonClass"
          :disabled="
            commitModel.busy.value !== null ||
            (!commitModel.hasStagedChanges.value &&
              commitModel.commitMessage.value.trim().length === 0)
          "
          @click="handleDismiss"
        >
          {{
            commitModel.busy.value === "discard" ? "Dismissing..." : "Dismiss"
          }}
        </Button>
        <Button
          size="sm"
          :class="primaryButtonClass"
          :disabled="!commitModel.canCommit.value"
          @click="commitModel.commitStaged"
        >
          {{ commitModel.busy.value === "commit" ? "Committing..." : "Commit" }}
        </Button>
      </div>

      <p
        v-if="commitModel.error.value"
        class="m-0 mt-3 text-center text-sm text-[var(--ui-critical)]"
      >
        {{ commitModel.error.value }}
      </p>
    </div>

    <div
      v-else
      class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="min-w-0 space-y-1">
        <p
          class="m-0 text-[11px] uppercase tracking-[0.18em]"
          :class="mutedClass"
        >
          Commit
        </p>
        <p class="m-0 text-sm">
          {{ summaryLabel }}
        </p>
        <p v-if="props.showHelper" class="m-0 text-xs" :class="mutedClass">
          {{
            commitModel.hasStagedChanges.value
              ? "Changes are staged locally until you commit them into signed history."
              : "Stage changes from tasks, users, or permissions, then commit them with one message."
          }}
        </p>
      </div>

      <div
        class="flex w-full flex-col gap-2 lg:max-w-2xl lg:flex-row lg:items-center"
      >
        <Input
          v-model="commitModel.commitMessage.value"
          :class="inputClass"
          placeholder="Commit message"
          :disabled="
            commitModel.busy.value !== null ||
            commitModel.mode.value !== 'interactive'
          "
        />
        <div class="flex gap-2">
          <Button
            size="sm"
            variant="plain-secondary"
            :class="secondaryButtonClass"
            :disabled="
              commitModel.busy.value !== null ||
              !commitModel.hasStagedChanges.value
            "
            @click="commitModel.discardStaged"
          >
            {{
              commitModel.busy.value === "discard" ? "Discarding..." : "Discard"
            }}
          </Button>
          <Button
            size="sm"
            :class="primaryButtonClass"
            :disabled="!commitModel.canCommit.value"
            @click="commitModel.commitStaged"
          >
            {{
              commitModel.busy.value === "commit" ? "Committing..." : "Commit"
            }}
          </Button>
        </div>
      </div>
    </div>

    <p
      v-if="
        commitModel.error.value && !(props.tone === 'demo' && !props.showHelper)
      "
      class="m-0 mt-3 text-sm text-[var(--ui-critical)]"
    >
      {{ commitModel.error.value }}
    </p>
  </div>
</template>
