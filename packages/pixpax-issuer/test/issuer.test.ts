import { describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import { canonicalizeClaimantIdentity } from "@ternent/pixpax-core";
import {
  createDeterministicPackIssuance,
  createDesignatedPackIssuance,
  issueAndSignDeterministicPack,
  signTransferAcceptance,
  signTransferOffer,
  signPackIssuance,
  verifyPackIssuanceProof,
  verifyTransferAcceptanceProof,
  verifyTransferProof,
} from "../src/index.ts";

describe("@ternent/pixpax-issuer", () => {
  it("creates deterministic issuance with stable cards for the same claimant and drop", async () => {
    const first = await createDeterministicPackIssuance({
      claimant: { type: "identity-public-key", value: "pk-1" },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "duck" },
        { cardId: "card-3", seriesId: "frog" },
      ],
      count: 3,
      issuedAt: "2026-03-21T12:00:00.000Z",
      issuerKeyId: "issuer-1",
    });
    const second = await createDeterministicPackIssuance({
      claimant: { type: "identity-public-key", value: "pk-1" },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "duck" },
        { cardId: "card-3", seriesId: "frog" },
      ],
      count: 3,
      issuedAt: "2026-03-21T12:00:00.000Z",
      issuerKeyId: "issuer-1",
    });
    const changed = await createDeterministicPackIssuance({
      claimant: { type: "identity-public-key", value: "pk-1" },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W13",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "duck" },
        { cardId: "card-3", seriesId: "frog" },
      ],
      count: 3,
      issuedAt: "2026-03-21T12:00:00.000Z",
      issuerKeyId: "issuer-1",
    });

    expect(first.cards).toEqual(second.cards);
    expect(new Set(first.cards.map((card) => card.cardId)).size).toBe(first.cards.length);
    expect(changed.deterministicMaterialHash).not.toBe(
      first.deterministicMaterialHash,
    );
  });

  it("creates designated issuance without deterministic material", async () => {
    const issuance = await createDesignatedPackIssuance({
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "promo-1",
      },
      cards: [
        { cardId: "card-3", seriesId: "frog" },
        { cardId: "card-1", seriesId: "duck" },
      ],
      issuedAt: "2026-03-21T12:00:00.000Z",
      issuerKeyId: "issuer-1",
      sourceCodeId: "code-1",
    });

    expect(issuance.issuanceKind).toBe("designated");
    expect(issuance.claimant).toBeNull();
    expect(issuance.deterministicMaterialHash).toBeNull();
    expect(issuance.sourceCodeId).toBe("code-1");
  });

  it("rejects designated issuance with duplicate cards", async () => {
    await expect(
      createDesignatedPackIssuance({
        scope: {
          collectionId: "pixel-animals",
          collectionVersion: "v2",
        },
        drop: {
          dropId: "promo-1",
        },
        cards: [
          { cardId: "card-3", seriesId: "frog" },
          { cardId: "card-3", seriesId: "frog" },
        ],
        issuedAt: "2026-03-21T12:00:00.000Z",
        issuerKeyId: "issuer-1",
        sourceCodeId: "code-1",
      }),
    ).rejects.toThrow("Duplicate cardId in pack issuance is not allowed: card-3");
  });

  it("rejects deterministic issuance counts larger than the available pool", async () => {
    await expect(
      createDeterministicPackIssuance({
        claimant: { type: "identity-public-key", value: "pk-1" },
        scope: {
          collectionId: "pixel-animals",
          collectionVersion: "v2",
        },
        drop: {
          dropId: "week-2026-W12",
        },
        availableCards: [
          { cardId: "card-1", seriesId: "duck" },
          { cardId: "card-2", seriesId: "duck" },
          { cardId: "card-3", seriesId: "frog" },
        ],
        count: 4,
        issuedAt: "2026-03-21T12:00:00.000Z",
        issuerKeyId: "issuer-1",
      }),
    ).rejects.toThrow("count cannot exceed the available card pool size.");
  });

  it("signs and verifies deterministic issuance proofs", async () => {
    const issuerIdentity = await createIdentity("2026-03-21T12:00:00.000Z");
    const artifact = await issueAndSignDeterministicPack({
      identity: issuerIdentity,
      claimant: { type: "identity-public-key", value: "pk-3" },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "duck" },
        { cardId: "card-3", seriesId: "frog" },
      ],
      count: 3,
      issuedAt: "2026-03-21T12:00:00.000Z",
      issuerKeyId: issuerIdentity.keyId,
    });

    const verification = await verifyPackIssuanceProof({ artifact });
    expect(verification.ok).toBe(true);
    expect(verification.signatureValid).toBe(true);
    expect(verification.hashMatch).toBe(true);
  });

  it("fails verification when payload is tampered after signing", async () => {
    const issuerIdentity = await createIdentity("2026-03-21T12:00:00.000Z");
    const issuance = await createDeterministicPackIssuance({
      claimant: { type: "identity-public-key", value: "pk-4" },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "duck" },
      ],
      count: 2,
      issuedAt: "2026-03-21T12:00:00.000Z",
      issuerKeyId: issuerIdentity.keyId,
    });
    const artifact = await signPackIssuance({
      identity: issuerIdentity,
      issuance,
    });
    const tampered = {
      ...artifact,
      payload: {
        ...artifact.payload,
        dropId: "week-2026-W99",
      },
    };

    const verification = await verifyPackIssuanceProof({ artifact: tampered });
    expect(verification.ok).toBe(false);
    expect(verification.hashMatch).toBe(false);
    expect(verification.errors).toContain(
      "Payload hash does not match the signed issuer proof.",
    );
  });

  it("signs and verifies transfer offer and acceptance proofs", async () => {
    const senderIdentity = await createIdentity("2026-03-21T12:00:00.000Z");
    const receiverIdentity = await createIdentity("2026-03-21T12:05:00.000Z");
    const senderClaimant = await canonicalizeClaimantIdentity({
      type: "identity-public-key",
      value: senderIdentity.publicKey,
    });
    const receiverClaimant = await canonicalizeClaimantIdentity({
      type: "identity-public-key",
      value: receiverIdentity.publicKey,
    });

    const offerArtifact = await signTransferOffer({
      identity: senderIdentity,
      offer: {
        version: "1",
        type: "pixpax-transfer-offer",
        proofScheme: "seal",
        transferId: "transfer-1",
        offeredAt: "2026-03-21T12:10:00.000Z",
        collectionId: "pixel-animals",
        collectionVersion: "v2",
        cardInstanceId: "instance-1",
        cardId: "card-1",
        sourceClaimEntryId: "claim-1",
        sourcePackId: "pack-1",
        seriesId: "duck",
        slotIndex: 0,
        role: null,
        fromClaimant: senderClaimant,
        toClaimant: receiverClaimant,
      },
    });
    const acceptanceArtifact = await signTransferAcceptance({
      identity: receiverIdentity,
      acceptance: {
        version: "1",
        type: "pixpax-transfer-acceptance",
        proofScheme: "seal",
        transferId: "transfer-1",
        acceptedAt: "2026-03-21T12:11:00.000Z",
        offerProofHash: offerArtifact.proof.subject.hash,
        collectionId: "pixel-animals",
        collectionVersion: "v2",
        cardInstanceId: "instance-1",
        cardId: "card-1",
        sourceClaimEntryId: "claim-1",
        sourcePackId: "pack-1",
        seriesId: "duck",
        slotIndex: 0,
        role: null,
        fromClaimant: senderClaimant,
        toClaimant: receiverClaimant,
      },
    });

    const offerVerification = await verifyTransferProof({ artifact: offerArtifact });
    const acceptanceVerification = await verifyTransferAcceptanceProof({
      artifact: acceptanceArtifact,
    });

    expect(offerVerification.ok).toBe(true);
    expect(acceptanceVerification.ok).toBe(true);
    expect(offerVerification.signatureValid).toBe(true);
    expect(acceptanceVerification.signatureValid).toBe(true);
  });
});
