import { canonicalStringify, hashData } from "ternent-utils";

/**
 * Encrypted payload wrapper for age-encrypted content.
 */
export interface EncryptedPayload {
  enc: "age";
  ct: string;
}

/**
 * Canonical entry payload for Concord.
 */
export interface Entry {
  kind: string;
  timestamp: string;
  author: string;
  payload?: object | EncryptedPayload | null;
  signature?: string | null;
}

/**
 * Canonical commit payload for Concord.
 */
export interface Commit {
  parent: string | null;
  timestamp: string;
  metadata?: Record<string, unknown> | null;
  entries: string[];
}

/**
 * Canonical Concord ledger container.
 */
export interface LedgerContainer {
  format: "concord-ledger";
  version: "1.0";
  commits: Record<string, Commit>;
  entries: Record<string, Entry>;
  head: string;
}

/**
 * Arbitrary metadata for commit creation.
 */
export interface CommitMetadata {
  [key: string]: unknown;
}

const PROTOCOL_SPEC = "concord-protocol@1.0";

/**
 * Returns the entry fields used for hashing and signing.
 */
export function getEntryCore(entry: Entry): Omit<Entry, "signature"> {
  return {
    kind: entry.kind,
    timestamp: entry.timestamp,
    author: entry.author,
    payload: entry.payload ?? null,
  };
}

/**
 * Canonical signing payload for an entry (excludes signature).
 */
export function getEntrySigningPayload(entry: Entry): string {
  return canonicalStringify(getEntryCore(entry));
}

/**
 * Deterministically derives an EntryID from entry content.
 */
export async function deriveEntryId(entry: Entry): Promise<string> {
  return hashData(getEntryCore(entry));
}

/**
 * Deterministically derives a CommitID from commit content.
 */
export async function deriveCommitId(commit: Commit): Promise<string> {
  return hashData(commit);
}

/**
 * Creates the genesis commit for a new ledger.
 */
export async function createGenesisCommit(
  metadata: CommitMetadata = {},
  timestamp = new Date().toISOString()
): Promise<{ commitId: string; commit: Commit }> {
  const commit: Commit = {
    parent: null,
    timestamp,
    metadata: {
      genesis: true,
      spec: PROTOCOL_SPEC,
      ...metadata,
    },
    entries: [],
  };
  const commitId = await deriveCommitId(commit);
  return { commitId, commit };
}

/**
 * Creates a new ledger container with a genesis commit.
 */
export async function createLedger(
  metadata: CommitMetadata = {},
  timestamp = new Date().toISOString()
): Promise<LedgerContainer> {
  const { commitId, commit } = await createGenesisCommit(metadata, timestamp);
  return {
    format: "concord-ledger",
    version: "1.0",
    commits: { [commitId]: commit },
    entries: {},
    head: commitId,
  };
}

/**
 * Returns commit IDs from genesis to head in replay order.
 */
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

/**
 * True when the commit is the Concord genesis commit.
 */
export function isGenesisCommit(commit: Commit): boolean {
  return !!commit.metadata && commit.metadata.genesis === true;
}
