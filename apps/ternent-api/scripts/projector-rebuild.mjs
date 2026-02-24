import { rebuildPixbookReceiptHeads } from "./pixbook-rebuild-utils.mjs";
import { closePlatformDbPool } from "../services/platform-db/index.mjs";

async function main() {
  const startedAt = Date.now();
  const rebuilt = await rebuildPixbookReceiptHeads({ persistOffset: true });
  const elapsedMs = Date.now() - startedAt;
  console.log(
    JSON.stringify(
      {
        ok: true,
        projector: "pixbook-rebuild",
        rebuiltStreams: rebuilt.length,
        elapsedMs,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[projector-rebuild] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePlatformDbPool();
  });
