<script setup>
import { watch, shallowRef } from "vue";
import { useLedger } from "@/module/ledger/useLedger";

const { ledger, addItem, getCollection } = useLedger();

function addTask(columnId) {
  addItem(
    {
      name: "task name",
      completed: false,
      columnId,
    },
    "tasks"
  );
}

function addColumn() {
  addItem(
    {
      name: "TODO",
    },
    "columns"
  );
}

const tasks = shallowRef();
const columns = shallowRef();

watch(
  ledger,
  () => {
    tasks.value = [...getCollection("tasks")?.data];
    columns.value = [...getCollection("columns")?.data];
  },
  { immediate: true }
);

function columnTasks(columnId) {
  return tasks.value.filter((task) => task.data.columnId === columnId);
}
</script>

<template>
  <div class="flex gap-4 flex-1 w-full p-6">
    <div class="flex gap-4 flex-1 w-full overflow-y-auto">
      <div
        class="min-w-64 w-64 bg-base-300 flex flex-col"
        v-for="column in columns"
        :key="column.data.id"
      >
        {{ column.data.name }}
        <button @click="addTask(column.data.id)">add task</button>
        <div
          class="bg-base-100 mx-2 my-1 p-2"
          v-for="task in columnTasks(column.data.id)"
          :key="task.data.id"
        >
          {{ task.data.name }}
        </div>
      </div>
      <button @click="addColumn">add Column</button>
    </div>
  </div>
</template>
