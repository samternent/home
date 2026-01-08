import {
  getCommitChain,
  getReplayEntries,
  type LedgerContainer,
} from "@ternent/concord-protocol";

export type InspectSummary = {
  commitCount: number;
  entryCount: number;
  entryKinds: Record<string, number>;
  chain: string[];
};

export function inspectLedger(ledger: LedgerContainer): InspectSummary {
  const chain = getCommitChain(ledger);
  const entries = getReplayEntries(ledger);
  const entryKinds: Record<string, number> = {};

  for (const entry of entries) {
    entryKinds[entry.kind] = (entryKinds[entry.kind] ?? 0) + 1;
  }

  return {
    commitCount: chain.length,
    entryCount: entries.length,
    entryKinds,
    chain,
  };
}
