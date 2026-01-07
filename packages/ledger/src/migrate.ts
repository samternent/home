import {
  Commit,
  ConcordLedger,
  Entry,
  deriveCommitId,
  deriveEntryId,
  deriveLedgerId,
} from "ternent-proof-of-work";

type LegacyRecord = {
  id: string;
  timestamp: number;
  signature?: string;
  identity: string;
  data?: { [key: string]: any };
  encrypted?: string;
  collection?: string;
};

type LegacyBlock = {
  records: Array<LegacyRecord>;
  timestamp: number;
  last_hash: string;
  hash?: string;
  nonce?: number;
  identity?: string;
  message?: string;
};

type LegacyLedger = {
  chain: Array<LegacyBlock>;
  pending_records?: Array<LegacyRecord>;
  id: string;
};

function mapLegacyKind(collection?: string): string {
  if (!collection) return "concord/entry";
  if (collection === "users") return "concord/user/added";
  if (collection === "ledger_apps") return "concord/app/registered";
  if (collection.startsWith("schema_")) {
    return `concord/schema/${collection.replace("schema_", "")}/record`;
  }
  return collection;
}

function mapLegacyPayload(record: LegacyRecord): object | undefined {
  if (!record.data && !record.encrypted) return undefined;
  if (record.encrypted && !record.data) {
    return {
      enc: "age",
      ct: record.encrypted,
    };
  }
  return {
    ...(record.data || {}),
    ...(record.encrypted ? { enc: "age", ct: record.encrypted } : {}),
  };
}

async function mapLegacyEntry(record: LegacyRecord): Promise<Entry> {
  const payload = mapLegacyPayload(record);
  const entryCore = {
    kind: mapLegacyKind(record.collection),
    time: record.timestamp,
    author: record.identity,
    payload,
  };
  const entryId = await deriveEntryId(entryCore);
  return {
    entryId,
    ...entryCore,
  };
}

async function mapLegacyCommit(
  block: LegacyBlock,
  parent: string | null
): Promise<Commit> {
  const entries = await Promise.all(block.records.map(mapLegacyEntry));
  const entryIds = entries.map((entry) => entry.entryId);
  const commitCore = {
    parent,
    time: block.timestamp,
    author: block.identity,
    message: block.message,
    entryIds,
  };
  const commitId = await deriveCommitId(commitCore);
  return {
    commitId,
    parent,
    time: block.timestamp,
    author: block.identity,
    message: block.message,
    entries,
  };
}

export async function migrateLegacyLedgerToConcord(
  legacyLedger: LegacyLedger
): Promise<ConcordLedger> {
  const commits: Commit[] = [];
  let parent: string | null = null;

  for (const block of legacyLedger.chain) {
    const commit = await mapLegacyCommit(block, parent);
    commits.push(commit);
    parent = commit.commitId;
  }

  const head = commits.length ? commits[commits.length - 1].commitId : "";
  const ledgerId = commits.length
    ? await deriveLedgerId(commits[0].commitId)
    : await deriveLedgerId("genesis");

  return {
    format: "concord-ledger",
    version: 0,
    ledgerId,
    head,
    commits,
  };
}
