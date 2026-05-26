<script setup lang="ts">
import {
  breakpointsTailwind,
  useBreakpoints,
  useLocalStorage,
  useWindowSize,
} from "@vueuse/core";
import type { LedgerCommitRecord, LedgerContainer, LedgerEntryRecord } from "@ternent/ledger";
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { PropType } from "vue";
import { RouterLink } from "vue-router";
import { Button, Textarea } from "ternent-ui/primitives";
import { PanelChrome } from "ternent-ui/patterns";
import { useAppApi } from "@/app/api";
import { DEFAULT_CONCORD_STORAGE_KEY } from "@/app/runtime";

defineProps({
  container: {
    type: Object as PropType<HTMLElement | null>,
    default: typeof document !== "undefined" ? document.body : null,
  },
});

const { width } = useWindowSize();
const breakpoints = useBreakpoints(breakpointsTailwind);
const appApi = useAppApi();
const mdAndLarger = breakpoints.greaterOrEqual("md");

const isDragging = useLocalStorage("isBottomPanelDragging", false);
const isBottomPanelExpanded = useLocalStorage("isBottomPanelExpanded", false);
const bottomPanelHeight = useLocalStorage("bottomPanelHeight", width.value < 500 ? 620 : 320);
const compactTab = useLocalStorage<"pending" | "history" | "commit">("consoleCompactTab", "pending");
const splitLeftRatio = useLocalStorage("consoleSplitLeftRatio", 0.58);
const splitContainer = ref<HTMLElement | null>(null);
const splitDragging = ref(false);
const splitPointerId = ref<number | null>(null);

const activeTab = useLocalStorage<"pending" | "history">("consoleActiveTab", "pending");
const commitMessage = useLocalStorage("consoleCommitMessage", "");
const submitting = ref(false);
const actionError = ref<string | null>(null);
const commitSummary = ref<{
  status: "committed" | "rejected";
  pulledEntryCount?: number;
  pushed?: boolean;
  conflicts?: string[];
} | null>(null);
const pendingOpenItem = ref<string | null>(null);
const historyOpenItem = ref<string | null>(null);

const stagedCount = computed(() => appApi.getState().stagedCount);
const hasStagedEntries = computed(() => stagedCount.value > 0);
const verification = computed(() => appApi.state.value.verification);

type ConcordStorageSnapshot = {
  container: LedgerContainer | null;
  staged: LedgerEntryRecord[];
};

const snapshot = shallowRef<ConcordStorageSnapshot>({
  container: null,
  staged: [],
});

const showDesktopSplit = computed(() => mdAndLarger.value);
const showMobileLeftPane = computed(() => !mdAndLarger.value);
const showMobileCommitPane = computed(() => !mdAndLarger.value && compactTab.value === "commit");
const leftActiveTab = computed<"pending" | "history">(() =>
  showDesktopSplit.value
    ? activeTab.value
    : compactTab.value === "history"
      ? "history"
      : "pending",
);

const MIN_PANE_WIDTH = 280;
const MIN_LEFT_RATIO = 0.25;
const MAX_LEFT_RATIO = 0.75;
const SPLIT_RESIZER_WIDTH = 12;

type SplitMetrics = {
  containerWidth: number;
  paneWidth: number;
  leftWidth: number;
  maxLeft: number;
  minLeft: number;
  rightWidth: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveSplitMetrics(): SplitMetrics {
  const viewportWidth = width.value;
  const containerWidth =
    splitContainer.value?.clientWidth ?? (showDesktopSplit.value ? viewportWidth : 0);
  const paneWidth = Math.max(0, containerWidth - SPLIT_RESIZER_WIDTH);
  const minLeftFromWidth = Math.min(MIN_PANE_WIDTH, paneWidth);
  const maxLeftFromWidth = Math.max(minLeftFromWidth, paneWidth - MIN_PANE_WIDTH);
  const minLeftFromRatio = paneWidth * MIN_LEFT_RATIO;
  const maxLeftFromRatio = paneWidth * MAX_LEFT_RATIO;
  const minLeft = clamp(minLeftFromRatio, minLeftFromWidth, maxLeftFromWidth);
  const maxLeft = clamp(maxLeftFromRatio, minLeft, maxLeftFromWidth);
  const desiredLeft = paneWidth * splitLeftRatio.value;
  const leftWidth = clamp(desiredLeft, minLeft, maxLeft);

  return {
    containerWidth,
    paneWidth,
    leftWidth,
    maxLeft,
    minLeft,
    rightWidth: Math.max(0, paneWidth - leftWidth),
  };
}

const desktopSplit = computed(() => resolveSplitMetrics());

watch(
  desktopSplit,
  (next) => {
    if (!next.paneWidth) {
      return;
    }

    const normalizedRatio = next.leftWidth / next.paneWidth;
    if (Math.abs(normalizedRatio - splitLeftRatio.value) > 0.001) {
      splitLeftRatio.value = normalizedRatio;
    }
  },
  { immediate: true },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isLedgerEntryRecord(value: unknown): value is LedgerEntryRecord {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.entryId === "string" &&
    typeof value.kind === "string" &&
    typeof value.authoredAt === "string" &&
    typeof value.author === "string" &&
    isRecord(value.payload) &&
    isRecord(value.seal)
  );
}

function isLedgerCommitRecord(value: unknown): value is LedgerCommitRecord {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.commitId === "string" &&
    (typeof value.parentCommitId === "string" || value.parentCommitId === null) &&
    typeof value.committedAt === "string" &&
    Array.isArray(value.entryIds)
  );
}

function isLedgerContainer(value: unknown): value is LedgerContainer {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.format === "concord-ledger" &&
    value.version === "1" &&
    typeof value.head === "string" &&
    isRecord(value.commits) &&
    isRecord(value.entries)
  );
}

function readSnapshotFromStorage(): ConcordStorageSnapshot {
  if (typeof window === "undefined") {
    return {
      container: null,
      staged: [],
    };
  }

  const raw = window.localStorage.getItem(DEFAULT_CONCORD_STORAGE_KEY);
  if (!raw) {
    return {
      container: null,
      staged: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      container?: unknown;
      staged?: unknown;
    };
    const container = isLedgerContainer(parsed.container) ? parsed.container : null;
    const staged = Array.isArray(parsed.staged) ? parsed.staged.filter(isLedgerEntryRecord) : [];

    return {
      container,
      staged,
    };
  } catch {
    return {
      container: null,
      staged: [],
    };
  }
}

function refreshSnapshot(): void {
  snapshot.value = readSnapshotFromStorage();
}

watch(
  () => appApi.state.value,
  () => {
    refreshSnapshot();
  },
  { immediate: true },
);

const pendingEntries = computed(() =>
  [...snapshot.value.staged].sort((a, b) => b.authoredAt.localeCompare(a.authoredAt)),
);

function resolveCommitHistory(
  container: LedgerContainer | null,
): Array<{ commitId: string; commit: LedgerCommitRecord }> {
  if (!container) {
    return [];
  }

  const ordered: Array<{ commitId: string; commit: LedgerCommitRecord }> = [];
  const visited = new Set<string>();
  let cursor: string | null = container.head;

  while (cursor && !visited.has(cursor)) {
    const commitCandidate = container.commits[cursor];
    if (!isLedgerCommitRecord(commitCandidate)) {
      break;
    }
    visited.add(cursor);
    ordered.push({
      commitId: cursor,
      commit: commitCandidate,
    });
    cursor = commitCandidate.parentCommitId;
  }

  return ordered;
}

const commits = computed(() => resolveCommitHistory(snapshot.value.container));

const invalidCommitIds = computed(() => new Set(verification.value?.invalidCommitIds ?? []));
const invalidEntryIds = computed(() => new Set(verification.value?.invalidEntryIds ?? []));

function entryHasIssue(entryId: string): boolean {
  return invalidEntryIds.value.has(entryId);
}

function commitHasIssue(commitId: string, commit: LedgerCommitRecord): boolean {
  if (invalidCommitIds.value.has(commitId)) {
    return true;
  }
  return commit.entryIds.some((entryId) => entryHasIssue(entryId));
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function stringifyPayload(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function resolveEntryPayload(entry: LedgerEntryRecord): unknown {
  if (entry.payload?.type === "plain") {
    return entry.payload.data;
  }

  if (entry.payload?.type === "encrypted") {
    return {
      type: "encrypted",
      scheme: entry.payload.scheme,
      encoding: entry.payload.encoding,
      payloadHash: entry.payload.payloadHash,
    };
  }

  return entry.payload;
}

function togglePendingItem(entryId: string): void {
  if (showMobileLeftPane.value) {
    compactTab.value = "pending";
  }
  pendingOpenItem.value = pendingOpenItem.value === entryId ? null : entryId;
}

function toggleHistoryItem(commitId: string): void {
  if (showMobileLeftPane.value) {
    compactTab.value = "history";
  }
  historyOpenItem.value = historyOpenItem.value === commitId ? null : commitId;
}

function applySplitFromPointer(clientX: number): void {
  const element = splitContainer.value;
  if (!element) {
    return;
  }

  const bounds = element.getBoundingClientRect();
  if (bounds.width <= 0) {
    return;
  }

  const next = resolveSplitMetrics();
  const nextLeft = clamp(clientX - bounds.left, next.minLeft, next.maxLeft);
  if (next.paneWidth > 0) {
    splitLeftRatio.value = nextLeft / next.paneWidth;
  }
}

function stopSplitDragging(): void {
  if (!splitDragging.value) {
    return;
  }

  splitDragging.value = false;
  splitPointerId.value = null;

  if (typeof window !== "undefined") {
    window.removeEventListener("pointermove", handleSplitPointerMove);
    window.removeEventListener("pointerup", handleSplitPointerUp);
    window.removeEventListener("pointercancel", handleSplitPointerUp);
  }
}

function handleSplitPointerMove(event: PointerEvent): void {
  if (!splitDragging.value) {
    return;
  }

  if (splitPointerId.value !== null && splitPointerId.value !== event.pointerId) {
    return;
  }

  applySplitFromPointer(event.clientX);
}

function handleSplitPointerUp(event: PointerEvent): void {
  if (splitPointerId.value !== null && splitPointerId.value !== event.pointerId) {
    return;
  }
  stopSplitDragging();
}

function startSplitResize(event: PointerEvent): void {
  if (!showDesktopSplit.value) {
    return;
  }

  event.preventDefault();
  splitDragging.value = true;
  splitPointerId.value = event.pointerId;
  applySplitFromPointer(event.clientX);

  if (typeof window !== "undefined") {
    window.addEventListener("pointermove", handleSplitPointerMove);
    window.addEventListener("pointerup", handleSplitPointerUp);
    window.addEventListener("pointercancel", handleSplitPointerUp);
  }
}

onBeforeUnmount(() => {
  stopSplitDragging();
});

async function commitChanges(): Promise<void> {
  if (!hasStagedEntries.value || submitting.value) {
    return;
  }

  actionError.value = null;
  commitSummary.value = null;
  submitting.value = true;

  try {
    const message = commitMessage.value.trim();
    const result = await appApi.commit(
      message
        ? {
            metadata: {
              message,
            },
          }
        : undefined,
    );

    if (result.status === "committed") {
      commitMessage.value = "";
      commitSummary.value = {
        status: "committed",
        pulledEntryCount: result.pulledEntryCount,
        pushed: result.pushed,
      };
      return;
    }

    commitSummary.value = {
      status: "rejected",
      pulledEntryCount: result.pulledEntryCount ?? 0,
      conflicts: result.conflicts.map((conflict) => conflict.message),
    };
    actionError.value = "Commit blocked by remote conflicts. Review the conflict details below.";
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
  commitSummary.value = null;
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
      <div
        class="flex w-full items-center justify-between font-mono text-xs tracking-[0.08em]"
      >
        <div class="flex min-w-0 items-center gap-2 w-full">
          <slot name="panel-control" />
        </div>
        <RouterLink
          to="/s/tamper"
          class="shrink-0 text-[9px] font-semibold text-[var(--ui-fg-muted)] no-underline opacity-85 transition-opacity hover:opacity-100"
          data-test="console-tamper-link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-braces-icon lucide-braces size-4 ml-2"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>
        </RouterLink>
      </div>
    </template>

    <div class="relative flex h-full min-h-0 w-full overflow-hidden border-t border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_84%,var(--ui-bg)_16%)]">
      <section
        v-if="showDesktopSplit"
        ref="splitContainer"
        class="hidden min-h-0 flex-1 md:flex"
      >
        <section
          class="flex min-h-0 flex-none flex-col border-r border-[var(--ui-border)]"
          :style="{ width: `${desktopSplit.leftWidth}px` }"
        >
          <div class="flex items-center gap-2 border-b border-[var(--ui-border)] px-3 py-2">
            <button
              type="button"
              class="rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors"
              :class="
                leftActiveTab === 'pending'
                  ? 'border-[var(--ui-primary)] bg-[var(--ui-tonal-primary)] text-[var(--ui-primary)]'
                  : 'border-[var(--ui-border)] text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]'
              "
              data-test="console-tab-pending"
              @click="
                activeTab = 'pending';
                compactTab = 'pending';
              "
            >
              Pending · {{ pendingEntries.length }}
            </button>
            <button
              type="button"
              class="rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors"
              :class="
                leftActiveTab === 'history'
                  ? 'border-[var(--ui-primary)] bg-[var(--ui-tonal-primary)] text-[var(--ui-primary)]'
                  : 'border-[var(--ui-border)] text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]'
              "
              data-test="console-tab-history"
              @click="
                activeTab = 'history';
                compactTab = 'history';
              "
            >
              History · {{ commits.length }}
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-auto p-2 font-mono text-xs">
            <div v-if="leftActiveTab === 'pending'">
              <div
                v-if="pendingEntries.length === 0"
                class="rounded-md border border-dashed border-[var(--ui-border)] p-3 text-[11px] text-[var(--ui-fg-muted)]"
              >
                No staged entries. Run commands in the workspace to queue pending changes.
              </div>

              <div v-else class="w-full divide-y divide-[var(--ui-border)]">
                <section
                  v-for="entry in pendingEntries"
                  :key="entry.entryId"
                  class="group"
                >
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3 py-3 text-left text-[var(--ui-fg)] transition-[color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] hover:text-[var(--ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
                    :aria-expanded="pendingOpenItem === entry.entryId"
                    :data-test="`console-pending-toggle-${entry.entryId}`"
                    @click="togglePendingItem(entry.entryId)"
                  >
                    <div class="flex w-full items-center justify-between gap-2">
                      <div class="flex min-w-0 items-center gap-2">
                        <span class="truncate text-[11px] font-semibold text-[var(--ui-fg)]">
                          {{ entry.kind }}
                        </span>
                        <span
                          v-if="entryHasIssue(entry.entryId)"
                          class="rounded border border-[var(--ui-critical)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--ui-critical)]"
                        >
                          issue
                        </span>
                      </div>
                      <span class="text-[10px] text-[var(--ui-fg-muted)]">
                        #{{ shortId(entry.entryId) }}
                      </span>
                    </div>
                    <span
                      class="ml-2 size-4 shrink-0 text-[var(--ui-fg-muted)] transition-transform duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]"
                      :class="pendingOpenItem === entry.entryId ? 'rotate-180' : ''"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 20 20" fill="none" class="size-full">
                        <path
                          d="m5 7.5 5 5 5-5"
                          stroke="currentColor"
                          stroke-width="1.75"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    v-if="pendingOpenItem === entry.entryId"
                    class="space-y-2 pb-4 pt-1"
                  >
                    <div class="space-y-2 bg-[color-mix(in_srgb,var(--ui-bg)_74%,var(--ui-surface)_26%)] p-2">
                      <div class="flex flex-wrap gap-2 text-[10px] text-[var(--ui-fg-muted)]">
                        <span>Author: {{ entry.author }}</span>
                        <span>At: {{ formatDate(entry.authoredAt) }}</span>
                      </div>
                      <pre class="m-0 overflow-auto rounded border border-[var(--ui-border)] p-2 text-[10px] leading-relaxed">{{
                        stringifyPayload(resolveEntryPayload(entry))
                      }}</pre>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div v-else>
              <div
                v-if="commits.length === 0"
                class="rounded-md border border-dashed border-[var(--ui-border)] p-3 text-[11px] text-[var(--ui-fg-muted)]"
              >
                No committed history is available yet.
              </div>

              <div v-else class="w-full divide-y divide-[var(--ui-border)]">
                <section
                  v-for="item in commits"
                  :key="item.commitId"
                  class="group"
                >
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3 py-3 text-left text-[var(--ui-fg)] transition-[color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] hover:text-[var(--ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
                    :aria-expanded="historyOpenItem === item.commitId"
                    :data-test="`console-history-toggle-${item.commitId}`"
                    @click="toggleHistoryItem(item.commitId)"
                  >
                    <div class="flex w-full items-center justify-between gap-2">
                      <div class="flex min-w-0 items-center gap-2">
                        <span class="text-[11px] font-semibold text-[var(--ui-fg)]">
                          @{{ shortId(item.commitId) }}
                        </span>
                        <span
                          v-if="commitHasIssue(item.commitId, item.commit)"
                          class="rounded border border-[var(--ui-critical)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--ui-critical)]"
                        >
                          issue
                        </span>
                        <span class="truncate text-[10px] text-[var(--ui-fg-muted)]">
                          {{
                            String(item.commit.metadata?.message ?? item.commit.metadata?.spec ?? "No message")
                          }}
                        </span>
                      </div>
                      <span class="shrink-0 text-[10px] text-[var(--ui-fg-muted)]">
                        {{ item.commit.entryIds.length }} entries
                      </span>
                    </div>
                    <span
                      class="ml-2 size-4 shrink-0 text-[var(--ui-fg-muted)] transition-transform duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]"
                      :class="historyOpenItem === item.commitId ? 'rotate-180' : ''"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 20 20" fill="none" class="size-full">
                        <path
                          d="m5 7.5 5 5 5-5"
                          stroke="currentColor"
                          stroke-width="1.75"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    v-if="historyOpenItem === item.commitId"
                    class="space-y-2 pb-4 pt-1"
                  >
                    <div class="space-y-2 bg-[color-mix(in_srgb,var(--ui-bg)_74%,var(--ui-surface)_26%)] p-2">
                      <div class="flex flex-wrap gap-2 text-[10px] text-[var(--ui-fg-muted)]">
                        <span>Committed: {{ formatDate(item.commit.committedAt) }}</span>
                        <span>Parent: {{ item.commit.parentCommitId ? shortId(item.commit.parentCommitId) : "genesis" }}</span>
                      </div>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="entryId in item.commit.entryIds"
                          :key="entryId"
                          class="rounded border px-1.5 py-0.5 text-[9px]"
                          :class="
                            entryHasIssue(entryId)
                              ? 'border-[var(--ui-critical)] text-[var(--ui-critical)]'
                              : 'border-[var(--ui-border)] text-[var(--ui-fg-muted)]'
                          "
                        >
                          {{ shortId(entryId) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize console panels"
          class="group relative w-3 shrink-0 cursor-col-resize touch-none select-none"
          data-test="console-split-resizer"
          @pointerdown="startSplitResize"
        >
          <div
            class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--ui-border)] transition-colors"
            :class="splitDragging ? 'bg-[var(--ui-primary)]' : 'group-hover:bg-[var(--ui-fg-muted)]'"
          />
        </div>

        <aside
          class="flex min-h-0 flex-none flex-col"
          :style="{ width: `${desktopSplit.rightWidth}px` }"
        >
          <div class="border-b border-[var(--ui-border)] px-4 py-3">
            <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ui-fg-muted)]">
              Commit
            </p>
            <p class="m-0 mt-1 text-[11px] text-[var(--ui-fg-muted)]">
              Stage review and commit controls stay pinned here.
            </p>
          </div>

          <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
            <Textarea
              v-model="commitMessage"
              :rows="5"
              resize="vertical"
              placeholder="Explain what changed..."
              data-test="console-commit-message"
            />

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

            <div
              v-if="commitSummary?.status === 'committed'"
              class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] p-2 text-xs text-[var(--ui-fg-muted)]"
              data-test="console-commit-summary"
            >
              <p class="m-0">Committed successfully.</p>
              <p class="m-0">Pulled {{ commitSummary.pulledEntryCount ?? 0 }} remote entries.</p>
              <p class="m-0">
                {{ commitSummary.pushed ? "Pushed to storage provider." : "No push required for this provider." }}
              </p>
            </div>

            <div
              v-if="commitSummary?.status === 'rejected'"
              class="rounded-md border border-[var(--ui-critical)]/40 bg-[color-mix(in_srgb,var(--ui-critical)_8%,transparent)] p-2 text-xs text-[var(--ui-critical)]"
              data-test="console-commit-conflicts"
            >
              <p class="m-0 font-semibold">Commit blocked.</p>
              <p class="m-0">Pulled {{ commitSummary.pulledEntryCount ?? 0 }} remote entries before rejection.</p>
              <ul class="m-0 mt-1 list-disc pl-4">
                <li v-for="(conflict, index) in commitSummary.conflicts ?? []" :key="index">
                  {{ conflict }}
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </section>

      <section
        v-if="showMobileLeftPane"
        class="flex min-h-0 flex-1 flex-col border-r border-[var(--ui-border)] max-md:border-r-0 max-md:border-b"
        :class="{ 'max-md:flex-none': compactTab === 'commit' }"
      >
        <div class="flex items-center gap-2 border-b border-[var(--ui-border)] px-3 py-2">
          <button
            type="button"
            class="rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors"
            :class="
              leftActiveTab === 'pending'
                ? 'border-[var(--ui-primary)] bg-[var(--ui-tonal-primary)] text-[var(--ui-primary)]'
                : 'border-[var(--ui-border)] text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]'
            "
            data-test="console-tab-pending"
            @click="
              activeTab = 'pending';
              compactTab = 'pending';
            "
          >
            Pending · {{ pendingEntries.length }}
          </button>
          <button
            type="button"
            class="rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors"
            :class="
              leftActiveTab === 'history'
                ? 'border-[var(--ui-primary)] bg-[var(--ui-tonal-primary)] text-[var(--ui-primary)]'
                : 'border-[var(--ui-border)] text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]'
            "
            data-test="console-tab-history"
            @click="
              activeTab = 'history';
              compactTab = 'history';
            "
          >
            History · {{ commits.length }}
          </button>
          <button
            type="button"
            class="rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors md:hidden"
            :class="
              compactTab === 'commit'
                ? 'border-[var(--ui-primary)] bg-[var(--ui-tonal-primary)] text-[var(--ui-primary)]'
                : 'border-[var(--ui-border)] text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]'
            "
            data-test="console-tab-commit"
            @click="compactTab = 'commit'"
          >
            Commit
          </button>
        </div>

        <div
          v-if="compactTab !== 'commit'"
          class="min-h-0 flex-1 overflow-auto p-2 font-mono text-xs"
        >
          <div v-if="leftActiveTab === 'pending'">
            <div
              v-if="pendingEntries.length === 0"
              class="rounded-md border border-dashed border-[var(--ui-border)] p-3 text-[11px] text-[var(--ui-fg-muted)]"
            >
              No staged entries. Run commands in the workspace to queue pending changes.
            </div>

            <div v-else class="w-full divide-y divide-[var(--ui-border)]">
              <section
                v-for="entry in pendingEntries"
                :key="entry.entryId"
                class="group"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 py-3 text-left text-[var(--ui-fg)] transition-[color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] hover:text-[var(--ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
                  :aria-expanded="pendingOpenItem === entry.entryId"
                  :data-test="`console-pending-toggle-${entry.entryId}`"
                  @click="togglePendingItem(entry.entryId)"
                >
                  <div class="flex w-full items-center justify-between gap-2">
                    <div class="flex min-w-0 items-center gap-2">
                      <span class="truncate text-[11px] font-semibold text-[var(--ui-fg)]">
                        {{ entry.kind }}
                      </span>
                      <span
                        v-if="entryHasIssue(entry.entryId)"
                        class="rounded border border-[var(--ui-critical)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--ui-critical)]"
                      >
                        issue
                      </span>
                    </div>
                    <span class="text-[10px] text-[var(--ui-fg-muted)]">
                      #{{ shortId(entry.entryId) }}
                    </span>
                  </div>
                  <span
                    class="ml-2 size-4 shrink-0 text-[var(--ui-fg-muted)] transition-transform duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]"
                    :class="pendingOpenItem === entry.entryId ? 'rotate-180' : ''"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 20 20" fill="none" class="size-full">
                      <path
                        d="m5 7.5 5 5 5-5"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <div
                  v-if="pendingOpenItem === entry.entryId"
                  class="space-y-2 pb-4 pt-1"
                >
                  <div class="space-y-2 bg-[color-mix(in_srgb,var(--ui-bg)_74%,var(--ui-surface)_26%)] p-2">
                    <div class="flex flex-wrap gap-2 text-[10px] text-[var(--ui-fg-muted)]">
                      <span>Author: {{ entry.author }}</span>
                      <span>At: {{ formatDate(entry.authoredAt) }}</span>
                    </div>
                    <pre class="m-0 overflow-auto rounded border border-[var(--ui-border)] p-2 text-[10px] leading-relaxed">{{
                      stringifyPayload(resolveEntryPayload(entry))
                    }}</pre>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div v-else>
            <div
              v-if="commits.length === 0"
              class="rounded-md border border-dashed border-[var(--ui-border)] p-3 text-[11px] text-[var(--ui-fg-muted)]"
            >
              No committed history is available yet.
            </div>

            <div v-else class="w-full divide-y divide-[var(--ui-border)]">
              <section
                v-for="item in commits"
                :key="item.commitId"
                class="group"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 py-3 text-left text-[var(--ui-fg)] transition-[color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] hover:text-[var(--ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
                  :aria-expanded="historyOpenItem === item.commitId"
                  :data-test="`console-history-toggle-${item.commitId}`"
                  @click="toggleHistoryItem(item.commitId)"
                >
                  <div class="flex w-full items-center justify-between gap-2">
                    <div class="flex min-w-0 items-center gap-2">
                      <span class="text-[11px] font-semibold text-[var(--ui-fg)]">
                        @{{ shortId(item.commitId) }}
                      </span>
                      <span
                        v-if="commitHasIssue(item.commitId, item.commit)"
                        class="rounded border border-[var(--ui-critical)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--ui-critical)]"
                      >
                        issue
                      </span>
                      <span class="truncate text-[10px] text-[var(--ui-fg-muted)]">
                        {{
                          String(item.commit.metadata?.message ?? item.commit.metadata?.spec ?? "No message")
                        }}
                      </span>
                    </div>
                    <span class="shrink-0 text-[10px] text-[var(--ui-fg-muted)]">
                      {{ item.commit.entryIds.length }} entries
                    </span>
                  </div>
                  <span
                    class="ml-2 size-4 shrink-0 text-[var(--ui-fg-muted)] transition-transform duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]"
                    :class="historyOpenItem === item.commitId ? 'rotate-180' : ''"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 20 20" fill="none" class="size-full">
                      <path
                        d="m5 7.5 5 5 5-5"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <div
                  v-if="historyOpenItem === item.commitId"
                  class="space-y-2 pb-4 pt-1"
                >
                  <div class="space-y-2 bg-[color-mix(in_srgb,var(--ui-bg)_74%,var(--ui-surface)_26%)] p-2">
                    <div class="flex flex-wrap gap-2 text-[10px] text-[var(--ui-fg-muted)]">
                      <span>Committed: {{ formatDate(item.commit.committedAt) }}</span>
                      <span>Parent: {{ item.commit.parentCommitId ? shortId(item.commit.parentCommitId) : "genesis" }}</span>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="entryId in item.commit.entryIds"
                        :key="entryId"
                        class="rounded border px-1.5 py-0.5 text-[9px]"
                        :class="
                          entryHasIssue(entryId)
                            ? 'border-[var(--ui-critical)] text-[var(--ui-critical)]'
                            : 'border-[var(--ui-border)] text-[var(--ui-fg-muted)]'
                        "
                      >
                        {{ shortId(entryId) }}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <aside
        v-if="showMobileCommitPane"
        class="flex min-h-0 flex-1 flex-col"
      >
        <div class="border-b border-[var(--ui-border)] px-4 py-3">
          <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ui-fg-muted)]">
            Commit
          </p>
          <p class="m-0 mt-1 text-[11px] text-[var(--ui-fg-muted)]">
            Stage review and commit controls stay pinned here.
          </p>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
       
          <Textarea
            v-model="commitMessage"
            :rows="5"
            resize="vertical"
            placeholder="Explain what changed..."
            data-test="console-commit-message"
          />
          
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

          <div
            v-if="commitSummary?.status === 'committed'"
            class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] p-2 text-xs text-[var(--ui-fg-muted)]"
            data-test="console-commit-summary"
          >
            <p class="m-0">Committed successfully.</p>
            <p class="m-0">Pulled {{ commitSummary.pulledEntryCount ?? 0 }} remote entries.</p>
            <p class="m-0">
              {{ commitSummary.pushed ? "Pushed to storage provider." : "No push required for this provider." }}
            </p>
          </div>

          <div
            v-if="commitSummary?.status === 'rejected'"
            class="rounded-md border border-[var(--ui-critical)]/40 bg-[color-mix(in_srgb,var(--ui-critical)_8%,transparent)] p-2 text-xs text-[var(--ui-critical)]"
            data-test="console-commit-conflicts"
          >
            <p class="m-0 font-semibold">Commit blocked.</p>
            <p class="m-0">Pulled {{ commitSummary.pulledEntryCount ?? 0 }} remote entries before rejection.</p>
            <ul class="m-0 mt-1 list-disc pl-4">
              <li v-for="(conflict, index) in commitSummary.conflicts ?? []" :key="index">
                {{ conflict }}
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  </PanelChrome>
</template>
