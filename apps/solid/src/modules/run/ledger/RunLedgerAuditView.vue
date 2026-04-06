<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Accordion,
  AccordionItem,
  Badge,
} from "ternent-ui/primitives";
import {
  useRunLedgerAuditSurface,
  type RunLedgerAuditCommitRow,
  type RunLedgerAuditEntryRow,
} from "@/modules/run/ledger/useRunLedgerAuditSurface";

const surface = useRunLedgerAuditSurface();
const openCommitIds = ref<string[]>([]);
const openEntryIds = ref<string[]>([]);

function formatJson(value: unknown): string {
  if (value == null) {
    return "null";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatIso(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(timestamp);
}

function shortValue(
  value: string | null | undefined,
  start = 10,
  end = 6,
): string {
  if (!value) {
    return "none";
  }

  if (value.length <= start + end + 1) {
    return value;
  }

  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

function readMetadataString(
  metadata: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

const entryById = computed<Record<string, RunLedgerAuditEntryRow>>(() =>
  Object.fromEntries(surface.entries.value.map((entry) => [entry.entryId, entry])),
);

const commitItems = computed<
  Array<RunLedgerAuditCommitRow & { entries: RunLedgerAuditEntryRow[] }>
>(() =>
  surface.commits.value.map((commit) => ({
    ...commit,
    entries: commit.entryIds
      .map((entryId) => entryById.value[entryId])
      .filter((entry): entry is RunLedgerAuditEntryRow => Boolean(entry)),
  })),
);

const unlinkedEntries = computed(() =>
  surface.entries.value.filter((entry) => entry.commitIds.length === 0),
);

const verificationKnown = computed(() => Boolean(surface.verification.value));
const verifying = computed(
  () => surface.status.value === "loading" && Boolean(surface.container.value),
);
const verificationSummaryTone = computed(() => {
  const verification = surface.verification.value;
  if (!verification) {
    return "neutral";
  }

  return verification.committedHistoryValid ? "success" : "warning";
});
const verificationSummaryLabel = computed(() => {
  const verification = surface.verification.value;
  if (!verification) {
    return "Unverified";
  }

  return verification.committedHistoryValid ? "Verified" : "Issues";
});

function commitMessage(commit: RunLedgerAuditCommitRow): string | null {
  return readMetadataString(commit.metadata, "message");
}

function commitSpec(commit: RunLedgerAuditCommitRow): string | null {
  return readMetadataString(commit.metadata, "spec");
}

function payloadType(entry: RunLedgerAuditEntryRow): string {
  return entry.payload?.type ?? "unknown";
}

function verificationTone(
  value: boolean | null | undefined,
): "neutral" | "success" | "warning" {
  if (value == null) {
    return "neutral";
  }

  return value ? "success" : "warning";
}
</script>

<template>
  <section class="space-y-4">
    <div class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
      <div class="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:px-6">
        <div class="flex flex-wrap items-center gap-2">
          <Badge
            :tone="verificationSummaryTone"
            variant="soft"
          >
            {{ verificationSummaryLabel }}
          </Badge>
          <Badge tone="neutral" variant="soft">
            {{ surface.commits.value.length }} commits
          </Badge>
          <Badge tone="neutral" variant="soft">
            {{ surface.entries.value.length }} entries
          </Badge>
          <Badge tone="neutral" variant="outline">
            {{ verifying ? "Verifying…" : surface.lastVerifiedAt.value
              ? formatIso(surface.lastVerifiedAt.value)
              : "Pending" }}
          </Badge>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Badge
            :tone="
              verificationTone(surface.verification.value?.commitChainValid)
            "
            variant="outline"
          >
            chain
          </Badge>
          <Badge
            :tone="
              verificationTone(surface.verification.value?.commitProofsValid)
            "
            variant="outline"
          >
            commit proofs
          </Badge>
          <Badge
            :tone="
              verificationTone(surface.verification.value?.entryProofsValid)
            "
            variant="outline"
          >
            entry proofs
          </Badge>
          <Badge
            :tone="
              verificationTone(surface.verification.value?.payloadHashesValid)
            "
            variant="outline"
          >
            payload hashes
          </Badge>
          <Badge
            v-if="verifying"
            tone="neutral"
            variant="outline"
          >
            verifying
          </Badge>
        </div>
      </div>

      <div
        v-if="surface.status.value === 'loading' && !surface.container.value"
        class="px-5 py-10 text-sm text-white/55 sm:px-6"
      >
        Loading audit…
      </div>

      <div
        v-else-if="surface.status.value === 'error'"
        class="px-5 py-5 text-sm text-[var(--ui-critical)] sm:px-6"
      >
        <div
          class="rounded-[1.25rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-3"
        >
          {{ surface.error.value }}
        </div>
      </div>

      <div
        v-else-if="!surface.container.value"
        class="px-5 py-10 text-sm text-white/50 sm:px-6"
      >
        No ledger open
      </div>

      <div
        v-else-if="!commitItems.length && !unlinkedEntries.length"
        class="px-5 py-10 text-sm text-white/50 sm:px-6"
      >
        No commits
      </div>

      <div v-else class="max-h-[48rem] overflow-auto px-4 py-4 sm:px-5">
        <Accordion
          v-model:value="openCommitIds"
          multiple
          collapsible
          class="space-y-2"
        >
          <AccordionItem
            v-for="commit in commitItems"
            :key="commit.commitId"
            :value="commit.commitId"
          >
            <template #title>
              <div class="flex min-w-0 flex-1 flex-col gap-2 text-left">
                <div class="flex min-w-0 flex-wrap items-center gap-2">
                  <span class="truncate font-mono text-sm text-white">
                    @{{ shortValue(commit.commitId, 12, 8) }}
                  </span>
                  <Badge
                    v-if="commit.isHead"
                    tone="primary"
                    variant="soft"
                    size="sm"
                  >
                    Head
                  </Badge>
                  <Badge
                    v-if="verificationKnown && commit.invalid"
                    tone="warning"
                    variant="soft"
                    size="sm"
                  >
                    Invalid
                  </Badge>
                  <Badge
                    :tone="commit.onHeadChain ? 'neutral' : 'warning'"
                    :variant="commit.onHeadChain ? 'outline' : 'soft'"
                    size="sm"
                  >
                    {{ commit.onHeadChain ? "Reachable" : "Orphaned" }}
                  </Badge>
                  <Badge
                    v-if="commitSpec(commit)"
                    tone="neutral"
                    variant="outline"
                    size="sm"
                  >
                    {{ commitSpec(commit) }}
                  </Badge>
                </div>

                <div
                  class="flex flex-col gap-1 text-xs text-white/52 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
                >
                  <span v-if="commitMessage(commit)" class="text-white/72">
                    {{ commitMessage(commit) }}
                  </span>
                  <span>{{ formatIso(commit.committedAt) }}</span>
                  <span>{{ commit.entries.length }} entries</span>
                  <span>
                    signer {{ shortValue(commit.seal.signer.keyId, 10, 6) }}
                  </span>
                </div>
              </div>
            </template>

            <div class="space-y-3 text-sm text-white/72">
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div class="text-[11px] uppercase tracking-[0.16em] text-white/34">
                    Parent
                  </div>
                  <div class="mt-1 break-all font-mono text-xs text-white/72">
                    {{ commit.parentCommitId ?? "none" }}
                  </div>
                </div>
                <div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div class="text-[11px] uppercase tracking-[0.16em] text-white/34">
                    Commit
                  </div>
                  <div class="mt-1 break-all font-mono text-xs text-white/72">
                    {{ commit.commitId }}
                  </div>
                </div>
                <div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div class="text-[11px] uppercase tracking-[0.16em] text-white/34">
                    Signed
                  </div>
                  <div class="mt-1 break-all font-mono text-xs text-white/72">
                    {{ commit.seal.signer.keyId }}
                  </div>
                </div>
                <div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div class="text-[11px] uppercase tracking-[0.16em] text-white/34">
                    At
                  </div>
                  <div class="mt-1 text-xs text-white/72">
                    {{ formatIso(commit.committedAt) }}
                  </div>
                </div>
              </div>

              <pre
                class="m-0 overflow-auto rounded-[1rem] border border-white/8 bg-[#08101d] p-3 text-xs text-white/72"
              >{{ formatJson(commit.metadata) }}</pre>

              <pre
                class="m-0 overflow-auto rounded-[1rem] border border-white/8 bg-[#08101d] p-3 text-xs text-white/72"
              >{{ formatJson(commit.seal) }}</pre>

              <Accordion
                v-model:value="openEntryIds"
                multiple
                collapsible
                class="space-y-2"
              >
                <AccordionItem
                  v-for="entry in commit.entries"
                  :key="entry.entryId"
                  :value="`${commit.commitId}:${entry.entryId}`"
                >
                  <template #title>
                    <div class="flex min-w-0 flex-1 flex-col gap-2 text-left">
                      <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <span class="truncate text-sm text-white">
                          {{ entry.kind }}
                        </span>
                        <Badge tone="neutral" variant="outline" size="sm">
                          {{ payloadType(entry) }}
                        </Badge>
                        <Badge
                          v-if="verificationKnown && entry.invalid"
                          tone="warning"
                          variant="soft"
                          size="sm"
                        >
                          Invalid
                        </Badge>
                        <Badge
                          :tone="entry.onHeadChain ? 'neutral' : 'warning'"
                          :variant="entry.onHeadChain ? 'outline' : 'soft'"
                          size="sm"
                        >
                          {{ entry.onHeadChain ? "Reachable" : "Orphaned" }}
                        </Badge>
                      </div>

                      <div
                        class="flex flex-col gap-1 text-xs text-white/52 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
                      >
                        <span class="font-mono text-white/72">
                          @{{ shortValue(entry.entryId, 12, 8) }}
                        </span>
                        <span>{{ formatIso(entry.authoredAt) }}</span>
                        <span>{{ shortValue(entry.author, 10, 6) }}</span>
                      </div>
                    </div>
                  </template>

                  <div class="space-y-3">
                    <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                        <div class="text-[11px] uppercase tracking-[0.16em] text-white/34">
                          Entry
                        </div>
                        <div class="mt-1 break-all font-mono text-xs text-white/72">
                          {{ entry.entryId }}
                        </div>
                      </div>
                      <div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                        <div class="text-[11px] uppercase tracking-[0.16em] text-white/34">
                          Author
                        </div>
                        <div class="mt-1 break-all font-mono text-xs text-white/72">
                          {{ entry.author }}
                        </div>
                      </div>
                      <div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                        <div class="text-[11px] uppercase tracking-[0.16em] text-white/34">
                          Signed
                        </div>
                        <div class="mt-1 break-all font-mono text-xs text-white/72">
                          {{ entry.seal.signer.keyId }}
                        </div>
                      </div>
                      <div class="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                        <div class="text-[11px] uppercase tracking-[0.16em] text-white/34">
                          Commits
                        </div>
                        <div class="mt-1 text-xs text-white/72">
                          {{ entry.commitIds.length }}
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="entry.commitIds.length"
                      class="flex flex-wrap items-center gap-2"
                    >
                      <Badge
                        v-for="commitId in entry.commitIds"
                        :key="commitId"
                        tone="neutral"
                        variant="outline"
                        size="sm"
                      >
                        @{{ shortValue(commitId, 12, 8) }}
                      </Badge>
                    </div>

                    <div class="space-y-2">
                      <pre
                        class="m-0 overflow-auto rounded-[1rem] border border-white/8 bg-[#08101d] p-3 text-xs text-white/72"
                      >{{ formatJson(entry.payload) }}</pre>
                      <pre
                        class="m-0 overflow-auto rounded-[1rem] border border-white/8 bg-[#08101d] p-3 text-xs text-white/72"
                      >{{ formatJson(entry.meta) }}</pre>
                      <pre
                        class="m-0 overflow-auto rounded-[1rem] border border-white/8 bg-[#08101d] p-3 text-xs text-white/72"
                      >{{ formatJson(entry.seal) }}</pre>
                    </div>
                  </div>
                </AccordionItem>
              </Accordion>
            </div>
          </AccordionItem>

          <AccordionItem
            v-if="unlinkedEntries.length"
            value="unlinked-entries"
          >
            <template #title>
              <div class="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span class="text-sm text-white">Unlinked entries</span>
                <Badge tone="warning" variant="soft" size="sm">
                  {{ unlinkedEntries.length }}
                </Badge>
              </div>
            </template>

            <Accordion
              v-model:value="openEntryIds"
              multiple
              collapsible
              class="space-y-2"
            >
              <AccordionItem
                v-for="entry in unlinkedEntries"
                :key="entry.entryId"
                :value="`unlinked:${entry.entryId}`"
              >
                <template #title>
                  <div class="flex min-w-0 flex-1 flex-col gap-2 text-left">
                    <div class="flex min-w-0 flex-wrap items-center gap-2">
                      <span class="truncate text-sm text-white">
                        {{ entry.kind }}
                      </span>
                      <Badge tone="neutral" variant="outline" size="sm">
                        {{ payloadType(entry) }}
                      </Badge>
                      <Badge tone="warning" variant="soft" size="sm">
                        Unlinked
                      </Badge>
                    </div>
                    <div class="font-mono text-xs text-white/52">
                      @{{ shortValue(entry.entryId, 12, 8) }}
                    </div>
                  </div>
                </template>

                <div class="space-y-2">
                  <pre
                    class="m-0 overflow-auto rounded-[1rem] border border-white/8 bg-[#08101d] p-3 text-xs text-white/72"
                  >{{ formatJson(entry.payload) }}</pre>
                  <pre
                    class="m-0 overflow-auto rounded-[1rem] border border-white/8 bg-[#08101d] p-3 text-xs text-white/72"
                  >{{ formatJson(entry.meta) }}</pre>
                  <pre
                    class="m-0 overflow-auto rounded-[1rem] border border-white/8 bg-[#08101d] p-3 text-xs text-white/72"
                  >{{ formatJson(entry.seal) }}</pre>
                </div>
              </AccordionItem>
            </Accordion>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </section>
</template>
