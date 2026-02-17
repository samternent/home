import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  dbQuery,
  dbTx,
  getPlatformDbPool,
  getPlatformDbStatus,
} from "../services/platform-db/index.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const migrationsDir = join(__dirname, "../data/migrations");

function hashSql(sql) {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

async function ensureMigrationsTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS platform_schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function readMigrations() {
  const files = await readdir(migrationsDir);
  return files
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

async function applyMigration(name) {
  const filepath = join(migrationsDir, name);
  const sql = await readFile(filepath, "utf8");
  const checksum = hashSql(sql);

  await dbTx(async (client) => {
    const existing = await client.query(
      "SELECT id, checksum FROM platform_schema_migrations WHERE id = $1",
      [name]
    );

    if (existing.rowCount > 0) {
      const current = String(existing.rows[0].checksum || "");
      if (current !== checksum) {
        throw new Error(
          `Migration checksum mismatch for ${name}. Expected ${current}, got ${checksum}.`
        );
      }
      return;
    }

    await client.query(sql);
    await client.query(
      "INSERT INTO platform_schema_migrations (id, checksum) VALUES ($1, $2)",
      [name, checksum]
    );

    console.log(`[platform-migrate] applied ${name}`);
  });
}

async function main() {
  const pool = await getPlatformDbPool();
  if (!pool) {
    const status = await getPlatformDbStatus();
    throw new Error(
      `Database pool is unavailable. ${status?.reason || "Ensure DATABASE_URL and pg dependency are configured."}`
    );
  }

  await ensureMigrationsTable();
  const migrations = await readMigrations();
  for (const migration of migrations) {
    await applyMigration(migration);
  }
  console.log(`[platform-migrate] complete (${migrations.length} migration files scanned)`);
}

main().catch((error) => {
  console.error("[platform-migrate] failed:", error);
  process.exitCode = 1;
});
