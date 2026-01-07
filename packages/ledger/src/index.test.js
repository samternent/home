import { expect, test } from "vitest";
import useLedger from "./ledger";

test("replay follows commit order and entry order, then pending entries", async () => {
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
    version: "1.0",
    commits: {
      "commit-genesis": {
        parent: null,
        timestamp: "2026-01-01T00:00:00Z",
        metadata: { genesis: true, spec: "concord-protocol@1.0" },
        entries: [],
      },
      "commit-1": {
        parent: "commit-genesis",
        timestamp: "2026-01-01T00:01:00Z",
        metadata: null,
        entries: ["entry-1", "entry-2"],
      },
    },
    entries: {
      "entry-1": {
        kind: "concord/app/registered",
        timestamp: "2026-01-01T00:01:01Z",
        author: "author-1",
        payload: { id: "app-1" },
      },
      "entry-2": {
        kind: "concord/perm/granted",
        timestamp: "2026-01-01T00:01:02Z",
        author: "author-1",
        payload: { id: "perm-1" },
      },
    },
    head: "commit-1",
    pendingEntries: [
      {
        entryId: "entry-pending",
        entry: {
          kind: "concord/user/added",
          timestamp: "2026-01-01T00:02:00Z",
          author: "author-1",
          payload: { id: "user-1" },
        },
      },
    ],
  };

  await ledgerApi.load(ledger, true);

  expect(calls).toEqual(["entry-1", "entry-2", "entry-pending"]);
});
