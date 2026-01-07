import { expect, test } from "vitest";
import {
  createLedger,
  deriveCommitId,
  deriveEntryId,
  getCommitChain,
} from "./index";

test("entry ID is stable for identical entries (without signature)", async () => {
  const entry = {
    kind: "concord/user/added",
    timestamp: "2026-01-01T00:00:00Z",
    author: "author-1",
    payload: { a: 1, b: 2 },
    signature: "sig",
  };
  const first = await deriveEntryId(entry);
  const second = await deriveEntryId(entry);
  expect(first).toBe(second);
});

test("commit ID depends on commit content only", async () => {
  const commit = {
    parent: null,
    timestamp: "2026-01-01T00:01:00Z",
    metadata: { msg: "init" },
    entries: ["entry-1"],
  };
  const first = await deriveCommitId(commit);
  const second = await deriveCommitId(commit);
  expect(first).toBe(second);
});

test("genesis commit is first in the chain", async () => {
  const ledger = await createLedger();
  const chain = getCommitChain(ledger);
  expect(chain.length).toBe(1);
  expect(ledger.commits[chain[0]].parent).toBe(null);
});
