#!/usr/bin/env node
import {
  closePlatformDbPool,
  dbQuery,
  getPlatformDbStatus,
} from "../services/platform-db/index.mjs";

function parseArgs(argv) {
  const args = {
    help: false,
    status: false,
    tables: false,
    pixpax: false,
    all: false,
    json: false,
    sql: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i] || "").trim();
    if (!arg) continue;

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--status") {
      args.status = true;
      continue;
    }
    if (arg === "--tables") {
      args.tables = true;
      continue;
    }
    if (arg === "--pixpax") {
      args.pixpax = true;
      continue;
    }
    if (arg === "--all") {
      args.all = true;
      continue;
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (arg === "--sql" && argv[i + 1]) {
      args.sql = String(argv[i + 1] || "");
      i += 1;
      continue;
    }
  }

  if (!args.help && !args.status && !args.tables && !args.pixpax && !args.all && !args.sql) {
    args.all = true;
  }

  if (args.all) {
    args.status = true;
    args.tables = true;
    args.pixpax = true;
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  pnpm --filter ternent-api db:check -- [options]

Options:
  --status         Show DB connection metadata and status.
  --tables         Show user tables + estimated rows/size.
  --pixpax         Show PixPax/auth table counts + recent identities/books.
  --sql "<query>"  Run ad-hoc SQL and print rows.
  --json           Print machine-readable JSON output.
  --all            Run status + tables + pixpax (default when no flags).
  -h, --help       Show this help.

Examples:
  pnpm --filter ternent-api db:check
  pnpm --filter ternent-api db:check -- --pixpax
  pnpm --filter ternent-api db:check -- --sql "SELECT now()"
`);
}

async function tableExists(qualifiedTableName) {
  const result = await dbQuery("SELECT to_regclass($1)::text AS reg", [qualifiedTableName]);
  return Boolean(result.rows?.[0]?.reg);
}

async function collectStatus() {
  const status = await getPlatformDbStatus();
  if (!status?.ok) {
    return {
      ok: false,
      reason: status?.reason || "Database is unavailable.",
    };
  }

  const meta = await dbQuery(
    `SELECT
      current_database() AS database,
      current_user AS db_user,
      inet_server_addr()::text AS server_addr,
      inet_server_port() AS server_port,
      version() AS postgres_version,
      NOW() AT TIME ZONE 'UTC' AS now_utc`
  );

  return {
    ok: true,
    configured: true,
    ...meta.rows?.[0],
  };
}

async function collectTables() {
  const query = await dbQuery(
    `SELECT
      schemaname,
      relname AS table_name,
      n_live_tup::bigint AS estimated_rows,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC, relname ASC`
  );
  return query.rows || [];
}

async function getCountIfTableExists(qualifiedName) {
  const exists = await tableExists(qualifiedName);
  if (!exists) return null;
  const result = await dbQuery(`SELECT COUNT(*)::bigint AS count FROM ${qualifiedName}`);
  const count = Number(result.rows?.[0]?.count || 0);
  return Number.isFinite(count) ? count : 0;
}

async function collectPixpaxSummary() {
  const tableNames = [
    "public.auth_users",
    "public.auth_sessions",
    "public.platform_workspaces",
    "public.platform_managed_users",
    "public.platform_books",
    "public.platform_book_snapshots",
  ];

  const counts = {};
  for (const tableName of tableNames) {
    counts[tableName] = await getCountIfTableExists(tableName);
  }

  let recentManagedUsers = [];
  if (counts["public.platform_managed_users"] !== null) {
    const users = await dbQuery(
      `SELECT
        id,
        workspace_id,
        profile_id,
        display_name,
        status,
        created_at,
        updated_at
      FROM platform_managed_users
      ORDER BY updated_at DESC
      LIMIT 20`
    );
    recentManagedUsers = users.rows || [];
  }

  let recentBooks = [];
  if (counts["public.platform_books"] !== null) {
    const books = await dbQuery(
      `SELECT
        id,
        workspace_id,
        managed_user_id,
        name,
        status,
        current_version,
        created_at,
        updated_at
      FROM platform_books
      ORDER BY updated_at DESC
      LIMIT 20`
    );
    recentBooks = books.rows || [];
  }

  return {
    counts,
    recentManagedUsers,
    recentBooks,
  };
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function printStatusHuman(status) {
  printSection("DB Status");
  if (!status.ok) {
    console.log(`Unavailable: ${status.reason || "Unknown error"}`);
    return;
  }

  console.log(`Database: ${status.database || ""}`);
  console.log(`User: ${status.db_user || ""}`);
  console.log(`Server: ${status.server_addr || "local"}:${status.server_port || ""}`);
  console.log(`UTC time: ${status.now_utc || ""}`);
  console.log(`Postgres: ${String(status.postgres_version || "").split("\n")[0] || ""}`);
}

function printTablesHuman(tables) {
  printSection("Tables");
  if (!tables.length) {
    console.log("No user tables found.");
    return;
  }

  for (const table of tables) {
    const schema = String(table.schemaname || "public");
    const name = String(table.table_name || "");
    const rows = Number(table.estimated_rows || 0);
    const size = String(table.total_size || "0 bytes");
    console.log(`${schema}.${name} | rows≈${rows} | size=${size}`);
  }
}

function printPixpaxHuman(summary) {
  printSection("PixPax/Auth Counts");
  for (const [tableName, count] of Object.entries(summary.counts || {})) {
    const value = count === null ? "missing" : count;
    console.log(`${tableName}: ${value}`);
  }

  printSection("Recent Managed Users");
  if (!summary.recentManagedUsers?.length) {
    console.log("None");
  } else {
    for (const user of summary.recentManagedUsers) {
      console.log(
        `${user.display_name || "(no-name)"} | profile=${user.profile_id || "-"} | id=${user.id} | status=${user.status}`
      );
    }
  }

  printSection("Recent Books");
  if (!summary.recentBooks?.length) {
    console.log("None");
  } else {
    for (const book of summary.recentBooks) {
      console.log(
        `${book.name || "(unnamed)"} | version=${book.current_version} | managedUser=${book.managed_user_id} | id=${book.id}`
      );
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    errors: [],
  };

  const dbStatus = await getPlatformDbStatus();
  if (!dbStatus?.ok) {
    payload.ok = false;
    payload.error = dbStatus?.reason || "Database is unavailable.";
    if (args.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      printSection("DB Check Failed");
      console.log(payload.error);
      console.log("Hint: ensure DATABASE_URL is set before running this command.");
    }
    process.exitCode = 1;
    return;
  }

  if (args.status) {
    try {
      payload.status = await collectStatus();
      if (!payload.status?.ok) {
        payload.ok = false;
        payload.errors.push({
          step: "status",
          error: payload.status?.reason || "Status check failed.",
        });
      }
    } catch (error) {
      payload.ok = false;
      payload.errors.push({
        step: "status",
        error: error?.message || String(error),
      });
    }
  }
  if (args.tables) {
    try {
      payload.tables = await collectTables();
    } catch (error) {
      payload.ok = false;
      payload.errors.push({
        step: "tables",
        error: error?.message || String(error),
      });
    }
  }
  if (args.pixpax) {
    try {
      payload.pixpax = await collectPixpaxSummary();
    } catch (error) {
      payload.ok = false;
      payload.errors.push({
        step: "pixpax",
        error: error?.message || String(error),
      });
    }
  }
  if (args.sql) {
    try {
      const sqlResult = await dbQuery(args.sql);
      payload.sql = {
        rowCount: sqlResult.rowCount || 0,
        rows: sqlResult.rows || [],
      };
    } catch (error) {
      payload.ok = false;
      payload.errors.push({
        step: "sql",
        error: error?.message || String(error),
      });
    }
  }

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    if (!payload.ok) process.exitCode = 1;
    return;
  }

  if (payload.status) printStatusHuman(payload.status);
  if (payload.tables) printTablesHuman(payload.tables);
  if (payload.pixpax) printPixpaxHuman(payload.pixpax);
  if (payload.sql) {
    printSection("SQL Result");
    console.log(`Rows: ${payload.sql.rowCount}`);
    console.log(JSON.stringify(payload.sql.rows, null, 2));
  }

  if (payload.errors?.length) {
    printSection("Errors");
    for (const item of payload.errors) {
      console.log(`${item.step}: ${item.error}`);
    }
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("[platform-db-check] failed:", error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePlatformDbPool().catch(() => {});
  });
