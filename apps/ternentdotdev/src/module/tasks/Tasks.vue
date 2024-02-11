<script setup>
import { useLedger } from "@/module/ledger/useLedger";
import LedgerDataTable from "../ledger/LedgerDataTable.vue";

import { SButton } from "ternent-ui/components";
import { watch, shallowRef } from "vue";

const { ledger, addItem, getCollection } = useLedger();
const tasks = shallowRef();

watch(
  ledger,
  () => {
    tasks.value = [...getCollection("tasks").data];
  },
  { immediate: true }
);

function addTaskItem() {
  addItem(
    {
      name: "task name",
      completed: false,
    },
    "tasks"
  );
}
</script>
<template>
  <div class="text-base font-thin">
    <SButton @click="addTaskItem" type="secondary" class="my-2"
      >Add item</SButton
    >
    <LedgerDataTable table="tasks" />
  </div>
</template>
