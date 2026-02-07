import { readdir, readFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

function parseArgs(argv) {
  const options = {
    api: "http://localhost:3000",
    token: process.env.PIX_PAX_ADMIN_TOKEN || "",
    collectionId: "",
    version: "",
    dir: "",
    dryRun: false,
    skipExisting: false,
    concurrency: 4,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--") {
      continue;
    }

    if (current === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (current === "--skip-existing") {
      options.skipExisting = true;
      continue;
    }

    if (!current.startsWith("--")) {
      throw new Error(`Unknown positional argument '${current}'.`);
    }

    const name = current.slice(2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for --${name}`);
    }
    index += 1;

    switch (name) {
      case "api":
        options.api = value;
        break;
      case "token":
        options.token = value;
        break;
      case "collectionId":
        options.collectionId = value;
        break;
      case "version":
        options.version = value;
        break;
      case "dir":
        options.dir = value;
        break;
      case "concurrency": {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 32) {
          throw new Error("--concurrency must be an integer between 1 and 32.");
        }
        options.concurrency = parsed;
        break;
      }
      default:
        throw new Error(`Unknown flag --${name}`);
    }
  }

  if (!options.collectionId) throw new Error("--collectionId is required.");
  if (!options.version) throw new Error("--version is required.");
  if (!options.dir) throw new Error("--dir is required.");
  if (!options.dryRun && !options.token) {
    throw new Error("--token is required (or set PIX_PAX_ADMIN_TOKEN).");
  }

  return options;
}

async function readJson(filepath) {
  const raw = await readFile(filepath, "utf8");
  return JSON.parse(raw);
}

async function discoverCards(cardsDir) {
  const entries = await readdir(cardsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".json")
    .map((entry) => join(cardsDir, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function toEndpoint(baseUrl, path) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function warnMismatch(message) {
  console.warn(`[pixpax:seed] warning: ${message}`);
}

async function putJson({ url, token, body }) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsed,
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const output = new Array(items.length);
  const pending = new Set();

  for (let index = 0; index < items.length; index += 1) {
    const run = Promise.resolve()
      .then(() => mapper(items[index], index))
      .then((value) => {
        output[index] = value;
      })
      .finally(() => {
        pending.delete(run);
      });
    pending.add(run);
    if (pending.size >= concurrency) {
      await Promise.race(pending);
    }
  }

  await Promise.all(pending);
  return output;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const root = resolve(options.dir);
  const collectionPath = join(root, "collection.json");
  const indexPath = join(root, "index.json");
  const cardsDir = join(root, "cards");

  const collectionJson = await readJson(collectionPath);
  const indexJson = await readJson(indexPath);
  const cardPaths = await discoverCards(cardsDir);

  if (!cardPaths.length) {
    throw new Error(`No card JSON files found under ${cardsDir}`);
  }

  if (
    collectionJson?.collectionId &&
    String(collectionJson.collectionId) !== String(options.collectionId)
  ) {
    warnMismatch(
      `collection.json collectionId '${collectionJson.collectionId}' differs from --collectionId '${options.collectionId}'.`
    );
  }
  if (
    collectionJson?.version &&
    String(collectionJson.version) !== String(options.version)
  ) {
    warnMismatch(
      `collection.json version '${collectionJson.version}' differs from --version '${options.version}'.`
    );
  }

  const summary = {
    uploaded: 0,
    skipped: 0,
    failed: 0,
  };

  async function uploadOne(kind, url, body) {
    if (options.dryRun) {
      console.log(`[dry-run] PUT ${url}`);
      summary.uploaded += 1;
      return;
    }

    const result = await putJson({
      url,
      token: options.token,
      body,
    });

    if (result.ok) {
      summary.uploaded += 1;
      return;
    }

    if (result.status === 409 && options.skipExisting) {
      summary.skipped += 1;
      console.log(`[skip-existing] ${kind} already exists: ${url}`);
      return;
    }

    summary.failed += 1;
    throw new Error(
      `${kind} upload failed (${result.status}) ${url}\n${JSON.stringify(result.body)}`
    );
  }

  const collectionUrl = toEndpoint(
    options.api,
    `/v1/pixpax/collections/${encodeURIComponent(
      options.collectionId
    )}/${encodeURIComponent(options.version)}/collection`
  );
  const indexUrl = toEndpoint(
    options.api,
    `/v1/pixpax/collections/${encodeURIComponent(
      options.collectionId
    )}/${encodeURIComponent(options.version)}/index`
  );

  await uploadOne("collection", collectionUrl, collectionJson);
  await uploadOne("index", indexUrl, indexJson);

  await mapWithConcurrency(cardPaths, options.concurrency, async (cardPath) => {
    const cardJson = await readJson(cardPath);
    const fileCardId = basename(cardPath, ".json");
    const payloadCardId = String(cardJson?.cardId || "").trim();
    const cardId = payloadCardId || fileCardId;

    if (payloadCardId && payloadCardId !== fileCardId) {
      warnMismatch(
        `card id mismatch for ${cardPath}: filename '${fileCardId}' vs payload '${payloadCardId}'. Using payload id.`
      );
    }

    const cardUrl = toEndpoint(
      options.api,
      `/v1/pixpax/collections/${encodeURIComponent(
        options.collectionId
      )}/${encodeURIComponent(options.version)}/cards/${encodeURIComponent(cardId)}`
    );
    await uploadOne("card", cardUrl, cardJson);
  });

  console.log(
    `[pixpax:seed] complete uploaded=${summary.uploaded} skipped=${summary.skipped} failed=${summary.failed}`
  );
}

main().catch((error) => {
  console.error(`[pixpax:seed] failed: ${error?.message || error}`);
  process.exit(1);
});
