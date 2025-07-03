<script setup>
import { computed, ref, shallowRef } from "vue";
import { useLedger } from "@/module/ledger/useLedger";
import { SButton, SInput, SDrawerRight } from "ternent-ui/components";

const { getCollection, addItem } = useLedger();
const tasks = computed(() => getCollection("tasks")?.data || []);

const isDrawerOpen = ref(false);
const drawerMode = ref("add");
const editingTask = shallowRef(null);
const contentContainer = shallowRef();

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
      <h2 class="text-xl font-bold">Task Table</h2>
      <SButton size="sm" @click="openAddDrawer">+ Add Task</SButton>
    </div>
    <div v-if="tasks.length === 0" class="text-base-content/50 text-center py-12">
      No tasks yet. Add your first task!
    </div>
    <div v-else class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id" class="hover:bg-base-200/40 cursor-pointer" @click="openEditDrawer(task)">
            <td>{{ task.data.title || 'Untitled Task' }}</td>
            <td>{{ task.data.description }}</td>
            <td>
              <span :class="task.completed ? 'badge badge-success' : 'badge badge-outline'">
                {{ task.completed ? 'Completed' : 'Open' }}
              </span>
            </td>
            <td>{{ task.data.priority }}</td>
            <td>{{ task.data.assignee }}</td>
            <td>{{ task.data.dueDate }}</td>
          </tr>
        </tbody>
      </table>
    </div>
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
