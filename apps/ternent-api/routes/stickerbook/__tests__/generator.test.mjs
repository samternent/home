import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { generatePack } from "../stickerbook-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const snapshotPath = join(__dirname, "__snapshots__", "generator.snap.json");

test("generatePack is deterministic for a fixed seed", () => {
  const kitJson = {
    candidates: [
      {
        archetypeId: "arch",
        bodyId: "body",
        eyesId: "eyes",
        identityId: "ident",
        accessoryId: "acc",
        frameId: "frame",
        fxId: "fx",
        paletteId: "p1",
      },
    ],
    rarityWeights: { common: 1 },
  };

  const entries = generatePack({
    packSeed: "seed-1",
    seriesId: "S1",
    themeId: "T1",
    count: 3,
    algoVersion: "1.0.0",
    kitJson,
  });

  const expected = JSON.parse(readFileSync(snapshotPath, "utf8"));
  assert.deepStrictEqual(entries, expected);
});
