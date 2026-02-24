import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import routes from "./routes/index.mjs";
import { requestContextMiddleware } from "./services/http/request-context.mjs";
import { errorMiddleware } from "./services/http/error-middleware.mjs";
import {
  createAuthRateLimit,
  createCommandRateLimit,
} from "./services/http/rate-limit.mjs";
import { getPlatformDbStatus } from "./services/platform-db/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseCsv(input) {
  return String(input || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function loadAppVersion() {
  try {
    const raw = readFileSync(join(__dirname, "./package.json"), "utf8");
    const pkg = JSON.parse(raw);
    return String(pkg?.version || "0.0.0");
  } catch {
    return "0.0.0";
  }
}

function hasVaultConfig() {
  const addr = String(process.env.VAULT_ADDR || "").trim();
  const transitMount = String(process.env.VAULT_TRANSIT_MOUNT || "").trim();
  const token = String(process.env.VAULT_TOKEN || "").trim();
  const role = String(process.env.VAULT_ROLE || "").trim();
  return Boolean(addr && transitMount && (token || role));
}

function hasSpacesConfig() {
  const endpoint = String(process.env.LEDGER_S3_ENDPOINT || "").trim();
  const bucket = String(
    process.env.PIXBOOK_LEDGER_BUCKET ||
      process.env.LEDGER_CONTENT_BUCKET ||
      process.env.LEDGER_BUCKET ||
      ""
  ).trim();
  const region = String(process.env.LEDGER_REGION || "").trim();
  const accessKeyId = String(process.env.LEDGER_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = String(process.env.LEDGER_SECRET_ACCESS_KEY || "").trim();
  return Boolean(endpoint && bucket && region && accessKeyId && secretAccessKey);
}

export function createApp() {
  const app = express();
  const appVersion = loadAppVersion();

  app.set("view engine", "ejs");
  app.set("port", "3000");

  const corsAllowOrigins = parseCsv(process.env.CORS_ALLOW_ORIGINS);
  const localhostOriginPattern =
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

  app.use(
    cors({
      credentials: true,
      exposedHeaders: ["X-Api-Version", "X-Request-Id"],
      origin(origin, callback) {
        if (!origin || localhostOriginPattern.test(origin)) {
          callback(null, true);
          return;
        }
        if (corsAllowOrigins.length === 0 || corsAllowOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin is not allowed by CORS policy: ${origin}`));
      },
    })
  );

  app.use(requestContextMiddleware);
  app.use("/v1/auth", createAuthRateLimit());

  const jsonBodyParser = bodyParser.json({
    limit: String(process.env.BODY_JSON_LIMIT || "1mb"),
  });

  app.use((req, res, next) => {
    if (req.path.startsWith("/v1/auth/")) {
      next();
      return;
    }
    jsonBodyParser(req, res, next);
  });

  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self';");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Strict-Transport-Security", "max-age=31536000 ; includeSubDomains");
    res.setHeader("x-api-version", appVersion);
    next();
  });

  app.get("/health/live", (_req, res) => {
    res.status(200).send({ ok: true, status: "live" });
  });

  app.get("/health/ready", async (_req, res) => {
    const db = await getPlatformDbStatus();
    const spaces = hasSpacesConfig();
    const vault = hasVaultConfig();
    if (!db.ok || !spaces || !vault) {
      res.status(503).send({
        ok: false,
        status: "not-ready",
        checks: {
          postgres: db.ok,
          spaces,
          vault,
        },
      });
      return;
    }
    res.status(200).send({
      ok: true,
      status: "ready",
      checks: {
        postgres: true,
        spaces: true,
        vault: true,
      },
    });
  });

  app.use("/v1/pixbooks", createCommandRateLimit());
  app.use(express.static(join(__dirname, "public")));
  app.use("/", routes);
  app.use(errorMiddleware);

  return { app, appVersion };
}
