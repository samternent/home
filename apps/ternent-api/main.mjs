import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import routes from "./routes/index.mjs";
import { createWebSocketServer } from "./services/sockets/index.mjs";
import { shutdownStickerbookLedger } from "./routes/stickerbook/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// App
const app = express();

app.set("view engine", "ejs");

function parseCsv(input) {
  return String(input || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const corsAllowOrigins = parseCsv(process.env.CORS_ALLOW_ORIGINS);

app.use(
  cors({
    credentials: true,
    exposedHeaders: ["X-Api-Version"],
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsAllowOrigins.length === 0 || corsAllowOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS policy."));
    },
  })
);

const jsonBodyParser = bodyParser.json({
  limit: String(process.env.BODY_JSON_LIMIT || "1mb"),
});

app.use((req, res, next) => {
  // Better Auth requires raw request handling for /v1/auth/* routes.
  if (req.path.startsWith("/v1/auth/")) {
    next();
    return;
  }
  jsonBodyParser(req, res, next);
});
app.use(function (req, res, next) {
  res.setHeader("Content-Security-Policy", "default-src 'self';");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000 ; includeSubDomains"
  );
  next();
});

// Set port
const port = "3000";
app.set("port", port);

app.use(async function (req, res, next) {
  const data = JSON.parse(
    await readFileSync(join(__dirname, "./package.json"), "utf8")
  );
  res.setHeader("x-api-version", data.version);
  next();
});

app.use(express.static(join(__dirname, "public")));
app.use("/", routes);

// Server
const server = app.listen(port, () => console.log("ternent-api is running."));

createWebSocketServer(server);

async function gracefulShutdown(signal) {
  try {
    await shutdownStickerbookLedger();
  } catch (error) {
    console.error(`[shutdown] stickerbook ledger flush failed on ${signal}:`, error);
  }

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 8000).unref();
}

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});
