import assert from "node:assert/strict";
import test from "node:test";
import { IssuancePolicyError, resolveIssuancePolicy } from "../issuance-policy.mjs";

test("resolveIssuancePolicy returns weekly deterministic policy by default", () => {
  const policy = resolveIssuancePolicy({
    wantsDevUntrackedPack: false,
    wantsOverride: false,
    allowDevUntrackedPacks: true,
    requestedDropId: "",
    requestedCount: null,
    issuedAt: "2026-02-16T12:00:00.000Z",
    clampPackCardCount: (value) => Number(value || 0),
    defaultPackCount: 5,
  });

  assert.equal(policy.name, "WeeklyDeterministicPolicy");
  assert.equal(policy.mode, "weekly");
  assert.equal(policy.count, 5);
  assert.equal(policy.untracked, false);
  assert.equal(policy.override, false);
});

test("resolveIssuancePolicy returns curated random policy when override=true", () => {
  const policy = resolveIssuancePolicy({
    wantsDevUntrackedPack: false,
    wantsOverride: true,
    allowDevUntrackedPacks: true,
    requestedDropId: "week-2026-W07",
    requestedCount: 8,
    issuedAt: "2026-02-16T12:00:00.000Z",
    clampPackCardCount: (value) => Number(value || 0),
    defaultPackCount: 5,
  });

  assert.equal(policy.name, "CuratedRandomPolicy");
  assert.equal(policy.mode, "override");
  assert.equal(policy.count, 8);
  assert.equal(policy.override, true);
});

test("resolveIssuancePolicy rejects mixed dev-untracked and override requests", () => {
  assert.throws(
    () =>
      resolveIssuancePolicy({
        wantsDevUntrackedPack: true,
        wantsOverride: true,
        allowDevUntrackedPacks: true,
        requestedDropId: "",
        requestedCount: null,
        issuedAt: "2026-02-16T12:00:00.000Z",
        clampPackCardCount: (value) => Number(value || 0),
        defaultPackCount: 5,
      }),
    (error) =>
      error instanceof IssuancePolicyError &&
      error.statusCode === 400 &&
      /dev-untracked issuance cannot be combined with override flags/.test(
        error.payload?.error || ""
      )
  );
});
