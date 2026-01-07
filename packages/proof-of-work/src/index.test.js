import { expect, test } from "vitest";
import {
  addEntry,
  commitPending,
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
  let ledger = await createLedger();
  ledger = await addEntry(
    {
      kind: "concord/user/added",
      timestamp: "2026-01-01T00:02:00Z",
      author: "author-1",
      payload: { id: "user-1" },
    },
    ledger
  );
  ledger = await commitPending(ledger, { message: "first" });
  const chain = getCommitChain(ledger);
  expect(chain.length).toBe(2);
  expect(ledger.commits[chain[0]].parent).toBe(null);
});
