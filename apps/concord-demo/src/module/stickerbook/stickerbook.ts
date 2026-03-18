import { getEntrySigningPayload } from "@ternent/concord-protocol";
import { importPublicKeyFromPem, verify } from "ternent-identity";
import { derivePackSeed, hashCanonical } from "./crypto";
import { computeMerkleRoot } from "./merkle";
import { generatePack, deriveKitFromCatalogue } from "./generator";

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function hashToUnit(input: string) {
  return (hashString(input) % 1000000) / 1000000;
}

export function hashToRange(input: string, min: number, max: number) {
  return min + (max - min) * hashToUnit(input);
}

export function buildSparklePositions(seed: string, count = 6) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    points.push({
      x: hashToRange(`${seed}:x:${i}`, 20, 180),
      y: hashToRange(`${seed}:y:${i}`, 20, 180),
      r: hashToRange(`${seed}:r:${i}`, 3, 9),
    });
  }
  return points;
}

function normalizePublicKeyPem(value: string) {
  if (!value) return value;
  const normalized = value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
  if (normalized.includes("BEGIN PUBLIC KEY")) return normalized.trim();
  return `-----BEGIN PUBLIC KEY-----\n${normalized.trim()}\n-----END PUBLIC KEY-----`;
}

export async function verifyIssuerSignature(
  entry: any,
  issuerPublicKeyPem: string
) {
  if (!entry?.signature) return false;
  const publicKey = await importPublicKeyFromPem(
    normalizePublicKeyPem(issuerPublicKeyPem)
  );
  const payload = getEntrySigningPayload(entry);
  return verify(entry.signature, payload, publicKey);
}

export async function verifyCommitRevealConsistency(commit: any, issue: any) {
  const commitPayload = commit?.payload;
  const issuePayload = issue?.payload;
  if (!commitPayload || !issuePayload) return false;
  if (commitPayload.packRequestId !== issuePayload.packRequestId) return false;

  const expectedServerCommit = await hashCanonical(issuePayload.serverSecret);
  if (expectedServerCommit !== commitPayload.serverCommit) return false;

  const expectedClientNonceHash = await hashCanonical(issuePayload.clientNonce);
  if (expectedClientNonceHash !== commitPayload.clientNonceHash) return false;

  const expectedPackSeed = await derivePackSeed({
    serverSecret: issuePayload.serverSecret,
    clientNonce: issuePayload.clientNonce,
    packRequestId: issuePayload.packRequestId,
    seriesId: issuePayload.seriesId,
    themeId: issuePayload.themeId,
  });

  return expectedPackSeed === issuePayload.packSeed;
}

export async function verifyCommitRevealFromPayloads(params: {
  commitPayload: any;
  revealPayload: any;
}) {
  const commitPayload = params.commitPayload;
  const revealPayload = params.revealPayload;
  if (!commitPayload || !revealPayload) return false;
  if (commitPayload.packRequestId !== revealPayload.packRequestId) return false;

  const expectedServerCommit = await hashCanonical(revealPayload.serverSecret);
  if (expectedServerCommit !== commitPayload.serverCommit) return false;

  const expectedClientNonceHash = await hashCanonical(revealPayload.clientNonce);
  if (expectedClientNonceHash !== commitPayload.clientNonceHash) return false;

  const expectedPackSeed = await derivePackSeed({
    serverSecret: revealPayload.serverSecret,
    clientNonce: revealPayload.clientNonce,
    packRequestId: revealPayload.packRequestId,
    seriesId: revealPayload.seriesId,
    themeId: revealPayload.themeId,
  });

  if (!revealPayload.packSeed) {
    return true;
  }
  return expectedPackSeed === revealPayload.packSeed;
}

export async function recomputePackSeed(issue: any) {
  const payload = issue?.payload;
  if (!payload) return null;
  return derivePackSeed({
    serverSecret: payload.serverSecret,
    clientNonce: payload.clientNonce,
    packRequestId: payload.packRequestId,
    seriesId: payload.seriesId,
    themeId: payload.themeId,
  });
}

export async function recomputePackRoot(params: {
  packSeed: string;
  seriesId: string;
  themeId: string;
  count: number;
  algoVersion: string;
  kitJson: any;
}) {
  const entries = generatePack({
    packSeed: params.packSeed,
    seriesId: params.seriesId,
    themeId: params.themeId,
    count: params.count,
    algoVersion: params.algoVersion,
    kitJson: params.kitJson,
  });
  return computeMerkleRoot(entries);
}

export async function verifyPackIssue(params: {
  commit: any;
  issue: any;
  issuerPublicKeyPem: string;
  catalogue: any;
  reveal?: any;
}) {
  const commitOk = await verifyIssuerSignature(
    params.commit,
    params.issuerPublicKeyPem
  );
  if (!commitOk) return { ok: false, reason: "commit-signature" } as const;

  const issueOk = await verifyIssuerSignature(
    params.issue,
    params.issuerPublicKeyPem
  );
  if (!issueOk) return { ok: false, reason: "issue-signature" } as const;

  const payload = params.issue?.payload;
  const revealPayload = params.reveal || null;

  if (payload?.type === "pack.issue") {
    const revealOk = await verifyCommitRevealConsistency(
      params.commit,
      params.issue
    );
    if (!revealOk) return { ok: false, reason: "commit-reveal" } as const;
  } else if (payload?.type === "pack.issued") {
    if (!revealPayload) {
      return { ok: false, reason: "missing-reveal" } as const;
    }
    const revealOk = await verifyCommitRevealFromPayloads({
      commitPayload: params.commit?.payload,
      revealPayload,
    });
    if (!revealOk) return { ok: false, reason: "commit-reveal" } as const;
  } else {
    return { ok: false, reason: "unsupported-issue-type" } as const;
  }

  const kitJson = deriveKitFromCatalogue(params.catalogue);
  const kitHash = await hashCanonical(kitJson);
  if (kitHash !== payload?.kitHash) {
    return { ok: false, reason: "kit-hash" } as const;
  }

  const themeHash = await hashCanonical({
    themeId: params.catalogue?.themeId ?? payload?.themeId,
    themeVersion:
      params.catalogue?.themeVersion ??
      params.catalogue?.version ??
      "1.0.0",
  });
  if (themeHash !== payload?.themeHash) {
    return { ok: false, reason: "theme-hash" } as const;
  }

  let resolvedEntries: any[] = [];
  let recomputedRoot = "";
  const seedForRecompute = revealPayload?.packSeed || payload.packSeed;
  if (seedForRecompute) {
    resolvedEntries = generatePack({
      packSeed: seedForRecompute,
      seriesId: payload.seriesId,
      themeId: payload.themeId,
      count: payload.count,
      algoVersion: payload.algoVersion,
      kitJson,
    });
    recomputedRoot = await computeMerkleRoot(resolvedEntries);
  } else if (Array.isArray(revealPayload?.entries)) {
    resolvedEntries = revealPayload.entries;
    recomputedRoot = await computeMerkleRoot(resolvedEntries);
  } else {
    return { ok: false, reason: "missing-pack-derivation" } as const;
  }

  if (recomputedRoot !== payload.packRoot) {
    return { ok: false, reason: "pack-root" } as const;
  }

  if (Array.isArray(payload.itemHashes)) {
    const recomputedItemHashes = await Promise.all(
      resolvedEntries.map((entry: any) => hashCanonical(entry))
    );
    if (
      recomputedItemHashes.length !== payload.itemHashes.length ||
      recomputedItemHashes.some(
        (itemHash, index) => itemHash !== payload.itemHashes[index]
      )
    ) {
      return { ok: false, reason: "item-hashes" } as const;
    }
  }

  if (payload.contentsCommitment) {
    const itemHashes = await Promise.all(
      resolvedEntries.map((entry: any) => hashCanonical(entry))
    );
    const expectedContentsCommitment = await hashCanonical({
      itemHashes,
      count: payload.count,
      packRoot: payload.packRoot,
    });
    if (expectedContentsCommitment !== payload.contentsCommitment) {
      return { ok: false, reason: "contents-commitment" } as const;
    }
  }

  return {
    ok: true,
    kitJson,
    entries: resolvedEntries,
  } as const;
}
