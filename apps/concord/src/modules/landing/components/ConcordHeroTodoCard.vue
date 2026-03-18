<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
} from "ternent-ui/primitives";
import { useConcordLandingDemo } from "@/modules/landing/useConcordLandingDemo";

const demo = useConcordLandingDemo();

const canAdd = computed(
  () =>
    demo.state.ready &&
    !demo.state.isMutating &&
    demo.state.pendingTitle.trim().length > 0,
);

const completedCount = computed(
  () => demo.state.todos.filter((todo) => todo.completed).length,
);

onMounted(() => {
  void demo.ensureStarted();
});

function submitTodo() {
  void demo.addTodo();
}

function commitStaged() {
  void demo.commitStaged();
}

function onToggle(id: string, checked: boolean | "indeterminate") {
  void demo.completeTodo(id, checked);
}
</script>

<template>
  <Card variant="panel" padding="sm" class="overflow-hidden">
    <div
      class="flex items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] px-4 py-4"
    >
      <div class="space-y-1">
        <p
          class="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
        >
          Concord app runtime
        </p>
        <h2 class="m-0 text-lg font-medium tracking-[-0.02em] text-[var(--ui-fg)]">
          Todo plugin demo
        </h2>
        <p class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]">
          Commands stage entries locally. Explicit commits turn staged meaning into signed history.
        </p>
      </div>

      <Badge
        :tone="demo.state.ready ? 'success' : 'neutral'"
        variant="soft"
      >
        {{ demo.state.ready ? "ready" : "loading" }}
      </Badge>
    </div>

    <div class="grid gap-4 px-4 py-4">
      <div
        class="grid gap-3 rounded-[calc(var(--ui-radius-lg)-6px)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_82%,transparent)] p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <Input
          v-model="demo.state.pendingTitle"
          size="sm"
          placeholder="Stage a todo command"
          aria-label="Todo title"
          :disabled="demo.state.isMutating"
          @keydown.enter.prevent="submitTodo"
        />
        <Button
          size="sm"
          :disabled="!canAdd"
          :loading="demo.state.isMutating"
          @click="submitTodo"
        >
          Stage item
        </Button>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-[calc(var(--ui-radius-lg)-6px)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_82%,transparent)] px-3 py-3"
      >
        <div class="flex flex-wrap items-center gap-3 text-sm text-[var(--ui-fg-muted)]">
          <span>{{ demo.state.stagedCount }} staged changes</span>
          <span>{{ demo.state.todos.length }} projected items</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          :disabled="demo.state.stagedCount === 0 || demo.state.isMutating"
          :loading="demo.state.isMutating"
          @click="commitStaged"
        >
          Commit staged
        </Button>
      </div>

      <div class="grid gap-2">
        <div
          v-for="todo in demo.state.todos"
          :key="todo.id"
          class="rounded-[calc(var(--ui-radius-lg)-8px)] border border-[color-mix(in_srgb,var(--ui-border)_74%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] px-3 py-3"
        >
          <Checkbox
            :model-value="todo.completed"
            size="sm"
            :disabled="todo.completed || demo.state.isMutating"
            @update:model-value="onToggle(todo.id, $event)"
          >
            <span
              class="text-sm"
              :class="
                todo.completed
                  ? 'text-[var(--ui-fg-muted)] line-through'
                  : 'text-[var(--ui-fg)]'
              "
            >
              {{ todo.title }}
            </span>
            <template #description>
              <span class="text-xs">
                {{
                  todo.completed
                    ? "staged or committed completion from replay"
                    : "projected from committed + staged replay"
                }}
              </span>
            </template>
          </Checkbox>
        </div>
      </div>

      <div
        class="flex flex-wrap items-center gap-3 border-t border-[color-mix(in_srgb,var(--ui-border)_74%,transparent)] pt-3 text-sm text-[var(--ui-fg-muted)]"
      >
        <span>{{ demo.state.todos.length }} items</span>
        <span>{{ completedCount }} completed</span>
        <span>signed commit history</span>
      </div>

      <p
        v-if="demo.state.error"
        class="m-0 text-sm leading-6 text-[var(--ui-critical)]"
      >
        {{ demo.state.error }}
      </p>
    </div>
  </Card>
</template>
