<script setup>
import { watch, shallowRef } from "vue";
import { useLedger } from "@/module/ledger/useLedger";
import { SButton, SDrawerRight, SInput } from "ternent-ui/components";
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
            class="task-item"
            v-for="task in columnTasks(column.data.id)"
            :key="task.data.id"
          >
            <SButton
              variant="ghost-icon"
              size="micro"
              @click="completeTask(task.data)"
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
              class="task-title"
              :class="{ 'task-title-completed': task.data.completed }"
            >
              {{ task.data.title }}
            </span>
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
  background: var(--bg-primary);
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
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 0.75rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-height: 3rem;
  box-shadow: var(--shadow-micro);
  transition: all 0.12s ease;
}

.task-item:hover {
  box-shadow: var(--shadow-soft);
  border-color: var(--text-tertiary);
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
  color: var(--text-secondary);
  line-height: 1.4;
  transition: all 0.12s ease;
}

.task-title-completed {
  text-decoration: line-through;
  opacity: 0.6;
}

.add-column-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
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
