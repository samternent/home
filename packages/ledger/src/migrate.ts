import {
  Commit,
  Entry,
  LedgerContainer,
  createGenesisCommit,
  deriveCommitId,
  deriveEntryId,
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
  return {
    kind: mapLegacyKind(record.collection),
    timestamp: new Date(record.timestamp).toISOString(),
    author: record.identity,
    payload,
    signature: record.signature ?? null,
  };
}

async function mapLegacyCommit(
  block: LegacyBlock,
  parent: string | null,
  entryIds: string[]
): Promise<Commit> {
  return {
    parent,
    timestamp: new Date(block.timestamp).toISOString(),
    metadata: {
      ...(block.identity ? { author: block.identity } : {}),
      ...(block.message ? { message: block.message } : {}),
    },
    entries: entryIds,
  };
}

export async function migrateLegacyLedgerToConcord(
  legacyLedger: LegacyLedger
): Promise<LedgerContainer> {
  const entries: Record<string, Entry> = {};
  const commits: Record<string, Commit> = {};

  const genesis = await createGenesisCommit();
  commits[genesis.commitId] = genesis.commit;
  let parent: string | null = genesis.commitId;

  for (const block of legacyLedger.chain) {
    const entryIds: string[] = [];
    for (const record of block.records) {
      const entry = await mapLegacyEntry(record);
      const entryId = await deriveEntryId(entry);
      entries[entryId] = entry;
      entryIds.push(entryId);
    }

    const commit: Commit = await mapLegacyCommit(block, parent, entryIds);
    const commitId: string = await deriveCommitId(commit);
    commits[commitId] = commit;
    parent = commitId;
  }

  return {
    format: "concord-ledger",
    version: "1.0",
    commits,
    entries,
    head: parent || genesis.commitId,
  };
}
