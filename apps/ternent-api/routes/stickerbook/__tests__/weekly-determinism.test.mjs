import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import stickerbookRoutes, { shutdownStickerbookLedger, toIsoWeek } from "../index.mjs";
import { hashCanonical } from "../stickerbook-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pendingPath = join(__dirname, "..", "..", "..", "persisted", "stickerbook", "issuer-pending.json");

function createRouterHarness() {
  const routes = new Map();
  const register = (method, path, handler) => {
    routes.set(`${method}:${path}`, handler);
  };

  return {
    get(path, handler) {
      register("GET", path, handler);
    },
    post(path, handler) {
      register("POST", path, handler);
    },
    async invoke(method, path, { body = {}, query = {}, params = {} } = {}) {
      const handler = routes.get(`${method}:${path}`);
      assert.ok(handler, `Missing route handler for ${method}:${path}`);

      let statusCode = 200;
      let sent;
      const req = { body, query, params };
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

      await handler(req, res);
      return { statusCode, body: sent };
    },
  };
}

function setIssuerPrivateKeyEnv() {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });
  process.env.ISSUER_PRIVATE_KEY_PEM = privateKeyPem.toString();
  delete process.env.ISSUER_KEY_ID;
  process.env.NODE_ENV = "test";
  process.env.LEDGER_RECORD_DEV_ISSUES = "false";
  process.env.LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON = "[]";
}

async function issueWeeklyPack({ packRequestId, clientNonce, issuedTo }) {
  const router = createRouterHarness();
  stickerbookRoutes(router);

  const commit = await router.invoke("POST", "/v1/stickerbook/commit", {
    body: {
      packRequestId: packRequestId || null,
      packType: "weekly",
      dropCycleId: "2026-W06",
      userKey: issuedTo,
      seriesId: "S1",
      themeId: "T1",
      count: 4,
      issuedTo,
      clientNonceHash: hashCanonical(clientNonce),
    },
  });
  assert.equal(commit.statusCode, 200);

  const issue = await router.invoke("POST", "/v1/stickerbook/issue", {
    body: {
      packRequestId: commit.body.packRequestId,
      clientNonce,
      issuedTo,
    },
  });
  assert.equal(issue.statusCode, 200);
  await shutdownStickerbookLedger();
  return issue.body;
}

test("weekly issuance is deterministic for same user and drop cycle", async () => {
  const beforePending = existsSync(pendingPath) ? readFileSync(pendingPath, "utf8") : null;
  setIssuerPrivateKeyEnv();
  process.env.ISSUER_MASTER_SEED = "weekly-master-seed-for-tests";

  try {
    const fixed = {
      clientNonce: "weekly-2026-W06-user-demo-client-nonce",
      issuedTo: "user:demo",
    };

    const first = await issueWeeklyPack(fixed);

    rmSync(pendingPath, { force: true });

    const second = await issueWeeklyPack(fixed);

    assert.equal(second.pack.packId, first.pack.packId);
    assert.deepEqual(second.entry.payload.itemHashes, first.entry.payload.itemHashes);
    assert.equal(second.entry.payload.packRoot, first.entry.payload.packRoot);
    assert.equal(
      second.entry.payload.contentsCommitment,
      first.entry.payload.contentsCommitment
    );
    assert.equal(second.entry.payload.week, "2026-W06");
    assert.equal(second.entry.payload.dropId, "week-2026-W06");
    assert.equal(second.receipt.skipped, true);
  } finally {
    await shutdownStickerbookLedger();
    if (beforePending === null) {
      rmSync(pendingPath, { force: true });
    } else {
      writeFileSync(pendingPath, beforePending);
    }
  }
});

test("weekly issuance differs for different users and drop cycles", async () => {
  const beforePending = existsSync(pendingPath) ? readFileSync(pendingPath, "utf8") : null;
  setIssuerPrivateKeyEnv();
  process.env.ISSUER_MASTER_SEED = "weekly-master-seed-for-tests";

  try {
    const a = await issueWeeklyPack({
      clientNonce: "weekly-2026-W06-user-a-client-nonce",
      issuedTo: "user:a",
    });
    const b = await issueWeeklyPack({
      clientNonce: "weekly-2026-W06-user-b-client-nonce",
      issuedTo: "user:b",
    });
    assert.notEqual(a.pack.packId, b.pack.packId);
    assert.notEqual(a.entry.payload.packRoot, b.entry.payload.packRoot);

    const router = createRouterHarness();
    stickerbookRoutes(router);
    const commit = await router.invoke("POST", "/v1/stickerbook/commit", {
      body: {
        packType: "weekly",
        dropCycleId: "2026-W07",
        userKey: "user:a",
        seriesId: "S1",
        themeId: "T1",
        count: 4,
        issuedTo: "user:a",
        clientNonceHash: hashCanonical("weekly-2026-W07-user-a-client-nonce"),
      },
    });
    assert.equal(commit.statusCode, 200);
    const issue = await router.invoke("POST", "/v1/stickerbook/issue", {
      body: {
        packRequestId: commit.body.packRequestId,
        clientNonce: "weekly-2026-W07-user-a-client-nonce",
        issuedTo: "user:a",
      },
    });
    assert.equal(issue.statusCode, 200);
    assert.notEqual(a.pack.packId, issue.body.pack.packId);
    assert.notEqual(a.entry.payload.packRoot, issue.body.entry.payload.packRoot);
  } finally {
    await shutdownStickerbookLedger();
    if (beforePending === null) {
      rmSync(pendingPath, { force: true });
    } else {
      writeFileSync(pendingPath, beforePending);
    }
  }
});

test("iso week calculation is stable for explicit offsets around boundaries", () => {
  const instantA = new Date("2026-02-08T00:30:00+14:00");
  const instantB = new Date("2026-02-07T10:30:00Z");
  assert.equal(instantA.toISOString(), instantB.toISOString());
  assert.equal(toIsoWeek(instantA), toIsoWeek(instantB));
});
