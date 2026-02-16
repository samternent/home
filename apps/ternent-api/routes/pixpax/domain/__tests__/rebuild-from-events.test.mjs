import assert from "node:assert/strict";
import test from "node:test";
import { createPixpaxEvent, PIXPAX_EVENT_TYPES } from "../events.mjs";
import { rebuildCollectionSnapshotFromEvents } from "../rebuild-from-events.mjs";

test("rebuildCollectionSnapshotFromEvents reconstructs core PixPax state", () => {
  const occurredAt = "2026-02-16T12:00:00.000Z";
  const events = [
    createPixpaxEvent({
      type: PIXPAX_EVENT_TYPES.COLLECTION_CREATED,
      occurredAt,
      payload: {
        collectionId: "premier-league-2026",
        version: "v1",
        name: "Premier League 2026",
        gridSize: 16,
      },
    }),
    createPixpaxEvent({
      type: PIXPAX_EVENT_TYPES.SERIES_ADDED,
      occurredAt: "2026-02-16T12:00:01.000Z",
      payload: {
        collectionId: "premier-league-2026",
        version: "v1",
        seriesIds: ["arsenal", "chelsea"],
      },
    }),
    createPixpaxEvent({
      type: PIXPAX_EVENT_TYPES.CARD_ADDED,
      occurredAt: "2026-02-16T12:00:02.000Z",
      payload: {
        collectionId: "premier-league-2026",
        version: "v1",
        cardId: "arsenal-01",
        seriesId: "arsenal",
      },
    }),
    createPixpaxEvent({
      type: PIXPAX_EVENT_TYPES.PACK_ISSUED,
      occurredAt: "2026-02-16T12:00:03.000Z",
      payload: {
        packId: "pack_001",
        collectionId: "premier-league-2026",
        collectionVersion: "v1",
        dropId: "week-2026-W07",
        packRoot: "root_001",
      },
    }),
    createPixpaxEvent({
      type: PIXPAX_EVENT_TYPES.PACK_CLAIMED,
      occurredAt: "2026-02-16T12:00:04.000Z",
      payload: {
        packId: "pack_001",
        collectionId: "premier-league-2026",
        collectionVersion: "v1",
        dropId: "week-2026-W07",
        issuedTo: "userhash_001",
      },
    }),
  ];

  const snapshot = rebuildCollectionSnapshotFromEvents(events);
  assert.equal(snapshot.collection?.collectionId, "premier-league-2026");
  assert.equal(snapshot.collection?.version, "v1");
  assert.deepEqual(snapshot.seriesIds, ["arsenal", "chelsea"]);
  assert.deepEqual(snapshot.cardIds, ["arsenal-01"]);
  assert.equal(snapshot.packsById.pack_001.packRoot, "root_001");
  assert.deepEqual(snapshot.claimedPackIds, ["pack_001"]);
});
