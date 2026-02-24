function normalizeError(error) {
  return {
    statusCode: Number(error?.statusCode || 500),
    code: String(error?.code || "INTERNAL_ERROR"),
    message: String(error?.message || "Request failed."),
    details: error?.details ?? null,
  };
}

function isPixbookRoute(req) {
  return String(req?.path || "").startsWith("/v1/pixbooks");
}

export function errorMiddleware(error, req, res, _next) {
  const requestId = String(req?.requestId || "").trim() || "unknown-request";
  const normalized = normalizeError(error);

  if (normalized.statusCode >= 500) {
    console.error("[http] unhandled error", {
      requestId,
      path: req?.path || "",
      method: req?.method || "",
      error: normalized,
    });
  }

  if (res.headersSent) {
    return;
  }

  if (isPixbookRoute(req)) {
    res.status(normalized.statusCode).send({
      ok: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details || {},
      },
      requestId,
    });
    return;
  }

  res.status(normalized.statusCode).send({
    ok: false,
    error: normalized.message,
    code: normalized.code,
    requestId,
  });
}
