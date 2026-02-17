import { randomUUID } from "node:crypto";

let poolPromise = null;
let poolInitError = null;

function parsePoolConfig() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (!connectionString) {
    return {
      ready: false,
      reason: "DATABASE_URL is not configured.",
    };
  }

  const max = Number.parseInt(String(process.env.DATABASE_POOL_MAX || "10"), 10);
  const idleTimeoutMillis = Number.parseInt(
    String(process.env.DATABASE_IDLE_TIMEOUT_MS || "30000"),
    10
  );
  const connectionTimeoutMillis = Number.parseInt(
    String(process.env.DATABASE_CONNECT_TIMEOUT_MS || "5000"),
    10
  );

  return {
    ready: true,
    connectionString,
    max: Number.isFinite(max) && max > 0 ? max : 10,
    idleTimeoutMillis:
      Number.isFinite(idleTimeoutMillis) && idleTimeoutMillis >= 0 ? idleTimeoutMillis : 30000,
    connectionTimeoutMillis:
      Number.isFinite(connectionTimeoutMillis) && connectionTimeoutMillis >= 0
        ? connectionTimeoutMillis
        : 5000,
  };
}

export async function getPlatformDbPool() {
  if (poolPromise) return poolPromise;

  poolPromise = (async () => {
    const config = parsePoolConfig();
    if (!config.ready) return null;

    let pg;
    try {
      pg = await import("pg");
    } catch (error) {
      poolInitError = new Error(
        "pg dependency is missing. Install dependencies for ternent-api before enabling platform auth."
      );
      poolInitError.cause = error;
      return null;
    }

    const { Pool } = pg;
    const pool = new Pool({
      connectionString: config.connectionString,
      max: config.max,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      application_name: "ternent-api",
      ssl: String(process.env.DATABASE_SSL || "").trim().toLowerCase() === "true"
        ? { rejectUnauthorized: false }
        : undefined,
    });

    pool.on("error", (error) => {
      console.error("[platform-db] pool error:", error);
    });

    return pool;
  })();

  return poolPromise;
}

export async function getPlatformDbStatus() {
  const config = parsePoolConfig();
  if (!config.ready) {
    return {
      ok: false,
      configured: false,
      reason: config.reason,
    };
  }

  const pool = await getPlatformDbPool();
  if (!pool) {
    return {
      ok: false,
      configured: true,
      reason: poolInitError?.message || "Database pool is unavailable.",
    };
  }

  return {
    ok: true,
    configured: true,
    reason: "ready",
  };
}

export async function dbQuery(text, values = []) {
  const pool = await getPlatformDbPool();
  if (!pool) {
    const status = await getPlatformDbStatus();
    throw new Error(status.reason || "Database is unavailable.");
  }
  return pool.query(text, values);
}

export async function dbTx(fn) {
  const pool = await getPlatformDbPool();
  if (!pool) {
    const status = await getPlatformDbStatus();
    throw new Error(status.reason || "Database is unavailable.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("[platform-db] rollback failed:", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export function createId(prefix) {
  const id = randomUUID().replace(/-/g, "");
  const p = String(prefix || "id")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${p || "id"}_${id}`;
}

export async function closePlatformDbPool() {
  const pool = await getPlatformDbPool();
  if (!pool) return;
  await pool.end();
  poolPromise = null;
}
