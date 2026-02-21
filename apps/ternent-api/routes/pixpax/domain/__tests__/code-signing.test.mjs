import assert from "node:assert/strict";
import test from "node:test";
import { createHash, generateKeyPairSync, sign as nodeSign, verify as nodeVerify } from "node:crypto";
import {
  signTokenV2,
  verifyTokenV2,
  signReceiptV1,
  verifyReceiptV1,
  deriveKeyIdFromPublicKey,
  computeTokenHashFromPayloadBytes,
  verifyP256Sha256Signature,
  verifyRaw64WithNode,
} from "../code-signing.mjs";

function createEcKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  return {
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
  };
}

function buildPackPayload(issuerKeyId) {
  return {
    v: 2,
    issuerKeyId,
    codeId: "abcdabcdabcdabcdabcdabcd",
    collectionId: "premier-league-2026",
    version: "v1",
    kind: "pack",
    count: 5,
    dropId: "week-2026-W08",
    exp: 1770000000,
  };
}

function toBase64Url(bytes) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

test("canonicalization stability + single-byte mutation for token signatures", async () => {
  const issuer = createEcKeyPair();
  const issuerKeyId = deriveKeyIdFromPublicKey(issuer.publicKeyPem);

  const payloadA = buildPackPayload(issuerKeyId);
  const payloadB = {
    kind: "pack",
    exp: 1770000000,
    version: "v1",
    collectionId: "premier-league-2026",
    codeId: "abcdabcdabcdabcdabcdabcd",
    count: 5,
    issuerKeyId,
    v: 2,
    dropId: "week-2026-W08",
  };

  const signedA = await signTokenV2(payloadA, issuer.privateKeyPem);
  const signedB = await signTokenV2(payloadB, issuer.privateKeyPem);

  assert.deepEqual(Buffer.from(signedA.payloadBytes), Buffer.from(signedB.payloadBytes));

  const verifyOk = await verifyTokenV2(signedA.token, {
    resolveIssuer: async () => ({ status: "active", publicKeyPem: issuer.publicKeyPem }),
    nowSeconds: 1760000000,
    expLeewaySeconds: 0,
  });
  assert.equal(verifyOk.ok, true);

  const parts = signedA.token.split(".");
  const payloadBytes = Buffer.from(parts[0].replace(/-/g, "+").replace(/_/g, "/"), "base64");
  payloadBytes[0] = payloadBytes[0] ^ 0xff;
  const tamperedToken = `${payloadBytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")}.${parts[1]}`;

  const verifyTampered = await verifyTokenV2(tamperedToken, {
    resolveIssuer: async () => ({ status: "active", publicKeyPem: issuer.publicKeyPem }),
    nowSeconds: 1760000000,
  });
  assert.equal(verifyTampered.ok, false);

  const expectedHash = createHash("sha256").update(signedA.payloadBytes).digest("hex");
  assert.equal(computeTokenHashFromPayloadBytes(signedA.payloadBytes), expectedHash);
});

test("canonicalization stability + single-byte mutation for receipt signatures", async () => {
  const receiptSigner = createEcKeyPair();
  const receiptKeyId = deriveKeyIdFromPublicKey(receiptSigner.publicKeyPem);

  const receiptPayloadA = {
    v: 1,
    receiptKeyId,
    tokenHash: "a".repeat(64),
    issuerKeyId: "b".repeat(64),
    collectorPubKey: "collector:key",
    mintRef: "cda39da454bcc23a04287613",
    serverTime: 1760000000,
    collectionId: "premier-league-2026",
    version: "v1",
    kind: "pack",
    codeId: "abcdabcdabcdabcdabcdabcd",
  };
  const receiptPayloadB = {
    codeId: "abcdabcdabcdabcdabcdabcd",
    kind: "pack",
    version: "v1",
    collectionId: "premier-league-2026",
    serverTime: 1760000000,
    mintRef: "cda39da454bcc23a04287613",
    collectorPubKey: "collector:key",
    issuerKeyId: "b".repeat(64),
    tokenHash: "a".repeat(64),
    receiptKeyId,
    v: 1,
  };

  const signedA = await signReceiptV1(receiptPayloadA, receiptSigner.privateKeyPem);
  const signedB = await signReceiptV1(receiptPayloadB, receiptSigner.privateKeyPem);

  assert.deepEqual(Buffer.from(signedA.payloadBytes), Buffer.from(signedB.payloadBytes));

  const verifyOk = await verifyReceiptV1(
    signedA.payload,
    signedA.signature,
    receiptSigner.publicKeyPem
  );
  assert.equal(verifyOk, true);

  const signatureRaw = Buffer.from(
    signedA.signature.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
  signatureRaw[5] = signatureRaw[5] ^ 0xff;
  const tamperedSig = signatureRaw
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const verifyTampered = await verifyReceiptV1(
    signedA.payload,
    tamperedSig,
    receiptSigner.publicKeyPem
  );
  assert.equal(verifyTampered, false);
});

test("raw-64 signature handling interoperates with Node verify path", async () => {
  const issuer = createEcKeyPair();
  const issuerKeyId = deriveKeyIdFromPublicKey(issuer.publicKeyPem);
  const signed = await signTokenV2(buildPackPayload(issuerKeyId), issuer.privateKeyPem);
  const { der, subtleOk } = await verifyRaw64WithNode(
    issuer.publicKeyPem,
    signed.payloadBytes,
    signed.signatureRaw64
  );

  assert.equal(subtleOk, true);
  const nodeOk = nodeVerify("sha256", signed.payloadBytes, issuer.publicKeyPem, der);
  assert.equal(nodeOk, true);
});

test("token exp verification honors configurable leeway", async () => {
  const issuer = createEcKeyPair();
  const issuerKeyId = deriveKeyIdFromPublicKey(issuer.publicKeyPem);
  const signed = await signTokenV2(
    {
      ...buildPackPayload(issuerKeyId),
      exp: 1000,
    },
    issuer.privateKeyPem
  );

  const withLeeway = await verifyTokenV2(signed.token, {
    resolveIssuer: async () => ({ status: "active", publicKeyPem: issuer.publicKeyPem }),
    nowSeconds: 1030,
    expLeewaySeconds: 60,
  });
  assert.equal(withLeeway.ok, true);

  const withoutEnoughLeeway = await verifyTokenV2(signed.token, {
    resolveIssuer: async () => ({ status: "active", publicKeyPem: issuer.publicKeyPem }),
    nowSeconds: 1030,
    expLeewaySeconds: 10,
  });
  assert.equal(withoutEnoughLeeway.ok, false);
  assert.equal(withoutEnoughLeeway.reason, "token-expired");
});

test("strict payload field rules reject unknown token and receipt fields", async () => {
  const issuer = createEcKeyPair();
  const issuerKeyId = deriveKeyIdFromPublicKey(issuer.publicKeyPem);

  await assert.rejects(
    () =>
      signTokenV2(
        {
          ...buildPackPayload(issuerKeyId),
          unknown: "nope",
        },
        issuer.privateKeyPem
      ),
    /unsupported field: unknown/
  );

  const invalidTokenPayload = {
    ...buildPackPayload(issuerKeyId),
    unknown: "nope",
  };
  const invalidToken = `${toBase64Url(Buffer.from(JSON.stringify(invalidTokenPayload), "utf8"))}.${toBase64Url(Buffer.alloc(64, 0x01))}`;
  const invalidVerify = await verifyTokenV2(invalidToken, {
    resolveIssuer: async () => ({ status: "active", publicKeyPem: issuer.publicKeyPem }),
    nowSeconds: 1760000000,
  });
  assert.equal(invalidVerify.ok, false);
  assert.equal(invalidVerify.reason, "invalid-token-payload");

  const receiptSigner = createEcKeyPair();
  const receiptKeyId = deriveKeyIdFromPublicKey(receiptSigner.publicKeyPem);
  await assert.rejects(
    () =>
      signReceiptV1(
        {
          v: 1,
          receiptKeyId,
          tokenHash: "a".repeat(64),
          issuerKeyId,
          collectorPubKey: "collector:key",
          mintRef: "mint-123",
          serverTime: 1760000000,
          collectionId: "premier-league-2026",
          version: "v1",
          kind: "pack",
          codeId: "abcdabcdabcdabcdabcdabcd",
          unknown: "nope",
        },
        receiptSigner.privateKeyPem
      ),
    /unsupported field: unknown/
  );
});

test("receipt key separation: issuer key must not verify receipt signature", async () => {
  const issuer = createEcKeyPair();
  const receiptSigner = createEcKeyPair();
  const receiptKeyId = deriveKeyIdFromPublicKey(receiptSigner.publicKeyPem);

  const signedReceipt = await signReceiptV1(
    {
      v: 1,
      receiptKeyId,
      tokenHash: "a".repeat(64),
      issuerKeyId: deriveKeyIdFromPublicKey(issuer.publicKeyPem),
      collectorPubKey: "collector:key",
      mintRef: "pack-1",
      serverTime: 1760000000,
      collectionId: "premier-league-2026",
      version: "v1",
      kind: "pack",
      codeId: "abcdabcdabcdabcdabcdabcd",
    },
    receiptSigner.privateKeyPem
  );

  const okWithReceiptKey = await verifyReceiptV1(
    signedReceipt.payload,
    signedReceipt.signature,
    receiptSigner.publicKeyPem
  );
  const okWithIssuerKey = await verifyReceiptV1(
    signedReceipt.payload,
    signedReceipt.signature,
    issuer.publicKeyPem
  );

  assert.equal(okWithReceiptKey, true);
  assert.equal(okWithIssuerKey, false);
});

test("collector proof verifier accepts DER and raw-64 signature encodings", async () => {
  const signer = createEcKeyPair();
  const issuerKeyId = deriveKeyIdFromPublicKey(signer.publicKeyPem);
  const payload = buildPackPayload(issuerKeyId);
  const token = await signTokenV2(payload, signer.privateKeyPem);
  const message = Buffer.from("collector-proof-message", "utf8");

  const der = nodeSign("sha256", message, signer.privateKeyPem);
  const derOk = await verifyP256Sha256Signature(signer.publicKeyPem, message, toBase64Url(der));
  assert.equal(derOk, true);

  const rawOk = await verifyP256Sha256Signature(
    signer.publicKeyPem,
    token.payloadBytes,
    toBase64Url(token.signatureRaw64)
  );
  assert.equal(rawOk, true);
});
