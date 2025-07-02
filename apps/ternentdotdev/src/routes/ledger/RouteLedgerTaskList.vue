<script setup>
import { computed, ref, shallowRef } from "vue";
import { useLedger } from "@/module/ledger/useLedger";
import { SButton, SInput, SDrawerRight } from "ternent-ui/components";

const { getCollection, addItem } = useLedger();
const tasks = computed(() => getCollection("tasks")?.data || []);

const isDrawerOpen = ref(false);
const drawerMode = ref("add"); // or 'edit'
const editingTask = shallowRef(null);
const contentContainer = shallowRef();

// Task form fields
const form = ref({
  title: "",
  description: "",
  assignee: "",
  dueDate: "",
  priority: "Normal",
});

function openAddDrawer() {
  drawerMode.value = "add";
  form.value = { title: "", description: "", assignee: "", dueDate: "", priority: "Normal" };
  isDrawerOpen.value = true;
}
function openEditDrawer(task) {
  drawerMode.value = "edit";
  editingTask.value = task;
  form.value = { ...task.data };
  isDrawerOpen.value = true;
}
function saveTask() {
  if (drawerMode.value === "add") {
    addItem({ ...form.value, completed: false }, "tasks");
  } else if (drawerMode.value === "edit" && editingTask.value) {
    addItem({ ...editingTask.value.data, ...form.value }, "tasks");
  }
  isDrawerOpen.value = false;
}

</script>

<template>
  <div class="flex flex-col flex-1 w-full h-full bg-base-100 p-6" ref="contentContainer">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">Task List</h2>
      <SButton size="sm" @click="openAddDrawer">+ Add Task</SButton>
    </div>
    <div v-if="tasks.length === 0" class="text-base-content/50 text-center py-12">
      No tasks yet. Add your first task!
    </div>
    <ul v-else class="flex flex-col gap-2">
      <li v-for="task in tasks" :key="task.id" class="bg-white dark:bg-base-200 rounded-lg shadow-sm border border-base-200 hover:shadow-md transition group cursor-pointer px-5 py-4 flex flex-col gap-1" @click="openEditDrawer(task)">
        <div class="flex items-center gap-3">
          <input type="checkbox" :checked="task.completed" class="checkbox checkbox-sm" @click.stop />
          <span class="font-medium text-base-content text-base group-hover:text-primary transition">{{ task.data.title || 'Untitled Task' }}</span>
          <span v-if="task.completed" class="badge badge-success ml-2">Completed</span>
        </div>
        <div class="flex flex-wrap items-center gap-3 mt-1 text-xs text-base-content/60">
          <span v-if="task.data.assignee" class="badge badge-info">👤 {{ task.data.assignee }}</span>
          <span v-if="task.data.dueDate" class="badge badge-ghost">⏰ Due: {{ task.data.dueDate }}</span>
          <span v-if="task.data.priority" :class="{
            'badge badge-outline': task.data.priority === 'Normal',
            'badge badge-warning': task.data.priority === 'High',
            'badge badge-error': task.data.priority === 'Critical',
            'badge badge-success': task.data.priority === 'Low',
          }">⚡ {{ task.data.priority }}</span>
          <span v-if="task.data.description" class="truncate max-w-xs">{{ task.data.description }}</span>
        </div>
      </li>
    </ul>
    <SDrawerRight v-model="isDrawerOpen" :container="contentContainer">
      <div class="p-6 w-80 max-w-full">
        <h3 class="text-lg font-bold mb-4">{{ drawerMode === 'add' ? 'Add Task' : 'Edit Task' }}</h3>
        <form @submit.prevent="saveTask" class="flex flex-col gap-4">
          <SInput v-model="form.title" label="Title" required />
          <SInput v-model="form.description" label="Description" />
          <SInput v-model="form.assignee" label="Assignee" />
          <SInput v-model="form.dueDate" label="Due Date" type="date" />
          <select v-model="form.priority" class="select select-bordered select-sm">
            <option>Low</option>
            <option>Normal</option>
            <option>High</option>
            <option>Critical</option>
          </select>
          <div class="flex gap-2 mt-4">
            <SButton type="submit" size="sm" variant="primary">Save</SButton>
            <SButton type="button" size="sm" variant="ghost" @click="isDrawerOpen = false">Cancel</SButton>
          </div>
        </form>
      </div>
    </SDrawerRight>
  </div>
</template>
