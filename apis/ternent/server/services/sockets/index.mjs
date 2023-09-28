import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { WebSocketServer } from "ws";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createWebSocketServer(server, appVersion) {
  // Set up a headless websocket server that prints any
  // events that come in.
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", async function connection(ws) {
    const data = JSON.parse(
      await readFileSync(join(__dirname, "../../../package.json"), "utf8")
    );

    ws.on("error", console.error);
    ws.on("message", (_message) => {
      const { message } = JSON.parse(_message.toString());

      // just send back confirmations
      ws.send(
        JSON.stringify({
          status: "received",
          serverVersion: data.version,
          message,
        })
      );
    });
  });

  // sockets
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (socket) => {
      wss.emit("connection", socket, request);
    });
  });
}
