import { computed, ref } from "vue";
import { useRunTaskActions } from "@/modules/run/services";
import type { RunTaskCreateInput, RunTaskListCreateInput } from "@/modules/run/services/useRunTaskActions";
import { useAppShellState } from "@/modules/ui/useAppShellState";
import { useRunTasksSurface } from "./useRunTasksSurface";
import type { TaskRecord, TaskStatus } from "./types";

export type RunTaskComposer = ReturnType<typeof useRunTaskComposer>;

export function useRunTaskComposer() {
  const surface = useRunTasksSurface();
  const actions = useRunTaskActions();
  const shellState = useAppShellState();
  const createError = ref<string | null>(null);
  const mutationPrompt = ref<string | null>(null);
  const statusTaskId = ref<string | null>(null);

  function clearMessages() {
    createError.value = null;
    mutationPrompt.value = null;
  }

  function dismissPrompt() {
    mutationPrompt.value = null;
  }

  function openConnectPanel(message: string) {
    createError.value = null;
    mutationPrompt.value = message;
    shellState.openConnect("create");
  }

  function handleMutationFailure(error: string, message: string) {
    if (error.includes("Add identity") || error.includes("read-only")) {
      openConnectPanel(message);
      return;
    }

    createError.value = error;
  }

  async function submitCreateTask(input: RunTaskCreateInput) {
    clearMessages();

    if (surface.mode.value !== "interactive") {
      openConnectPanel("Add identity to create tasks.");
      return {
        ok: false as const,
        error: "Add identity to create tasks.",
      };
    }

    const result = await actions.createTask(input);

    if (!result.ok) {
      handleMutationFailure(result.error, "Add identity to create tasks.");
      return {
        ok: false as const,
        error: result.error,
      };
    }

    return { ok: true as const };
  }

  async function submitEditTask(
    taskId: string,
    input: RunTaskCreateInput,
  ) {
    clearMessages();

    if (surface.mode.value !== "interactive") {
      openConnectPanel("Add identity to update tasks.");
      return {
        ok: false as const,
        error: "Add identity to update tasks.",
      };
    }

    const result = await actions.editTask({
      taskId,
      taskListId: input.taskListId ?? null,
      title: input.title,
      notes: input.notes ?? null,
      area: input.area ?? null,
      assignee: input.assignee ?? null,
      assigneeId: input.assigneeId ?? null,
      permissionId: input.permissionId ?? null,
      tags: input.tags ?? [],
      priority: input.priority ?? "normal",
      dueAt: input.dueAt ?? null,
    });

    if (!result.ok) {
      handleMutationFailure(result.error, "Add identity to update tasks.");
      return {
        ok: false as const,
        error: result.error,
      };
    }

    return { ok: true as const };
  }

  async function submitCreateTaskList(input: RunTaskListCreateInput) {
    clearMessages();

    if (surface.mode.value !== "interactive") {
      openConnectPanel("Add identity to create task lists.");
      return {
        ok: false as const,
        error: "Add identity to create task lists.",
      };
    }

    const result = await actions.createTaskList(input);

    if (!result.ok) {
      handleMutationFailure(result.error, "Add identity to create task lists.");
      return {
        ok: false as const,
        error: result.error,
      };
    }

    return { ok: true as const };
  }

  async function handleSetStatus(taskId: string, status: TaskStatus) {
    clearMessages();

    if (surface.mode.value !== "interactive") {
      openConnectPanel("Add identity to move tasks.");
      return;
    }

    statusTaskId.value = taskId;

    const result = await actions.setTaskStatus({
      taskId,
      status,
    });

    if (!result.ok) {
      statusTaskId.value = null;
      handleMutationFailure(result.error, "Add identity to move tasks.");
      return;
    }

    statusTaskId.value = null;
  }

  async function handleToggleComplete(task: Pick<TaskRecord, "taskId" | "status">) {
    await handleSetStatus(task.taskId, task.status === "done" ? "backlog" : "done");
  }

  return {
    createError,
    mutationPrompt,
    statusTaskId,
    dismissPrompt,
    createHint: computed(() =>
      surface.mode.value === "interactive"
        ? "Capture the task details and stage them, then commit when you are ready."
        : "Add identity when you’re ready to save changes.",
    ),
    submitCreateTask,
    submitEditTask,
    submitCreateTaskList,
    handleSetStatus,
    handleToggleComplete,
  };
}
