import assert from "node:assert/strict";
import test from "node:test";
import { createPixpaxRedeemRateLimit } from "../rate-limit.mjs";

test("pixpax redeem rate limit returns 429 after the configured threshold", () => {
  process.env.RATE_LIMIT_PIXPAX_REDEEM_WINDOW_MS = "60000";
  process.env.RATE_LIMIT_PIXPAX_REDEEM_MAX = "2";

  const limiter = createPixpaxRedeemRateLimit();
  const req = {
    headers: {},
    socket: {
      remoteAddress: "203.0.113.10",
    },
    requestId: "req-1",
  };

  let nextCalls = 0;
  const createResponse = () => {
    let statusCode = 200;
    let body = null;
    return {
      status(code) {
        statusCode = code;
        return this;
      },
      send(payload) {
        body = payload;
        return { statusCode, body };
      },
      read() {
        return { statusCode, body };
      },
    };
  };

  limiter(req, createResponse(), () => {
    nextCalls += 1;
  });
  limiter(req, createResponse(), () => {
    nextCalls += 1;
  });

  const blocked = createResponse();
  limiter(req, blocked, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 2);
  assert.deepEqual(blocked.read(), {
    statusCode: 429,
    body: {
      ok: false,
      error: "Rate limit exceeded.",
      code: "RATE_LIMITED",
      requestId: "req-1",
    },
  });
});
