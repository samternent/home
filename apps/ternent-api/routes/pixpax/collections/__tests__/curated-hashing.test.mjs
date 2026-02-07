import assert from "node:assert/strict";
import test from "node:test";
import {
  computeMerkleRootFromItemHashes,
  hashAlbumCard,
} from "../curated-hashing.mjs";

function sampleCard(overrides = {}) {
  return {
    collectionId: "premier-league-2026",
    collectionVersion: "v1",
    cardId: "arsenal-01",
    renderPayload: {
      gridSize: 16,
      gridB64: "AAECAwQF",
      ...overrides.renderPayload,
    },
    ...overrides,
  };
}

test("hashAlbumCard is stable for the same card", () => {
  const card = sampleCard();
  const a = hashAlbumCard(card);
  const b = hashAlbumCard(card);
  assert.equal(a, b);
});

test("hashAlbumCard excludes labels and descriptions", () => {
  const a = hashAlbumCard(
    sampleCard({
      label: "Player A",
      description: "Original text",
      seriesId: "arsenal",
    })
  );
  const b = hashAlbumCard(
    sampleCard({
      label: "Player Renamed",
      description: "Changed text",
      seriesId: "arsenal",
    })
  );
  assert.equal(a, b);
});

test("computeMerkleRootFromItemHashes is stable for same set and order", () => {
  const itemHashes = [
    hashAlbumCard(sampleCard({ cardId: "arsenal-01" })),
    hashAlbumCard(sampleCard({ cardId: "arsenal-02" })),
    hashAlbumCard(sampleCard({ cardId: "arsenal-03" })),
  ];

  const rootA = computeMerkleRootFromItemHashes(itemHashes);
  const rootB = computeMerkleRootFromItemHashes(itemHashes);
  assert.equal(rootA, rootB);
});
