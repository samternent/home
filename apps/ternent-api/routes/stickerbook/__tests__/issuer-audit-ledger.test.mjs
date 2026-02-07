import assert from "node:assert/strict";
import test from "node:test";
import { createHash, generateKeyPairSync, webcrypto } from "node:crypto";
import { Buffer } from "node:buffer";
import { gzipSync, gunzipSync } from "node:zlib";
import { deriveEntryId, getEntrySigningPayload } from "@ternent/concord-protocol";
import {
  IssuerAuditLedger,
  buildSegmentObject,
  createDefaultCheckpoint,
  deriveIssuerKeyIdFromPublicKey,
  parseSegmentJsonl,
} from "../issuer-audit-ledger.mjs";

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizePem(pem) {
  const normalized = pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
  return normalized.trim() + "\n";
}

function privatePemToDer(pem) {
  const stripped = normalizePem(pem)
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replaceAll("\n", "");
  return Buffer.from(stripped, "base64");
}

async function signPayload(privateKeyPem, payload) {
  const subtle = webcrypto?.subtle || globalThis.crypto?.subtle;
  const key = await subtle.importKey(
    "pkcs8",
    privatePemToDer(privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const signature = await subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(payload)
  );
  return Buffer.from(signature).toString("base64");
}

function createMemoryGateway() {
  const objects = new Map();
  return {
    objects,
    async getObject({ bucket, key }) {
      const id = `${bucket}:${key}`;
      if (!objects.has(id)) {
        throw new Error(`NoSuchKey:${key}`);
      }
      return Buffer.from(objects.get(id));
    },
    async putObject({ bucket, key, body }) {
      const id = `${bucket}:${key}`;
      objects.set(id, Buffer.from(body));
    },
  };
}

test("buildSegmentObject emits parseable content-addressed JSONL", () => {
  const checkpoint = createDefaultCheckpoint("pixpax/ledger");
  assert.equal("packIndex" in checkpoint, false);
  const events = [
    {
      entryId: "e1",
      entry: {
        kind: "pack.issued",
        timestamp: "2026-02-06T00:00:00.000Z",
        author: "issuer",
        payload: { type: "pack.issued", packId: "p1" },
        signature: "sig",
      },
    },
  ];

  const segment = buildSegmentObject({ checkpoint, events });
  const expectedHash = sha256Hex(segment.jsonl);

  assert.equal(segment.segmentHash, expectedHash);
  const parsed = parseSegmentJsonl(segment.jsonl);
  assert.equal(parsed.meta.type, "segment.meta");
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].entry.payload.packId, "p1");
});

test("IssuerAuditLedger appends and verifies a signed pack receipt", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });
  const issuerKeyId = deriveIssuerKeyIdFromPublicKey(publicKeyPem);

  const payload = {
    type: "pack.issued",
    packId: "pack-test-1",
    packRequestId: "req-1",
    issuedAt: "2026-02-06T00:00:00.000Z",
    issuerKeyId,
    issuedBy: "issuer",
    issuedTo: "unknown",
    seriesId: "S1",
    dropId: "week-2026-W06",
    themeId: "T1",
    week: "2026-W06",
    count: 1,
    packRoot: "root-1",
    itemHashes: ["h1"],
    contentsCommitment: "cc1",
    algoVersion: "1.0.0",
    kitHash: "kit-1",
    themeHash: "theme-1",
  };

  const entryCore = {
    kind: "pack.issued",
    timestamp: "2026-02-06T00:00:00.000Z",
    author: "issuer",
    payload,
  };

  const signature = await signPayload(privateKeyPem, getEntrySigningPayload(entryCore));
  const entry = { ...entryCore, signature };
  const entryId = await deriveEntryId(entry);

  const gateway = createMemoryGateway();
  const ledger = new IssuerAuditLedger({
    disabled: false,
    bucket: "test-bucket",
    prefix: "pixpax/ledger",
    flushMaxEvents: 200,
    flushIntervalMs: 60000,
    flushSyncOnIssue: true,
    trustedIssuerPublicKeysJson: "",
    currentIssuerKeyId: issuerKeyId,
    currentIssuerPublicKeyPem: publicKeyPem,
    gateway,
  });

  await ledger.init();
  const receipt = await ledger.appendIssuedEntry(entryId, entry);

  const proof = await ledger.fetchReceiptProof("pack-test-1", receipt.segmentKey);
  assert.equal(proof.ok, true);
  assert.equal(proof.event.entryId, entryId);
  assert.equal(proof.event.entry.payload.packId, "pack-test-1");
});

test("IssuerAuditLedger detects tampered segment content", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });
  const issuerKeyId = deriveIssuerKeyIdFromPublicKey(publicKeyPem);

  const payload = {
    type: "pack.issued",
    packId: "pack-test-2",
    packRequestId: "req-2",
    issuedAt: "2026-02-06T00:00:00.000Z",
    issuerKeyId,
    issuedBy: "issuer",
    issuedTo: "unknown",
    seriesId: "S1",
    dropId: "week-2026-W06",
    themeId: "T1",
    week: "2026-W06",
    count: 1,
    packRoot: "root-2",
    itemHashes: ["h2"],
    contentsCommitment: "cc2",
    algoVersion: "1.0.0",
    kitHash: "kit-2",
    themeHash: "theme-2",
  };

  const entryCore = {
    kind: "pack.issued",
    timestamp: "2026-02-06T00:00:00.000Z",
    author: "issuer",
    payload,
  };

  const signature = await signPayload(privateKeyPem, getEntrySigningPayload(entryCore));
  const entry = { ...entryCore, signature };
  const entryId = await deriveEntryId(entry);

  const gateway = createMemoryGateway();
  const ledger = new IssuerAuditLedger({
    disabled: false,
    bucket: "test-bucket",
    prefix: "pixpax/ledger",
    flushMaxEvents: 200,
    flushIntervalMs: 60000,
    flushSyncOnIssue: true,
    trustedIssuerPublicKeysJson: "",
    currentIssuerKeyId: issuerKeyId,
    currentIssuerPublicKeyPem: publicKeyPem,
    gateway,
  });

  await ledger.init();
  const receipt = await ledger.appendIssuedEntry(entryId, entry);

  const checkpointBytes = await gateway.getObject({
    bucket: "test-bucket",
    key: "pixpax/ledger/checkpoint.json",
  });
  const checkpoint = JSON.parse(Buffer.from(checkpointBytes).toString("utf8"));
  const headKey = checkpoint.headSegmentKey;

  const objectId = `test-bucket:${headKey}`;
  const original = gateway.objects.get(objectId);
  const originalJsonl = gunzipSync(Buffer.from(original)).toString("utf8");
  const tamperedJsonl = originalJsonl.replace("pack-test-2", "pack-test-x");
  gateway.objects.set(objectId, gzipSync(Buffer.from(tamperedJsonl, "utf8")));

  const proof = await ledger.fetchReceiptProof("pack-test-2", receipt.segmentKey);
  assert.equal(proof.ok, false);
});
