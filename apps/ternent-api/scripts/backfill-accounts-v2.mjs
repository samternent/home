#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import {
  closePlatformDbPool,
  dbQuery,
  dbTx,
  getPlatformDbStatus,
} from "../services/platform-db/index.mjs";

function parseArgs(argv) {
  const args = {
    json: false,
    report: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i] || "").trim();
    if (!arg) continue;
    if (arg === "--json") args.json = true;
    if (arg === "--report" && argv[i + 1]) {
      args.report = String(argv[i + 1] || "").trim();
      i += 1;
    }
  }

  return args;
}

function defaultReportPath() {
  const stamp = new Date().toISOString().replace(/[\W:]+/g, "-");
  return `/tmp/accounts-v2-backfill-report-${stamp}.json`;
}

async function tableCount(tableName) {
  const result = await dbQuery(`SELECT COUNT(*)::bigint AS count FROM ${tableName}`);
  return Number(result.rows?.[0]?.count || 0);
}

function appendStage(report, name, details) {
  report.stages.push({
    stage: name,
    ...details,
  });
}

function appendError(report, stage, error, rows = []) {
  report.errors.push({
    stage,
    error,
    rows,
  });
}

function appendWarning(report, stage, warning, rows = []) {
  report.warnings.push({
    stage,
    warning,
    rows,
  });
}

async function collectRows(query, values = []) {
  const result = await dbQuery(query, values);
  return result.rows || [];
}

async function backfillAccounts(report) {
  const oldCount = await tableCount("platform_workspaces");
  const beforeCount = await tableCount("accounts");

  const inserted = await dbTx(async (client) => {
    const result = await client.query(
      `INSERT INTO accounts (id, name, status, created_at, updated_at)
       SELECT id, name, 'active', created_at, updated_at
       FROM platform_workspaces
       ON CONFLICT (id)
       DO UPDATE SET
         name = EXCLUDED.name,
         updated_at = GREATEST(accounts.updated_at, EXCLUDED.updated_at)`
    );
    return result.rowCount || 0;
  });

  const afterCount = await tableCount("accounts");
  appendStage(report, "accounts", { oldCount, beforeCount, afterCount, affectedRows: inserted });
}

async function backfillAccountMembers(report) {
  const oldCount = await tableCount("platform_workspace_members");
  const beforeCount = await tableCount("account_members");

  const orphans = await collectRows(
    `SELECT m.id, m.workspace_id, m.user_id
     FROM platform_workspace_members m
     LEFT JOIN platform_workspaces w ON w.id = m.workspace_id
     LEFT JOIN auth_users u ON u.id = m.user_id
     WHERE w.id IS NULL OR u.id IS NULL
     ORDER BY m.created_at ASC
     LIMIT 100`
  );
  if (orphans.length > 0) {
    appendError(report, "account_members", "source rows missing required workspace/user", orphans);
  }

  const inserted = await dbTx(async (client) => {
    const result = await client.query(
      `INSERT INTO account_members
         (id, account_id, user_id, role, status, created_at, updated_at)
       SELECT m.id, m.workspace_id, m.user_id, m.role, m.status, m.created_at, m.updated_at
       FROM platform_workspace_members m
       INNER JOIN accounts a ON a.id = m.workspace_id
       INNER JOIN auth_users u ON u.id = m.user_id
       ON CONFLICT (id)
       DO UPDATE SET
         account_id = EXCLUDED.account_id,
         user_id = EXCLUDED.user_id,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         updated_at = GREATEST(account_members.updated_at, EXCLUDED.updated_at)`
    );
    return result.rowCount || 0;
  });

  const afterCount = await tableCount("account_members");
  appendStage(report, "account_members", {
    oldCount,
    beforeCount,
    afterCount,
    affectedRows: inserted,
    orphanRows: orphans.length,
  });
}

async function backfillIdentities(report) {
  const oldCount = await tableCount("platform_managed_users");
  const beforeCount = await tableCount("identities");

  const orphans = await collectRows(
    `SELECT u.id, u.workspace_id
     FROM platform_managed_users u
     LEFT JOIN accounts a ON a.id = u.workspace_id
     WHERE a.id IS NULL
     ORDER BY u.created_at ASC
     LIMIT 100`
  );
  if (orphans.length > 0) {
    appendError(report, "identities", "source rows missing required account", orphans);
  }

  const duplicateFingerprints = await collectRows(
    `SELECT
       workspace_id AS account_id,
       identity_key_fingerprint,
       COUNT(*)::int AS duplicate_count,
       array_agg(id ORDER BY created_at ASC, id ASC) AS identity_ids
     FROM platform_managed_users
     WHERE identity_key_fingerprint IS NOT NULL
       AND status != 'deleted'
     GROUP BY workspace_id, identity_key_fingerprint
     HAVING COUNT(*) > 1
     ORDER BY duplicate_count DESC, workspace_id ASC
     LIMIT 100`
  );
  if (duplicateFingerprints.length > 0) {
    appendWarning(
      report,
      "identities",
      "duplicate active identity_key_fingerprint rows were downgraded to deleted for v2 uniqueness",
      duplicateFingerprints
    );
  }

  const inserted = await dbTx(async (client) => {
    const result = await client.query(
      `WITH ranked_source AS (
         SELECT
           u.*,
           CASE
             WHEN u.identity_key_fingerprint IS NOT NULL AND u.status != 'deleted'
               THEN row_number() OVER (
                 PARTITION BY u.workspace_id, u.identity_key_fingerprint
                 ORDER BY u.created_at ASC, u.id ASC
               )
             ELSE 1
           END AS fingerprint_rank
         FROM platform_managed_users u
         INNER JOIN accounts a ON a.id = u.workspace_id
       )
       INSERT INTO identities
         (
           id,
           account_id,
           display_name,
           avatar_public_id,
           user_key,
           profile_id,
           identity_public_key,
           identity_key_fingerprint,
           status,
           created_at,
           updated_at
         )
       SELECT
         u.id,
         u.workspace_id,
         u.display_name,
         u.avatar_public_id,
         u.user_key,
         u.profile_id,
         u.identity_public_key,
         u.identity_key_fingerprint,
         CASE
           WHEN u.fingerprint_rank > 1 THEN 'deleted'
           ELSE u.status
         END,
         u.created_at,
         u.updated_at
       FROM ranked_source u
       ON CONFLICT (id)
       DO UPDATE SET
         account_id = EXCLUDED.account_id,
         display_name = EXCLUDED.display_name,
         avatar_public_id = EXCLUDED.avatar_public_id,
         user_key = EXCLUDED.user_key,
         profile_id = EXCLUDED.profile_id,
         identity_public_key = EXCLUDED.identity_public_key,
         identity_key_fingerprint = EXCLUDED.identity_key_fingerprint,
         status = EXCLUDED.status,
         updated_at = GREATEST(identities.updated_at, EXCLUDED.updated_at)`
    );
    return result.rowCount || 0;
  });

  const afterCount = await tableCount("identities");
  appendStage(report, "identities", {
    oldCount,
    beforeCount,
    afterCount,
    affectedRows: inserted,
    orphanRows: orphans.length,
    duplicateFingerprintGroups: duplicateFingerprints.length,
  });
}

async function backfillPixbooks(report) {
  const oldCount = await tableCount("platform_books");
  const beforeCount = await tableCount("pixbooks");

  const identityOrphans = await collectRows(
    `SELECT b.id, b.workspace_id, b.managed_user_id
     FROM platform_books b
     LEFT JOIN identities i ON i.id = b.managed_user_id
     WHERE i.id IS NULL
     ORDER BY b.created_at ASC
     LIMIT 100`
  );
  if (identityOrphans.length > 0) {
    appendError(report, "pixbooks", "source rows missing required identity", identityOrphans);
  }

  const accountMismatches = await collectRows(
    `SELECT b.id, b.workspace_id, b.managed_user_id, i.account_id
     FROM platform_books b
     INNER JOIN identities i ON i.id = b.managed_user_id
     WHERE i.account_id != b.workspace_id
     ORDER BY b.created_at ASC
     LIMIT 100`
  );
  if (accountMismatches.length > 0) {
    appendError(report, "pixbooks", "identity account does not match pixbook account", accountMismatches);
  }

  const inserted = await dbTx(async (client) => {
    const result = await client.query(
      `INSERT INTO pixbooks
         (
           id,
           account_id,
           identity_id,
           collection_id,
           name,
           status,
           current_version,
           created_at,
           updated_at
         )
       SELECT
         b.id,
         b.workspace_id,
         b.managed_user_id,
         COALESCE(NULLIF(BTRIM(b.collection_id), ''), 'primary'),
         b.name,
         b.status,
         b.current_version,
         b.created_at,
         b.updated_at
       FROM platform_books b
       INNER JOIN identities i
         ON i.id = b.managed_user_id
         AND i.account_id = b.workspace_id
       ON CONFLICT (id)
       DO UPDATE SET
         account_id = EXCLUDED.account_id,
         identity_id = EXCLUDED.identity_id,
         collection_id = EXCLUDED.collection_id,
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         current_version = EXCLUDED.current_version,
         updated_at = GREATEST(pixbooks.updated_at, EXCLUDED.updated_at)`
    );
    return result.rowCount || 0;
  });

  const afterCount = await tableCount("pixbooks");
  appendStage(report, "pixbooks", {
    oldCount,
    beforeCount,
    afterCount,
    affectedRows: inserted,
    missingIdentityRows: identityOrphans.length,
    accountMismatchRows: accountMismatches.length,
  });
}

async function backfillSnapshots(report) {
  const oldCount = await tableCount("platform_book_snapshots");
  const beforeCount = await tableCount("pixbook_snapshots");

  const orphans = await collectRows(
    `SELECT s.id, s.book_id
     FROM platform_book_snapshots s
     LEFT JOIN pixbooks p ON p.id = s.book_id
     WHERE p.id IS NULL
     ORDER BY s.created_at ASC
     LIMIT 100`
  );
  if (orphans.length > 0) {
    appendError(report, "pixbook_snapshots", "source rows missing required pixbook", orphans);
  }

  const inserted = await dbTx(async (client) => {
    const result = await client.query(
      `INSERT INTO pixbook_snapshots
         (
           id,
           pixbook_id,
           version,
           cipher_object_key,
           cipher_sha256,
           wrapped_dek,
           ledger_head,
           payload_json,
           created_at
         )
       SELECT
         s.id,
         s.book_id,
         s.version,
         s.cipher_object_key,
         s.cipher_sha256,
         s.wrapped_dek,
         s.ledger_head,
         s.payload_json,
         s.created_at
       FROM platform_book_snapshots s
       INNER JOIN pixbooks p ON p.id = s.book_id
       ON CONFLICT (id)
       DO UPDATE SET
         pixbook_id = EXCLUDED.pixbook_id,
         version = EXCLUDED.version,
         cipher_object_key = EXCLUDED.cipher_object_key,
         cipher_sha256 = EXCLUDED.cipher_sha256,
         wrapped_dek = EXCLUDED.wrapped_dek,
         ledger_head = EXCLUDED.ledger_head,
         payload_json = EXCLUDED.payload_json,
         created_at = LEAST(pixbook_snapshots.created_at, EXCLUDED.created_at)`
    );
    return result.rowCount || 0;
  });

  const afterCount = await tableCount("pixbook_snapshots");
  appendStage(report, "pixbook_snapshots", {
    oldCount,
    beforeCount,
    afterCount,
    affectedRows: inserted,
    orphanRows: orphans.length,
  });
}

async function backfillAuditEvents(report) {
  const oldCount = await tableCount("platform_audit_events");
  const beforeCount = await tableCount("audit_events");

  const inserted = await dbTx(async (client) => {
    const result = await client.query(
      `INSERT INTO audit_events
         (id, account_id, actor_user_id, event_type, payload, created_at)
       SELECT
         e.id,
         e.workspace_id,
         e.actor_user_id,
         e.event_type,
         e.payload,
         e.created_at
       FROM platform_audit_events e
       ON CONFLICT (id)
       DO UPDATE SET
         account_id = EXCLUDED.account_id,
         actor_user_id = EXCLUDED.actor_user_id,
         event_type = EXCLUDED.event_type,
         payload = EXCLUDED.payload,
         created_at = LEAST(audit_events.created_at, EXCLUDED.created_at)`
    );
    return result.rowCount || 0;
  });

  const afterCount = await tableCount("audit_events");
  appendStage(report, "audit_events", {
    oldCount,
    beforeCount,
    afterCount,
    affectedRows: inserted,
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
    stages: [],
    errors: [],
    warnings: [],
  };

  try {
    await backfillAccounts(report);
    await backfillAccountMembers(report);
    await backfillIdentities(report);
    await backfillPixbooks(report);
    await backfillSnapshots(report);
    await backfillAuditEvents(report);
  } catch (error) {
    report.ok = false;
    appendError(report, "runtime", error?.message || String(error));
    throw error;
  } finally {
    report.ok = report.errors.length === 0;
  }

  const reportPath = args.report || defaultReportPath();
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`accounts-v2 backfill ${report.ok ? "passed" : "completed with issues"}`);
    for (const stage of report.stages) {
      console.log(
        `${stage.stage}: old=${stage.oldCount} before=${stage.beforeCount} after=${stage.afterCount} affected=${stage.affectedRows}`
      );
    }
    console.log(`errors=${report.errors.length}`);
    console.log(`warnings=${report.warnings.length}`);
    console.log(`report=${reportPath}`);
  }

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("[accounts-v2:backfill] failed:", error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePlatformDbPool().catch(() => {});
  });
