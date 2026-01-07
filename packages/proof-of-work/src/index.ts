import { hashData } from "ternent-utils";

export interface EncryptedPayload {
  enc: "age";
  ct: string;
}

export interface Entry {
  entryId: string;
  kind: string;
  time: number;
  author: string;
  sig?: string;
  payload?: object | EncryptedPayload;
}

export interface Commit {
  commitId: string;
  parent: string | null;
  time: number;
  author?: string;
  message?: string;
  entries: Entry[];
}

export interface ConcordLedger {
  format: "concord-ledger";
  version: 0;
  ledgerId: string;
  head: string;
  commits: Commit[];
}

export interface RuntimeLedger extends ConcordLedger {
  pendingEntries: Entry[];
}

export interface EntryCore {
  kind: string;
  time: number;
  author: string;
  payload?: object | EncryptedPayload;
}

export interface CommitCore {
  parent: string | null;
  time: number;
  author?: string;
  message?: string;
  entryIds: string[];
}

export async function deriveEntryId(entryCore: EntryCore): Promise<string> {
  return hashData(entryCore);
}

export async function deriveCommitId(commitCore: CommitCore): Promise<string> {
  return hashData(commitCore);
}

export async function deriveLedgerId(
  genesisCommitId: string
): Promise<string> {
  return hashData({
    format: "concord-ledger",
    version: 0,
    genesis: genesisCommitId,
  });
}

function getEntryCore(entry: Entry): EntryCore {
  return {
    kind: entry.kind,
    time: entry.time,
    author: entry.author,
    payload: entry.payload,
  };
}

async function normalizeEntry(entry: Entry): Promise<Entry> {
  const entryCore = getEntryCore(entry);
  const entryId = await deriveEntryId(entryCore);
  if (entry.entryId && entry.entryId !== entryId) {
    throw new Error("Entry ID does not match its canonical content");
  }
  return {
    ...entry,
    entryId,
  };
}

export function toCanonicalLedger(ledger: RuntimeLedger): ConcordLedger {
  const { pendingEntries, ...canonical } = ledger;
  return canonical;
}

export async function addEntry(
  entry: Entry,
  ledger: RuntimeLedger
): Promise<RuntimeLedger> {
  const normalized = await normalizeEntry(entry);
  const hasEntry = ledger.pendingEntries.some(
    (pending) => pending.entryId === normalized.entryId
  );
  if (hasEntry) {
    return ledger;
  }
  return {
    ...ledger,
    pendingEntries: [...ledger.pendingEntries, normalized],
  };
}

async function createCommit(
  entries: Entry[],
  parent: string | null,
  meta: { author?: string; message?: string; time?: number } = {}
): Promise<Commit> {
  const normalized = await Promise.all(entries.map(normalizeEntry));
  const entryIds = normalized.map((entry) => entry.entryId);
  const time = meta.time ?? Date.now();
  const commitCore: CommitCore = {
    parent,
    time,
    author: meta.author,
    message: meta.message,
    entryIds,
  };
  const commitId = await deriveCommitId(commitCore);
  return {
    commitId,
    parent,
    time,
    author: meta.author,
    message: meta.message,
    entries: normalized,
  };
}

export async function commitPending(
  ledger: RuntimeLedger,
  meta: { author?: string; message?: string; time?: number } = {}
): Promise<RuntimeLedger> {
  if (!ledger.pendingEntries.length) {
    return ledger;
  }
  const commit = await createCommit(
    ledger.pendingEntries,
    ledger.head || null,
    meta
  );
  return {
    ...ledger,
    commits: [...ledger.commits, commit],
    head: commit.commitId,
    pendingEntries: [],
  };
}

export async function createLedger(
  genesisEntry: Entry,
  meta: { author?: string; message?: string; time?: number } = {}
): Promise<RuntimeLedger> {
  const commit = await createCommit([genesisEntry], null, {
    ...meta,
    time: meta.time ?? genesisEntry.time,
  });
  const ledgerId = await deriveLedgerId(commit.commitId);
  return {
    format: "concord-ledger",
    version: 0,
    ledgerId,
    head: commit.commitId,
    commits: [commit],
    pendingEntries: [],
  };
}
