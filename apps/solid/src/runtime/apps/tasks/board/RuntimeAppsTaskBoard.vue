<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Badge, Button, Card } from "ternent-ui/primitives";
import { useAppApi } from "@/app/api";

const appApi = useAppApi();

const loadError = ref<string | null>(null);
const actionError = ref<string | null>(null);

const boardId = computed(() => appApi.tasks.defaultBoardId());
const columns = computed(() => appApi.tasks.boardColumns(boardId.value));
const tasks = computed(() => appApi.tasks.byBoard(boardId.value));

const tasksByColumnId = computed(() =>
  Object.fromEntries(
    columns.value.map((column) => [
      column.id,
      appApi.tasks.byColumn(boardId.value, column.id),
    ]),
  ) as Record<string, ReturnType<typeof appApi.tasks.byColumn>>,
);

function columnIndexById(columnId: string): number {
  return columns.value.findIndex((column) => column.id === columnId);
}

function adjacentColumnId(columnId: string, direction: -1 | 1): string | null {
  const index = columnIndexById(columnId);
  if (index < 0) {
    return null;
  }

  const nextColumn = columns.value[index + direction];
  return nextColumn?.id ?? null;
}

async function ensureLoaded(): Promise<void> {
  loadError.value = null;
  try {
    await appApi.load();
    await appApi.identity.ensureActiveIdentity();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
  }
}

onMounted(() => {
  void ensureLoaded();
});

async function moveTask(taskId: string, nextColumnId: string | null): Promise<void> {
  actionError.value = null;
  if (!nextColumnId) {
    return;
  }

  try {
    await appApi.tasks.move({ taskId, columnId: nextColumnId });
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}

async function archiveTask(taskId: string): Promise<void> {
  actionError.value = null;
  try {
    await appApi.tasks.archive({ taskId });
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<template>
  <section class="p-4" data-test="runtime-task-board-v1">
    <header class="mb-4 flex items-center justify-between gap-2">
      <div>
        <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">Tasks</p>
        <h2 class="m-0 mt-1 text-lg font-semibold text-[var(--ui-fg)]">Board</h2>
      </div>
      <Badge tone="warning" variant="soft" size="xs" data-test="runtime-task-board-count">
        {{ tasks.length }} visible
      </Badge>
    </header>

    <p v-if="loadError" class="m-0 mb-3 text-sm text-[var(--ui-critical)]" data-test="runtime-task-board-load-error">
      {{ loadError }}
    </p>
    <p v-if="actionError" class="m-0 mb-3 text-sm text-[var(--ui-critical)]" data-test="runtime-task-board-action-error">
      {{ actionError }}
    </p>

    <div class="grid gap-3 md:grid-cols-3" data-test="runtime-task-board-columns">
      <Card v-for="column in columns" :key="column.id" class="p-3">
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">{{ column.title }}</p>
          <Badge tone="neutral" variant="outline" size="xs">
            {{ tasksByColumnId[column.id]?.length ?? 0 }}
          </Badge>
        </div>

        <div class="space-y-2">
          <Card
            v-for="task in tasksByColumnId[column.id] ?? []"
            :key="task.id"
            class="p-2"
            data-test="runtime-task-board-card"
          >
            <p class="m-0 text-sm text-[var(--ui-fg)]">{{ task.title }}</p>
            <p class="m-0 mt-1 text-xs text-[var(--ui-fg-muted)]">
              {{ task.assigneeIdentityKey ? `assignee: ${task.assigneeIdentityKey.slice(0, 14)}...` : "unassigned" }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-1">
              <Button
                type="button"
                size="xs"
                variant="plain-secondary"
                @click="moveTask(task.id, adjacentColumnId(task.columnId, -1))"
              >
                Prev
              </Button>
              <Button
                type="button"
                size="xs"
                variant="plain-secondary"
                @click="moveTask(task.id, adjacentColumnId(task.columnId, 1))"
              >
                Next
              </Button>
              <Button type="button" size="xs" variant="plain-secondary" @click="archiveTask(task.id)">
                Archive
              </Button>
            </div>
          </Card>

          <p
            v-if="(tasksByColumnId[column.id] ?? []).length === 0"
            class="m-0 rounded-[var(--ui-radius-sm)] border border-dashed border-[var(--ui-border)] p-2 text-xs text-[var(--ui-fg-muted)]"
          >
            No tasks.
          </p>
        </div>
      </Card>
    </div>
  </section>
</template>
