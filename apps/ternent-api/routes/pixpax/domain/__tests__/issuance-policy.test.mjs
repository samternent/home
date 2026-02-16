import assert from "node:assert/strict";
import test from "node:test";
import { IssuancePolicyError, resolveIssuancePolicy } from "../issuance-policy.mjs";

test("resolveIssuancePolicy returns weekly deterministic policy by default", () => {
  const policy = resolveIssuancePolicy({
    wantsDevUntrackedPack: false,
    wantsOverride: false,
    overrideCodeRaw: "",
    overridePayload: null,
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

test("resolveIssuancePolicy returns giftcode policy when override payload is present", () => {
  const policy = resolveIssuancePolicy({
    wantsDevUntrackedPack: false,
    wantsOverride: false,
    overrideCodeRaw: "PPX-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD",
    overridePayload: {
      codeId: "abcdabcdabcdabcdabcdabcd",
      collectionId: "premier-league-2026",
      version: "v1",
      dropId: "week-2026-W07",
      bindToUser: true,
      issuedTo: "userhash",
      count: 8,
    },
    allowDevUntrackedPacks: true,
    requestedDropId: "",
    requestedCount: null,
    issuedAt: "2026-02-16T12:00:00.000Z",
    clampPackCardCount: (value) => Number(value || 0),
    defaultPackCount: 5,
  });

  assert.equal(policy.name, "GiftCodePolicy");
  assert.equal(policy.mode, "override-code");
  assert.equal(policy.count, 8);
  assert.equal(policy.override, true);
  assert.equal(policy.codeId, "abcdabcdabcdabcdabcdabcd");
});

test("resolveIssuancePolicy rejects mixed override and code requests", () => {
  assert.throws(
    () =>
      resolveIssuancePolicy({
        wantsDevUntrackedPack: false,
        wantsOverride: true,
        overrideCodeRaw: "some-code",
        overridePayload: null,
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
      /either override=true or overrideCode/.test(error.payload?.error || "")
  );
});
