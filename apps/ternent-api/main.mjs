import { createApp } from "./app.mjs";
import { createWebSocketServer } from "./services/sockets/index.mjs";
import { shutdownStickerbookLedger } from "./routes/stickerbook/index.mjs";
const { app, appVersion } = createApp();
const port = app.get("port");

// Server
const server = app.listen(port, () => console.log("ternent-api is running."));

createWebSocketServer(server, appVersion);

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
