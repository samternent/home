import type { ConcordReplayPlugin } from "@ternent/concord";

export type ConcordTodoItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ConcordTodoReplayState = {
  items: Record<string, ConcordTodoItem>;
};

type ConcordTodoSnapshotPayload = {
  item: ConcordTodoItem;
};

function sortTodoItems(items: Record<string, ConcordTodoItem>): ConcordTodoItem[] {
  return Object.values(items).sort((left, right) => {
    if (left.completed !== right.completed) {
      return left.completed ? 1 : -1;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function listConcordTodoItems(
  state: ConcordTodoReplayState | null | undefined,
): ConcordTodoItem[] {
  return sortTodoItems(state?.items ?? {});
}

export function createConcordTodoHostedPlugin(): ConcordReplayPlugin<ConcordTodoReplayState> {
  return {
    id: "todo",
    initialState() {
      return { items: {} };
    },
    commands: {
      "todo.put-item": async (_ctx, input: ConcordTodoSnapshotPayload) => ({
        kind: "todo.item.put",
        payload: input,
      }),
      "todo.create-item": async (ctx, input: { id: string; title: string }) => ({
        kind: "todo.item.created",
        payload: {
          ...input,
          createdAt: ctx.now(),
        },
      }),
      "todo.set-completed": async (ctx, input: { id: string; completed: boolean }) => ({
        kind: "todo.item.completed-set",
        payload: {
          ...input,
          updatedAt: ctx.now(),
        },
      }),
      "todo.delete-item": async (ctx, input: { id: string }) => ({
        kind: "todo.item.deleted",
        payload: {
          ...input,
          updatedAt: ctx.now(),
        },
      }),
    },
    applyEntry(entry, ctx) {
      if (entry.payload.type !== "plain") {
        return;
      }

      if (entry.kind === "todo.item.created") {
        const payload = entry.payload.data as {
          id: string;
          title: string;
          createdAt: string;
        };

        ctx.setState((state) => ({
          items: {
            ...state.items,
            [payload.id]: {
              id: payload.id,
              title: payload.title,
              completed: false,
              createdAt: payload.createdAt,
              updatedAt: payload.createdAt,
            },
          },
        }));
        return;
      }

      if (entry.kind === "todo.item.put") {
        const payload = entry.payload.data as ConcordTodoSnapshotPayload;
        const item = payload.item;

        ctx.setState((state) => ({
          items: {
            ...state.items,
            [item.id]: item,
          },
        }));
        return;
      }

      if (entry.kind === "todo.item.completed-set") {
        const payload = entry.payload.data as {
          id: string;
          completed: boolean;
          updatedAt: string;
        };

        ctx.setState((state) => {
          const current = state.items[payload.id];
          if (!current) {
            return state;
          }

          return {
            items: {
              ...state.items,
              [payload.id]: {
                ...current,
                completed: payload.completed,
                updatedAt: payload.updatedAt,
              },
            },
          };
        });
        return;
      }

      if (entry.kind === "todo.item.deleted") {
        const payload = entry.payload.data as { id: string };

        ctx.setState((state) => {
          if (!state.items[payload.id]) {
            return state;
          }

          const nextItems = { ...state.items };
          delete nextItems[payload.id];
          return {
            items: nextItems,
          };
        });
      }
    },
  };
}
