import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAcceptedSwapRecord,
  applyCompletedSwapRecord,
  createSwapRecord,
  recordMatchesInbox,
  recordMatchesOutbox,
  sortSwapRecordsDesc,
} from "../swaps.mjs";

function createOfferArtifact(overrides = {}) {
  const payload = {
    version: "1",
    type: "pixpax-transfer-offer",
    proofScheme: "seal",
    transferId: "transfer-001",
    offeredAt: "2026-03-21T10:00:00.000Z",
    collectionId: "dragons",
    collectionVersion: "v1",
    cardInstanceId: "card-instance-1",
    cardId: "dragon-001",
    sourceClaimEntryId: "claim-001",
    sourcePackId: "pack-001",
    seriesId: "starter",
    slotIndex: 0,
    role: "rare",
    fromClaimant: {
      type: "identity-public-key",
      value: "sender-key",
      normalizedValue: "sender-key",
    },
    toClaimant: {
      type: "identity-public-key",
      value: "receiver-key",
      normalizedValue: "receiver-key",
    },
    ...overrides,
  };
  return {
    payload,
    proof: {
      subject: {
        hash: `hash:${payload.transferId}`,
      },
    },
  };
}

function createAcceptanceArtifact(overrides = {}) {
  const payload = {
    version: "1",
    type: "pixpax-transfer-acceptance",
    proofScheme: "seal",
    transferId: "transfer-001",
    acceptedAt: "2026-03-21T10:05:00.000Z",
    offerProofHash: "hash:transfer-001",
    collectionId: "dragons",
    collectionVersion: "v1",
    cardInstanceId: "card-instance-1",
    cardId: "dragon-001",
    sourceClaimEntryId: "claim-001",
    sourcePackId: "pack-001",
    seriesId: "starter",
    slotIndex: 0,
    role: "rare",
    fromClaimant: {
      type: "identity-public-key",
      value: "sender-key",
      normalizedValue: "sender-key",
    },
    toClaimant: {
      type: "identity-public-key",
      value: "receiver-key",
      normalizedValue: "receiver-key",
    },
    ...overrides,
  };
  return {
    payload,
    proof: {
      subject: {
        hash: `accept:${payload.transferId}`,
      },
    },
  };
}

test("createSwapRecord stores sender/recipient metadata for inbox/outbox matching", () => {
  const record = createSwapRecord({
    offerArtifact: createOfferArtifact(),
  });

  assert.equal(record.status, "offered");
  assert.equal(record.transferId, "transfer-001");
  assert.equal(record.senderPublicKey, "sender-key");
  assert.equal(record.recipientPublicKey, "receiver-key");
  assert.equal(recordMatchesInbox(record, "receiver-key"), true);
  assert.equal(recordMatchesOutbox(record, "sender-key"), true);
  assert.equal(recordMatchesInbox(record, "someone-else"), false);
});

test("accepted records stay visible in inbox until sender completion", () => {
  const offered = createSwapRecord({
    offerArtifact: createOfferArtifact(),
  });
  const accepted = applyAcceptedSwapRecord(offered, createAcceptanceArtifact());

  assert.equal(accepted.status, "accepted");
  assert.equal(accepted.acceptedAt, "2026-03-21T10:05:00.000Z");
  assert.equal(recordMatchesInbox(accepted, "receiver-key"), true);
  assert.equal(recordMatchesInbox(accepted, "receiver-key", "accepted"), true);
});

test("completed records drop from inbox but remain in outbox history", () => {
  const offered = createSwapRecord({
    offerArtifact: createOfferArtifact(),
  });
  const accepted = applyAcceptedSwapRecord(offered, createAcceptanceArtifact());
  const completed = applyCompletedSwapRecord(accepted, "2026-03-21T10:10:00.000Z");

  assert.equal(completed.status, "completed");
  assert.equal(recordMatchesInbox(completed, "receiver-key"), false);
  assert.equal(recordMatchesOutbox(completed, "sender-key"), true);
});

test("sortSwapRecordsDesc sorts newer accepted records first", () => {
  const older = createSwapRecord({
    offerArtifact: createOfferArtifact({
      transferId: "transfer-older",
      offeredAt: "2026-03-20T09:00:00.000Z",
    }),
  });
  const newer = applyAcceptedSwapRecord(
    createSwapRecord({
      offerArtifact: createOfferArtifact({
        transferId: "transfer-newer",
        offeredAt: "2026-03-21T09:00:00.000Z",
      }),
    }),
    createAcceptanceArtifact({
      transferId: "transfer-newer",
      acceptedAt: "2026-03-21T10:15:00.000Z",
      offerProofHash: "hash:transfer-newer",
    }),
  );

  const sorted = sortSwapRecordsDesc([older, newer]);
  assert.deepEqual(
    sorted.map((entry) => entry.transferId),
    ["transfer-newer", "transfer-older"],
  );
});
