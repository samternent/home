import { describe, expect, it } from "vitest";
import {
  PIXPAX_PACK_DERIVATION_VERSION,
  canonicalizeClaimantIdentity,
  createDeterministicIssuanceMaterial,
  createPackContentsHash,
  createPackItemHashes,
  createPackRoot,
  createReplayStateFromClaims,
  deriveCardInstanceId,
  selectDeterministicPackCards,
} from "../src/index.ts";

describe("@ternent/pixpax-core", () => {
  it("canonicalizes claimant identities deterministically", async () => {
    const claimant = await canonicalizeClaimantIdentity({
      type: "identity-public-key",
      value: " public-key-1 ",
    });

    expect(claimant.normalizedValue).toBe("public-key-1");
    expect(claimant.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it("creates stable deterministic issuance material", async () => {
    const material = await createDeterministicIssuanceMaterial({
      claimant: { type: "identity-public-key", value: "pk-1" },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      count: 5,
    });

    expect(material.version).toBe(PIXPAX_PACK_DERIVATION_VERSION);
    expect(material.claimant.normalizedValue).toBe("pk-1");
  });

  it("selects the same deterministic cards for the same claimant and drop", async () => {
    const baseInput = {
      claimant: { type: "identity-public-key" as const, value: "pk-1" },
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      drop: {
        dropId: "week-2026-W12",
      },
      count: 3,
      pool: [
        { cardId: "card-1", seriesId: "duck" },
        { cardId: "card-2", seriesId: "duck" },
        { cardId: "card-3", seriesId: "frog" },
      ],
    };

    const first = await selectDeterministicPackCards(baseInput);
    const second = await selectDeterministicPackCards(baseInput);
    const changed = await selectDeterministicPackCards({
      ...baseInput,
      drop: { dropId: "week-2026-W13" },
    });

    expect(first.materialHash).toBe(second.materialHash);
    expect(first.cards).toEqual(second.cards);
    expect(new Set(first.cards.map((card) => card.cardId)).size).toBe(first.cards.length);
    expect(changed.materialHash).not.toBe(first.materialHash);
  });

  it("rejects deterministic selection counts larger than the available pool", async () => {
    await expect(
      selectDeterministicPackCards({
        claimant: { type: "identity-public-key", value: "pk-1" },
        scope: {
          collectionId: "pixel-animals",
          collectionVersion: "v2",
        },
        drop: {
          dropId: "week-2026-W12",
        },
        count: 4,
        pool: [
          { cardId: "card-1", seriesId: "duck" },
          { cardId: "card-2", seriesId: "duck" },
          { cardId: "card-3", seriesId: "frog" },
        ],
      }),
    ).rejects.toThrow("count cannot exceed the available card pool size.");
  });

  it("derives stable card instance ids from claim entry and slot", async () => {
    const first = await deriveCardInstanceId({
      claimEntryId: "entry-1",
      packId: "pack-1",
      slotIndex: 0,
      cardId: "card-1",
    });
    const second = await deriveCardInstanceId({
      claimEntryId: "entry-1",
      packId: "pack-1",
      slotIndex: 0,
      cardId: "card-1",
    });
    const changed = await deriveCardInstanceId({
      claimEntryId: "entry-1",
      packId: "pack-1",
      slotIndex: 1,
      cardId: "card-1",
    });

    expect(first).toBe(second);
    expect(changed).not.toBe(first);
  });

  it("builds replay state from claims without using opened state for ownership", async () => {
    const cards = [
      {
        cardId: "card-1",
        seriesId: "duck",
        slotIndex: 0,
        role: null,
        renderPayload: null,
      },
      {
        cardId: "card-1",
        seriesId: "duck",
        slotIndex: 1,
        role: null,
        renderPayload: null,
      },
      {
        cardId: "card-2",
        seriesId: "frog",
        slotIndex: 2,
        role: null,
        renderPayload: null,
      },
    ];
    const itemHashes = await createPackItemHashes({
      scope: {
        collectionId: "pixel-animals",
        collectionVersion: "v2",
      },
      cards,
    });
    const packRoot = await createPackRoot(itemHashes);
    const contentsHash = await createPackContentsHash({ itemHashes, packRoot });

    const state = await createReplayStateFromClaims({
      claimsByEntryId: {
        "entry-1": {
          claimEntryId: "entry-1",
          claimId: "claim-1",
          claimedAt: "2026-03-21T12:00:00.000Z",
          verification: null,
          artifact: {
            payload: {
              version: "1",
              type: "pixpax-pack-issuance",
              proofScheme: "seal",
              issuanceKind: "deterministic",
              derivationVersion: "pixpax-pack/v2",
              claimUniqueness: "claimant-drop",
              packId: "pack-1",
              issuedAt: "2026-03-21T12:00:00.000Z",
              claimant: {
                type: "identity-public-key",
                value: "pk-1",
                normalizedValue: "pk-1",
                fingerprint: "f".repeat(64),
              },
              collectionId: "pixel-animals",
              collectionVersion: "v2",
              dropId: "week-2026-W12",
              issuerKeyId: "issuer-1",
              sourceCodeId: null,
              deterministicMaterialHash: "a".repeat(64),
              cards,
              itemHashes,
              packRoot,
              contentsHash,
            },
            proof: {
              version: "2",
              type: "seal-proof",
              algorithm: "Ed25519",
              createdAt: "2026-03-21T12:00:00.000Z",
              subject: {
                kind: "artifact",
                path: "pixpax/issuance/pack-1.json",
                hash: contentsHash,
              },
              signer: {
                publicKey: "issuer-public-key",
                keyId: "issuer-key-id",
              },
              signature: "signature",
            },
          },
        },
      },
      openedByClaimEntryId: {
        "entry-1": {
          openEntryId: "open-1",
          claimEntryId: "entry-1",
          packId: "pack-1",
          openedAt: "2026-03-21T12:01:00.000Z",
        },
      },
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
    });

    expect(Object.keys(state.ownedCardInstancesById)).toHaveLength(3);
    expect(state.duplicateCountsByCardId["card-1"]).toBe(2);
    expect(state.spareCountsByCardId["card-1"]).toBe(1);
    expect(
      state.completionByCollectionKey["pixel-animals::v2"].ownedUniqueCards,
    ).toBe(2);
    expect(state.ledgerHealth.openedPackCount).toBe(1);
  });
});
