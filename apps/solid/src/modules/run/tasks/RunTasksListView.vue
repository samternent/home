<script setup lang="ts">
import { Badge, Checkbox } from "ternent-ui/primitives";
import type { TaskPriority, TaskRecord, TaskStatus } from "./types";

const props = defineProps<{
  tasks: TaskRecord[];
  statusLabels: Record<TaskStatus, string>;
  taskListLabels?: Record<string, string>;
  statusTaskId: string | null;
  formatRelativeTime(value: string): string;
  variant?: "default" | "demo";
}>();

const emit = defineEmits<{
  (event: "edit", task: TaskRecord): void;
  (event: "toggle-complete", task: Pick<TaskRecord, "taskId" | "status">): void;
}>();

const toneByStatus: Record<
  TaskStatus,
  "neutral" | "primary" | "warning" | "success"
> = {
  backlog: "neutral",
  active: "primary",
  blocked: "warning",
  done: "success",
};

const priorityMeta: Record<
  TaskPriority,
  { label: string; glyph: string; className: string; tone: "neutral" | "primary" | "warning" }
> = {
  high: {
    label: "High",
    glyph: "↑",
    className: "text-[var(--ui-critical)]",
    tone: "warning",
  },
  normal: {
    label: "Medium",
    glyph: "↗",
    className: "text-[var(--ui-accent)]",
    tone: "primary",
  },
  low: {
    label: "Low",
    glyph: "↓",
    className: "text-[var(--ui-success)]",
    tone: "neutral",
  },
};

const swatchVars = [
  "var(--ui-primary)",
  "var(--ui-info)",
  "var(--ui-secondary)",
  "var(--ui-accent)",
  "var(--ui-success)",
];

function getInitials(task: TaskRecord): string {
  const source = task.assignee?.trim() || task.title;
  const words = source.split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");
  return initials.join("") || "TK";
}

function hashLabel(value: string): number {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function colorForLabel(value: string): string {
  return (
    swatchVars[hashLabel(value) % swatchVars.length] ?? "var(--ui-primary)"
  );
}

function avatarStyle(task: TaskRecord) {
  const color = colorForLabel(task.assignee?.trim() || task.title);
  return {
    background: `color-mix(in srgb, ${color} 88%, white)`,
    color: "var(--ui-bg)",
    boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 30%, transparent)`,
  };
}

function dotStyle(label: string | null) {
  const color = colorForLabel(label || "general");
  return {
    backgroundColor: color,
  };
}

function formatDueDate(value: string | null): string {
  if (!value) {
    return "No due date";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(timestamp);
}

function secondaryLine(task: TaskRecord): string | null {
  const notes = task.notes?.trim();
  if (notes) {
    return notes;
  }

  const parts = [
    task.taskListId && props.taskListLabels?.[task.taskListId]
      ? props.taskListLabels[task.taskListId]
      : null,
    task.area || null,
    task.assignee || null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : null;
}

function rowDateLabel(task: TaskRecord): string {
  if (task.dueAt) {
    return formatDueDate(task.dueAt);
  }

  return props.formatRelativeTime(task.updatedAt);
}

function onEdit(task: TaskRecord) {
  emit("edit", task);
}
</script>

<template>
  <div
    v-if="props.variant === 'demo'"
    class="space-y-3"
  >
    <div
      v-if="!props.tasks.length"
      class="rounded-[24px] border border-[var(--ui-border)] bg-[var(--ui-surface)]/40 px-5 py-10 text-center text-sm text-[var(--ui-fg-muted)]"
    >
      No matching tasks
    </div>

    <div v-else class="space-y-3">
      <article
        v-for="task in props.tasks"
        :key="task.taskId"
        class="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-[24px] border border-transparent px-4 py-4 transition duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-tonal-tertiary)]"
        :class="task.status === 'done' ? 'opacity-70' : ''"
        role="button"
        tabindex="0"
        @click="onEdit(task)"
        @keydown.enter.prevent="onEdit(task)"
        @keydown.space.prevent="onEdit(task)"
      >
        <div class="pt-0.5">
          <Checkbox
            size="sm"
            :model-value="task.status === 'done'"
            :disabled="props.statusTaskId === task.taskId"
            class="[&_[data-scope='checkbox'][data-part='control']]:rounded-[6px]"
            @click.stop
            @update:model-value="
              emit('toggle-complete', {
                taskId: task.taskId,
                status: task.status,
              })
            "
          />
        </div>

        <div class="min-w-0">
          <h2
            class="truncate text-[15px] font-medium tracking-[-0.01em] text-[var(--ui-fg)]"
            :class="task.status === 'done' ? 'line-through decoration-[var(--ui-fg-muted)]/70' : ''"
          >
            {{ task.title }}
          </h2>

          <div class="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--ui-fg-muted)]">
            <span
              v-if="task.assignee"
              class="inline-flex items-center gap-1.5"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" class="h-3.5 w-3.5">
                <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 16a6 6 0 0 1 12 0" stroke-width="1.5" />
              </svg>
              {{ task.assignee }}
            </span>

            <span class="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" class="h-3.5 w-3.5">
                <rect x="3.5" y="4.5" width="13" height="12" rx="2" stroke-width="1.5" />
                <path d="M6.5 2.8v3.4M13.5 2.8v3.4M3.5 8.2h13" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              {{ rowDateLabel(task) }}
            </span>

            <span
              v-if="!task.assignee && secondaryLine(task)"
              class="truncate"
            >
              {{ secondaryLine(task) }}
            </span>
          </div>
        </div>

        <div>
          <Badge
            :tone="toneByStatus[task.status]"
            variant="soft"
            size="sm"
            class="uppercase tracking-[0.16em]"
          >
            {{ props.statusLabels[task.status] }}
          </Badge>
        </div>

        <div class="flex justify-end">
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-medium ring-1 ring-white/10"
            :style="avatarStyle(task)"
          >
            {{ getInitials(task) }}
          </span>
        </div>
      </article>
    </div>
  </div>

  <div v-else class="space-y-2">
    <div
      v-if="!props.tasks.length"
      class="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-10 text-center text-sm text-[var(--ui-fg-muted)]"
    >
      No matching tasks
    </div>

    <template v-else>
      <div
        v-for="task in props.tasks"
        :key="task.taskId"
        class="group grid cursor-pointer gap-3 rounded-[1.125rem] border border-transparent bg-transparent px-4 py-3 transition duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] hover:border-white/8 hover:bg-white/[0.04] lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
        role="button"
        tabindex="0"
        @click="onEdit(task)"
        @keydown.enter.prevent="onEdit(task)"
        @keydown.space.prevent="onEdit(task)"
      >
        <button
          class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition"
          :class="[
            task.status === 'blocked'
              ? 'border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)]/40 text-[var(--ui-critical)]'
              : task.status === 'done'
              ? 'border-[var(--ui-success-muted)] bg-[var(--ui-success-muted)] text-[var(--ui-success)]'
              : 'border-white/12 text-[var(--ui-fg-muted)] group-hover:border-white/20 group-hover:text-[var(--ui-fg)]',
          ]"
          :disabled="props.statusTaskId === task.taskId"
          :aria-label="
            task.status === 'done'
              ? `Move ${task.title} back to backlog`
              : `Mark ${task.title} done`
          "
          @click.stop="
            emit('toggle-complete', {
              taskId: task.taskId,
              status: task.status,
            })
          "
        >
          {{ task.status === "blocked" ? "—" : "✓" }}
        </button>

        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-medium ring-1 ring-white/10"
          :style="avatarStyle(task)"
        >
          {{ getInitials(task) }}
        </span>

        <div class="min-w-0 space-y-2">
          <div class="flex items-start justify-between gap-3">
            <p
              class="m-0 truncate text-[15px] leading-6 tracking-[-0.015em] text-[var(--ui-fg)]"
            >
              {{ task.title }}
            </p>

            <div class="hidden shrink-0 items-center gap-1.5 lg:flex">
              <Badge
                :tone="toneByStatus[task.status]"
                variant="soft"
                size="xs"
                class="tracking-normal"
              >
                {{ props.statusLabels[task.status] }}
              </Badge>
              <Badge
                v-for="tag in task.tags"
                :key="`${task.taskId}:${tag}`"
                tone="neutral"
                variant="outline"
                size="xs"
                class="tracking-normal text-[var(--ui-fg)]"
              >
                {{ tag }}
              </Badge>
            </div>
          </div>

          <p
            v-if="task.notes"
            class="m-0 truncate text-[12px] leading-5 text-[var(--ui-fg-muted)]"
          >
            {{ task.notes }}
          </p>

          <div
            class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--ui-fg-muted)]"
          >
            <span
              v-if="task.taskListId && props.taskListLabels?.[task.taskListId]"
              class="inline-flex items-center gap-1.5"
            >
              <span class="text-white/35">≡</span>
              <span>{{ props.taskListLabels[task.taskListId] }}</span>
            </span>

            <span v-if="task.area" class="inline-flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full" :style="dotStyle(task.area)" />
              <span>{{ task.area }}</span>
            </span>

            <span class="inline-flex items-center gap-1.5">
              <span :class="priorityMeta[task.priority].className">{{
                priorityMeta[task.priority].glyph
              }}</span>
              <span>{{ priorityMeta[task.priority].label }}</span>
            </span>

            <span class="inline-flex items-center gap-1.5">
              <span class="text-white/35">◷</span>
              <span>{{
                task.dueAt
                  ? formatDueDate(task.dueAt)
                  : props.formatRelativeTime(task.updatedAt)
              }}</span>
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 lg:hidden">
            <Badge
              :tone="toneByStatus[task.status]"
              variant="soft"
              size="xs"
              class="tracking-normal"
            >
              {{ props.statusLabels[task.status] }}
            </Badge>
            <Badge
              v-for="tag in task.tags"
              :key="`${task.taskId}:${tag}`"
              tone="neutral"
              variant="outline"
              size="xs"
              class="tracking-normal text-[var(--ui-fg)]"
            >
              {{ tag }}
            </Badge>
          </div>
        </div>

        <div class="hidden items-center lg:flex">
          <div
            class="pl-4 text-[12px] text-white/22 transition group-hover:text-white/36"
          >
            →
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
