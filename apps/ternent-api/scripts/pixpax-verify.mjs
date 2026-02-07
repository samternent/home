#!/usr/bin/env node
import {
  IssuerAuditLedger,
  createLedgerConfigFromEnv,
  createS3Gateway,
} from "../routes/stickerbook/issuer-audit-ledger.mjs";

function parseArgs(argv) {
  const args = { packId: "", segmentKey: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === "--packId" || arg === "--pack-id") && argv[i + 1]) {
      args.packId = String(argv[i + 1]);
      i += 1;
    }
    if ((arg === "--segmentKey" || arg === "--segment-key") && argv[i + 1]) {
      args.segmentKey = String(argv[i + 1]);
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.packId || !args.segmentKey) {
    console.error(
      "Usage: pnpm --filter ternent-api pixpax:verify -- --packId <id> --segmentKey <key>"
    );
    process.exit(1);
  }

  const config = createLedgerConfigFromEnv({
    currentIssuerKeyId: process.env.ISSUER_KEY_ID || "",
    currentIssuerPublicKeyPem: process.env.ISSUER_PUBLIC_KEY_PEM || "",
  });

  if (!config.ready) {
    console.error(
      "Missing LEDGER_* config. Required: LEDGER_S3_ENDPOINT, LEDGER_BUCKET, LEDGER_REGION, LEDGER_ACCESS_KEY_ID, LEDGER_SECRET_ACCESS_KEY"
    );
    process.exit(1);
  }

  const gateway = await createS3Gateway(config);
  const ledger = new IssuerAuditLedger({
    disabled: false,
    bucket: config.bucket,
    prefix: config.prefix,
    flushMaxEvents: config.flushMaxEvents,
    flushIntervalMs: config.flushIntervalMs,
    trustedIssuerPublicKeysJson: config.trustedIssuerPublicKeysJson,
    currentIssuerKeyId: config.currentIssuerKeyId,
    currentIssuerPublicKeyPem: config.currentIssuerPublicKeyPem,
    gateway,
  });

  await ledger.init();
  const result = await ledger.fetchReceiptProof(args.packId, args.segmentKey);
  await ledger.shutdown();

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(2);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        packId: result.packId,
        issuerKeyId: result.event?.entry?.payload?.issuerKeyId,
        segmentHash: result.segmentHash,
        segmentKey: result.segmentKey,
        chainDepthFromHead: result.chainDepthFromHead,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, reason: "internal-error", error: error?.message }, null, 2));
  process.exit(3);
});
