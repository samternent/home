<script setup>
import { watch, shallowRef } from "vue";
import { useLedger } from "@/module/ledger/useLedger";
import { SButton, SDrawerRight } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import BoardColumn from "@/module/board/BoardColumn.vue";

const { ledger, addItem, getCollection } = useLedger();

useBreadcrumbs({
  path: "/ledger/tasks",
  name: "Tasks",
});

function addTask(columnId, task) {
  addItem(
    {
      columnId,
      completed: false,
      ...task,
    },
    "tasks"
  );
}

async function addColumn() {
  await addItem(
    {
      title: newColumn.value,
    },
    "columns"
  );
  newColumn.value = "";
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

const newColumn = shallowRef("");
</script>

<template>
  <div class="flex gap-4 flex-1 w-full p-6" ref="contentContainer">
    <SDrawerRight
      v-if="contentContainer"
      v-model="isDrawerOpen"
      :container="contentContainer"
    >
      hiya
    </SDrawerRight>
    <div class="flex gap-4 flex-1 w-full overflow-y-auto">
      <BoardColumn
        v-for="column in columns"
        :key="column.data.id"
        :title="column.data.title"
        @addTask="(task) => addTask(column.data.id, task)"
      >
        <div class="flex-1 flex flex-col gap-1 p-2 overflow-auto">
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

            <span
              class="text-sm flex-1"
              :class="{ 'line-through': task.data.completed }"
              >{{ task.data.title }}</span
            >
            <!-- <SButton
              class="btn-sm disabled"
              @click="isDrawerOpen = true"
              disabled
            >
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
            </SButton> -->
          </div>
        </div>
      </BoardColumn>
      <div class="bg-base-200 p-2 flex flex-col gap-2 min-w-60 w-60">
        <input
          v-model="newColumn"
          class="input w-full"
          placeholder="Column name"
        />
        <SButton
          type="primary"
          :disabled="!newColumn"
          class="btn-sm !font-thin btn-outline !m-2"
          @click="addColumn"
          >Add Column</SButton
        >
      </div>
    </div>
  </div>
</template>
