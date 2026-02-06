import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  computeMerkleRoot,
  createNonceHex,
  deriveKitFromCatalogue,
  derivePackSeed,
  generatePack,
  hashCanonical,
} from "../../apps/ternent-api/routes/stickerbook/stickerbook-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const SERIES_ID = process.env.SERIES_ID;
if (!SERIES_ID) {
  throw new Error("SERIES_ID is required.");
}

const COUNT = Number(process.env.COUNT || 5);
const CLIENT_NONCE = process.env.CLIENT_NONCE || createNonceHex(16);
const SERVER_SECRET = process.env.SERVER_SECRET || createNonceHex(48);
const PACK_REQUEST_ID =
  process.env.PACK_REQUEST_ID ||
  hashCanonical({
    seriesId: SERIES_ID,
    count: COUNT,
    clientNonceHash: hashCanonical(CLIENT_NONCE),
  });

const OUTPUT_DIR =
  process.env.OUTPUT_DIR ||
  join(ROOT, "apps/ternent-api/persisted/stickerbook/packs");
const OUTPUT_PATH =
  process.env.OUTPUT_PATH ||
  join(OUTPUT_DIR, `pack-${SERIES_ID}-${PACK_REQUEST_ID}.json`);

const cataloguePath = join(
  ROOT,
  "apps/ternent-api/persisted/stickerbook/series",
  `series-${SERIES_ID}.catalogue.json`
);

const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const kitJson = deriveKitFromCatalogue(catalogue);

const themeId = catalogue?.themeId || "stickerbook";
const clientNonceHash = hashCanonical(CLIENT_NONCE);
const serverCommit = hashCanonical(SERVER_SECRET);

const packSeed = derivePackSeed({
  serverSecret: SERVER_SECRET,
  clientNonce: CLIENT_NONCE,
  packRequestId: PACK_REQUEST_ID,
  seriesId: SERIES_ID,
  themeId,
});

const entries = generatePack({
  packSeed,
  seriesId: SERIES_ID,
  themeId,
  count: COUNT,
  algoVersion: "1.0.0",
  kitJson,
});

const packRoot = await computeMerkleRoot(entries);

const payload = {
  generatedAt: new Date().toISOString(),
  packRequestId: PACK_REQUEST_ID,
  seriesId: SERIES_ID,
  themeId,
  count: COUNT,
  clientNonce: CLIENT_NONCE,
  clientNonceHash,
  serverSecret: SERVER_SECRET,
  serverCommit,
  packSeed,
  packRoot,
  algoVersion: "1.0.0",
  kitHash: hashCanonical(kitJson),
  themeHash: hashCanonical({
    themeId,
    themeVersion: catalogue?.themeVersion ?? catalogue?.version ?? "1.0.0",
  }),
  entries,
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));

console.log(`Wrote pack to ${OUTPUT_PATH}`);
