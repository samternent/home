import { getEntrySigningPayload } from "@ternent/concord-protocol";
import { createHash, webcrypto } from "node:crypto";
import { hashCanonical } from "../../stickerbook/stickerbook-utils.mjs";
import { loadIssuerKeys } from "../../stickerbook/index.mjs";
import { PACK_MODELS } from "../models/pack-models.mjs";
import { computeMerkleRootFromItemHashes, hashAlbumCard } from "../collections/curated-hashing.mjs";

function normalizePublicKeyPem(value) {
  const normalized = String(value || "").replace(/\\n/g, "\n").trim();
  if (!normalized) return "";
  if (normalized.includes("BEGIN PUBLIC KEY")) return normalized;
  return `-----BEGIN PUBLIC KEY-----\n${normalized}\n-----END PUBLIC KEY-----`;
}

function publicPemToDer(pem) {
  const stripped = normalizePublicKeyPem(pem)
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replaceAll("\n", "");
  return Buffer.from(stripped, "base64");
}

async function verifyEntrySignature(entry, publicKeyPem) {
  const signature = String(entry?.signature || "").trim();
  if (!signature) return false;
  const subtle = webcrypto?.subtle || globalThis.crypto?.subtle;
  if (!subtle) throw new Error("WebCrypto subtle is not available.");

  const key = await subtle.importKey(
    "spki",
    publicPemToDer(publicKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );

  const signingPayload = getEntrySigningPayload(entry);
  return subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    Buffer.from(signature, "base64"),
    new TextEncoder().encode(signingPayload)
  );
}

function fingerprintPublicKey(publicKeyPem) {
  const normalized = normalizePublicKeyPem(publicKeyPem);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function fail(reason, details = {}) {
  return {
    ok: false,
    reason,
    details,
  };
}

function normalizePackSource(input) {
  const source = input || {};

  if (source.kind === "pack.issued" && source.payload) {
    return {
      payload: source.payload,
      issuerSignature: source.signature || null,
      issuerAuthor: source.author || null,
      issuerKeyId: source.payload?.issuerKeyId || null,
      entryTimestamp: source.timestamp || null,
    };
  }

  if (source.entry?.kind === "pack.issued" && source.entry?.payload) {
    return {
      payload: source.entry.payload,
      issuerSignature: source.entry.signature || null,
      issuerAuthor: source.entry.author || null,
      issuerKeyId: source.entry.payload?.issuerKeyId || null,
      entryTimestamp: source.entry.timestamp || null,
    };
  }

  if (source.type === "pack.issued" && source.payload) {
    return {
      payload: source.payload,
      issuerSignature: source.payload?.issuerSignature || null,
      issuerAuthor: source.payload?.issuerAuthor || null,
      issuerKeyId: source.payload?.issuerKeyId || null,
      entryTimestamp: source.payload?.entryTimestamp || null,
    };
  }

  if (source.packId && source.collectionId) {
    return {
      payload: source,
      issuerSignature: source.issuerSignature || null,
      issuerAuthor: source.issuerAuthor || null,
      issuerKeyId: source.issuerKeyId || null,
      entryTimestamp: source.entryTimestamp || source.issuedAt || null,
    };
  }

  return {
    payload: null,
    issuerSignature: null,
    issuerAuthor: null,
    issuerKeyId: null,
    entryTimestamp: null,
  };
}

async function resolveTrustedIssuerKeys(inputMap = {}) {
  const map = new Map();
  for (const [keyId, publicKeyPem] of Object.entries(inputMap || {})) {
    const normalized = normalizePublicKeyPem(publicKeyPem);
    if (!normalized) continue;
    map.set(String(keyId), normalized);
  }
  if (map.size > 0) return map;

  try {
    const keys = await loadIssuerKeys();
    if (keys?.issuerKeyId && keys?.publicKeyPem) {
      map.set(String(keys.issuerKeyId), normalizePublicKeyPem(keys.publicKeyPem));
    }
  } catch {
    // No configured issuer key in local env; caller may provide explicit trusted map.
  }

  const envPublicKey = normalizePublicKeyPem(process.env.ISSUER_PUBLIC_KEY_PEM || "");
  if (envPublicKey) {
    map.set(fingerprintPublicKey(envPublicKey), envPublicKey);
  }

  return map;
}

function buildEntryPayloadForSignature(params) {
  if (params.signedEntryPayload && typeof params.signedEntryPayload === "object") {
    return params.signedEntryPayload;
  }

  return {
    type: "pack.issued",
    packModel: PACK_MODELS.ALBUM,
    packId: params.packId,
    issuedAt: params.issuedAt,
    issuerKeyId: params.issuerKeyId || null,
    issuedBy: params.issuerAuthor || null,
    issuedTo: params.issuedTo || "",
    userKeyHash: params.issuedTo || "",
    dropId: params.dropId,
    collectionId: params.collectionId,
    collectionVersion: params.collectionVersion,
    cardIds: params.cardIds || [],
    count: params.count || 0,
    packRoot: params.packRoot,
    itemHashes: params.itemHashes || [],
    contentsCommitment: params.contentsCommitment || "",
  };
}

export async function verifyPack(params) {
  const store = params?.store;
  if (!store) {
    throw new Error("verifyPack requires params.store.");
  }

  const trustedIssuerPublicKeysById = params?.trustedIssuerPublicKeysById || {};
  const normalized = normalizePackSource(params?.packEntry || null);

  let payload = normalized.payload;
  let sourceCollectionId = String(params?.collectionId || "").trim();
  let sourceVersion = String(params?.version || params?.collectionVersion || "").trim();
  const requestedPackId = String(params?.packId || "").trim();

  if (!payload) {
    if (!requestedPackId) {
      return fail("missing-pack-id", { message: "verifyPack requires packId or packEntry." });
    }
    if (!sourceCollectionId || !sourceVersion) {
      return fail("missing-pack-scope", {
        message: "verifyPack(packId) requires collectionId and version.",
      });
    }
    const events = await store.replayEvents(sourceCollectionId, sourceVersion);
    const packEvent = events.find(
      (event) => event?.type === "pack.issued" && String(event?.payload?.packId || "") === requestedPackId
    );
    if (!packEvent) {
      return fail("pack-not-found", {
        packId: requestedPackId,
        collectionId: sourceCollectionId,
        version: sourceVersion,
      });
    }
    payload = packEvent.payload;
    normalized.issuerSignature = payload?.issuerSignature || null;
    normalized.issuerAuthor = payload?.issuerAuthor || null;
    normalized.issuerKeyId = payload?.issuerKeyId || null;
    normalized.entryTimestamp = payload?.entryTimestamp || null;
  }

  const packId = String(payload?.packId || requestedPackId || "").trim();
  const collectionId = String(payload?.collectionId || sourceCollectionId || "").trim();
  const collectionVersion = String(payload?.collectionVersion || sourceVersion || "").trim();
  const dropId = String(payload?.dropId || "").trim();
  const cardIds = Array.isArray(payload?.cardIds) ? payload.cardIds.map((value) => String(value || "").trim()) : [];
  const itemHashes = Array.isArray(payload?.itemHashes)
    ? payload.itemHashes.map((value) => String(value || "").trim())
    : [];
  const packRoot = String(payload?.packRoot || "").trim();
  const contentsCommitment = String(payload?.contentsCommitment || "").trim();
  const issuerKeyId = String(payload?.issuerKeyId || normalized.issuerKeyId || "").trim();
  const issuerSignature = String(payload?.issuerSignature || normalized.issuerSignature || "").trim();
  const issuerAuthor = String(payload?.issuerAuthor || normalized.issuerAuthor || "");
  const issuedAt = String(payload?.issuedAt || normalized.entryTimestamp || "").trim();
  const issuedTo = String(payload?.issuedTo || payload?.userKeyHash || "").trim();
  const isUntracked = payload?.untracked === true || String(payload?.issuanceMode || "") === "dev-untracked";

  if (!packId) return fail("missing-pack-id", { payload });
  if (!collectionId || !collectionVersion) {
    return fail("missing-collection-scope", { collectionId, collectionVersion });
  }
  if (!cardIds.length) return fail("missing-card-ids", { packId });
  if (!itemHashes.length) return fail("missing-item-hashes", { packId });
  if (cardIds.length !== itemHashes.length) {
    return fail("item-hash-length-mismatch", {
      cardCount: cardIds.length,
      itemHashCount: itemHashes.length,
    });
  }
  if (!packRoot) return fail("missing-pack-root", { packId });

  let index;
  try {
    index = await store.getIndex(collectionId, collectionVersion);
  } catch (error) {
    return fail("missing-index", { error: String(error?.message || error) });
  }

  const listedSeriesIds = new Set(
    (Array.isArray(index?.series) ? index.series : [])
      .map((entry) => String(entry?.seriesId || "").trim())
      .filter(Boolean)
  );
  const cardMap = index?.cardMap || {};
  for (const cardId of cardIds) {
    const mapped = cardMap?.[cardId] || null;
    if (!mapped) {
      return fail("card-missing-from-index", { cardId });
    }
    const mappedSeriesId = String(mapped?.seriesId || "").trim();
    if (!mappedSeriesId) {
      return fail("card-missing-series", { cardId });
    }
    if (listedSeriesIds.size > 0 && !listedSeriesIds.has(mappedSeriesId)) {
      return fail("card-series-not-declared", {
        cardId,
        seriesId: mappedSeriesId,
      });
    }
  }

  const recomputedItemHashes = [];
  for (const cardId of cardIds) {
    let card;
    try {
      card = await store.getCard(collectionId, collectionVersion, cardId);
    } catch (error) {
      return fail("card-content-missing", {
        cardId,
        error: String(error?.message || error),
      });
    }
    const mapped = cardMap?.[cardId] || {};
    const effectiveSeriesId = String(card?.seriesId || mapped?.seriesId || "").trim();
    if (!effectiveSeriesId) {
      return fail("card-series-missing", { cardId });
    }

    recomputedItemHashes.push(
      hashAlbumCard({
        collectionId,
        collectionVersion,
        cardId,
        renderPayload: card?.renderPayload || {},
      })
    );
  }

  for (let i = 0; i < itemHashes.length; i += 1) {
    if (itemHashes[i] !== recomputedItemHashes[i]) {
      return fail("item-hashes-mismatch", {
        index: i,
        expected: itemHashes[i],
        actual: recomputedItemHashes[i],
      });
    }
  }

  const recomputedRoot = computeMerkleRootFromItemHashes(recomputedItemHashes);
  if (recomputedRoot !== packRoot) {
    return fail("pack-root-mismatch", {
      expected: packRoot,
      actual: recomputedRoot,
    });
  }

  const recomputedCommitment = hashCanonical({
    itemHashes: recomputedItemHashes,
    count: cardIds.length,
    packRoot: recomputedRoot,
  });
  if (contentsCommitment && recomputedCommitment !== contentsCommitment) {
    return fail("contents-commitment-mismatch", {
      expected: contentsCommitment,
      actual: recomputedCommitment,
    });
  }

  if (!isUntracked) {
    if (!issuerKeyId) {
      return fail("missing-issuer-key-id", { packId });
    }
    if (!issuerSignature) {
      return fail("missing-signature", { packId });
    }
    if (!issuerAuthor.trim()) {
      return fail("missing-issuer-author", { packId });
    }

    const trustedKeys = await resolveTrustedIssuerKeys(trustedIssuerPublicKeysById);
    const publicKeyPem = trustedKeys.get(issuerKeyId) || null;
    if (!publicKeyPem) {
      return fail("issuer-key-not-trusted", {
        issuerKeyId,
        trustedKeyIds: [...trustedKeys.keys()],
      });
    }

    const signatureEntry = {
      kind: "pack.issued",
      timestamp: issuedAt || new Date().toISOString(),
      author: issuerAuthor,
      payload: buildEntryPayloadForSignature({
        ...payload,
        packId,
        collectionId,
        collectionVersion,
        dropId,
        cardIds,
        count: cardIds.length,
        packRoot,
        itemHashes: recomputedItemHashes,
        contentsCommitment: recomputedCommitment,
        issuerKeyId,
        issuerAuthor,
        issuedAt: issuedAt || new Date().toISOString(),
      }),
      signature: issuerSignature,
    };

    const signatureValid = await verifyEntrySignature(signatureEntry, publicKeyPem);
    if (!signatureValid) {
      return fail("signature-invalid", { issuerKeyId });
    }
  }

  return {
    ok: true,
    packId,
    collectionId,
    collectionVersion,
    dropId,
    checks: {
      exists: true,
      seriesReference: true,
      itemHashes: true,
      merkleRoot: true,
      contentsCommitment: true,
      signature: isUntracked ? "skipped-untracked" : true,
    },
  };
}
