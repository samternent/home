import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  ConcordProtocolError,
  appendCommit,
  appendCommitStrict,
  appendEntry,
  createCommit,
  createLedger,
  deriveCommitId,
  deriveEntryId,
  getCommitChain,
  getEntrySigningPayload,
  validateLedger,
} from "../index";
import { canonicalStringify } from "../canonical";

const VECTORS_PATH = new URL(
  "../../../concord-test-vectors/vectors.json",
  import.meta.url
);

function loadVectors() {
  return JSON.parse(readFileSync(VECTORS_PATH, "utf8"));
}

function materializeValue(value) {
  if (value && typeof value === "object") {
    if (value.__concord_type === "undefined") {
      return undefined;
    }
    if (value.__concord_type === "nan") {
      return Number.NaN;
    }
    if (value.__concord_type === "infinity") {
      return Number.POSITIVE_INFINITY;
    }
    if (value.__concord_type === "circular") {
      const circular = {};
      circular.self = circular;
      return circular;
    }
    if (Array.isArray(value)) {
      return value.map((item) => materializeValue(item));
    }
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = materializeValue(child);
    }
    return result;
  }
  return value;
}

function materializeInput(input) {
  return materializeValue(input);
}

function assertConcordError(error, code, messageIncludes) {
  expect(error).toBeInstanceOf(ConcordProtocolError);
  expect(error.code).toBe(code);
  if (messageIncludes) {
    expect(error.message).toContain(messageIncludes);
  }
}

describe("test vectors (JS)", () => {
  const vectors = loadVectors();
  const entryVectors = vectors.filter((vector) => vector.type === "entry");
  const commitVectors = vectors.filter((vector) => vector.type === "commit");
  const signatureVectors = vectors.filter(
    (vector) => vector.type === "entry-signature-exclusion"
  );
  const rejectionVectors = vectors.filter(
    (vector) => vector.type === "reject-entry"
  );

  test("entry vectors", async () => {
    for (const vector of entryVectors) {
      const entry = materializeInput(vector.input);
      const entryId = await deriveEntryId(entry);
      const signingPayload = getEntrySigningPayload(entry);
      expect(entryId).toBe(vector.expect.entryId);
      expect(signingPayload).toBe(vector.expect.signingPayload);
    }
  });

  test("commit vectors", async () => {
    for (const vector of commitVectors) {
      const commit = materializeInput(vector.input);
      const commitId = await deriveCommitId(commit);
      const canonicalCommit = canonicalStringify(commit);
      expect(commitId).toBe(vector.expect.commitId);
      expect(canonicalCommit).toBe(vector.expect.canonicalCommit);
    }
  });

  test("signature exclusion vectors", async () => {
    for (const vector of signatureVectors) {
      const base = materializeInput(vector.input);
      const ids = [];
      for (const variant of vector.variants) {
        const entry = { ...base, ...variant };
        ids.push(await deriveEntryId(entry));
      }
      for (const id of ids) {
        expect(id).toBe(vector.expect.entryId);
      }
    }
  });

  test("rejection vectors", async () => {
    const ledger = await createLedger();
    for (const vector of rejectionVectors) {
      const entry = materializeInput(vector.input);
      try {
        await appendEntry(ledger, entry);
        throw new Error("Expected appendEntry to throw");
      } catch (error) {
        assertConcordError(
          error,
          vector.expect.errorCode,
          vector.expect.messageIncludes
        );
      }
    }
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
      assertConcordError(error, "MISSING_HEAD");
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
      assertConcordError(error, "MISSING_COMMIT");
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
      assertConcordError(error, "COMMIT_CHAIN_CYCLE");
    }
  });
});

describe("helper safety", () => {
  test("createLedger produces a valid ledger", async () => {
    const ledger = await createLedger();
    const result = validateLedger(ledger);
    expect(result.ok).toBe(true);
  });

  test("validateLedger allows non-matching spec when strictSpec is false", async () => {
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

  test("appendCommitStrict rejects mismatched commit id", async () => {
    const ledger = await createLedger();
    const { commit } = await createCommit({
      ledger,
      entries: [],
    });
    await expect(
      appendCommitStrict(ledger, "not-a-real-id", commit)
    ).rejects.toMatchObject({ code: "COMMIT_ID_MISMATCH" });
  });

  test("appendEntry rejects toJSON payloads", async () => {
    const ledger = await createLedger();
    const payload = {
      toJSON() {
        return { a: 1 };
      },
    };
    await expect(
      appendEntry(ledger, {
        kind: "concord/user/added",
        timestamp: "2026-01-01T00:00:00Z",
        author: "author-1",
        payload,
      })
    ).rejects.toMatchObject({ code: "INVALID_ENTRY" });
  });
});
