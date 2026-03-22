import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseIdentity } from "@ternent/identity";
import { assertValidRecordTransferCommandInput } from "@ternent/pixpax-core";
import {
  createDesignatedPackIssuance,
  createDeterministicPackIssuance,
  signPackIssuance,
  verifyPackIssuanceProof,
  verifyTransferAcceptanceProof,
  verifyTransferProof,
} from "@ternent/pixpax-issuer";
import { isPlatformAuthReady, requestHasCapability } from "../../../services/auth/permissions.mjs";
import {
  createCollectionContentStoreFromEnv,
} from "../collections/content-store.mjs";
import { buildQrSvg } from "../domain/code-token-qr.mjs";
import { createAlreadyClaimedPayload } from "./public-claim.mjs";
import {
  isV2CollectionAvailable,
  parseV2AvailableCollections,
  resolveAvailableCollectionVersion,
} from "./availability.mjs";
import {
  applyAcceptedSwapRecord,
  applyCompletedSwapRecord,
  createSwapRecord,
  recordMatchesInbox,
  recordMatchesOutbox,
  sortSwapRecordsDesc,
} from "./swaps.mjs";

const PIXPAX_ADMIN_PERMISSIONS = Object.freeze([
  "pixpax.admin.manage",
  "pixpax.analytics.read",
  "pixpax.creator.publish",
  "pixpax.creator.view",
]);

function trim(value) {
  return String(value || "").trim();
}

function getAvailableCollections() {
  return parseV2AvailableCollections(
    trim(process.env.PIX_PAX_V2_AVAILABLE_COLLECTIONS) ||
      trim(process.env.PIX_PAX_V2_COLLECTION_ALLOWLIST),
  );
}

function assertAvailableCollection(collectionId, version = "") {
  if (!isV2CollectionAvailable(getAvailableCollections(), collectionId, version)) {
    throw new Error("Collection is not available on this PixPax app.");
  }
}

function extractBearerToken(headerValue) {
  const raw = trim(headerValue);
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice("bearer ".length).trim();
}

function resolveAdminToken() {
  return trim(process.env.PIX_PAX_ADMIN_TOKEN);
}

function badRequest(res, error, details = undefined) {
  res.status(400).send({
    ok: false,
    error,
    ...(details ? { details } : {}),
  });
}

function parseSwapQrBody(body) {
  return {
    value: trim(body?.value),
  };
}

function parseSwapOfferBody(body) {
  return {
    offerArtifact: body?.offerArtifact || null,
  };
}

function parseSwapAcceptBody(body) {
  return {
    offerArtifact: body?.offerArtifact || null,
    acceptanceArtifact: body?.acceptanceArtifact || null,
  };
}

function parseSwapListQuery(query, actorKeyName) {
  return {
    actorPublicKey: trim(query?.[actorKeyName]),
    status: trim(query?.status),
    limit: Math.max(1, Math.min(100, Number(query?.limit || 50) || 50)),
  };
}

async function resolveAdminAccess(req) {
  const expectedToken = resolveAdminToken();
  const provided = extractBearerToken(req?.headers?.authorization);

  if (expectedToken && provided && provided === expectedToken) {
    return {
      ok: true,
      statusCode: 200,
      permissions: [...PIXPAX_ADMIN_PERMISSIONS],
      source: "bearer-token",
    };
  }

  const platformAccess = await requestHasCapability(req, "pixpax.admin.manage");
  if (platformAccess.ok) {
    return {
      ok: true,
      statusCode: 200,
      permissions: [...PIXPAX_ADMIN_PERMISSIONS],
      source: "platform-session",
    };
  }

  if (!expectedToken) {
    const platformReady = await isPlatformAuthReady();
    if (platformReady) {
      return {
        ok: false,
        statusCode: platformAccess.statusCode || 401,
        payload: { error: "Unauthorized." },
      };
    }
    return {
      ok: false,
      statusCode: 503,
      payload: {
        error: "PIX_PAX_ADMIN_TOKEN is not configured.",
      },
    };
  }

  return {
    ok: false,
    statusCode: 401,
    payload: { error: "Unauthorized." },
  };
}

async function requireAdminAccess(req, res) {
  const access = await resolveAdminAccess(req);
  if (!access.ok) {
    res.status(access.statusCode).send(access.payload);
    return false;
  }
  return true;
}

function resolveIssuerIdentity() {
  const inline = trim(process.env.SEAL_IDENTITY);
  const fromFilePath = trim(process.env.SEAL_IDENTITY_FILE);
  const raw = inline || (fromFilePath ? readFileSync(fromFilePath, "utf8") : "");
  if (!trim(raw)) {
    throw new Error(
      "Seal issuer identity is not configured. Set SEAL_IDENTITY or SEAL_IDENTITY_FILE.",
    );
  }
  return parseIdentity(raw);
}

let contentStorePromise = null;

async function getStore() {
  if (!contentStorePromise) {
    contentStorePromise = createCollectionContentStoreFromEnv();
  }
  return contentStorePromise;
}

async function getSwapRecordOrNull(store, transferId) {
  try {
    return await store.getGlobalSwapRecord(transferId);
  } catch (error) {
    if (String(error?.message || "").startsWith("NoSuchKey:")) {
      return null;
    }
    throw error;
  }
}

async function loadCollectionCards({ collectionId, collectionVersion, selectedCardIds = [] }) {
  const store = await getStore();
  const resolvedVersion = await resolvePublicCollectionVersion(
    store,
    collectionId,
    collectionVersion,
  );
  const index = await store.getIndex(collectionId, resolvedVersion);
  const availableCardIds = Array.isArray(index?.cards)
    ? index.cards.map((cardId) => trim(cardId)).filter(Boolean)
    : [];
  if (!availableCardIds.length) {
    throw new Error("Collection index has no cards.");
  }

  const targetCardIds = selectedCardIds.length
    ? selectedCardIds.map((cardId) => trim(cardId)).filter(Boolean)
    : availableCardIds;

  const invalid = targetCardIds.filter((cardId) => !availableCardIds.includes(cardId));
  if (invalid.length > 0) {
    throw new Error(`Unknown cardIds requested: ${invalid.join(", ")}`);
  }

  const cards = await Promise.all(
    targetCardIds.map(async (cardId) => {
      const card = await store.getCard(collectionId, resolvedVersion, cardId);
      return {
        cardId,
        seriesId: trim(card?.seriesId) || null,
        role: trim(card?.role) || null,
        renderPayload:
          card?.renderPayload && typeof card.renderPayload === "object"
            ? card.renderPayload
            : null,
      };
    }),
  );
  return cards;
}

function parseDeterministicBody(body) {
  return {
    collectionId: trim(body?.collectionId),
    collectionVersion: trim(body?.collectionVersion),
    dropId: trim(body?.dropId),
    claimantPublicKey: trim(body?.claimantPublicKey),
    count: Number(body?.count || 5),
  };
}

function parseDesignatedBody(body) {
  return {
    collectionId: trim(body?.collectionId),
    collectionVersion: trim(body?.collectionVersion),
    dropId: trim(body?.dropId),
    sourceCodeId: trim(body?.sourceCodeId),
    cardIds: Array.isArray(body?.cardIds)
      ? body.cardIds.map((value) => trim(value)).filter(Boolean)
      : [],
  };
}

function parseDesignatedRedeemBody(body) {
  return {
    code: trim(body?.code || body?.redeem || body?.sourceCodeId),
    claimantPublicKey: trim(body?.claimantPublicKey),
  };
}

function parseCodeListQuery(query) {
  const limit = Math.max(1, Math.min(50, Number(query?.limit || 20) || 20));
  return {
    collectionId: trim(query?.collectionId),
    collectionVersion: trim(query?.collectionVersion || query?.version),
    dropId: trim(query?.dropId),
    status: trim(query?.status).toLowerCase(),
    limit,
  };
}

function createOpaqueCodeId(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += alphabet[bytes[index] % alphabet.length];
  }
  return value;
}

function hashClaimantPublicKey(publicKey) {
  return createHash("sha256")
    .update(`pixpax:claimant:${trim(publicKey)}`, "utf8")
    .digest("hex");
}

function matchesClaimant(existingUse, claimantPublicKey) {
  const normalizedPublicKey = trim(claimantPublicKey);
  if (!normalizedPublicKey) {
    return false;
  }

  const recordedPublicKey = trim(existingUse?.claimantPublicKey);
  if (recordedPublicKey && recordedPublicKey === normalizedPublicKey) {
    return true;
  }

  const recordedHash = trim(existingUse?.claimantHash);
  return Boolean(recordedHash) && recordedHash === hashClaimantPublicKey(normalizedPublicKey);
}

function compareVersionsDesc(left, right) {
  return String(right || "").localeCompare(String(left || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

async function resolveCollectionVersion(store, collectionId, requestedVersion = "") {
  const normalizedVersion = trim(requestedVersion);
  if (normalizedVersion) {
    return normalizedVersion;
  }

  try {
    const settings = await store.getCollectionSettings(collectionId);
    const latestPublicVersion = trim(settings?.latestPublicVersion);
    if (latestPublicVersion) {
      return latestPublicVersion;
    }
  } catch {
    // Ignore missing settings and fall back to version listing.
  }

  const versions = await store.listCollectionVersions(collectionId);
  versions.sort(compareVersionsDesc);
  const resolved = versions[0];
  if (!resolved) {
    throw new Error("No collection versions found.");
  }
  return resolved;
}

async function resolvePublicCollectionVersion(store, collectionId, requestedVersion = "") {
  const constrainedVersion = resolveAvailableCollectionVersion(
    getAvailableCollections(),
    collectionId,
    requestedVersion,
  );
  const resolvedVersion = await resolveCollectionVersion(
    store,
    collectionId,
    constrainedVersion || requestedVersion,
  );
  assertAvailableCollection(collectionId, resolvedVersion);
  return resolvedVersion;
}

async function loadBundle({ collectionId, collectionVersion = "" }) {
  const store = await getStore();
  const resolvedVersion = await resolvePublicCollectionVersion(
    store,
    collectionId,
    collectionVersion,
  );
  const [collection, index, settings] = await Promise.all([
    store.getCollection(collectionId, resolvedVersion),
    store.getIndex(collectionId, resolvedVersion),
    store.getCollectionSettings(collectionId).catch(() => null),
  ]);

  const cardIds = Array.isArray(index?.cards)
    ? index.cards.map((value) => trim(value)).filter(Boolean)
    : [];

  const cards = await Promise.all(
    cardIds.map(async (cardId) => {
      const card = await store.getCard(collectionId, resolvedVersion, cardId);
      return {
        ...card,
        cardId,
      };
    }),
  );

  return {
    collectionId,
    resolvedVersion,
    collection,
    index,
    settings,
    cards,
  };
}

function resolvePlayerBaseUrl(req) {
  const configured = trim(process.env.PIX_PAX_PUBLIC_APP_URL);
  if (configured) return configured.replace(/\/+$/, "");

  const host = trim(req?.headers?.host);
  if (host && /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
    const protocol =
      trim(req?.headers?.["x-forwarded-proto"]) ||
      (host.includes("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return "https://pixpax.ternent.dev";
}

function createRedeemUrl(req, codeId) {
  return `${resolvePlayerBaseUrl(req)}/redeem?code=${encodeURIComponent(codeId)}`;
}

async function reserveOpaqueCodeId(store, payloadFactory, attempts = 6) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const codeId = createOpaqueCodeId(12);
    const payload = payloadFactory(codeId);
    const reserved = await store.putGlobalCodeRecordIfAbsent(codeId, payload);
    if (reserved?.created) {
      return {
        codeId,
        payload,
      };
    }
  }

  throw new Error("Failed to reserve a unique designated code id.");
}

function createAdminCodeSummary(record, claim = null) {
  const codeId = trim(record?.codeId);
  const baseStatus =
    trim(record?.status) === "revoked"
      ? "revoked"
      : claim || trim(record?.status) === "claimed"
        ? "claimed"
        : "unused";
  return {
    codeId,
    status: baseStatus,
    kind: trim(record?.kind) || "v2-designated",
    collectionId: trim(record?.collectionId),
    collectionVersion: trim(record?.version),
    dropId: trim(record?.dropId) || null,
    sourceCodeId: trim(record?.sourceCodeId) || null,
    issuedAt: trim(record?.issuedAt) || null,
    redeemUrl: trim(record?.redeemUrl) || null,
    claimedAt: trim(claim?.claimedAt || record?.claimedAt) || null,
    claimantPublicKey: trim(claim?.claimantPublicKey || record?.claimantPublicKey) || null,
    revokedAt: trim(record?.revokedAt) || null,
    revokedReason: trim(record?.revokedReason) || null,
    artifact: null,
  };
}

async function writeAdminCodeSummary(store, record, claim = null) {
  const summary = createAdminCodeSummary(record, claim);
  if (!summary.codeId) {
    throw new Error("Admin code summary requires codeId.");
  }
  await store.putGlobalCodeSummary(summary.codeId, summary);
  return summary;
}

async function backfillAdminCodeSummaries(store, limit = 100) {
  const listed = await store.listGlobalCodeRecords({ limit });
  const summaries = [];
  for (const record of listed.records || []) {
    if (trim(record?.kind) !== "v2-designated") {
      continue;
    }
    const collectionId = trim(record?.collectionId);
    const collectionVersion = trim(record?.version);
    const codeId = trim(record?.codeId);
    const claim =
      collectionId && collectionVersion && codeId
        ? await store.getOverrideCodeUse(collectionId, collectionVersion, codeId).catch(() => null)
        : null;
    summaries.push(await writeAdminCodeSummary(store, record, claim));
  }
  return summaries;
}

function codeSummaryMatchesFilters(summary, filters) {
  if (filters.collectionId && summary.collectionId !== filters.collectionId) return false;
  if (filters.collectionVersion && summary.collectionVersion !== filters.collectionVersion) return false;
  if (filters.dropId && summary.dropId !== filters.dropId) return false;
  if (filters.status && summary.status !== filters.status) return false;
  return true;
}

export default function pixpaxV2Routes(router, options = {}) {
  if (typeof options.createStore === "function") {
    contentStorePromise = Promise.resolve(options.createStore());
  }

  router.get("/v1/pixpax/v2/meta", async (_req, res) => {
    let sealIdentityConfigured = false;
    try {
      resolveIssuerIdentity();
      sealIdentityConfigured = true;
    } catch {
      sealIdentityConfigured = false;
    }

    res.status(200).send({
      ok: true,
      version: "0.1.0",
      invariants: [
        "Concord remains generic.",
        "Pixbook ownership derives from claim-pack and transfer replay only.",
        "record-pack-opened never changes ownership or completion.",
        "Card instance ids are deterministic for claim entry id plus slot index.",
        "Deterministic issuance inputs are canonicalized and versioned.",
      ],
      capabilities: {
        deterministicPreview: true,
        deterministicIssue: true,
        designatedIssue: true,
        publicCollections: true,
        designatedRedeem: true,
        proofVerify: true,
      },
      issuer: {
        sealIdentityConfigured,
      },
    });
  });

  router.post("/v1/pixpax/v2/swaps/recipient-qr", async (req, res) => {
    const input = parseSwapQrBody(req.body);
    if (!input.value) {
      badRequest(res, "value is required.");
      return;
    }
    if (input.value.length > 4096) {
      badRequest(res, "value is too long.");
      return;
    }

    try {
      const qr = await buildQrSvg(input.value, {
        sizePx: 320,
      });
      res.status(200).send({
        ok: true,
        qrSvg: qr.qrSvg,
      });
    } catch (error) {
      res.status(422).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.post("/v1/pixpax/v2/swaps/offers", async (req, res) => {
    const input = parseSwapOfferBody(req.body);
    if (!input.offerArtifact) {
      badRequest(res, "offerArtifact is required.");
      return;
    }

    try {
      const verification = await verifyTransferProof({
        artifact: input.offerArtifact,
      });
      if (!verification.ok) {
        res.status(422).send({
          ok: false,
          error: "Transfer offer proof is invalid.",
          verification,
        });
        return;
      }

      const record = createSwapRecord(input);
      const store = await getStore();
      const created = await store.putGlobalSwapRecordIfAbsent(record.transferId, record);
      const stored = created.created
        ? record
        : await store.getGlobalSwapRecord(record.transferId);

      res.status(created.created ? 200 : 200).send({
        ok: true,
        created: created.created,
        offer: stored,
      });
    } catch (error) {
      res.status(422).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.get("/v1/pixpax/v2/swaps/inbox", async (req, res) => {
    const query = parseSwapListQuery(req.query, "recipientPublicKey");
    if (!query.actorPublicKey) {
      badRequest(res, "recipientPublicKey is required.");
      return;
    }

    try {
      const store = await getStore();
      const listed = await store.listGlobalSwapRecords({
        limit: query.limit,
      });
      const offers = sortSwapRecordsDesc(
        (listed.records || []).filter((record) =>
          recordMatchesInbox(record, query.actorPublicKey, query.status),
        ),
      ).slice(0, query.limit);

      res.status(200).send({
        ok: true,
        offers,
      });
    } catch (error) {
      res.status(500).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.get("/v1/pixpax/v2/swaps/outbox", async (req, res) => {
    const query = parseSwapListQuery(req.query, "senderPublicKey");
    if (!query.actorPublicKey) {
      badRequest(res, "senderPublicKey is required.");
      return;
    }

    try {
      const store = await getStore();
      const listed = await store.listGlobalSwapRecords({
        limit: query.limit,
      });
      const offers = sortSwapRecordsDesc(
        (listed.records || []).filter((record) =>
          recordMatchesOutbox(record, query.actorPublicKey, query.status),
        ),
      ).slice(0, query.limit);

      res.status(200).send({
        ok: true,
        offers,
      });
    } catch (error) {
      res.status(500).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.post("/v1/pixpax/v2/swaps/offers/:transferId/accept", async (req, res) => {
    const transferId = trim(req?.params?.transferId);
    const input = parseSwapAcceptBody(req.body);
    if (!transferId || !input.offerArtifact || !input.acceptanceArtifact) {
      badRequest(res, "transferId, offerArtifact, and acceptanceArtifact are required.");
      return;
    }

    try {
      await assertValidRecordTransferCommandInput({
        offerArtifact: input.offerArtifact,
        acceptanceArtifact: input.acceptanceArtifact,
      });
      const offerVerification = await verifyTransferProof({
        artifact: input.offerArtifact,
      });
      if (!offerVerification.ok) {
        res.status(422).send({
          ok: false,
          error: "Transfer offer proof is invalid.",
          verification: offerVerification,
        });
        return;
      }
      const acceptanceVerification = await verifyTransferAcceptanceProof({
        artifact: input.acceptanceArtifact,
      });
      if (!acceptanceVerification.ok) {
        res.status(422).send({
          ok: false,
          error: "Transfer acceptance proof is invalid.",
          verification: acceptanceVerification,
        });
        return;
      }

      const store = await getStore();
      const existing = await getSwapRecordOrNull(store, transferId);
      if (trim(existing?.transferId) !== transferId) {
        res.status(404).send({
          ok: false,
          error: "Swap offer not found.",
        });
        return;
      }
      if (
        trim(existing?.offerArtifact?.proof?.subject?.hash) !==
        trim(input.offerArtifact?.proof?.subject?.hash)
      ) {
        res.status(409).send({
          ok: false,
          error: "Swap offer does not match the stored pending offer.",
        });
        return;
      }
      if (trim(existing?.status) === "accepted" || trim(existing?.status) === "completed") {
        res.status(200).send({
          ok: true,
          offer: existing,
        });
        return;
      }

      const next = applyAcceptedSwapRecord(existing, input.acceptanceArtifact);
      await store.putGlobalSwapRecord(transferId, next);
      res.status(200).send({
        ok: true,
        offer: next,
      });
    } catch (error) {
      res.status(422).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.post("/v1/pixpax/v2/swaps/offers/:transferId/complete", async (req, res) => {
    const transferId = trim(req?.params?.transferId);
    const input = parseSwapOfferBody(req.body);
    if (!transferId || !input.offerArtifact) {
      badRequest(res, "transferId and offerArtifact are required.");
      return;
    }

    try {
      const verification = await verifyTransferProof({
        artifact: input.offerArtifact,
      });
      if (!verification.ok) {
        res.status(422).send({
          ok: false,
          error: "Transfer offer proof is invalid.",
          verification,
        });
        return;
      }

      const store = await getStore();
      const existing = await getSwapRecordOrNull(store, transferId);
      if (trim(existing?.transferId) !== transferId) {
        res.status(404).send({
          ok: false,
          error: "Swap offer not found.",
        });
        return;
      }
      if (trim(existing?.status) !== "accepted" && trim(existing?.status) !== "completed") {
        res.status(409).send({
          ok: false,
          error: "Swap is not ready to complete.",
        });
        return;
      }
      if (
        trim(existing?.offerArtifact?.proof?.subject?.hash) !==
        trim(input.offerArtifact?.proof?.subject?.hash)
      ) {
        res.status(409).send({
          ok: false,
          error: "Swap offer does not match the stored pending offer.",
        });
        return;
      }
      if (trim(existing?.senderCompletedAt)) {
        res.status(200).send({
          ok: true,
          offer: existing,
        });
        return;
      }

      const next = applyCompletedSwapRecord(existing, new Date().toISOString());
      await store.putGlobalSwapRecord(transferId, next);
      res.status(200).send({
        ok: true,
        offer: next,
      });
    } catch (error) {
      res.status(422).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.post("/v1/pixpax/v2/deterministic/preview", async (req, res) => {
    if (!(await requireAdminAccess(req, res))) return;
    const input = parseDeterministicBody(req.body);
    if (
      !input.collectionId ||
      !input.collectionVersion ||
      !input.dropId ||
      !input.claimantPublicKey
    ) {
      badRequest(
        res,
        "collectionId, collectionVersion, dropId, and claimantPublicKey are required.",
      );
      return;
    }

    try {
      const availableCards = await loadCollectionCards({
        collectionId: input.collectionId,
        collectionVersion: input.collectionVersion,
      });
      const issuance = await createDeterministicPackIssuance({
        claimant: {
          type: "identity-public-key",
          value: input.claimantPublicKey,
        },
        scope: {
          collectionId: input.collectionId,
          collectionVersion: input.collectionVersion,
        },
        drop: {
          dropId: input.dropId,
        },
        availableCards,
        count: input.count,
        issuedAt: new Date().toISOString(),
      });

      res.status(200).send({
        ok: true,
        issuance,
      });
    } catch (error) {
      res.status(422).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.post("/v1/pixpax/v2/deterministic/issue", async (req, res) => {
    if (!(await requireAdminAccess(req, res))) return;
    const input = parseDeterministicBody(req.body);
    if (
      !input.collectionId ||
      !input.collectionVersion ||
      !input.dropId ||
      !input.claimantPublicKey
    ) {
      badRequest(
        res,
        "collectionId, collectionVersion, dropId, and claimantPublicKey are required.",
      );
      return;
    }

    try {
      const issuerIdentity = resolveIssuerIdentity();
      const availableCards = await loadCollectionCards({
        collectionId: input.collectionId,
        collectionVersion: input.collectionVersion,
      });
      const issuance = await createDeterministicPackIssuance({
        claimant: {
          type: "identity-public-key",
          value: input.claimantPublicKey,
        },
        scope: {
          collectionId: input.collectionId,
          collectionVersion: input.collectionVersion,
        },
        drop: {
          dropId: input.dropId,
        },
        availableCards,
        count: input.count,
        issuedAt: new Date().toISOString(),
        issuerKeyId: issuerIdentity.keyId,
      });
      const artifact = await signPackIssuance({
        identity: issuerIdentity,
        issuance,
      });
      const verification = await verifyPackIssuanceProof({ artifact });

      res.status(200).send({
        ok: true,
        artifact,
        verification,
      });
    } catch (error) {
      res.status(422).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.post("/v1/pixpax/v2/designated/issue", async (req, res) => {
    if (!(await requireAdminAccess(req, res))) return;
    const input = parseDesignatedBody(req.body);
    if (
      !input.collectionId ||
      !input.collectionVersion ||
      !input.dropId ||
      !input.sourceCodeId ||
      !input.cardIds.length
    ) {
      badRequest(
        res,
        "collectionId, collectionVersion, dropId, sourceCodeId, and cardIds are required.",
      );
      return;
    }

    try {
      const issuerIdentity = resolveIssuerIdentity();
      const store = await getStore();
      const cards = await loadCollectionCards({
        collectionId: input.collectionId,
        collectionVersion: input.collectionVersion,
        selectedCardIds: input.cardIds,
      });
      const issuance = await createDesignatedPackIssuance({
        scope: {
          collectionId: input.collectionId,
          collectionVersion: input.collectionVersion,
        },
        drop: {
          dropId: input.dropId,
        },
        cards,
        issuedAt: new Date().toISOString(),
        issuerKeyId: issuerIdentity.keyId,
        sourceCodeId: input.sourceCodeId,
      });
      const artifact = await signPackIssuance({
        identity: issuerIdentity,
        issuance,
      });
      const verification = await verifyPackIssuanceProof({ artifact });
      const reserved = await reserveOpaqueCodeId(store, (codeId) => {
        const redeemUrl = createRedeemUrl(req, codeId);
        return {
          codeId,
          status: "active",
          kind: "v2-designated",
          collectionId: input.collectionId,
          version: input.collectionVersion,
          dropId: input.dropId,
          issuedAt: issuance.issuedAt,
          sourceCodeId: input.sourceCodeId,
          redeemUrl,
          artifact,
          artifactVersion: artifact?.payload?.version || "1",
          issuerKeyId: issuerIdentity.keyId,
        };
      });
      const qr = await buildQrSvg(reserved.payload.redeemUrl);
      await writeAdminCodeSummary(store, reserved.payload, null);

      res.status(200).send({
        ok: true,
        codeId: reserved.codeId,
        redeemUrl: reserved.payload.redeemUrl,
        qrSvg: qr.qrSvg,
        artifact,
        verification,
      });
    } catch (error) {
      res.status(422).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.get("/v1/pixpax/v2/designated/codes", async (req, res) => {
    if (!(await requireAdminAccess(req, res))) return;

    try {
      const store = await getStore();
      const filters = parseCodeListQuery(req.query);
      let listed = await store.listGlobalCodeSummaries({
        limit: Math.max(filters.limit * 3, filters.limit),
      });
      let sourceSummaries = Array.isArray(listed.summaries) ? listed.summaries : [];
      if (!sourceSummaries.length) {
        sourceSummaries = await backfillAdminCodeSummaries(
          store,
          Math.max(filters.limit * 3, filters.limit),
        );
      }
      const summaries = sourceSummaries.filter((summary) =>
        codeSummaryMatchesFilters(summary, filters),
      );

      summaries.sort((left, right) =>
        String(right.issuedAt || "").localeCompare(String(left.issuedAt || "")),
      );

      res.status(200).send({
        ok: true,
        codes: summaries.slice(0, filters.limit),
      });
    } catch (error) {
      const message = String(error?.message || error);
      res.status(message.includes("not available on this PixPax app") ? 404 : 500).send({
        ok: false,
        error: message,
      });
    }
  });

  router.post("/v1/pixpax/v2/designated/codes/:codeId/revoke", async (req, res) => {
    if (!(await requireAdminAccess(req, res))) return;
    const codeId = trim(req?.params?.codeId);
    if (!codeId) {
      badRequest(res, "codeId is required.");
      return;
    }

    try {
      const store = await getStore();
      const record = await store.getGlobalCodeRecord(codeId).catch(() => null);
      if (!record || trim(record?.kind) !== "v2-designated") {
        res.status(404).send({
          ok: false,
          error: "Designated code not found.",
        });
        return;
      }

      const alreadyRevoked = trim(record?.status) === "revoked";
      const revokedAt = trim(record?.revokedAt) || new Date().toISOString();
      const revokedReason = trim(req.body?.reason);
      const existingClaim =
        trim(record?.collectionId) && trim(record?.version)
          ? await store
              .getOverrideCodeUse(
                trim(record?.collectionId),
                trim(record?.version),
                codeId,
              )
              .catch(() => null)
          : null;
      const nextRecord = {
        ...record,
        status: "revoked",
        revokedAt,
        ...(revokedReason ? { revokedReason } : {}),
      };
      await store.putGlobalCodeRecord(codeId, nextRecord);
      const summary = await writeAdminCodeSummary(store, nextRecord, existingClaim);

      res.status(200).send({
        ok: true,
        alreadyRevoked,
        code: summary,
      });
    } catch (error) {
      res.status(500).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.get("/v1/pixpax/v2/collections/catalog", async (_req, res) => {
    try {
      const store = await getStore();
      const collectionIds = await store.listCollectionIds();
      const settled = await Promise.allSettled(
        collectionIds.map(async (collectionId) => {
          const bundle = await loadBundle({ collectionId });
          const visibility = trim(bundle.settings?.visibility || "public");
          if (visibility && visibility !== "public") {
            return null;
          }
          return {
            collectionId,
            resolvedVersion: bundle.resolvedVersion,
            name: trim(bundle.collection?.name) || collectionId,
            description: trim(bundle.collection?.description) || "",
            settings: bundle.settings || null,
          };
        }),
      );

      const collections = settled
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => result.value);

      collections.sort((left, right) =>
        String(left.collectionId).localeCompare(String(right.collectionId)),
      );

      res.status(200).send({
        ok: true,
        collections,
      });
    } catch (error) {
      res.status(500).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.get("/v1/pixpax/v2/collections/:collectionId/bundle", async (req, res) => {
    const collectionId = trim(req?.params?.collectionId);
    const version = trim(req?.query?.version);
    if (!collectionId) {
      badRequest(res, "collectionId is required.");
      return;
    }

    try {
      const bundle = await loadBundle({
        collectionId,
        collectionVersion: version,
      });

      res.status(200).send({
        ok: true,
        collectionId: bundle.collectionId,
        resolvedVersion: bundle.resolvedVersion,
        collection: bundle.collection,
        index: bundle.index,
        settings: bundle.settings,
        cards: bundle.cards,
      });
    } catch (error) {
      res.status(404).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.post("/v1/pixpax/v2/designated/redeem", async (req, res) => {
    const input = parseDesignatedRedeemBody(req.body);
    if (!input.code || !input.claimantPublicKey) {
      badRequest(res, "code and claimantPublicKey are required.");
      return;
    }

    try {
      const store = await getStore();
      const codeRecord = await store.getGlobalCodeRecord(input.code);
      if (trim(codeRecord?.kind) !== "v2-designated") {
        res.status(404).send({
          ok: false,
          error: "Designated code not found.",
        });
        return;
      }
      if (trim(codeRecord?.status) === "revoked") {
        res.status(410).send({
          ok: false,
          error: "This designated code has been revoked.",
          reason: "code-revoked",
        });
        return;
      }

      const collectionId = trim(codeRecord?.collectionId);
      const collectionVersion = trim(codeRecord?.version);
      assertAvailableCollection(collectionId, collectionVersion);
      const existingUse = await store
        .getOverrideCodeUse(collectionId, collectionVersion, input.code)
        .catch(() => null);

      if (existingUse) {
        const recoveredRecord =
          trim(codeRecord?.status) === "claimed" &&
          trim(codeRecord?.claimedAt) &&
          trim(codeRecord?.claimantPublicKey)
            ? codeRecord
            : {
                ...codeRecord,
                status: "claimed",
                claimedAt: trim(existingUse?.claimedAt) || new Date().toISOString(),
                claimantPublicKey: trim(existingUse?.claimantPublicKey) || input.claimantPublicKey,
                claimantHash:
                  trim(existingUse?.claimantHash) || hashClaimantPublicKey(input.claimantPublicKey),
              };
        if (recoveredRecord !== codeRecord) {
          await store.putGlobalCodeRecord(input.code, recoveredRecord);
        }
        await writeAdminCodeSummary(store, recoveredRecord, existingUse);
        if (!matchesClaimant(existingUse, input.claimantPublicKey)) {
          res.status(409).send({
            ok: false,
            error: "Already claimed.",
            reason: "already-claimed",
            claimed: createAlreadyClaimedPayload(existingUse),
          });
          return;
        }

        const artifact = codeRecord?.artifact;
        const verification = await verifyPackIssuanceProof({ artifact });
        if (!verification.ok) {
          res.status(422).send({
            ok: false,
            error: "Stored designated artifact is invalid.",
            verification,
          });
          return;
        }

        res.status(200).send({
          ok: true,
          artifact,
          recovered: true,
          claim: {
            codeId: input.code,
            claimedAt: trim(existingUse?.claimedAt) || new Date().toISOString(),
            sourceCodeId: trim(codeRecord?.sourceCodeId) || null,
            policyConfirmed: true,
            source: "server-designated-claim",
            claimantPublicKey: trim(existingUse?.claimantPublicKey) || input.claimantPublicKey,
          },
          verification,
        });
        return;
      }

      const artifact = codeRecord?.artifact;
      const verification = await verifyPackIssuanceProof({ artifact });
      if (!verification.ok) {
        res.status(422).send({
          ok: false,
          error: "Stored designated artifact is invalid.",
          verification,
        });
        return;
      }

      const claimedAt = new Date().toISOString();
      const claimRecord = {
        codeId: input.code,
        claimedAt,
        claimantPublicKey: input.claimantPublicKey,
        claimantHash: hashClaimantPublicKey(input.claimantPublicKey),
        packId: trim(artifact?.payload?.packId),
        dropId: trim(codeRecord?.dropId),
        sourceCodeId: trim(codeRecord?.sourceCodeId),
      };
      const claimed = await store.putOverrideCodeUseIfAbsent(
        collectionId,
        collectionVersion,
        input.code,
        claimRecord,
      );
      if (!claimed?.created) {
        const currentUse = await store
          .getOverrideCodeUse(collectionId, collectionVersion, input.code)
          .catch(() => null);
        if (!matchesClaimant(currentUse, input.claimantPublicKey)) {
          res.status(409).send({
            ok: false,
            error: "Already claimed.",
            reason: "already-claimed",
            claimed: createAlreadyClaimedPayload(currentUse),
          });
          return;
        }

        await writeAdminCodeSummary(
          store,
          {
            ...codeRecord,
            status: "claimed",
            claimedAt: trim(currentUse?.claimedAt) || claimedAt,
            claimantPublicKey: trim(currentUse?.claimantPublicKey) || input.claimantPublicKey,
            claimantHash:
              trim(currentUse?.claimantHash) || hashClaimantPublicKey(input.claimantPublicKey),
          },
          currentUse,
        );

        res.status(200).send({
          ok: true,
          artifact,
          recovered: true,
          claim: {
            codeId: input.code,
            claimedAt: trim(currentUse?.claimedAt) || claimedAt,
            sourceCodeId: trim(codeRecord?.sourceCodeId) || null,
            policyConfirmed: true,
            source: "server-designated-claim",
            claimantPublicKey: trim(currentUse?.claimantPublicKey) || input.claimantPublicKey,
          },
          verification,
        });
        return;
      }

      const claimedRecord = {
        ...codeRecord,
        status: "claimed",
        claimedAt,
        claimantPublicKey: input.claimantPublicKey,
        claimantHash: claimRecord.claimantHash,
      };
      await store.putGlobalCodeRecord(input.code, claimedRecord);
      await writeAdminCodeSummary(store, claimedRecord, claimRecord);

      res.status(200).send({
        ok: true,
        artifact,
        claim: {
          codeId: input.code,
          claimedAt,
          sourceCodeId: trim(codeRecord?.sourceCodeId) || null,
          policyConfirmed: true,
          source: "server-designated-claim",
          claimantPublicKey: input.claimantPublicKey,
        },
        verification,
      });
    } catch (error) {
      res.status(500).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });

  router.post("/v1/pixpax/v2/proofs/verify", async (req, res) => {
    const artifact =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : null;
    if (!artifact) {
      badRequest(res, "artifact body is required.");
      return;
    }

    try {
      const verification = await verifyPackIssuanceProof({ artifact });
      res.status(200).send({
        ok: true,
        verification,
      });
    } catch (error) {
      res.status(422).send({
        ok: false,
        error: String(error?.message || error),
      });
    }
  });
}
