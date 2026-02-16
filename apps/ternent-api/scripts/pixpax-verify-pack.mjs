#!/usr/bin/env node
import { createCollectionContentStoreFromEnv } from "../routes/pixpax/collections/content-store.mjs";
import { verifyPack } from "../routes/pixpax/domain/verify-pack.mjs";

function parseArgs(argv) {
  const args = {
    packId: "",
    collectionId: "",
    version: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i] || "");
    if ((arg === "--packId" || arg === "--pack-id") && argv[i + 1]) {
      args.packId = String(argv[i + 1]).trim();
      i += 1;
      continue;
    }
    if ((arg === "--collectionId" || arg === "--collection-id") && argv[i + 1]) {
      args.collectionId = String(argv[i + 1]).trim();
      i += 1;
      continue;
    }
    if ((arg === "--version" || arg === "--collectionVersion" || arg === "--collection-version") && argv[i + 1]) {
      args.version = String(argv[i + 1]).trim();
      i += 1;
      continue;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.packId || !args.collectionId || !args.version) {
    console.error(
      "Usage: pnpm --filter ternent-api pixpax:verify-pack -- --packId <id> --collectionId <id> --version <version>"
    );
    process.exit(1);
  }

  const store = await createCollectionContentStoreFromEnv();
  const result = await verifyPack({
    store,
    packId: args.packId,
    collectionId: args.collectionId,
    version: args.version,
  });

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(2);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, reason: "internal-error", error: error?.message }, null, 2));
  process.exit(3);
});
