#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import {
  closePlatformDbPool,
  dbQuery,
  getPlatformDbStatus,
} from "../services/platform-db/index.mjs";

const TARGET_TABLES = [
  "auth_users",
  "platform_workspaces",
  "platform_workspace_members",
  "platform_managed_users",
  "platform_books",
  "platform_book_snapshots",
  "platform_audit_events",
];

const OLD_TO_NEW_MAPPING = {
  platform_workspaces: "accounts",
  platform_workspace_members: "account_members",
  platform_managed_users: "identities",
  platform_books: "pixbooks",
  platform_book_snapshots: "pixbook_snapshots",
  platform_audit_events: "audit_events",
};

function parseArgs(argv) {
  const args = {
    json: false,
    out: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i] || "").trim();
    if (!arg) continue;
    if (arg === "--json") args.json = true;
    if (arg === "--out" && argv[i + 1]) {
      args.out = String(argv[i + 1] || "").trim();
      i += 1;
    }
  }

  return args;
}

async function tableSchema(tableName) {
  const result = await dbQuery(
    `SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position ASC`,
    [tableName]
  );

  return result.rows || [];
}

async function listPublicTables() {
  const result = await dbQuery(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
     ORDER BY table_name ASC`
  );
  return (result.rows || []).map((row) => String(row.table_name || "")).filter(Boolean);
}

async function listConstraints(tableName) {
  const result = await dbQuery(
    `SELECT
      tc.constraint_name,
      tc.constraint_type,
      string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = $1
    GROUP BY tc.constraint_name, tc.constraint_type
    ORDER BY tc.constraint_type, tc.constraint_name`,
    [tableName]
  );

  return result.rows || [];
}

function defaultOutputPath() {
  const stamp = new Date().toISOString().replace(/[\W:]+/g, "-");
  return `/tmp/accounts-v2-recon-${stamp}.json`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const status = await getPlatformDbStatus();
  if (!status?.ok) {
    throw new Error(status?.reason || "Database is unavailable.");
  }

  const publicTables = await listPublicTables();
  const betterAuthLikeTables = publicTables.filter(
    (name) =>
      name.startsWith("auth_") ||
      name === "user" ||
      name === "session" ||
      name === "account" ||
      name === "verification" ||
      name === "passkey"
  );

  const schemas = {};
  const constraints = {};
  for (const tableName of TARGET_TABLES) {
    schemas[tableName] = await tableSchema(tableName);
    constraints[tableName] = await listConstraints(tableName);
  }

  const authUserIdType =
    schemas.auth_users?.find((column) => column.column_name === "id")?.data_type || "unknown";

  const payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    authUserIdType,
    discoveredBetterAuthTables: betterAuthLikeTables,
    targetTables: TARGET_TABLES,
    schemas,
    constraints,
    mapping: OLD_TO_NEW_MAPPING,
  };

  const outPath = args.out || defaultOutputPath();
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  if (!args.json) {
    console.log("accounts-v2 recon complete");
    console.log(`auth_users.id type: ${authUserIdType}`);
    console.log(`better-auth style tables: ${betterAuthLikeTables.join(", ") || "(none)"}`);
    console.log(`report: ${outPath}`);
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

main()
  .catch((error) => {
    console.error("[accounts-v2:recon] failed:", error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePlatformDbPool().catch(() => {});
  });
