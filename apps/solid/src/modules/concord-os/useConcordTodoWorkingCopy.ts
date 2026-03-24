import { watch, computed, type ComputedRef } from "vue";
import type { ConcordApp } from "@ternent/concord";
import { useConcordOsAppHost } from "./useConcordOsAppHost";
import {
  createConcordOsWorkingCopy,
  type ConcordOsWorkingCopyChange,
} from "./useConcordOsWorkingCopy";
import {
  listConcordTodoItems,
  type ConcordTodoItem,
  type ConcordTodoReplayState,
} from "./todo";

type TodoCommandApp = ConcordApp & {
  command(type: "todo.put-item", input: { item: ConcordTodoItem }): Promise<unknown>;
  command(type: "todo.delete-item", input: { id: string }): Promise<unknown>;
  clearStaged(): Promise<void>;
};

export type ConcordTodoWorkingCopy = {
  items: ComputedRef<ConcordTodoItem[]>;
  stagedCount: ComputedRef<number>;
  pendingTransactions: ComputedRef<ConcordOsWorkingCopyChange[]>;
  saving: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  lastAction: ComputedRef<string | null>;
  commitMessage: ComputedRef<string>;
  createTodo(title: string): boolean;
  toggleTodo(item: ConcordTodoItem): void;
  deleteTodo(itemId: string): void;
  setCommitMessage(value: string): void;
  commitPending(): Promise<boolean>;
  reset(): void;
};

let singleton: ConcordTodoWorkingCopy | null = null;

function normalizeTodoItem(item: ConcordTodoItem): ConcordTodoItem {
  return {
    id: String(item.id),
    title: String(item.title),
    completed: Boolean(item.completed),
    createdAt: String(item.createdAt),
    updatedAt: String(item.updatedAt),
  };
}

function sameTodoItem(left: ConcordTodoItem, right: ConcordTodoItem): boolean {
  return (
    left.id === right.id &&
    left.title === right.title &&
    left.completed === right.completed &&
    left.createdAt === right.createdAt &&
    left.updatedAt === right.updatedAt
  );
}

function currentTodoApp(app: ConcordApp | null): TodoCommandApp {
  if (!app) {
    throw new Error("No active Todo app is loaded.");
  }

  return app as TodoCommandApp;
}

function createTodoWorkingCopy(): ConcordTodoWorkingCopy {
  const host = useConcordOsAppHost();
  const draft = createConcordOsWorkingCopy<ConcordTodoItem>({
    sort(items) {
      return listConcordTodoItems({ items });
    },
    equal: sameTodoItem,
    normalize: normalizeTodoItem,
  });

  watch(
    () => [host.activeApp.value, host.activeAppId.value] as const,
    ([app, appId]) => {
      if (!app || appId !== "todo") {
        draft.reset();
        return;
      }

      const replay = app.getReplayState<ConcordTodoReplayState>("todo");
      draft.loadCommitted(listConcordTodoItems(replay));
    },
    { immediate: true },
  );

  return {
    items: draft.items,
    stagedCount: draft.stagedCount,
    pendingTransactions: draft.pendingTransactions,
    saving: draft.saving,
    error: draft.error,
    lastAction: draft.lastAction,
    commitMessage: draft.commitMessage,
    createTodo(title: string) {
      const normalized = title.trim();
      if (!normalized) {
        return false;
      }

      const now = new Date().toISOString();
      draft.stagePut(`Create todo ${normalized}`, {
        id: crypto.randomUUID(),
        title: normalized,
        completed: false,
        createdAt: now,
        updatedAt: now,
      });
      return true;
    },
    toggleTodo(item) {
      draft.stagePut(
        `${item.completed ? "Reopen" : "Complete"} todo ${item.title}`,
        {
          ...normalizeTodoItem(item),
          completed: !item.completed,
          updatedAt: new Date().toISOString(),
        },
      );
    },
    deleteTodo(itemId: string) {
      const current = draft.items.value.find((item) => item.id === itemId);
      draft.stageDelete(current ? `Delete todo ${current.title}` : "Delete todo item", itemId);
    },
    setCommitMessage: draft.setCommitMessage,
    async commitPending() {
      return await draft.commitPending({
        clearStaged: async () => {
          await currentTodoApp(host.activeApp.value).clearStaged();
        },
        putEntity: async (item) => {
          await currentTodoApp(host.activeApp.value).command("todo.put-item", { item });
        },
        deleteEntity: async (id) => {
          await currentTodoApp(host.activeApp.value).command("todo.delete-item", { id });
        },
        commit: async (message) => {
          await currentTodoApp(host.activeApp.value).commit({
            metadata: {
              message,
            },
          });
        },
      });
    },
    reset: draft.reset,
  };
}

export function useConcordTodoWorkingCopy(): ConcordTodoWorkingCopy {
  if (!singleton) {
    singleton = createTodoWorkingCopy();
  }

  return singleton;
}
