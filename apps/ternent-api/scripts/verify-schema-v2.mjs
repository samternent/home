#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import {
  closePlatformDbPool,
  dbQuery,
  getPlatformDbStatus,
} from "../services/platform-db/index.mjs";

function parseArgs(argv) {
  const args = {
    json: false,
    report: "",
    sampleSize: 3,
    reconcile: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i] || "").trim();
    if (!arg) continue;
    if (arg === "--json") args.json = true;
    if (arg === "--reconcile") args.reconcile = true;
    if (arg === "--report" && argv[i + 1]) {
      args.report = String(argv[i + 1] || "").trim();
      i += 1;
    }
    if (arg === "--sample-size" && argv[i + 1]) {
      const parsed = Number.parseInt(String(argv[i + 1] || ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) args.sampleSize = parsed;
      i += 1;
    }
  }

  return args;
}

function defaultReportPath() {
  const stamp = new Date().toISOString().replace(/[\W:]+/g, "-");
  return `/tmp/accounts-v2-verify-report-${stamp}.json`;
}

async function scalar(query, values = []) {
  const result = await dbQuery(query, values);
  return Number(result.rows?.[0]?.count || 0);
}

async function rows(query, values = []) {
  const result = await dbQuery(query, values);
  return result.rows || [];
}

function pushCheck(report, check) {
  report.checks.push(check);
  if (!check.ok) {
    report.ok = false;
  }
}

async function checkCounts(report) {
  const pairs = [
    ["accounts", "platform_workspaces"],
    ["account_members", "platform_workspace_members"],
    ["identities", "platform_managed_users"],
    ["pixbooks", "platform_books"],
    ["pixbook_snapshots", "platform_book_snapshots"],
  ];

  for (const [nextTable, oldTable] of pairs) {
    const nextCount = await scalar(`SELECT COUNT(*)::bigint AS count FROM ${nextTable}`);
    const oldCount = await scalar(`SELECT COUNT(*)::bigint AS count FROM ${oldTable}`);
    pushCheck(report, {
      type: "count",
      table: nextTable,
      oldTable,
      oldCount,
      newCount: nextCount,
      ok: nextCount === oldCount,
    });
  }
}

async function checkIntegrity(report) {
  const checks = [
    {
      name: "account_member_account_fk",
      query: `SELECT COUNT(*)::bigint AS count
              FROM account_members m
              LEFT JOIN accounts a ON a.id = m.account_id
              WHERE a.id IS NULL`,
    },
    {
      name: "identity_account_fk",
      query: `SELECT COUNT(*)::bigint AS count
              FROM identities i
              LEFT JOIN accounts a ON a.id = i.account_id
              WHERE a.id IS NULL`,
    },
    {
      name: "pixbook_identity_fk",
      query: `SELECT COUNT(*)::bigint AS count
              FROM pixbooks p
              LEFT JOIN identities i ON i.id = p.identity_id
              WHERE i.id IS NULL`,
    },
    {
      name: "pixbook_account_match",
      query: `SELECT COUNT(*)::bigint AS count
              FROM pixbooks p
              INNER JOIN identities i ON i.id = p.identity_id
              WHERE p.account_id != i.account_id`,
    },
    {
      name: "snapshot_pixbook_fk",
      query: `SELECT COUNT(*)::bigint AS count
              FROM pixbook_snapshots s
              LEFT JOIN pixbooks p ON p.id = s.pixbook_id
              WHERE p.id IS NULL`,
    },
    {
      name: "identity_fingerprint_duplicates",
      query: `SELECT COUNT(*)::bigint AS count
              FROM (
                SELECT account_id, identity_key_fingerprint
                FROM identities
                WHERE identity_key_fingerprint IS NOT NULL
                  AND status != 'deleted'
                GROUP BY account_id, identity_key_fingerprint
                HAVING COUNT(*) > 1
              ) d`,
    },
    {
      name: "pixbook_active_duplicates",
      query: `SELECT COUNT(*)::bigint AS count
              FROM (
                SELECT identity_id, collection_id
                FROM pixbooks
                WHERE status != 'deleted'
                GROUP BY identity_id, collection_id
                HAVING COUNT(*) > 1
              ) d`,
    },
  ];

  for (const item of checks) {
    const count = await scalar(item.query);
    pushCheck(report, {
      type: "integrity",
      name: item.name,
      count,
      ok: count === 0,
    });
  }
}

async function checkSampleReads(report, sampleSize) {
  const sampleAccounts = await rows(
    `SELECT id, name
     FROM accounts
     ORDER BY created_at ASC
     LIMIT $1`,
    [sampleSize]
  );

  const sample = [];
  for (const account of sampleAccounts) {
    const identities = await rows(
      `SELECT id, display_name, profile_id, identity_key_fingerprint, status
       FROM identities
       WHERE account_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [account.id]
    );

    const identityIds = identities.map((row) => String(row.id || "")).filter(Boolean);
    const pixbooks = identityIds.length
      ? await rows(
          `SELECT id, identity_id, collection_id, status, current_version
           FROM pixbooks
           WHERE account_id = $1
             AND identity_id = ANY($2::text[])
           ORDER BY created_at ASC
           LIMIT 50`,
          [account.id, identityIds]
        )
      : [];

    sample.push({
      account,
      identities,
      pixbooks,
    });
  }

  const sampleIdentityMismatches = await rows(
    `SELECT
       old_i.id AS identity_id,
       old_i.workspace_id AS account_id,
       COALESCE(old_books.collections, ARRAY[]::text[]) AS old_collections,
       COALESCE(new_books.collections, ARRAY[]::text[]) AS new_collections
     FROM platform_managed_users old_i
     LEFT JOIN LATERAL (
       SELECT array_agg(DISTINCT collection_id ORDER BY collection_id) AS collections
       FROM platform_books
       WHERE managed_user_id = old_i.id
         AND status != 'deleted'
     ) old_books ON TRUE
     LEFT JOIN LATERAL (
       SELECT array_agg(DISTINCT collection_id ORDER BY collection_id) AS collections
       FROM pixbooks
       WHERE identity_id = old_i.id
         AND status != 'deleted'
     ) new_books ON TRUE
     WHERE COALESCE(old_books.collections, ARRAY[]::text[]) != COALESCE(new_books.collections, ARRAY[]::text[])
     ORDER BY old_i.created_at ASC
     LIMIT $1`,
    [sampleSize * 5]
  );

  pushCheck(report, {
    type: "sample",
    name: "account_identity_pixbook_samples",
    checkedAccounts: sample.length,
    ok: true,
    sample,
  });

  pushCheck(report, {
    type: "sample",
    name: "identity_expected_collections",
    mismatchCount: sampleIdentityMismatches.length,
    mismatches: sampleIdentityMismatches,
    ok: sampleIdentityMismatches.length === 0,
  });
}

async function checkReconcile(report) {
  const oldDeletedIdentities = await scalar(
    `SELECT COUNT(*)::bigint AS count FROM platform_managed_users WHERE status = 'deleted'`
  );
  const newDeletedIdentities = await scalar(
    `SELECT COUNT(*)::bigint AS count FROM identities WHERE status = 'deleted'`
  );
  const oldDeletedBooks = await scalar(
    `SELECT COUNT(*)::bigint AS count FROM platform_books WHERE status = 'deleted'`
  );
  const newDeletedBooks = await scalar(
    `SELECT COUNT(*)::bigint AS count FROM pixbooks WHERE status = 'deleted'`
  );

  const forcedDeletedForFingerprintUniqueness = await scalar(
    `SELECT COALESCE(SUM(g.duplicate_count - 1), 0)::bigint AS count
     FROM (
       SELECT workspace_id, identity_key_fingerprint, COUNT(*)::bigint AS duplicate_count
       FROM platform_managed_users
       WHERE identity_key_fingerprint IS NOT NULL
         AND status != 'deleted'
       GROUP BY workspace_id, identity_key_fingerprint
       HAVING COUNT(*) > 1
     ) g`
  );
  const expectedDeletedIdentities = oldDeletedIdentities + forcedDeletedForFingerprintUniqueness;

  pushCheck(report, {
    type: "reconcile",
    name: "deleted_identity_count",
    oldCount: oldDeletedIdentities,
    forcedDeletedForFingerprintUniqueness,
    expectedNewCount: expectedDeletedIdentities,
    newCount: newDeletedIdentities,
    ok: expectedDeletedIdentities === newDeletedIdentities,
  });

  pushCheck(report, {
    type: "reconcile",
    name: "deleted_pixbook_count",
    oldCount: oldDeletedBooks,
    newCount: newDeletedBooks,
    ok: oldDeletedBooks === newDeletedBooks,
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const status = await getPlatformDbStatus();
  if (!status?.ok) {
    throw new Error(status?.reason || "Database is unavailable.");
  }

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    checks: [],
  };

  await checkCounts(report);
  await checkIntegrity(report);
  await checkSampleReads(report, args.sampleSize);

  if (args.reconcile) {
    await checkReconcile(report);
  }

  const reportPath = args.report || defaultReportPath();
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`accounts-v2 verify ${report.ok ? "passed" : "failed"}`);
    for (const check of report.checks) {
      const label = check.name || `${check.type}:${check.table || ""}`;
      console.log(`${check.ok ? "PASS" : "FAIL"} ${label}`);
    }
    console.log(`report=${reportPath}`);
  }

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("[accounts-v2:verify] failed:", error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePlatformDbPool().catch(() => {});
  });
