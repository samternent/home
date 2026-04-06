import type { TaskCompatibilityResult } from "./types";

type TaskLedgerLike = {
  entries?: Record<string, { kind: string }> | null;
};

const TASK_DOCUMENT_ENTRY_KINDS = new Set([
  "task.item.created",
  "task.item.edited",
  "task.item.status-set",
  "task.list.created",
  "task.list.edited",
  "task.user.upserted",
  "task.permission.created",
  "task.permission.edited",
  "task.permission-grant.created",
]);

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

  const taskDocumentKinds = entryKinds.filter((kind) => TASK_DOCUMENT_ENTRY_KINDS.has(kind));
  const nonTaskDocumentKinds = entryKinds.filter((kind) => !TASK_DOCUMENT_ENTRY_KINDS.has(kind));

  if (taskDocumentKinds.length === entryKinds.length) {
    return {
      supported: true,
      reason: null,
      classification: "task-document",
    };
  }

  if (taskDocumentKinds.length > 0 && nonTaskDocumentKinds.length > 0) {
    return {
      supported: false,
      reason: "Tasks currently supports ledgers whose entries belong to the task document model only.",
      classification: "mixed",
    };
  }

  return {
    supported: false,
    reason: "Selected ledger does not expose the task document replay contract.",
    classification: "unsupported",
  };
}
