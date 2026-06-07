import type { TaskCompatibilityResult } from "./types";

type TaskLedgerLike = {
  entries?: Record<string, { kind: string }> | null;
};

const TASK_ENTRY_KINDS = new Set(["task.item.created", "task.item.edited", "task.item.status-set"]);

export function supportsTaskProjection(
  container: TaskLedgerLike | null | undefined,
): TaskCompatibilityResult {
  const entryKinds = Object.values(container?.entries ?? {}).map((entry) => entry.kind);

  if (entryKinds.length === 0) {
    return {
      supported: true,
      reason: null,
      classification: "empty",
    };
  }

  const taskKinds = entryKinds.filter((kind) => TASK_ENTRY_KINDS.has(kind));
  const nonTaskKinds = entryKinds.filter((kind) => !TASK_ENTRY_KINDS.has(kind));

  if (taskKinds.length === entryKinds.length) {
    return {
      supported: true,
      reason: null,
      classification: "task-only",
    };
  }

  if (taskKinds.length > 0 && nonTaskKinds.length > 0) {
    return {
      supported: false,
      reason: "Tasks currently supports empty or task-only ledgers.",
      classification: "mixed",
    };
  }

  return {
    supported: false,
    reason: "Selected ledger does not expose the Tasks replay contract.",
    classification: "unsupported",
  };
}
