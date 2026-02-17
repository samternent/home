import assert from "node:assert/strict";
import test from "node:test";
import authRoutes from "../index.mjs";

function createRouterHarness() {
  const routes = new Map();
  const register = (method, path, handlers) => {
    routes.set(`${method}:${path}`, handlers);
  };

  const invoke = async (method, path, { body = {}, params = {}, headers = {}, query = {} } = {}) => {
    let handlers = routes.get(`${method}:${path}`) || routes.get(`ALL:${path}`);
    if (!handlers) {
      for (const [key, value] of routes.entries()) {
        const [registeredMethod, registeredPath] = key.split(":");
        if (registeredMethod !== "ALL") continue;
        if (!registeredPath.endsWith("*")) continue;
        const prefix = registeredPath.slice(0, -1);
        if (path.startsWith(prefix)) {
          handlers = value;
          break;
        }
      }
    }
    assert.ok(handlers, `Missing handler ${method}:${path}`);

    let statusCode = 200;
    let sent;
    const req = { body, params, headers, query, path };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      send(payload) {
        sent = payload;
        return this;
      },
    };

    let index = 0;
    const next = async () => {
      const fn = handlers[index++];
      if (!fn) return;
      if (fn.length >= 3) {
        await fn(req, res, next);
      } else {
        await fn(req, res);
      }
    };

    await next();
    return { statusCode, body: sent };
  };

  return {
    get(path, ...handlers) {
      register("GET", path, handlers);
    },
    post(path, ...handlers) {
      register("POST", path, handlers);
    },
    patch(path, ...handlers) {
      register("PATCH", path, handlers);
    },
    all(path, ...handlers) {
      register("ALL", path, handlers);
    },
    invoke,
  };
}

test("auth routes fail closed when platform auth is not configured", async () => {
  delete process.env.AUTH_SECRET;
  delete process.env.AUTH_BASE_URL;
  delete process.env.DATABASE_URL;

  const router = createRouterHarness();
  authRoutes(router);

  const health = await router.invoke("GET", "/v1/auth/health");
  assert.equal(health.statusCode, 503);
  assert.equal(health.body.ok, false);

  const session = await router.invoke("GET", "/v1/auth/session");
  assert.equal(session.statusCode, 503);
  assert.equal(session.body.authenticated, false);

  const passthrough = await router.invoke("ALL", "/v1/auth/passkey/register");
  assert.equal(passthrough.statusCode, 503);
  assert.equal(passthrough.body.ok, false);
});
