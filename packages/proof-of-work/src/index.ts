import { canonicalStringify, hashData } from "ternent-utils";

export interface EncryptedPayload {
  enc: "age";
  ct: string;
}

export interface Entry {
  kind: string;
  timestamp: string;
  author: string;
  payload?: object | EncryptedPayload | null;
  signature?: string | null;
}

export interface Commit {
  parent: string | null;
  timestamp: string;
  metadata?: Record<string, unknown> | null;
  entries: string[];
}

export interface LedgerContainer {
  format: "concord-ledger";
  version: "1.0";
  commits: Record<string, Commit>;
  entries: Record<string, Entry>;
  head: string;
}

export interface EntryRecord {
  entryId: string;
  entry: Entry;
}

export interface RuntimeLedger extends LedgerContainer {
  pendingEntries: EntryRecord[];
}

export interface CommitMetadata {
  [key: string]: unknown;
}

const PROTOCOL_SPEC = "concord-protocol@1.0";

export function getEntryCore(entry: Entry): Omit<Entry, "signature"> {
  return {
    kind: entry.kind,
    timestamp: entry.timestamp,
    author: entry.author,
    payload: entry.payload ?? null,
  };
}

export function getEntrySigningPayload(entry: Entry): string {
  return canonicalStringify(getEntryCore(entry));
}

export async function deriveEntryId(entry: Entry): Promise<string> {
  return hashData(getEntryCore(entry));
}

export async function deriveCommitId(commit: Commit): Promise<string> {
  return hashData(commit);
}

export async function createGenesisCommit(
  meta: CommitMetadata = {},
  timestamp = new Date().toISOString()
): Promise<{ commitId: string; commit: Commit }> {
  const commit: Commit = {
    parent: null,
    timestamp,
    metadata: {
      genesis: true,
      spec: PROTOCOL_SPEC,
      ...meta,
    },
    entries: [],
  };
  const commitId = await deriveCommitId(commit);
  return { commitId, commit };
}

export async function createLedger(
  meta: CommitMetadata = {},
  timestamp = new Date().toISOString()
): Promise<RuntimeLedger> {
  const { commitId, commit } = await createGenesisCommit(meta, timestamp);
  return {
    format: "concord-ledger",
    version: "1.0",
    commits: { [commitId]: commit },
    entries: {},
    head: commitId,
    pendingEntries: [],
  };
}

export async function addEntry(
  entry: Entry,
  ledger: RuntimeLedger
): Promise<RuntimeLedger> {
  const normalizedEntry: Entry = {
    ...entry,
    payload: entry.payload ?? null,
  };
  const entryId = await deriveEntryId(normalizedEntry);
  const hasEntry = ledger.pendingEntries.some(
    (pending) => pending.entryId === entryId
  );
  if (hasEntry) {
    return ledger;
  }
  return {
    ...ledger,
    pendingEntries: [
      ...ledger.pendingEntries,
      { entryId, entry: normalizedEntry },
    ],
  };
}

export async function commitPending(
  ledger: RuntimeLedger,
  metadata: CommitMetadata = {},
  timestamp = new Date().toISOString()
): Promise<RuntimeLedger> {
  if (!ledger.pendingEntries.length) {
    return ledger;
  }
  const entryIds = ledger.pendingEntries.map((pending) => pending.entryId);
  const commit: Commit = {
    parent: ledger.head ?? null,
    timestamp,
    metadata: Object.keys(metadata).length ? metadata : null,
    entries: entryIds,
  };
  const commitId = await deriveCommitId(commit);
  const entries = { ...ledger.entries };
  for (const pending of ledger.pendingEntries) {
    entries[pending.entryId] = pending.entry;
  }
  return {
    ...ledger,
    commits: {
      ...ledger.commits,
      [commitId]: commit,
    },
    entries,
    head: commitId,
    pendingEntries: [],
  };
}

export function getCommitChain(ledger: LedgerContainer): string[] {
  const chain: string[] = [];
  let current = ledger.head;
  while (current) {
    chain.push(current);
    const commit = ledger.commits[current];
    if (!commit) break;
    current = commit.parent ?? "";
  }
  return chain.reverse();
}

export function isGenesisCommit(commit: Commit): boolean {
  return !!commit.metadata && commit.metadata.genesis === true;
}

export function toCanonicalLedger(ledger: RuntimeLedger): LedgerContainer {
  const { pendingEntries, ...canonical } = ledger;
  return canonical;
}
