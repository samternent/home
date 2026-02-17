import assert from "node:assert/strict";
import test from "node:test";
import accountRoutes from "../index.mjs";

function createRouterHarness() {
  const routes = new Map();
  const register = (method, path, handlers) => {
    routes.set(`${method}:${path}`, handlers);
  };

  const invoke = async (method, path, { body = {}, params = {}, headers = {}, query = {} } = {}) => {
    const handlers = routes.get(`${method}:${path}`);
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
    invoke,
  };
}

test("account routes require platform auth and fail closed by default", async () => {
  delete process.env.AUTH_SECRET;
  delete process.env.AUTH_BASE_URL;
  delete process.env.DATABASE_URL;

  const router = createRouterHarness();
  accountRoutes(router);

  const session = await router.invoke("GET", "/v1/account/session");
  assert.equal(session.statusCode, 503);
  assert.equal(session.body.ok, false);

  const users = await router.invoke("GET", "/v1/account/users");
  assert.equal(users.statusCode, 503);
  assert.equal(users.body.ok, false);
});
