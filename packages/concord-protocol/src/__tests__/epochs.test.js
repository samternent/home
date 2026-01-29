import fs from "node:fs";
import { describe, expect, test } from "vitest";
import {
  validateLedgerEpochs,
  getEpochChain,
  getActiveEpoch,
} from "../index";

function loadFixtureLedger() {
  const fixturePath = new URL("./fixtures/epoch-ledger.valid.json", import.meta.url);
  const raw = fs.readFileSync(fixturePath, "utf8");
  return JSON.parse(raw);
}

function cloneFixtureLedger() {
  return JSON.parse(JSON.stringify(loadFixtureLedger()));
}

test("testValidEpochChainFixture", async () => {
  const ledger = loadFixtureLedger();
  const result = await validateLedgerEpochs(ledger);
  expect(result.ok).toBe(true);
  const epochs = getEpochChain(ledger);
  expect(epochs.length).toBe(2);
  const active = await getActiveEpoch(ledger);
  expect(active.ok).toBe(true);
  if (active.ok) {
    expect(active.epoch.payload.epochId).toBe(
      ledger.entries["entry-epoch-2"].payload.epochId
    );
  }
});

test("testValidatorRejectsMissingGenesisEpoch", async () => {
  const ledger = cloneFixtureLedger();
  ledger.commits.genesis.entries = [];
  const result = await validateLedgerEpochs(ledger);
  expect(result.ok).toBe(false);
  expect(result.errors.some((err) => err.code === "EPOCH_GENESIS_MISSING")).toBe(
    true
  );
});

test("testValidatorRejectsPrevNullOutsideGenesis", async () => {
  const ledger = cloneFixtureLedger();
  ledger.entries["entry-epoch-2"].payload.prevEpochId = null;
  const result = await validateLedgerEpochs(ledger);
  expect(result.ok).toBe(false);
  expect(
    result.errors.some(
      (err) => err.code === "EPOCH_PREV_NULL_OUTSIDE_GENESIS"
    )
  ).toBe(true);
});

test("testValidatorRejectsMultipleGenesisEpoch", async () => {
  const ledger = cloneFixtureLedger();
  ledger.entries["entry-epoch-1b"] = JSON.parse(
    JSON.stringify(ledger.entries["entry-epoch-1"])
  );
  ledger.commits.genesis.entries.push("entry-epoch-1b");
  const result = await validateLedgerEpochs(ledger);
  expect(result.ok).toBe(false);
  expect(result.errors.some((err) => err.code === "EPOCH_GENESIS_MULTIPLE")).toBe(
    true
  );
});

test("testValidatorRejectsBrokenChain", async () => {
  const ledger = cloneFixtureLedger();
  ledger.entries["entry-epoch-2"].payload.prevEpochId = "not-the-prev-epoch";
  const result = await validateLedgerEpochs(ledger);
  expect(result.ok).toBe(false);
  expect(result.errors.some((err) => err.code === "EPOCH_CHAIN_BROKEN")).toBe(
    true
  );
});

test("testValidatorRejectsEpochIdMismatch", async () => {
  const ledger = cloneFixtureLedger();
  ledger.entries["entry-epoch-2"].payload.encryptionKeyId = "bad";
  const result = await validateLedgerEpochs(ledger);
  expect(result.ok).toBe(false);
  expect(result.errors.some((err) => err.code === "EPOCH_ID_MISMATCH")).toBe(true);
});

test("testValidatorRejectsSignerKeyIdMismatch", async () => {
  const ledger = cloneFixtureLedger();
  ledger.entries["entry-epoch-1"].payload.signerKeyId = "bad";
  const result = await validateLedgerEpochs(ledger);
  expect(result.ok).toBe(false);
  expect(
    result.errors.some((err) => err.code === "SIGNER_KEY_ID_MISMATCH")
  ).toBe(true);
});

test("testValidatorRejectsEntryTimestampAfterCommit", async () => {
  const ledger = cloneFixtureLedger();
  ledger.entries["entry-epoch-2"].timestamp = "2024-01-03T00:00:00.000Z";
  const result = await validateLedgerEpochs(ledger);
  expect(result.ok).toBe(false);
  expect(
    result.errors.some((err) => err.code === "ENTRY_TIMESTAMP_AFTER_COMMIT")
  ).toBe(true);
});
