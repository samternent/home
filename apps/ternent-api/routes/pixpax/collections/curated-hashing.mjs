import { createHash } from "node:crypto";
import { canonicalStringify } from "@ternent/concord-protocol";
import { PACK_MODELS } from "../models/pack-models.mjs";

function sha256HexUtf8(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hashCanonical(value) {
  return sha256HexUtf8(canonicalStringify(value));
}

export function buildCanonicalAlbumCardObject({
  collectionId,
  collectionVersion,
  cardId,
  renderPayload,
}) {
  const base = {
    v: 1,
    packModel: PACK_MODELS.ALBUM,
    collectionId: String(collectionId || "").trim(),
    collectionVersion: String(collectionVersion || "").trim(),
    cardId: String(cardId || "").trim(),
    renderPayload: {
      gridSize: Number(renderPayload?.gridSize),
      gridB64: String(renderPayload?.gridB64 || ""),
    },
  };

  if (renderPayload && Object.prototype.hasOwnProperty.call(renderPayload, "palette")) {
    base.renderPayload.palette = renderPayload.palette;
  }

  return base;
}

export function canonicalAlbumCardBytes(params) {
  const canonical = buildCanonicalAlbumCardObject(params);
  return Buffer.from(canonicalStringify(canonical), "utf8");
}

export function hashAlbumCard(params) {
  const canonicalBytes = canonicalAlbumCardBytes(params);
  return sha256HexUtf8(canonicalBytes.toString("utf8"));
}

// Mirrors stickerbook merkle combining logic, but accepts pre-hashed leaves.
export function computeMerkleRootFromItemHashes(itemHashes) {
  const leaves = Array.isArray(itemHashes) ? itemHashes.map((value) => String(value)) : [];
  if (!leaves.length) return hashCanonical([]);

  let level = leaves.slice();
  while (level.length > 1) {
    const next = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      const right = level[index + 1] ?? level[index];
      next.push(hashCanonical({ left, right }));
    }
    level = next;
  }

  return level[0];
}
