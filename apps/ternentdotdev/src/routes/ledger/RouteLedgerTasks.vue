<script setup>
import { watch, shallowRef } from "vue";
import { useLedger } from "@/module/ledger/useLedger";
import { SButton, SDrawerRight } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const { ledger, addItem, getCollection } = useLedger();

useBreadcrumbs({
  path: "/ledger/tasks",
  name: "Tasks",
});

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

function completeTask(task) {
  addItem({ ...task, completed: !task.completed }, "tasks");
}

const isDrawerOpen = shallowRef(false);
const contentContainer = shallowRef();
</script>

<template>
  <div class="flex gap-4 flex-1 w-full p-6" ref="contentContainer">
    <SDrawerRight v-model="isDrawerOpen"> hiya </SDrawerRight>
    <div class="flex gap-4 flex-1 w-full overflow-y-auto">
      <div
        class="min-w-80 w-80 border border-base-300 flex flex-col justify-between"
        v-for="column in columns"
        :key="column.data.id"
      >
        <h3 class="mx-auto font-bold text-2xl p-2">{{ column.data.name }}</h3>
        <div class="flex-1 flex flex-col gap-1 px-2 overflow-auto">
          <div
            class="bg-base-200 border border-base-300 p-2 flex gap-2 items-center justify-between overflow-auto min-h-16"
            v-for="task in columnTasks(column.data.id)"
            :key="task.data.id"
          >
            <SButton class="btn-sm" @click="completeTask(task.data)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6"
                :class="{
                  'text-success': task.data.completed,
                  'text-info': !task.data.completed,
                }"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </SButton>

            <span :class="{ 'line-through': task.data.completed }">{{
              task.data.name
            }}</span>
            <SButton class="btn-sm" @click="isDrawerOpen = true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                />
              </svg>
            </SButton>
          </div>
        </div>

        <SButton
          type="primary"
          class="btn-sm glass !font-thin btn-outline !m-2"
          @click="addTask(column.data.id)"
          >Add task</SButton
        >
      </div>
      <SButton
        type="primary"
        class="!font-thin btn-sm btn-outline"
        @click="addColumn"
        >Add Column</SButton
      >
    </div>
  </div>
</template>
