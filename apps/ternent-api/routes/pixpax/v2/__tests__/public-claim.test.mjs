import assert from "node:assert/strict";
import test from "node:test";
import { createAlreadyClaimedPayload } from "../public-claim.mjs";

test("createAlreadyClaimedPayload exposes only public conflict fields", () => {
  const payload = createAlreadyClaimedPayload({
    claimedAt: "2026-03-21T12:06:00.000Z",
    sourceCodeId: "source-code-1",
    claimantPublicKey: "claimant-public-key",
    claimantHash: "claimant-hash",
    packId: "pack-1",
  });

  assert.deepEqual(payload, {
    claimedAt: "2026-03-21T12:06:00.000Z",
    sourceCodeId: "source-code-1",
  });
});
