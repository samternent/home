import { describe, expect, test } from "vitest";
import {
  ConcordProtocolError,
  appendCommit,
  appendEntry,
  createCommit,
  createLedger,
  deriveCommitId,
  deriveEntryId,
  getCommitChain,
  validateLedger,
} from "../index";

describe("canonical hashing determinism", () => {
  test("fixed entry produces fixed EntryID", async () => {
    const entry = {
      kind: "concord/user/added",
      timestamp: "2026-01-01T00:00:00Z",
      author: "author-1",
      payload: { a: 1, b: 2 },
    };
    const entryId = await deriveEntryId(entry);
    expect(entryId).toBe(
      "6e3ffbf931a8a795b2572649ec861a305538fe6ceb6447e151b3781e249b3007"
    );
  });

  test("fixed commit produces fixed CommitID", async () => {
    const commit = {
      parent: null,
      timestamp: "2026-01-01T00:01:00Z",
      metadata: { genesis: true, spec: "concord-protocol@1.0" },
      entries: [],
    };
    const commitId = await deriveCommitId(commit);
    expect(commitId).toBe(
      "2d72634e11d0a177b35393d3ba200f6922c612663a885a809b7f09021249a3d6"
    );
  });

  test("signature changes do not affect EntryID", async () => {
    const entry = {
      kind: "concord/user/added",
      timestamp: "2026-01-01T00:00:00Z",
      author: "author-1",
      payload: { a: 1, b: 2 },
      signature: "sig-1",
    };
    const entryWithDifferentSig = { ...entry, signature: "sig-2" };
    const first = await deriveEntryId(entry);
    const second = await deriveEntryId(entryWithDifferentSig);
    expect(first).toBe(second);
  });

  test("non-ASCII payload produces stable EntryID", async () => {
    const entry = {
      kind: "concord/user/added",
      timestamp: "2026-01-02T00:00:00Z",
      author: "author-1",
      payload: { message: "café" },
    };
    const entryId = await deriveEntryId(entry);
    expect(entryId).toBe(
      "1681308cdf7ee7c018144bb51e3fe493d65dbc78fedf959b0e8c7e94c6de6f52"
    );
  });
});

describe("commit chain safety", () => {
  test("missing head commit throws typed error", async () => {
    const ledger = await createLedger();
    const invalid = { ...ledger, head: "missing" };
    try {
      getCommitChain(invalid);
      throw new Error("Expected getCommitChain to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ConcordProtocolError);
      expect(error.code).toBe("MISSING_HEAD");
    }
  });

  test("missing intermediate commit throws typed error", async () => {
    const ledger = await createLedger();
    const { commitId, commit } = await createCommit({
      ledger,
      entries: [],
    });
    const updated = appendCommit(ledger, commitId, commit);
    const tampered = {
      ...updated,
      commits: { ...updated.commits },
    };
    delete tampered.commits[ledger.head];
    try {
      getCommitChain(tampered);
      throw new Error("Expected getCommitChain to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ConcordProtocolError);
      expect(error.code).toBe("MISSING_COMMIT");
    }
  });

  test("cycle in parent pointers throws typed error", async () => {
    const ledger = await createLedger();
    const { commitId, commit } = await createCommit({
      ledger,
      entries: [],
    });
    const updated = appendCommit(ledger, commitId, commit);
    const cycleCommit = {
      ...updated.commits[commitId],
      parent: commitId,
    };
    const cycled = {
      ...updated,
      commits: {
        ...updated.commits,
        [commitId]: cycleCommit,
      },
    };
    try {
      getCommitChain(cycled);
      throw new Error("Expected getCommitChain to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ConcordProtocolError);
      expect(error.code).toBe("COMMIT_CHAIN_CYCLE");
    }
  });
});

describe("ledger validation", () => {
  test("createLedger produces a valid ledger", async () => {
    const ledger = await createLedger();
    const result = validateLedger(ledger);
    expect(result.ok).toBe(true);
  });

  test("genesis invariants are enforced", async () => {
    const ledger = await createLedger();
    const genesisId = ledger.head;
    const invalid = {
      ...ledger,
      commits: {
        ...ledger.commits,
        [genesisId]: {
          ...ledger.commits[genesisId],
          metadata: { genesis: false, spec: "concord-protocol@1.0" },
        },
      },
    };
    const result = validateLedger(invalid);
    expect(result.ok).toBe(false);
  });

  test("non-strict spec validation allows other spec strings", async () => {
    const ledger = await createLedger();
    const genesisId = ledger.head;
    const relaxed = {
      ...ledger,
      commits: {
        ...ledger.commits,
        [genesisId]: {
          ...ledger.commits[genesisId],
          metadata: { genesis: true, spec: "custom-spec@0.1" },
        },
      },
    };
    const result = validateLedger(relaxed, { strictSpec: false });
    expect(result.ok).toBe(true);
  });
});

describe("helper safety", () => {
  test("createCommit throws when parent is missing", async () => {
    const ledger = await createLedger();
    await expect(
      createCommit({
        ledger,
        entries: [],
        parent: "missing-parent",
      })
    ).rejects.toMatchObject({ code: "MISSING_COMMIT" });
  });

  test("createCommit throws when parent is empty string", async () => {
    const ledger = await createLedger();
    await expect(
      createCommit({
        ledger,
        entries: [],
        parent: "",
      })
    ).rejects.toMatchObject({ code: "INVALID_PARENT" });
  });

  test("appendCommit throws when parent does not exist", async () => {
    const ledger = await createLedger();
    const commit = {
      parent: "missing-parent",
      timestamp: "2026-01-01T00:01:00Z",
      metadata: { msg: "test" },
      entries: [],
    };
    expect(() => appendCommit(ledger, "missing-commit-id", commit)).toThrow(
      ConcordProtocolError
    );
  });

  test("appendEntry rejects non-canonical payloads", async () => {
    const ledger = await createLedger();
    await expect(
      appendEntry(ledger, {
        kind: "concord/user/added",
        timestamp: "2026-01-01T00:00:00Z",
        author: "author-1",
        payload: { invalid: undefined },
      })
    ).rejects.toMatchObject({ code: "INVALID_ENTRY" });
  });
});
