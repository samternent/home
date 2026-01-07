import { expect, test } from "vitest";
import useLedger from "./ledger";

test("replay order is deterministic by kind, time, and entryId", async () => {
  const calls = [];
  const ledgerApi = useLedger({
    plugins: [
      {
        onAdd: (entry) => calls.push(entry.entryId),
      },
    ],
  });

  const ledger = {
    format: "concord-ledger",
    version: 0,
    ledgerId: "ledger-1",
    head: "commit-1",
    commits: [
      {
        commitId: "commit-1",
        parent: null,
        time: 1,
        entries: [
          {
            entryId: "other-a",
            kind: "concord/app/registered",
            time: 1,
            author: "author-1",
            payload: { id: "app-1" },
          },
          {
            entryId: "perm-b",
            kind: "concord/perm/granted",
            time: 5,
            author: "author-1",
            payload: { id: "perm-2" },
          },
          {
            entryId: "perm-a",
            kind: "concord/perm/granted",
            time: 5,
            author: "author-1",
            payload: { id: "perm-1" },
          },
        ],
      },
    ],
    pendingEntries: [
      {
        entryId: "user-a",
        kind: "concord/user/added",
        time: 10,
        author: "author-1",
        payload: { id: "user-1" },
      },
    ],
  };

  await ledgerApi.load(ledger, true);

  expect(calls).toEqual(["user-a", "perm-a", "perm-b", "other-a"]);
});
