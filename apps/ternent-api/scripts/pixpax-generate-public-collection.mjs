import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const options = {
    outDir: "docs/pixpax-public-collections/premier-league-2026/v2",
    collectionId: "premier-league-2026",
    version: "v2",
    seriesCount: 5,
    cardsPerSeries: 10,
    gridSize: 16,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (!flag.startsWith("--")) throw new Error(`Unknown positional argument '${flag}'.`);
    const key = flag.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    i += 1;
    switch (key) {
      case "outDir":
        options.outDir = value;
        break;
      case "collectionId":
        options.collectionId = value;
        break;
      case "version":
        options.version = value;
        break;
      case "seriesCount":
        options.seriesCount = Number(value);
        break;
      case "cardsPerSeries":
        options.cardsPerSeries = Number(value);
        break;
      case "gridSize":
        options.gridSize = Number(value);
        break;
      default:
        throw new Error(`Unknown flag --${key}`);
    }
  }

  if (!Number.isInteger(options.seriesCount) || options.seriesCount < 1) {
    throw new Error("--seriesCount must be a positive integer.");
  }
  if (!Number.isInteger(options.cardsPerSeries) || options.cardsPerSeries < 1) {
    throw new Error("--cardsPerSeries must be a positive integer.");
  }
  if (!Number.isInteger(options.gridSize) || options.gridSize !== 16) {
    throw new Error("--gridSize must be 16 (idx4 protocol). ");
  }

  return options;
}

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function packIndicesToIdx4Base64(indices) {
  if (!(indices instanceof Uint8Array) || indices.length !== 256) {
    throw new Error("Expected 256 indices for 16x16 idx4 art.");
  }
  const packed = new Uint8Array(128);
  for (let i = 0; i < 256; i += 2) {
    const p0 = indices[i] & 0x0f;
    const p1 = indices[i + 1] & 0x0f;
    packed[i / 2] = (p0 << 4) | p1;
  }
  return bytesToBase64(packed);
}

function createSeriesName(index) {
  return ["Arsenal", "Chelsea", "Liverpool", "Man City", "Spurs"][index] || `Series ${index + 1}`;
}

function drawPattern(seriesIndex, slotIndex) {
  const out = new Uint8Array(256);
  const base = ((seriesIndex * 3 + slotIndex) % 14) + 1;
  const accent = ((base + 4) % 15) + 1;

  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const idx = y * 16 + x;
      if (x < 2 || x > 13 || y < 2 || y > 13) {
        out[idx] = 0;
        continue;
      }

      const checker = (x + y + seriesIndex) % 2 === 0;
      const stripe = (x + slotIndex) % 4 === 0;
      if (checker) out[idx] = base;
      if (stripe) out[idx] = accent;
    }
  }

  out[(6 + (seriesIndex % 3)) + 16 * 7] = 1;
  out[(9 - (seriesIndex % 3)) + 16 * 7] = 1;
  for (let x = 6; x <= 9; x += 1) out[x + 16 * 10] = accent;

  return out;
}

async function writeJson(path, payload) {
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outDir = resolve(options.outDir);
  const cardsDir = join(outDir, "cards");
  await mkdir(cardsDir, { recursive: true });

  const series = [];
  const cards = [];
  const cardMap = {};

  for (let seriesIndex = 0; seriesIndex < options.seriesCount; seriesIndex += 1) {
    const seriesId = createSeriesName(seriesIndex).toLowerCase().replace(/\s+/g, "-");
    const seriesName = createSeriesName(seriesIndex);
    series.push({ seriesId, name: seriesName });

    for (let slotIndex = 0; slotIndex < options.cardsPerSeries; slotIndex += 1) {
      const cardId = `${seriesId}-${String(slotIndex + 1).padStart(2, "0")}`;
      const label = `${seriesName} Player ${String(slotIndex + 1).padStart(2, "0")}`;
      const indices = drawPattern(seriesIndex, slotIndex);
      const gridB64 = packIndicesToIdx4Base64(indices);

      cards.push(cardId);
      cardMap[cardId] = {
        seriesId,
        slotIndex,
        role: "player",
      };

      const card = {
        cardId,
        seriesId,
        slotIndex,
        role: "player",
        label,
        renderPayload: {
          gridSize: options.gridSize,
          gridB64,
        },
      };

      await writeJson(join(cardsDir, `${cardId}.json`), card);
    }
  }

  const collection = {
    collectionId: options.collectionId,
    version: options.version,
    name: "Premier League 2026",
    description: "Public demo collection with 5 series and 50 cards.",
    gridSize: options.gridSize,
    createdAt: new Date().toISOString(),
    palette: {
      id: "premier-league-2026-default",
      colors: [
        0x00000000,
        0xff111111,
        0xffffffff,
        0xffef4444,
        0xff22c55e,
        0xff3b82f6,
        0xfff59e0b,
        0xffa855f7,
        0xff06b6d4,
        0xfff97316,
        0xff84cc16,
        0xffec4899,
        0xff8b5cf6,
        0xfff5d0fe,
        0xffbae6fd,
        0xfffde68a,
      ],
    },
  };

  const index = {
    collectionId: options.collectionId,
    version: options.version,
    series,
    cards,
    cardMap,
  };

  await writeJson(join(outDir, "collection.json"), collection);
  await writeJson(join(outDir, "index.json"), index);

  console.log(
    `[pixpax:generate] wrote ${cards.length} cards across ${series.length} series to ${outDir}`
  );
}

main().catch((error) => {
  console.error(`[pixpax:generate] failed: ${error?.message || error}`);
  process.exit(1);
});
