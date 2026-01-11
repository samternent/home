<script setup lang="ts">
import { onMounted, computed, shallowRef } from "vue";
import { generateId } from "ternent-utils";
import { useLedger } from "../../module/ledger/useLedger";

const { api, bridge } = useLedger();

const items = computed(() =>
  Object.values(bridge.collections.byKind.value?.items || {})
);

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);
const itemTitle = shallowRef("");
async function addItem() {
  const id = generateId();
  await api.addAndStage({
    kind: "items",
    payload: { id, title: itemTitle.value },
  });
  itemTitle.value = "";
}

async function completeItem(item: Object) {
  await api.addAndStage({
    kind: "items",
    payload: { ...item, completed: !item.completed },
  });
}
</script>
<template>
  <div
    class="p-4 mx-auto max-w-140 w-full flex flex-col flex-1 justify-between"
  >
    <h1 class="sticky top-0 bg-[var(--paper)]">TODO list</h1>
    <ul class="w-full my-4 py-3 flex-1">
      <li v-for="item in items" :key="item.entryId" class="py-1">
        <button
          @click="completeItem(item.data)"
          class="flex gap-2 items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
            :class="item.data.completed ? 'text-green-500' : 'text-gray-300'"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          {{ item.data.title }}
        </button>
      </li>
    </ul>
    <div
      v-if="canAddItem"
      class="flex items-center w-full sticky bottom-0 bg-[var(--paper)] py-4 gap-2"
    >
      <input
        v-model="itemTitle"
        type="text"
        placeholder="Item title"
        class="border py-2 px-4 border-[var(--rule)] flex-1 rounded-full"
      />
      <button @click="addItem">Add item</button>
    </div>
  </div>
</template>
