<script setup lang="ts">
import { computed } from "vue";

import { useLedger } from "../../module/ledger/useLedger";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";

const viewModel = defineModel({
  type: Object,
  default: null,
});

const { bridge } = useLedger();

type LedgerItem = {
  id: string;
  title: string;
  completed?: boolean;
  assignedTo?: boolean;
  [key: string]: unknown;
};

type ItemEntry = {
  entryId: string;
  data: LedgerItem;
};

const users = computed<ItemEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.users || {}) as ItemEntry[]
);
</script>
<template>
  <div class="flex gap-4 items-center w-full flex-1">
    <select
      v-model="viewModel"
      class="text-sm border py-2 px-3 rounded-xl border-[var(--rule)] flex-1"
    >
      <option :value="null" :selected="!viewModel">anyone</option>
      <option v-for="user in users" :key="user" :value="user.data">
        {{ user.data.name }}
      </option>
    </select>
    <IdentityAvatar
      v-if="viewModel?.publicIdentityKey"
      :identity="viewModel.publicIdentityKey"
      size="xs"
    />
  </div>
</template>
