import { describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import { createConcordApp } from "@ternent/concord";
import { canonicalizeClaimantIdentity } from "@ternent/pixpax-core";
import {
  createDeterministicPackIssuance,
  signPackIssuance,
  signTransferAcceptance,
  signTransferOffer,
} from "@ternent/pixpax-issuer";
import { createPixbookPlugin } from "../src/index.ts";

function createMemoryStorage() {
  return {
    name: "memory",
    snapshot: null as unknown,
    async load() {
      return this.snapshot;
    },
    async save(snapshot: unknown) {
      this.snapshot = structuredClone(snapshot);
    },
    async clear() {
      this.snapshot = null;
    },
  };
}

describe("@ternent/pixpax-concord", () => {
  it("claims packs and derives ownership from claim entries", async () => {
    const playerIdentity = await createIdentity("2026-03-21T12:00:00.000Z");
    const issuerIdentity = await createIdentity("2026-03-21T12:05:00.000Z");
    const storage = createMemoryStorage();
    const app = await createConcordApp({
      identity: playerIdentity,
      storage,
      plugins: [
        createPixbookPlugin({
          catalogs: [
            {
              collectionId: "pixel-animals",
              collectionVersion: "v2",
              cards: [
                { cardId: "card-1", seriesId: "duck" },
                { cardId: "card-2", seriesId: "frog" },
                { cardId: "card-3", seriesId: "axolotl" },
              ],
            },
          ],
        }),
      ],
    });

    await app.load();

    const issuance = await createDeterministicPackIssuance({
      claimant: {
        type: "identity-public-key",
        value: playerIdentity.publicKey,
      },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "frog" },
        { cardId: "card-3", seriesId: "axolotl" },
      ],
      count: 5,
      issuedAt: "2026-03-21T12:10:00.000Z",
      issuerKeyId: issuerIdentity.keyId,
    });
    const artifact = await signPackIssuance({
      identity: issuerIdentity,
      issuance,
    });

    await app.command("pixbook.claim-pack", {
      artifact,
      claimedAt: "2026-03-21T12:12:00.000Z",
    });
    await app.commit();

    const state = app.getReplayState("pixbook") as {
      ownedCardInstancesById: Record<string, unknown>;
      claimedPacksByEntryId: Record<string, unknown>;
      ledgerHealth: { claimedPackCount: number };
    };

    expect(Object.keys(state.claimedPacksByEntryId)).toHaveLength(1);
    expect(state.ledgerHealth.claimedPackCount).toBe(1);
    expect(Object.keys(state.ownedCardInstancesById)).toHaveLength(5);
  });

  it("records opened packs without affecting ownership", async () => {
    const playerIdentity = await createIdentity("2026-03-21T12:00:00.000Z");
    const issuerIdentity = await createIdentity("2026-03-21T12:05:00.000Z");
    const app = await createConcordApp({
      identity: playerIdentity,
      storage: createMemoryStorage(),
      plugins: [createPixbookPlugin()],
    });

    await app.load();

    const issuance = await createDeterministicPackIssuance({
      claimant: {
        type: "identity-public-key",
        value: playerIdentity.publicKey,
      },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "frog" },
      ],
      count: 2,
      issuedAt: "2026-03-21T12:10:00.000Z",
      issuerKeyId: issuerIdentity.keyId,
    });
    const artifact = await signPackIssuance({
      identity: issuerIdentity,
      issuance,
    });

    const claimResult = await app.command("pixbook.claim-pack", {
      artifact,
    });
    const beforeOpen = app.getReplayState("pixbook") as {
      ownedCardInstancesById: Record<string, unknown>;
    };
    await app.command("pixbook.record-pack-opened", {
      claimEntryId: claimResult.entryIds[0],
      packId: issuance.packId,
    });

    const afterOpen = app.getReplayState("pixbook") as {
      ownedCardInstancesById: Record<string, unknown>;
      openedPacksByClaimEntryId: Record<string, unknown>;
    };

    expect(Object.keys(beforeOpen.ownedCardInstancesById)).toHaveLength(2);
    expect(Object.keys(afterOpen.ownedCardInstancesById)).toHaveLength(2);
    expect(Object.keys(afterOpen.openedPacksByClaimEntryId)).toHaveLength(1);
  });

  it("rejects duplicate claims for the same pack artifact", async () => {
    const playerIdentity = await createIdentity("2026-03-21T12:00:00.000Z");
    const issuerIdentity = await createIdentity("2026-03-21T12:05:00.000Z");
    const app = await createConcordApp({
      identity: playerIdentity,
      storage: createMemoryStorage(),
      plugins: [createPixbookPlugin()],
    });

    await app.load();

    const issuance = await createDeterministicPackIssuance({
      claimant: {
        type: "identity-public-key",
        value: playerIdentity.publicKey,
      },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "frog" },
      ],
      count: 2,
      issuedAt: "2026-03-21T12:10:00.000Z",
      issuerKeyId: issuerIdentity.keyId,
    });
    const artifact = await signPackIssuance({
      identity: issuerIdentity,
      issuance,
    });

    await app.command("pixbook.claim-pack", { artifact });
    await expect(app.command("pixbook.claim-pack", { artifact })).rejects.toThrow(
      /already claimed/i,
    );
  });

  it("rejects tampered proofs before staging a claim", async () => {
    const playerIdentity = await createIdentity("2026-03-21T12:00:00.000Z");
    const issuerIdentity = await createIdentity("2026-03-21T12:05:00.000Z");
    const app = await createConcordApp({
      identity: playerIdentity,
      storage: createMemoryStorage(),
      plugins: [createPixbookPlugin()],
    });

    await app.load();

    const issuance = await createDeterministicPackIssuance({
      claimant: {
        type: "identity-public-key",
        value: playerIdentity.publicKey,
      },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "frog" },
      ],
      count: 2,
      issuedAt: "2026-03-21T12:10:00.000Z",
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

    await expect(app.command("pixbook.claim-pack", { artifact: tampered })).rejects.toThrow(
      /pack issuance/i,
    );
  });

  it("records outgoing and incoming swaps against the same card instance", async () => {
    const senderIdentity = await createIdentity("2026-03-21T12:00:00.000Z");
    const receiverIdentity = await createIdentity("2026-03-21T12:02:00.000Z");
    const issuerIdentity = await createIdentity("2026-03-21T12:05:00.000Z");
    const catalogs = [
      {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
        cards: [
          { cardId: "card-1", seriesId: "duck" },
          { cardId: "card-2", seriesId: "frog" },
          { cardId: "card-3", seriesId: "axolotl" },
        ],
      },
    ];
    const senderApp = await createConcordApp({
      identity: senderIdentity,
      storage: createMemoryStorage(),
      plugins: [createPixbookPlugin({ catalogs })],
    });
    const receiverApp = await createConcordApp({
      identity: receiverIdentity,
      storage: createMemoryStorage(),
      plugins: [createPixbookPlugin({ catalogs })],
    });

    await senderApp.load();
    await receiverApp.load();

    const issuance = await createDeterministicPackIssuance({
      claimant: {
        type: "identity-public-key",
        value: senderIdentity.publicKey,
      },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      availableCards: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "frog" },
        { cardId: "card-3", seriesId: "axolotl" },
      ],
      count: 3,
      issuedAt: "2026-03-21T12:10:00.000Z",
      issuerKeyId: issuerIdentity.keyId,
    });
    const artifact = await signPackIssuance({
      identity: issuerIdentity,
      issuance,
    });

    await senderApp.command("pixbook.claim-pack", {
      artifact,
      claimedAt: "2026-03-21T12:12:00.000Z",
    });
    await senderApp.commit();

    const senderBefore = senderApp.getReplayState("pixbook") as {
      ownedCardInstancesById: Record<
        string,
        {
          cardInstanceId: string;
          cardId: string;
          claimEntryId: string;
          packId: string;
          collectionId: string;
          collectionVersion: string;
          seriesId?: string | null;
          slotIndex: number;
          role?: string | null;
        }
      >;
    };
    const cardInstance = Object.values(senderBefore.ownedCardInstancesById)[0];
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
        offeredAt: "2026-03-21T12:20:00.000Z",
        collectionId: cardInstance.collectionId,
        collectionVersion: cardInstance.collectionVersion,
        cardInstanceId: cardInstance.cardInstanceId,
        cardId: cardInstance.cardId,
        sourceClaimEntryId: cardInstance.claimEntryId,
        sourcePackId: cardInstance.packId,
        seriesId: cardInstance.seriesId ?? null,
        slotIndex: cardInstance.slotIndex,
        role: cardInstance.role ?? null,
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
        acceptedAt: "2026-03-21T12:21:00.000Z",
        offerProofHash: offerArtifact.proof.subject.hash,
        collectionId: cardInstance.collectionId,
        collectionVersion: cardInstance.collectionVersion,
        cardInstanceId: cardInstance.cardInstanceId,
        cardId: cardInstance.cardId,
        sourceClaimEntryId: cardInstance.claimEntryId,
        sourcePackId: cardInstance.packId,
        seriesId: cardInstance.seriesId ?? null,
        slotIndex: cardInstance.slotIndex,
        role: cardInstance.role ?? null,
        fromClaimant: senderClaimant,
        toClaimant: receiverClaimant,
      },
    });

    await receiverApp.command("pixbook.record-transfer", {
      offerArtifact,
      acceptanceArtifact,
    });
    await receiverApp.commit();
    await senderApp.command("pixbook.record-transfer", {
      offerArtifact,
      acceptanceArtifact,
    });
    await senderApp.commit();

    const senderAfter = senderApp.getReplayState("pixbook") as {
      ownedCardInstancesById: Record<string, unknown>;
      transferHistory: { outgoing: string[]; incoming: string[] };
    };
    const receiverAfter = receiverApp.getReplayState("pixbook") as {
      ownedCardInstancesById: Record<
        string,
        {
          cardId: string;
        }
      >;
      transferHistory: { outgoing: string[]; incoming: string[] };
    };

    expect(senderAfter.ownedCardInstancesById[cardInstance.cardInstanceId]).toBeUndefined();
    expect(receiverAfter.ownedCardInstancesById[cardInstance.cardInstanceId]).toMatchObject({
      cardId: cardInstance.cardId,
    });
    expect(senderAfter.transferHistory.outgoing).toHaveLength(1);
    expect(receiverAfter.transferHistory.incoming).toHaveLength(1);
  });
});
