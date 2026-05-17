<script setup lang="ts">
import { useLocalStorage, useWindowSize } from "@vueuse/core";
import { computed, ref } from "vue";
import type { PropType } from "vue";
import { Button, Tabs, Textarea } from "ternent-ui/primitives";
import { FormField, PanelChrome } from "ternent-ui/patterns";
import { useAppApi } from "@/app/api";

defineProps({
  container: {
    type: Object as PropType<HTMLElement | null>,
    default: typeof document !== "undefined" ? document.body : null,
  },
});

const { width } = useWindowSize();
const appApi = useAppApi();

const isDragging = useLocalStorage("isBottomPanelDragging", false);
const isBottomPanelExpanded = useLocalStorage("isBottomPanelExpanded", false);
const bottomPanelHeight = useLocalStorage("bottomPanelHeight", width.value < 500 ? 620 : 320);

const activeTab = useLocalStorage("consoleActiveTab", "changes");
const commitMessage = useLocalStorage("consoleCommitMessage", "");
const submitting = ref(false);
const actionError = ref<string | null>(null);

const tabItems = [
  { label: "Changes", value: "changes" },
  { label: "Activity", value: "activity" },
];

const stagedCount = computed(() => appApi.getState().stagedCount);
const hasStagedEntries = computed(() => stagedCount.value > 0);

async function commitChanges(): Promise<void> {
  if (!hasStagedEntries.value || submitting.value) {
    return;
  }

  actionError.value = null;
  submitting.value = true;

  try {
    const message = commitMessage.value.trim();
    await appApi.commit(
      message
        ? {
            metadata: {
              message,
            },
          }
        : undefined,
    );
    commitMessage.value = "";
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  } finally {
    submitting.value = false;
  }
}

async function discardChanges(): Promise<void> {
  if (!hasStagedEntries.value || submitting.value) {
    return;
  }

  actionError.value = null;
  submitting.value = true;

  try {
    await appApi.discard();
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  } finally {
    submitting.value = false;
  }
}
</script>
<template>
  <PanelChrome
    v-model:open="isBottomPanelExpanded"
    v-model:height="bottomPanelHeight"
    v-model:dragging="isDragging"
    :container="container"
    :minHeight="340"
    title=""
  >
    <template #header>
      <slot name="panel-control" />
    </template>

    <Tabs
      v-model="activeTab"
      :items="tabItems"
      size="sm"
      variant="pill"
      class="flex w-full flex-1 flex-col p-3"
    >
      <template #panel-changes>
        <div class="flex h-full flex-col gap-3">
          <FormField
            label="Commit message (optional)"
            description="This is stored as commit metadata for audit clarity."
          >
            <template #default="{ id, describedBy }">
              <Textarea
                :id="id"
                v-model="commitMessage"
                :aria-describedby="describedBy"
                :rows="3"
                resize="vertical"
                placeholder="Explain what changed..."
                data-test="console-commit-message"
              />
            </template>
          </FormField>

          <div class="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              :disabled="!hasStagedEntries || submitting"
              :loading="submitting"
              data-test="console-commit-submit"
              @click="commitChanges"
            >
              Commit staged
            </Button>
            <Button
              variant="plain-secondary"
              size="sm"
              :disabled="!hasStagedEntries || submitting"
              data-test="console-discard-submit"
              @click="discardChanges"
            >
              Discard staged
            </Button>
          </div>

          <p
            v-if="actionError"
            class="m-0 text-sm text-[var(--ui-critical)]"
            data-test="console-commit-error"
          >
            {{ actionError }}
          </p>
        </div>
      </template>

      <template #panel-activity>
        <div
          class="rounded-[var(--ui-radius-md)] border border-dashed border-[var(--ui-border)] p-3 text-sm text-[var(--ui-fg-muted)]"
          data-test="console-activity-placeholder"
        >
          Activity tab placeholder. This will host richer console output in a later slice.
        </div>
      </template>
    </Tabs>
  </PanelChrome>
</template>
