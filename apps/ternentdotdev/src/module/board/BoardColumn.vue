<script setup>
import { shallowRef } from "vue";
import { SButton, SInput } from "ternent-ui/components";

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
  <div class="board-column">
    <header class="board-column-header">
      <h3 class="board-column-title">{{ title }}</h3>
    </header>
    
    <div class="board-column-content">
      <slot />
    </div>

    <footer class="board-column-footer">
      <SInput 
        v-model="newTask" 
        size="micro"
        placeholder="Add a task..." 
        class="board-column-input"
      />
      <SButton
        variant="primary"
        size="micro"
        :disabled="!newTask"
        @click="createTask"
        class="board-column-add-btn"
      >
        Add Task
      </SButton>
    </footer>
  </div>
</template>

<style scoped>
.board-column {
  min-width: 20rem;
  width: 20rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-soft);
  height: fit-content;
  max-height: 80vh;
}

.board-column-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-light);
}

.board-column-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  margin: 0;
}

.board-column-content {
  flex: 1;
  overflow-y: auto;
  min-height: 10rem;
}

.board-column-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-light);
  background: var(--bg-tertiary);
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.board-column-input {
  width: 100%;
}

.board-column-add-btn {
  width: 100%;
}
</style>
