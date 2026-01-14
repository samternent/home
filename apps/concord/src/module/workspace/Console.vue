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

const { api, bridge, ledger } = useLedger();

const commitMessage = shallowRef("");
async function commit() {
  if (!bridge.flags.value.canWrite || !bridge.flags.value.pendingCount) {
    return;
  }

  // auto-squash keeps commits clean
  await api.squashByIdAndKind({ kinds: ["items"] });
  await api.commit(commitMessage.value, {
    message: commitMessage.value,
  });
  commitMessage.value = "";
}

const items = computed(() =>
  Object.entries(ledger.value?.commits || {}).reverse()
);

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
        {{ bridge.flags.value.pendingCount }}
      </div>
    </template>
    <div class="flex w-full flex-1">
      <div
        class="flex flex-col overflow-auto flex-1 py-2 border-l border-[var(--rule)] p-2"
      >
        <Accordian>
          <AccordianItem
            v-for="[commitId, commit] in items"
            :key="commitId"
            :value="commitId"
          >
            <template #title>
              <div class="flex-1 flex gap-2 items-center">
                <span class="font-medium text-[var(--accent)] text-sm"
                  >@{{ commitId.substring(0, 7) }}</span
                >
                <div
                  v-if="commit.metadata.genesis"
                  class="text-xs py1 px-2 border-1 border-[var(--rule)] rounded-full"
                >
                  {{ commit.metadata.spec }}
                </div>
                <div class="text-sm">
                  {{ commit.metadata.message }}
                </div>
              </div>
            </template>

            <div class="flex flex-col gap-1 p-2 bg-[var(--paper2)]">
              <div
                v-for="entry in commit.entries"
                :key="entry"
                class="text-xs w-full flex-1"
              >
                <div class="flex gap-2 items-center justify-between flex-1">
                  <div class="flex items-center gap-2 flex-1">
                    <span class="text-[var(--muted)]">
                      @{{ entry.substring(0, 7) }}</span
                    >
                    <VerifyIcon
                      :payload="ledger.entries[entry]"
                      :signature="ledger.entries[entry].signature"
                      :author="ledger.entries[entry].author"
                    />
                    <div
                      class="text-xs py1 px-2 border-1 border-[var(--rule)] rounded-full"
                    >
                      {{ ledger.entries[entry].kind }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <IdentityAvatar
                      :identity="ledger.entries[entry].author"
                      size="xs"
                    />

                    <span
                      v-if="ledger.entries[entry]?.timestamp"
                      class="text-xs text-ellipsis overflow-hidden"
                    >
                      {{ formatDate(ledger.entries[entry].timestamp) }}
                    </span>
                  </div>
                </div>
                <pre class="w-full overflow-auto">{{
                  ledger.entries[entry].payload
                }}</pre>
              </div>
            </div>
          </AccordianItem>
        </Accordian>
      </div>

      <div class="flex-1 flex flex-col">
        <textarea
          v-model="commitMessage"
          placeholder="Commit message"
          class="border-b border-[var(--rule)] w-full py-2 px-4"
        />
        <button @click="commit" :disabled="!commitMessage">Commit</button>
      </div>
    </div>
  </Console>
</template>
