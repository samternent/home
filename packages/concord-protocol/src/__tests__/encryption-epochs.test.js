import fs from "node:fs";
import { describe, expect, test } from "vitest";
import { validateLedgerEncryptionKeyIds } from "../index";

function loadFixtureLedger() {
  const fixturePath = new URL(
    "./fixtures/epoch-ledger.valid.json",
    import.meta.url
  );
  const raw = fs.readFileSync(fixturePath, "utf8");
  return JSON.parse(raw);
}

function buildLedgerWithPermissions() {
  const ledger = loadFixtureLedger();
  const genesisEpochId = ledger.entries["entry-epoch-1"].payload.epochId;
  const nextEpochId = ledger.entries["entry-epoch-2"].payload.epochId;

  ledger.entries["entry-perm-1"] = {
    kind: "permission-grants",
    timestamp: "2024-01-01T00:00:00.000Z",
    author: ledger.entries["entry-epoch-1"].author,
    payload: {
      permissionId: "perm-1",
      secret: "secret",
      encryptionKeyId: genesisEpochId,
    },
    signature: "sig",
  };
  ledger.commits.genesis.entries.push("entry-perm-1");

  ledger.entries["entry-perm-2"] = {
    kind: "permission-grants",
    timestamp: "2024-01-03T00:00:00.000Z",
    author: ledger.entries["entry-epoch-1"].author,
    payload: {
      permissionId: "perm-1",
      secret: "secret-2",
      encryptionKeyId: nextEpochId,
    },
    signature: "sig",
  };
  ledger.commits["commit-3"] = {
    parent: "commit-2",
    timestamp: "2024-01-03T00:00:00.000Z",
    metadata: { message: "grant" },
    entries: ["entry-perm-2"],
  };
  ledger.head = "commit-3";

  return ledger;
}

describe("encryptionKeyId validation", () => {
  test("valid ledger uses epoch ids per commit chain", () => {
    const ledger = buildLedgerWithPermissions();
    const result = validateLedgerEncryptionKeyIds(ledger);
    expect(result.ok).toBe(true);
  });

  test("invalid ledger rejects unknown encryptionKeyId", () => {
    const ledger = buildLedgerWithPermissions();
    ledger.entries["entry-perm-2"].payload.encryptionKeyId = "unknown";
    const result = validateLedgerEncryptionKeyIds(ledger);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((err) => err.code === "EPOCH_UNKNOWN_ENCRYPTION_KEY")
    ).toBe(true);
  });
});
