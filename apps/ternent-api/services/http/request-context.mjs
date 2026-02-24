import { randomUUID } from "node:crypto";

function resolveRequestId(req) {
  const incoming = String(
    req?.headers?.["x-request-id"] ||
      req?.headers?.["x-correlation-id"] ||
      ""
  ).trim();
  return incoming || randomUUID();
}

export function requestContextMiddleware(req, res, next) {
  const requestId = resolveRequestId(req);
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
