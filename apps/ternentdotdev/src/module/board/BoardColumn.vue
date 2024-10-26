<script setup>
import { shallowRef } from "vue";
import { SButton } from "ternent-ui/components";
defineProps({
  title: {
    type: String,
    default: "Column",
  },
});

const emit = defineEmits(["addTask"]);

const newTask = shallowRef("");

function createTask() {
  emit("addTask", { title: newTask.value, completed: false });
  newTask.value = "";
}
</script>
<template>
  <div
    class="min-w-80 w-80 border border-base-300 flex flex-col justify-between"
  >
    <h3 class="mx-auto font-bold text-2xl p-2">{{ title }}</h3>
    <div class="flex-1 flex flex-col gap-1 px-2 overflow-auto">
      <slot />
    </div>

    <div
      class="bg-base-200 border border-base-300 p-2 flex gap-2 items-center justify-between overflow-auto min-h-16"
    >
      <input v-model="newTask" class="input w-full" placeholder="Task name" />
    </div>
    <SButton
      type="primary"
      :disabled="!newTask"
      class="btn-sm glass !font-thin btn-outline !m-2"
      @click="createTask"
      >Add task</SButton
    >
  </div>
</template>
