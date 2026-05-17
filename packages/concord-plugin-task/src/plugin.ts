import type { ConcordReplayPlugin } from "@ternent/concord";
import { taskCreateInputSchema, taskEditInputSchema, taskSetStatusInputSchema } from "./schemas";
import { createEmptyTaskProjection, normalizeTaskProjection } from "./state";
import type {
  TaskCreateInput,
  TaskEditInput,
  TaskProjection,
  TaskRecord,
  TaskSetStatusInput,
} from "./types";

function normalizeNotes(value: string | null | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDueAt(value: string | null | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTaskCreateInput(input: unknown): TaskCreateInput {
  const parsed = taskCreateInputSchema.parse(input);
  return {
    taskId: parsed.taskId,
    title: parsed.title.trim(),
    notes: normalizeNotes(parsed.notes),
    priority: parsed.priority ?? "normal",
    dueAt: normalizeDueAt(parsed.dueAt),
  };
}

function normalizeTaskEditInput(input: unknown): TaskEditInput {
  const parsed = taskEditInputSchema.parse(input);
  const next: TaskEditInput = {
    taskId: parsed.taskId,
  };

  if (parsed.title !== undefined) {
    next.title = parsed.title.trim();
  }
  if (parsed.notes !== undefined) {
    next.notes = normalizeNotes(parsed.notes);
  }
  if (parsed.priority !== undefined) {
    next.priority = parsed.priority;
  }
  if (parsed.dueAt !== undefined) {
    next.dueAt = normalizeDueAt(parsed.dueAt);
  }

  return next;
}

function normalizeTaskSetStatusInput(input: unknown): TaskSetStatusInput {
  return taskSetStatusInputSchema.parse(input);
}

function upsertTask(state: TaskProjection, nextTask: TaskRecord): TaskProjection {
  const exists = Boolean(state.tasksById[nextTask.taskId]);
  return normalizeTaskProjection(
    {
      ...state.tasksById,
      [nextTask.taskId]: nextTask,
    },
    exists ? state.orderedTaskIds : [...state.orderedTaskIds, nextTask.taskId],
  );
}

export function taskPlugin(): ConcordReplayPlugin<TaskProjection> {
  return {
    id: "tasks",
    initialState() {
      return createEmptyTaskProjection();
    },
    commands: {
      "task.create-item": async (_ctx, input) => ({
        kind: "task.item.created",
        payload: normalizeTaskCreateInput(input),
      }),
      "task.edit-item": async (_ctx, input) => ({
        kind: "task.item.edited",
        payload: normalizeTaskEditInput(input),
      }),
      "task.set-status": async (_ctx, input) => ({
        kind: "task.item.status-set",
        payload: normalizeTaskSetStatusInput(input),
      }),
    },
    applyEntry(entry, ctx) {
      if (entry.payload.type !== "plain") {
        return;
      }

      if (entry.kind === "task.item.created") {
        const payload = normalizeTaskCreateInput(entry.payload.data);
        const current = ctx.getState() as TaskProjection;

        ctx.setState(
          upsertTask(current, {
            taskId: payload.taskId,
            title: payload.title,
            notes: payload.notes ?? null,
            status: "backlog",
            priority: payload.priority ?? "normal",
            dueAt: payload.dueAt ?? null,
            createdAt: entry.authoredAt,
            updatedAt: entry.authoredAt,
          }),
        );
        return;
      }

      if (entry.kind === "task.item.edited") {
        const payload = normalizeTaskEditInput(entry.payload.data);
        const current = ctx.getState() as TaskProjection;
        const existing = current.tasksById[payload.taskId];
        if (!existing) {
          return;
        }

        ctx.setState(
          upsertTask(current, {
            ...existing,
            title: payload.title ?? existing.title,
            notes: payload.notes ?? existing.notes,
            priority: payload.priority ?? existing.priority,
            dueAt: payload.dueAt ?? existing.dueAt,
            updatedAt: entry.authoredAt,
          }),
        );
        return;
      }

      if (entry.kind === "task.item.status-set") {
        const payload = normalizeTaskSetStatusInput(entry.payload.data);
        const current = ctx.getState() as TaskProjection;
        const existing = current.tasksById[payload.taskId];
        if (!existing) {
          return;
        }

        ctx.setState(
          upsertTask(current, {
            ...existing,
            status: payload.status,
            updatedAt: entry.authoredAt,
          }),
        );
      }
    },
  };
}
