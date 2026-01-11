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
  <div class="p-4 mx-auto max-w-140 w-full">
    <h1>Permissions</h1>
    <ul class="w-full">
      <li v-for="item in items" :key="item.entryId">
        {{ item.data.title }}

        <button @click="completeItem(item.data)">
          {{ item.data.completed ? "✓" : "✗" }}
        </button>
      </li>
    </ul>
    <div v-if="canAddItem">
      <input
        v-model="itemTitle"
        type="text"
        placeholder="Item title"
        class="border p-2 mr-2"
      />
      <button @click="addItem">Add item</button>
    </div>
  </div>
</template>
