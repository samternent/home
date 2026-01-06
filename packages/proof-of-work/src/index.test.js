import { expect, test } from "vitest";
import {
  createLedger,
  deriveCommitId,
  deriveEntryId,
} from "./index";

test("entry ID is stable for identical entry cores", async () => {
  const entryCore = {
    kind: "concord/user/added",
    time: 1700000000000,
    author: "author-1",
    payload: { a: 1, b: 2 },
  };
  const first = await deriveEntryId(entryCore);
  const second = await deriveEntryId(entryCore);
  expect(first).toBe(second);
});

test("commit ID depends on entry IDs, not entry payload bodies", async () => {
  const entryId = await deriveEntryId({
    kind: "concord/user/added",
    time: 1700000000000,
    author: "author-1",
    payload: { payload: "v1" },
  });
  const commitCore = {
    parent: null,
    time: 1700000000001,
    entryIds: [entryId],
  };
  const first = await deriveCommitId(commitCore);
  const second = await deriveCommitId(commitCore);
  expect(first).toBe(second);
});

test("genesis commit ID is consistent for identical genesis entries", async () => {
  const entryCore = {
    kind: "concord/user/added",
    time: 1700000000000,
    author: "author-1",
    payload: { id: "user-1" },
  };
  const entry = {
    entryId: await deriveEntryId(entryCore),
    ...entryCore,
  };
  const first = await createLedger(entry, { time: entry.time });
  const second = await createLedger(entry, { time: entry.time });
  expect(first.commits[0].commitId).toBe(second.commits[0].commitId);
});
