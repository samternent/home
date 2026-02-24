function nowMs() {
  return Date.now();
}

function asInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clientIp(req) {
  const forwarded = String(req?.headers?.["x-forwarded-for"] || "").trim();
  if (forwarded) return forwarded.split(",")[0].trim();
  return String(req?.socket?.remoteAddress || "unknown");
}

function createLimiter({ windowMs, limit, keyResolver }) {
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const key = keyResolver(req);
    const now = nowMs();
    const state = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > state.resetAt) {
      state.count = 0;
      state.resetAt = now + windowMs;
    }

    state.count += 1;
    buckets.set(key, state);

    if (state.count > limit) {
      res.status(429).send({
        ok: false,
        error: "Rate limit exceeded.",
        code: "RATE_LIMITED",
        requestId: req.requestId,
      });
      return;
    }

    next();
  };
}

export function createAuthRateLimit() {
  return createLimiter({
    windowMs: asInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 60_000),
    limit: asInt(process.env.RATE_LIMIT_AUTH_MAX, 30),
    keyResolver(req) {
      return `auth:${clientIp(req)}`;
    },
  });
}

export function createCommandRateLimit() {
  const limiter = createLimiter({
    windowMs: asInt(process.env.RATE_LIMIT_COMMAND_WINDOW_MS, 60_000),
    limit: asInt(process.env.RATE_LIMIT_COMMAND_MAX, 120),
    keyResolver(req) {
      const accountId = String(
        req?.headers?.["x-account-id"] ||
          req?.query?.accountId ||
          req?.body?.accountId ||
          ""
      ).trim();
      const scope = accountId || clientIp(req);
      return `cmd:${scope}`;
    },
  });

  return function commandRateLimit(req, res, next) {
    if (!String(req?.path || "").includes("/commands/")) {
      next();
      return;
    }
    limiter(req, res, next);
  };
}
