import test from "node:test";
import assert from "node:assert/strict";
import {
  isV2CollectionAvailable,
  isPixpaxV2CollectionFormat,
  normalizeCollectionFormat,
  parseV2AvailableCollections,
  resolveAvailableCollectionVersion,
} from "../availability.mjs";

test("parseV2AvailableCollections accepts collection ids and pinned versions", () => {
  const parsed = parseV2AvailableCollections(`
    prod-book@v2,
    legacy-book,
    prod-book@v2
  `);

  assert.deepEqual(parsed, [
    { collectionId: "prod-book", version: "v2" },
    { collectionId: "legacy-book", version: "" },
  ]);
});

test("isV2CollectionAvailable enforces allowlisted collections and versions", () => {
  const available = [
    { collectionId: "prod-book", version: "v2" },
    { collectionId: "free-play", version: "" },
  ];

  assert.equal(isV2CollectionAvailable(available, "prod-book", "v2"), true);
  assert.equal(isV2CollectionAvailable(available, "prod-book", "v1"), false);
  assert.equal(isV2CollectionAvailable(available, "free-play", "v7"), true);
  assert.equal(isV2CollectionAvailable(available, "legacy-book", "v1"), false);
});

test("isV2CollectionAvailable treats an empty allowlist as no public v2 books", () => {
  assert.equal(isV2CollectionAvailable([], "pixel-animals", "v2"), false);
  assert.equal(isV2CollectionAvailable([], "dragons", "v1"), false);
});

test("resolveAvailableCollectionVersion pins a single allowed version when no version is requested", () => {
  const available = [
    { collectionId: "prod-book", version: "v2" },
  ];

  assert.equal(resolveAvailableCollectionVersion(available, "prod-book", ""), "v2");
  assert.equal(resolveAvailableCollectionVersion(available, "prod-book", "v3"), "v3");
  assert.equal(resolveAvailableCollectionVersion(available, "free-play", ""), "");
});

test("normalizeCollectionFormat lowercases and trims explicit format markers", () => {
  assert.equal(normalizeCollectionFormat(" PIXPAX-V2 "), "pixpax-v2");
  assert.equal(normalizeCollectionFormat(""), "");
});

test("isPixpaxV2CollectionFormat only accepts explicit v2 format marker", () => {
  assert.equal(isPixpaxV2CollectionFormat("pixpax-v2"), true);
  assert.equal(isPixpaxV2CollectionFormat("v2"), false);
  assert.equal(isPixpaxV2CollectionFormat("pixel-sheet-v2"), false);
});
