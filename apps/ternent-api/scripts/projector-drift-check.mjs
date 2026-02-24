import { computeHeadDrift } from "./pixbook-rebuild-utils.mjs";
import { closePlatformDbPool } from "../services/platform-db/index.mjs";

async function main() {
  const result = await computeHeadDrift();
  if (result.mismatches.length > 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          reason: "pixbook-head-drift-detected",
          rebuiltStreams: result.rebuiltStreams,
          mismatchCount: result.mismatches.length,
          mismatches: result.mismatches,
        },
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        rebuiltStreams: result.rebuiltStreams,
        mismatchCount: 0,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[projector-drift-check] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePlatformDbPool();
  });
