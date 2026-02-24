import { WebSocketServer } from "ws";
import { getPlatformSession } from "../auth/platform-auth.mjs";

const MAX_WS_PAYLOAD_BYTES = Number.parseInt(
  String(process.env.WS_MAX_PAYLOAD_BYTES || "65536"),
  10
);

function parseMessage(input) {
  let parsed;
  try {
    parsed = JSON.parse(String(input || ""));
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "invalid-message-shape" };
  }

  const type = String(parsed.type || "").trim();
  const topic = String(parsed.topic || "").trim();
  const payload = parsed.payload ?? null;

  if (!type || !topic) {
    return { ok: false, reason: "type-and-topic-required" };
  }

  return {
    ok: true,
    value: { type, topic, payload },
  };
}

function closeUpgrade(socket, statusCode, statusText) {
  socket.write(
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
      "Connection: close\r\n" +
      "\r\n"
  );
  socket.destroy();
}

export function createWebSocketServer(server, appVersion) {
  const maxPayload =
    Number.isFinite(MAX_WS_PAYLOAD_BYTES) && MAX_WS_PAYLOAD_BYTES > 1024
      ? MAX_WS_PAYLOAD_BYTES
      : 65536;
  const wss = new WebSocketServer({ noServer: true, maxPayload });

  wss.on("connection", async function connection(ws, request, authSession) {
    ws.on("error", console.error);
    ws.on("message", (message, isBinary) => {
      if (isBinary) {
        ws.send(
          JSON.stringify({
            ok: false,
            error: "Binary payloads are not supported.",
            code: "WS_BINARY_UNSUPPORTED",
          })
        );
        return;
      }

      const parsed = parseMessage(message.toString());
      if (!parsed.ok) {
        ws.send(
          JSON.stringify({
            ok: false,
            error: "Invalid websocket message.",
            code: "WS_MESSAGE_INVALID",
            reason: parsed.reason,
          })
        );
        return;
      }

      ws.send(
        JSON.stringify({
          ok: true,
          status: "received",
          serverVersion: String(appVersion || "0.0.0"),
          sessionUserId: String(authSession?.session?.user?.id || ""),
          message: parsed.value,
        })
      );
    });
  });

  server.on("upgrade", async (request, socket, head) => {
    const session = await getPlatformSession(request);
    if (!session.ok || !session.session?.user?.id) {
      closeUpgrade(socket, 401, "Unauthorized");
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, session);
    });
  });
}
