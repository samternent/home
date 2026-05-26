import type { LedgerCommitRecord, LedgerContainer, LedgerEntryRecord } from "@ternent/ledger";
import type { LedgerHead, LedgerSnapshot } from "@/app/runtime/contracts";

function resolveCommitChain(container: LedgerContainer): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  let cursor: string | null = container.head;

  while (cursor && !seen.has(cursor)) {
    const commit = container.commits[cursor];
    if (!commit) {
      break;
    }
    ordered.push(cursor);
    seen.add(cursor);
    cursor = commit.parentCommitId;
  }

  return ordered.reverse();
}

export function orderedEntriesFromContainer(container: LedgerContainer): LedgerEntryRecord[] {
  const ordered: LedgerEntryRecord[] = [];
  for (const commitId of resolveCommitChain(container)) {
    const commit = container.commits[commitId];
    if (!commit) {
      continue;
    }
    for (const entryId of commit.entryIds) {
      const entry = container.entries[entryId];
      if (entry) {
        ordered.push(entry);
      }
    }
  }
  return ordered;
}

export function createHeadsFromContainer(container: LedgerContainer): LedgerHead[] {
  const headCommit: LedgerCommitRecord | undefined = container.commits[container.head];
  const lastEntryId = headCommit?.entryIds.at(-1) ?? container.head;

  return [
    {
      entryId: lastEntryId,
      hash: container.head,
      committedAt: headCommit?.committedAt,
    },
  ];
}

export function createLedgerSnapshot(input: {
  workspaceId: string;
  container: LedgerContainer;
  loadedAt?: string;
}): LedgerSnapshot {
  return {
    workspaceId: input.workspaceId,
    container: input.container,
    entries: orderedEntriesFromContainer(input.container),
    heads: createHeadsFromContainer(input.container),
    loadedAt: input.loadedAt ?? new Date().toISOString(),
  };
}

export function isHeadIncluded(container: LedgerContainer, candidateCommitId: string): boolean {
  let cursor: string | null = container.head;
  const seen = new Set<string>();

  while (cursor && !seen.has(cursor)) {
    if (cursor === candidateCommitId) {
      return true;
    }
    seen.add(cursor);
    const commit = container.commits[cursor];
    cursor = commit?.parentCommitId ?? null;
  }

  return false;
}

export function hasSameHead(left: LedgerContainer, right: LedgerContainer): boolean {
  return left.head === right.head;
}

export function countNewEntries(base: LedgerContainer, next: LedgerContainer): number {
  const existing = new Set(Object.keys(base.entries));
  let count = 0;
  for (const entryId of Object.keys(next.entries)) {
    if (!existing.has(entryId)) {
      count += 1;
    }
  }
  return count;
}
