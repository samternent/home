<script setup>
import { watch, shallowRef } from "vue";
import { useLedger } from "@/module/ledger/useLedger";
import { SButton, SDrawerRight, SInput } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import BoardColumn from "@/module/board/BoardColumn.vue";

const { ledger, addItem, getCollection } = useLedger();

useBreadcrumbs({
  path: "/ledger/board",
  name: "Board",
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
  <div class="task-board-container" ref="contentContainer">
    <SDrawerRight
      v-if="contentContainer"
      v-model="isDrawerOpen"
      :container="contentContainer"
    >
      <div class="p-4">
        <h3>Task Details</h3>
        <p>Coming soon...</p>
      </div>
    </SDrawerRight>

    <div class="task-board-content">
      <BoardColumn
        v-for="column in columns"
        :key="column.data.id"
        :title="column.data.title"
        @addTask="(task) => addTask(column.data.id, task)"
      >
        <div class="task-list">
          <div
            class="task-item group bg-white dark:bg-base-200 rounded-xl shadow border border-base-200 hover:shadow-lg transition flex flex-col gap-1 px-4 py-3 cursor-pointer"
            v-for="task in columnTasks(column.data.id)"
            :key="task.data.id"
          >
            <div class="flex items-center gap-3 mb-1">
              <SButton
                variant="ghost-icon"
                size="micro"
                @click.stop="completeTask(task.data)"
                class="task-status-btn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="task-status-icon"
                  :class="{
                    'task-completed': task.data.completed,
                    'task-pending': !task.data.completed,
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
                class="font-semibold text-base-content text-base group-hover:text-primary transition"
                :class="{ 'line-through opacity-60': task.data.completed }"
              >
                {{ task.data.title || "Untitled Task" }}
              </span>
              <span
                v-if="task.data.priority"
                :class="{
                  'badge badge-outline': task.data.priority === 'Normal',
                  'badge badge-warning': task.data.priority === 'High',
                  'badge badge-error': task.data.priority === 'Critical',
                  'badge badge-success': task.data.priority === 'Low',
                }"
                >⚡ {{ task.data.priority }}</span
              >
              <span v-if="task.completed" class="badge badge-success ml-2"
                >Completed</span
              >
            </div>
            <div
              class="flex flex-wrap items-center gap-3 text-xs text-base-content/60 mb-1"
            >
              <span v-if="task.data.assignee" class="badge badge-info"
                >👤 {{ task.data.assignee }}</span
              >
              <span v-if="task.data.dueDate" class="badge badge-ghost"
                >⏰ Due: {{ task.data.dueDate }}</span
              >
              <span v-if="task.data.description" class="truncate max-w-xs">{{
                task.data.description
              }}</span>
            </div>
          </div>
        </div>
      </BoardColumn>

      <!-- Add column section -->
      <div class="add-column-section">
        <SInput
          v-model="newColumn"
          size="micro"
          placeholder="Column name"
          class="add-column-input"
        />
        <SButton
          variant="outline"
          size="micro"
          :disabled="!newColumn"
          @click="addColumn"
        >
          Add Column
        </SButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-board-container {
  display: flex;
  gap: 1rem;
  flex: 1;
  width: 100%;
  padding: 1.5rem;
  background: oklch(var(--b1));
  min-height: 100vh;
}

.task-board-content {
  display: flex;
  gap: 1rem;
  flex: 1;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.task-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  overflow-y: auto;
  max-height: 70vh;
}

.task-item {
  /* @apply group bg-white dark:bg-base-200 rounded-xl shadow border border-base-200 hover:shadow-lg transition flex flex-col gap-1 px-4 py-3 cursor-pointer; */
}

.task-item:hover {
  box-shadow: var(--shadow-soft);
  border-color: oklch(var(--bc) / 0.3);
}

.task-status-btn {
  flex-shrink: 0;
}

.task-status-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: color 0.12s ease;
}

.task-completed {
  color: #10b981;
}

.task-pending {
  color: #6b7280;
}

.task-title {
  flex: 1;
  font-size: 0.8125rem;
  color: oklch(var(--bc) / 0.7);
  line-height: 1.4;
  transition: all 0.12s ease;
}

.task-title-completed {
  text-decoration: line-through;
  opacity: 0.6;
}

.add-column-section {
  background: oklch(var(--b2));
  border: 1px solid oklch(var(--b3));
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 15rem;
  width: 15rem;
  height: fit-content;
  box-shadow: var(--shadow-micro);
}

.add-column-input {
  width: 100%;
}
</style>
