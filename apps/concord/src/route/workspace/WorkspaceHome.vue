<script setup lang="ts">
import { onMounted, computed, shallowRef } from "vue";
import { generateId, stripIdentityKey } from "ternent-utils";
import { LedgerContainer } from "ternent-ledger-types";
import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";

import AppLayout from "../../module/app/AppLayout.vue";
import Console from "../../module/console/Console.vue";
import SideNav from "../../module/side-nav/SideNav.vue";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import sampleLedger from "./sample-ledger.json";

defineProps({
  workspaceId: {
    type: String,
    required: false,
  },
});

const { api, bridge, ledger } = useLedger();
const { privateKey: priv, publicKey: pub, publicKeyPEM } = useIdentity();

const useSampleLedger = true;

onMounted(async () => {
  await api.loadFromStorage();
  if (!bridge.flags.value.hasLedger && useSampleLedger) {
    await api.load(sampleLedger as LedgerContainer, [], true);
  }
  await api.auth(priv.value!, pub.value!);
});

const hasLedger = computed(() => bridge.flags.value.hasLedger);
const commitMessage = shallowRef("");
async function commit() {
  if (!bridge.flags.value.canWrite || !bridge.flags.value.pendingCount) {
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
</script>
<template>
  <AppLayout>
    <template #left-side> <SideNav /> </template>

    <div class="p-4 flex flex-1">
      <RouterView v-if="hasLedger" />
      <div v-else>
        <p>No ledger found in this workspace.</p>
        <button @click="api.create()">Create Ledger</button>
      </div>
    </div>
    <template #console="{ container }">
      <Console :container>
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
            <ul
              v-for="[commitId, commit] in items"
              :key="commitId"
              class="px-2 flex flex-col gap-1 py-4 border-b border-[var(--rule)]"
            >
              <div class="text-sm flex items-center gap-2">
                @{{ commitId.substring(0, 7) }}
                <div
                  v-if="commit.metadata.genesis"
                  class="text-xs py1 px-2 border-1 border-[var(--rule)] rounded-full"
                >
                  {{ commit.metadata.spec }}
                </div>
                <div>{{ commit.metadata.message }}</div>

                <div v-if="commit.entries.length" class="font-medium">v</div>
              </div>
              <li
                v-for="entry in commit.entries"
                :key="entry"
                class="px-2 text-xs border-t border-[var(--rule)] py-2 my-2"
              >
                <div class="flex gap-2 items-center">
                  @{{ entry.substring(0, 7) }}
                  <div
                    class="text-xs py1 px-2 border-1 border-[var(--rule)] rounded-full"
                  >
                    {{ ledger.entries[entry].kind }}
                  </div>
                  <IdentityAvatar
                    :identity="ledger.entries[entry].author"
                    size="xs"
                  />
                  <span class="text-sm text-ellipsis w-64 overflow-hidden">{{
                    ledger.entries[entry].signature
                  }}</span>
                  <span class="text-sm text-ellipsis w-64 overflow-hidden">{{
                    ledger.entries[entry].timestamp
                  }}</span>
                </div>
                <pre class="w-full overflow-auto">{{
                  ledger.entries[entry].payload
                }}</pre>
              </li>
            </ul>
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
  </AppLayout>
</template>
