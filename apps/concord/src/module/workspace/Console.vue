<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useLedger } from "../../module/ledger/useLedger";
import Console from "../../module/console/Console.vue";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import VerifyIcon from "../../module/verify/VerifyIcon.vue";
import { Accordian, AccordianItem } from "ternent-ui/primitives";

defineProps({
  container: {
    type: HTMLElement,
    default: document.body,
  },
});

const { api, bridge, ledger, pending } = useLedger();

const activeTab = shallowRef<"pending" | "history">("pending");
const commitMessage = shallowRef("");
const commits = computed(() =>
  Object.entries(ledger.value?.commits || {}).reverse()
);
const entries = computed(() => ledger.value?.entries ?? {});
const pendingEntries = computed(() => {
  const items = pending.value ? [...pending.value] : [];
  return items.sort((a, b) =>
    (b.entry.timestamp || "").localeCompare(a.entry.timestamp || "")
  );
});
const pendingCount = computed(() => bridge.flags.value.pendingCount);

const canCommit = computed(() => {
  if (!bridge.flags.value.canWrite || !pendingCount.value) return false;
  return commitMessage.value.trim().length > 0;
});

async function commit() {
  if (!bridge.flags.value.canWrite || !pendingCount.value) return;
  const message = commitMessage.value.trim();
  if (!message) return;

  await api.commit(message, {
    message,
  });
  commitMessage.value = "";
}

function shortId(id: string) {
  return id.substring(0, 7);
}

function getPayloadId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  return typeof record.id === "string" ? record.id : null;
}

function entryDisplayId(entryId: string, entry?: { payload?: unknown } | null) {
  return getPayloadId(entry?.payload)?.substring(0, 7) ?? shortId(entryId);
}

function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
}
</script>
<template>
  <Console :container="container">
    <template #panel-control>
      <div
        class="text-xs font-sans border-1 border-[var(--rule)] rounded-full px-2 py-1 flex items-center justify-center"
      >
        {{ pendingCount }}
      </div>
    </template>
    <div class="flex w-full flex-1">
      <div class="flex flex-col w-1/2 border-r border-[var(--rule)]">
        <div
          class="flex items-center gap-2 border-b border-[var(--rule)] px-2 py-2"
        >
          <button
            class="text-xs border-1 rounded-full px-3 py-1"
            :class="
              activeTab === 'pending'
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--paper2)]'
                : 'border-[var(--rule)] text-[var(--muted)]'
            "
            @click="activeTab = 'pending'"
          >
            Pending
            <span class="ml-1 text-[var(--muted)]">{{ pendingCount }}</span>
          </button>
          <button
            class="text-xs border-1 rounded-full px-3 py-1"
            :class="
              activeTab === 'history'
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--paper2)]'
                : 'border-[var(--rule)] text-[var(--muted)]'
            "
            @click="activeTab = 'history'"
          >
            History
            <span class="ml-1 text-[var(--muted)]">{{ commits.length }}</span>
          </button>
        </div>
        <div class="flex-1 overflow-auto p-2">
          <div v-if="activeTab === 'pending'">
            <div
              v-if="!pendingEntries.length"
              class="text-xs text-[var(--muted)] p-2"
            >
              No pending entries.
            </div>
            <Accordian v-else>
              <AccordianItem
                v-for="pendingEntry in pendingEntries"
                :key="pendingEntry.entryId"
                :value="pendingEntry.entryId"
              >
                <template #title>
                  <div class="flex-1 flex gap-2 items-center">
                    <span class="font-medium text-[var(--accent)] text-sm">
                      {{ pendingEntry.entry.kind }}
                    </span>
                    <span class="text-xs text-[var(--muted)]">
                      #{{
                        entryDisplayId(pendingEntry.entryId, pendingEntry.entry)
                      }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <IdentityAvatar
                      :identity="pendingEntry.entry.author"
                      size="xs"
                    />
                    <span
                      v-if="pendingEntry.entry?.timestamp"
                      class="text-xs text-[var(--muted)]"
                    >
                      {{ formatDate(pendingEntry.entry.timestamp) }}
                    </span>
                  </div>
                </template>

                <div class="flex flex-col gap-1 p-2 bg-[var(--paper2)]">
                  <div class="flex gap-2 items-center justify-between flex-1">
                    <div class="flex items-center gap-2 flex-1">
                      <span class="text-[var(--muted)]">
                        @{{ shortId(pendingEntry.entryId) }}
                      </span>
                      <div
                        class="text-xs py1 px-2 border-1 border-[var(--rule)] rounded-full"
                      >
                        {{ pendingEntry.entry.kind }}
                      </div>
                    </div>
                  </div>
                  <pre class="w-full overflow-auto">{{
                    pendingEntry.entry.payload
                  }}</pre>
                </div>
              </AccordianItem>
            </Accordian>
          </div>
          <div v-else>
            <div v-if="!commits.length" class="text-xs text-[var(--muted)] p-2">
              No commit history yet.
            </div>
            <Accordian v-else>
              <AccordianItem
                v-for="[commitId, commit] in commits"
                :key="commitId"
                :value="commitId"
              >
                <template #title>
                  <div class="flex-1 flex gap-2 items-center">
                    <span class="font-medium text-[var(--accent)] text-sm"
                      >@{{ shortId(commitId) }}</span
                    >
                    <div
                      v-if="commit.metadata?.genesis"
                      class="text-xs py1 px-2 border-1 border-[var(--rule)] rounded-full"
                    >
                      {{ commit.metadata?.spec }}
                    </div>
                    <div class="text-sm">
                      {{ commit.metadata?.message }}
                    </div>
                  </div>
                  <div
                    v-if="commit.timestamp"
                    class="text-xs text-[var(--muted)]"
                  >
                    {{ formatDate(commit.timestamp) }}
                  </div>
                </template>

                <div class="flex flex-col gap-1 p-2 bg-[var(--paper2)]">
                  <div
                    v-for="entryId in commit.entries"
                    :key="entryId"
                    class="text-xs w-full flex-1"
                  >
                    <div
                      v-if="entries[entryId]"
                      class="flex gap-2 items-center justify-between flex-1"
                    >
                      <div class="flex items-center gap-2 flex-1">
                        <span class="text-[var(--muted)]">
                          @{{ shortId(entryId) }}</span
                        >
                        <VerifyIcon
                          v-if="entries[entryId].signature"
                          :payload="entries[entryId]"
                          :signature="entries[entryId].signature"
                          :author="entries[entryId].author"
                        />
                        <div
                          class="text-xs py1 px-2 border-1 border-[var(--rule)] rounded-full"
                        >
                          {{ entries[entryId].kind }}
                        </div>
                        <span
                          v-if="
                            entryDisplayId(entryId, entries[entryId]) !==
                            shortId(entryId)
                          "
                          class="text-[var(--muted)]"
                        >
                          #{{ entryDisplayId(entryId, entries[entryId]) }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <IdentityAvatar
                          :identity="entries[entryId].author"
                          size="xs"
                        />

                        <span
                          v-if="entries[entryId]?.timestamp"
                          class="text-xs text-ellipsis overflow-hidden"
                        >
                          {{ formatDate(entries[entryId].timestamp) }}
                        </span>
                      </div>
                    </div>
                    <pre v-if="entries[entryId]" class="w-full overflow-auto">{{
                      entries[entryId].payload
                    }}</pre>
                  </div>
                </div>
              </AccordianItem>
            </Accordian>
          </div>
        </div>
      </div>

      <div class="flex-1 flex flex-col">
        <div class="border-b border-[var(--rule)] px-4 py-3">
          <div class="text-sm font-medium">Commit</div>
          <div class="text-xs text-[var(--muted)]">
            {{ pendingCount }}
            {{ pendingCount === 1 ? "pending entry" : "pending entries" }}
          </div>
        </div>
        <div class="flex-1 flex flex-col gap-3 p-4">
          <div class="text-xs text-[var(--muted)]">Message</div>
          <textarea
            v-model="commitMessage"
            placeholder="Commit message"
            class="border-1 border-[var(--rule)] w-full py-2 px-3 rounded min-h-[120px]"
          />
          <div class="flex items-center justify-end">
            <button
              class="text-xs border-1 border-[var(--rule)] rounded px-3 py-2 disabled:opacity-50"
              @click="commit"
              :disabled="!canCommit"
            >
              Commit
            </button>
          </div>
        </div>
      </div>
    </div>
  </Console>
</template>
