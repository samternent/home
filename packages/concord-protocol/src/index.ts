import { canonicalStringify } from "./canonical";
import { sha256Hex } from "./crypto";
import { utf8Bytes } from "./encoding";

/**
 * Canonical entry payload for Concord.
 */
export interface Entry {
  kind: string;
  timestamp: string;
  author: string;
  payload?: unknown | null;
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
const LEDGER_FORMAT = "concord-ledger";
const LEDGER_VERSION = "1.0";

export class ConcordProtocolError extends Error {
  code: string;

  /**
   * Typed protocol error with a stable machine-readable code.
   */
  constructor(code: string, message: string) {
    super(message);
    this.name = "ConcordProtocolError";
    this.code = code;
  }
}

/**
 * Hash canonical JSON using SHA-256 over UTF-8 bytes.
 */
function hashCanonical(canonical: string): Promise<string> {
  return sha256Hex(utf8Bytes(canonical));
}

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
 * Canonical signing payload as bytes for an entry (excludes signature).
 */
export function getEntrySigningBytes(entry: Entry): Uint8Array {
  return utf8Bytes(getEntrySigningPayload(entry));
}

/**
 * Deterministically derives an EntryID from entry content.
 */
export async function deriveEntryId(entry: Entry): Promise<string> {
  const payload = getEntrySigningPayload(entry);
  return hashCanonical(payload);
}

/**
 * Deterministically derives a CommitID from commit content.
 */
export async function deriveCommitId(commit: Commit): Promise<string> {
  const payload = canonicalStringify(commit);
  return hashCanonical(payload);
}

/**
 * Creates the genesis commit for a new ledger.
 */
export async function createGenesisCommit(
  metadata: CommitMetadata = {},
  timestamp = new Date().toISOString(),
  entries: string[] = []
): Promise<{ commitId: string; commit: Commit }> {
  const commit: Commit = {
    parent: null,
    timestamp,
    metadata: {
      genesis: true,
      spec: PROTOCOL_SPEC,
      ...metadata,
    },
    entries,
  };
  const commitId = await deriveCommitId(commit);
  return { commitId, commit };
}

/**
 * Creates a new ledger container with a genesis commit.
 */
export async function createLedger(
  metadata: CommitMetadata = {},
  timestamp = new Date().toISOString(),
  entries: Entry[] = []
): Promise<LedgerContainer> {
  const entriesMap: Record<string, Entry> = {};
  const entryIds: string[] = [];

  for (const entry of entries) {
    const result = validateEntry(entry);
    if (!result.ok) {
      throw new ConcordProtocolError(
        "INVALID_ENTRY",
        result.errors.join("; ")
      );
    }
    const entryId = await deriveEntryId(entry);
    if (entriesMap[entryId]) {
      throw new ConcordProtocolError(
        "DUPLICATE_ENTRY",
        `Entry ${entryId} already exists`
      );
    }
    entriesMap[entryId] = entry;
    entryIds.push(entryId);
  }

  const { commitId, commit } = await createGenesisCommit(
    metadata,
    timestamp,
    entryIds
  );
  return {
    format: LEDGER_FORMAT,
    version: LEDGER_VERSION,
    commits: { [commitId]: commit },
    entries: entriesMap,
    head: commitId,
  };
}

/**
 * Returns commit IDs from genesis to head in replay order.
 */
export function getCommitChain(ledger: LedgerContainer): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();
  if (!ledger.commits[ledger.head]) {
    throw new ConcordProtocolError(
      "MISSING_HEAD",
      `Missing head commit ${ledger.head}`
    );
  }
  let current: string | null = ledger.head ?? null;
  while (current !== null) {
    if (visited.has(current)) {
      throw new ConcordProtocolError(
        "COMMIT_CHAIN_CYCLE",
        `Commit chain cycle detected at ${current}`
      );
    }
    visited.add(current);
    chain.push(current);
    const commit: Commit | undefined = ledger.commits[current];
    if (!commit) {
      throw new ConcordProtocolError(
        "MISSING_COMMIT",
        `Missing commit ${current}`
      );
    }
    if (commit.parent === "") {
      throw new ConcordProtocolError(
        "INVALID_PARENT",
        "Commit parent must be null or a CommitID"
      );
    }
    current = commit.parent ?? null;
  }
  return chain.reverse();
}

/**
 * True when the commit is the Concord genesis commit.
 */
export function isGenesisCommit(commit: Commit): boolean {
  return !!commit.metadata && commit.metadata.genesis === true;
}

/**
 * Creates a non-genesis commit with validated parent and entry references.
 */
export async function createCommit(params: {
  ledger: LedgerContainer;
  entries: string[];
  metadata?: CommitMetadata | null;
  timestamp?: string;
  parent?: string | null;
}): Promise<{ commitId: string; commit: Commit }> {
  if (!Array.isArray(params.entries)) {
    throw new ConcordProtocolError("INVALID_ENTRIES", "Entries must be an array");
  }
  if (params.entries.some((entryId) => typeof entryId !== "string")) {
    throw new ConcordProtocolError(
      "INVALID_ENTRIES",
      "Entries must be an array of strings"
    );
  }
  for (const entryId of params.entries) {
    if (!params.ledger.entries[entryId]) {
      throw new ConcordProtocolError(
        "MISSING_ENTRY",
        `Missing entry ${entryId}`
      );
    }
  }

  const parent = params.parent ?? params.ledger.head;
  if (parent === "" || parent === null) {
    throw new ConcordProtocolError(
      "INVALID_PARENT",
      "Non-genesis commits must reference a parent"
    );
  }
  if (!params.ledger.commits[parent]) {
    throw new ConcordProtocolError(
      "MISSING_COMMIT",
      `Missing commit ${parent}`
    );
  }
  const commit: Commit = {
    parent,
    timestamp: params.timestamp ?? new Date().toISOString(),
    metadata: params.metadata ?? null,
    entries: params.entries,
  };
  const commitId = await deriveCommitId(commit);
  return { commitId, commit };
}

export function appendCommit(
  ledger: LedgerContainer,
  commitId: string,
  commit: Commit
): LedgerContainer {
  if (isGenesisCommit(commit)) {
    throw new ConcordProtocolError(
      "INVALID_COMMIT",
      "Genesis commits must be created via createLedger"
    );
  }
  if (commit.parent === null || commit.parent === "") {
    throw new ConcordProtocolError(
      "INVALID_PARENT",
      "Commit parent must be a non-empty CommitID"
    );
  }
  if (!ledger.commits[commit.parent]) {
    throw new ConcordProtocolError(
      "MISSING_COMMIT",
      `Missing commit ${commit.parent}`
    );
  }
  const commitValidation = validateCommit(commit);
  if (!commitValidation.ok) {
    throw new ConcordProtocolError(
      "INVALID_COMMIT",
      commitValidation.errors.join("; ")
    );
  }
  for (const entryId of commit.entries) {
    if (!ledger.entries[entryId]) {
      throw new ConcordProtocolError(
        "MISSING_ENTRY",
        `Missing entry ${entryId}`
      );
    }
  }
  if (ledger.commits[commitId]) {
    throw new ConcordProtocolError(
      "DUPLICATE_COMMIT",
      `Commit ${commitId} already exists`
    );
  }
  return {
    ...ledger,
    commits: {
      ...ledger.commits,
      [commitId]: commit,
    },
    head: commitId,
  };
}

/**
 * Append a commit and verify its CommitID matches the commit content.
 */
export async function appendCommitStrict(
  ledger: LedgerContainer,
  commitId: string,
  commit: Commit
): Promise<LedgerContainer> {
  const derivedId = await deriveCommitId(commit);
  if (derivedId !== commitId) {
    throw new ConcordProtocolError(
      "COMMIT_ID_MISMATCH",
      "CommitID does not match commit content"
    );
  }
  return appendCommit(ledger, commitId, commit);
}

/**
 * Append an entry after validating shape and canonicalizability.
 */
export async function appendEntry(
  ledger: LedgerContainer,
  entry: Entry
): Promise<{ ledger: LedgerContainer; entryId: string }> {
  const entryValidation = validateEntry(entry);
  if (!entryValidation.ok) {
    throw new ConcordProtocolError(
      "INVALID_ENTRY",
      entryValidation.errors.join("; ")
    );
  }
  try {
    canonicalStringify(getEntryCore(entry));
  } catch (error) {
    throw new ConcordProtocolError(
      "INVALID_ENTRY_PAYLOAD",
      error instanceof Error ? error.message : "Entry payload is not valid JSON"
    );
  }
  const entryId = await deriveEntryId(entry);
  if (ledger.entries[entryId]) {
    throw new ConcordProtocolError(
      "DUPLICATE_ENTRY",
      `Entry ${entryId} already exists`
    );
  }
  return {
    entryId,
    ledger: {
      ...ledger,
      entries: {
        ...ledger.entries,
        [entryId]: entry,
      },
    },
  };
}

export function getReplayEntryIds(ledger: LedgerContainer): string[] {
  const chain = getCommitChain(ledger);
  const entryIds: string[] = [];
  for (const commitId of chain) {
    const commit = ledger.commits[commitId];
    if (isGenesisCommit(commit)) {
      continue;
    }
    entryIds.push(...commit.entries);
  }
  return entryIds;
}

/**
 * Resolve entries in deterministic replay order.
 */
export function getReplayEntries(ledger: LedgerContainer): Entry[] {
  const entryIds = getReplayEntryIds(ledger);
  return entryIds.map((entryId) => {
    const entry = ledger.entries[entryId];
    if (!entry) {
      throw new ConcordProtocolError(
        "MISSING_ENTRY",
        `Missing entry ${entryId}`
      );
    }
    return entry;
  });
}

/**
 * Validate entry shape and canonicalizability.
 */
export function validateEntry(entry: Entry): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!entry || typeof entry !== "object") {
    errors.push("Entry must be an object");
    return { ok: false, errors };
  }
  if (typeof entry.kind !== "string" || entry.kind.length === 0) {
    errors.push("Entry.kind must be a non-empty string");
  }
  if (typeof entry.timestamp !== "string" || entry.timestamp.length === 0) {
    errors.push("Entry.timestamp must be a non-empty string");
  }
  if (typeof entry.author !== "string" || entry.author.length === 0) {
    errors.push("Entry.author must be a non-empty string");
  }
  if (
    entry.signature !== undefined &&
    entry.signature !== null &&
    typeof entry.signature !== "string"
  ) {
    errors.push("Entry.signature must be a string or null");
  }
  try {
    canonicalStringify(getEntryCore(entry));
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Entry payload is not valid JSON"
    );
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Validate commit shape without dereferencing external state.
 */
export function validateCommit(commit: Commit): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!commit || typeof commit !== "object") {
    errors.push("Commit must be an object");
    return { ok: false, errors };
  }
  if (commit.parent === "") {
    errors.push("Commit.parent must be a non-empty string or null");
  } else if (commit.parent !== null && typeof commit.parent !== "string") {
    errors.push("Commit.parent must be a non-empty string or null");
  }
  if (typeof commit.timestamp !== "string" || commit.timestamp.length === 0) {
    errors.push("Commit.timestamp must be a non-empty string");
  }
  if (!Array.isArray(commit.entries)) {
    errors.push("Commit.entries must be an array");
  } else if (commit.entries.some((entryId) => typeof entryId !== "string")) {
    errors.push("Commit.entries must be an array of strings");
  }
  if (
    commit.metadata !== undefined &&
    commit.metadata !== null &&
    (typeof commit.metadata !== "object" || Array.isArray(commit.metadata))
  ) {
    errors.push("Commit.metadata must be an object or null");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Validate ledger structure, commit chain, and genesis invariants.
 */
export function validateLedger(
  ledger: LedgerContainer,
  options?: { strictSpec?: boolean }
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const strictSpec = options?.strictSpec ?? true;
  if (!ledger || typeof ledger !== "object") {
    errors.push("Ledger must be an object");
    return { ok: false, errors };
  }
  if (ledger.format !== LEDGER_FORMAT) {
    errors.push(`Ledger.format must be "${LEDGER_FORMAT}"`);
  }
  if (ledger.version !== LEDGER_VERSION) {
    errors.push(`Ledger.version must be "${LEDGER_VERSION}"`);
  }
  if (!ledger.commits || typeof ledger.commits !== "object") {
    errors.push("Ledger.commits must be an object");
  }
  if (!ledger.entries || typeof ledger.entries !== "object") {
    errors.push("Ledger.entries must be an object");
  }
  if (typeof ledger.head !== "string") {
    errors.push("Ledger.head must be a string");
  }

  if (errors.length === 0) {
    if (!ledger.commits[ledger.head]) {
      errors.push(`Ledger head ${ledger.head} does not exist in commits`);
    }
    try {
      const chain = getCommitChain(ledger);
      if (chain.length === 0) {
        errors.push("Ledger must include a head commit");
      } else {
        const genesisId = chain[0];
        const genesis = ledger.commits[genesisId];
        if (!genesis) {
          errors.push("Genesis commit is missing");
        } else {
          if (genesis.parent !== null) {
            errors.push("Genesis commit parent must be null");
          }
          if (!Array.isArray(genesis.entries)) {
            errors.push("Genesis commit entries must be an array");
          }
          if (
            !genesis.metadata ||
            typeof genesis.metadata !== "object" ||
            Array.isArray(genesis.metadata)
          ) {
            errors.push("Genesis commit metadata must be an object");
          } else {
            if (genesis.metadata.genesis !== true) {
              errors.push("Genesis commit metadata.genesis must be true");
            }
            if (!genesis.metadata.spec) {
              errors.push("Genesis commit metadata.spec is required");
            } else if (typeof genesis.metadata.spec !== "string") {
              errors.push("Genesis commit metadata.spec must be a string");
            } else if (strictSpec && genesis.metadata.spec !== PROTOCOL_SPEC) {
              errors.push(
                `Genesis commit metadata.spec must be "${PROTOCOL_SPEC}"`
              );
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof ConcordProtocolError) {
        errors.push(error.message);
      } else {
        errors.push("Ledger commit chain is invalid");
      }
    }

    for (const [commitId, commit] of Object.entries(ledger.commits)) {
      const result = validateCommit(commit);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => `Commit ${commitId}: ${err}`)
        );
      }
      if (Array.isArray(commit.entries)) {
        for (const entryId of commit.entries) {
          if (!ledger.entries[entryId]) {
            errors.push(
              `Commit ${commitId} references missing entry ${entryId}`
            );
          }
        }
      }
    }

    for (const [entryId, entry] of Object.entries(ledger.entries)) {
      const result = validateEntry(entry);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => `Entry ${entryId}: ${err}`)
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export * from "./epochs";
export * from "./assertions";
export { canonicalStringify } from "./canonical";
