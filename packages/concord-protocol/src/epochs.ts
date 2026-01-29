import { canonicalStringify } from "./canonical";
import { sha256Hex } from "./crypto";
import { utf8Bytes } from "./encoding";
import { getCommitChain, type Entry } from "./index";

export const EPOCH_TAG = "concord-epoch@1.0";

export function canonicalizeIdentityKey(value: string): string {
  return (value || "").replace(/\s/g, "");
}

export function canonicalizeAgeRecipient(value: string): string {
  return (value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export async function deriveSignerKeyId(publicIdentityKey: string) {
  return sha256Hex(utf8Bytes(canonicalizeIdentityKey(publicIdentityKey)));
}

export async function deriveEpochId(params: {
  signerKeyId: string;
  encryptionPublicKey: string;
  prevEpochId: string | null;
  createdAt: string;
}) {
  const canonical = canonicalStringify({
    tag: EPOCH_TAG,
    createdAt: params.createdAt,
    encryptionPublicKey: canonicalizeAgeRecipient(params.encryptionPublicKey),
    prevEpochId: params.prevEpochId ?? null,
    signerKeyId: params.signerKeyId,
  });
  return sha256Hex(utf8Bytes(canonical));
}

export type EpochValidationError = {
  code: string;
  message: string;
  commitId?: string;
  entryId?: string;
};

export type EpochValidationResult = {
  ok: boolean;
  errors: EpochValidationError[];
  legacyEpochPlacement: boolean;
};

type EpochPayload = {
  type?: string;
  epochId?: string;
  prevEpochId?: string | null;
  createdAt?: string;
  encryptionPublicKey?: string;
  encryptionKeyId?: string;
  signerKeyId?: string;
};

type EpochEntry = Entry & { payload?: EpochPayload };

export type EpochChainItem = {
  entryId: string;
  commitId: string;
  entry: EpochEntry;
};

type PayloadObject = Record<string, unknown>;

function isPayloadObject(payload: unknown): payload is PayloadObject {
  return !!payload && typeof payload === "object" && !Array.isArray(payload);
}

function isEntryAfterCommit(entryTimestamp: string, commitTimestamp: string) {
  const entryTime = Date.parse(entryTimestamp);
  const commitTime = Date.parse(commitTimestamp);
  if (!Number.isFinite(entryTime) || !Number.isFinite(commitTime)) {
    return false;
  }
  return entryTime > commitTime;
}

export function getEpochChain(ledger: {
  commits: Record<
    string,
    { parent: string | null; entries: string[]; timestamp: string }
  >;
  entries: Record<string, EpochEntry>;
  head: string;
}): EpochChainItem[] {
  const epochs: EpochChainItem[] = [];
  const chain = getCommitChain(ledger as any);
  for (const commitId of chain) {
    const commit = ledger.commits[commitId];
    for (const entryId of commit.entries || []) {
      const entry = ledger.entries[entryId];
      if (!entry || entry.kind !== "epochs" || entry.payload?.type !== "epoch") {
        continue;
      }
      epochs.push({ entryId, commitId, entry });
    }
  }
  return epochs;
}

export async function getActiveEpoch(
  ledger: {
    commits: Record<
      string,
      { parent: string | null; entries: string[]; timestamp: string }
    >;
    entries: Record<string, EpochEntry>;
    head: string;
  },
  options?: {
    verifyEntrySignature?: (entry: EpochEntry) => Promise<boolean> | boolean;
  }
): Promise<
  | { ok: true; epoch: EpochEntry }
  | { ok: false; errors: EpochValidationError[] }
> {
  const validation = await validateLedgerEpochs(ledger, options);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }
  const epochs = getEpochChain(ledger);
  if (epochs.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: "EPOCH_GENESIS_MISSING",
          message: "Genesis commit must include exactly one epoch entry.",
          commitId: getCommitChain(ledger as any)[0],
        },
      ],
    };
  }
  return { ok: true, epoch: epochs[epochs.length - 1].entry };
}

export async function validateLedgerEpochs(
  ledger: {
    commits: Record<
      string,
      { parent: string | null; entries: string[]; timestamp: string }
    >;
    entries: Record<string, EpochEntry>;
    head: string;
  },
  options?: {
    verifyEntrySignature?: (entry: EpochEntry) => Promise<boolean> | boolean;
  }
): Promise<EpochValidationResult> {
  const errors: EpochValidationError[] = [];
  let legacyEpochPlacement = false;

  const chain = getCommitChain(ledger as any);
  const genesisId = chain[0];
  for (const commitId of chain) {
    const commit = ledger.commits[commitId];
    for (const entryId of commit.entries || []) {
      const entry = ledger.entries[entryId];
      if (entry && isEntryAfterCommit(entry.timestamp, commit.timestamp)) {
        errors.push({
          code: "ENTRY_TIMESTAMP_AFTER_COMMIT",
          message: "Entry timestamp must be on or before its commit timestamp.",
          commitId,
          entryId,
        });
      }
    }
  }

  const epochEntryIds = Object.keys(ledger.entries || {}).filter((entryId) => {
    const entry = ledger.entries[entryId];
    return entry?.kind === "epochs" && entry?.payload?.type === "epoch";
  });

  const genesisCommit = ledger.commits[genesisId];
  const genesisEpochEntryIds = (genesisCommit.entries || []).filter(
    (entryId) => {
      const entry = ledger.entries[entryId];
      return entry?.kind === "epochs" && entry?.payload?.type === "epoch";
    }
  );

  if (genesisEpochEntryIds.length === 0) {
    errors.push({
      code: "EPOCH_GENESIS_MISSING",
      message: "Genesis commit must include exactly one epoch entry.",
      commitId: genesisId,
    });
    legacyEpochPlacement = epochEntryIds.length > 0;
  } else if (genesisEpochEntryIds.length > 1) {
    errors.push({
      code: "EPOCH_GENESIS_MULTIPLE",
      message: "Genesis commit must include exactly one epoch entry.",
      commitId: genesisId,
    });
  }

  let lastEpochId: string | null = null;
  let prevNullEpochCount = 0;
  for (const commitId of chain) {
    const commit = ledger.commits[commitId];
    for (const entryId of commit.entries || []) {
      const entry = ledger.entries[entryId];
      if (!entry || entry.kind !== "epochs" || entry.payload?.type !== "epoch") {
        continue;
      }

      const payload = entry.payload ?? {};
      const isGenesisEpoch = commitId === genesisId;

      if (payload.prevEpochId === null) {
        prevNullEpochCount += 1;
      }

      if (!isGenesisEpoch && payload.prevEpochId === null) {
        errors.push({
          code: "EPOCH_PREV_NULL_OUTSIDE_GENESIS",
          message: "Epoch prevEpochId must not be null outside genesis.",
          commitId,
          entryId,
        });
      }

      if (isGenesisEpoch && payload.prevEpochId !== null) {
        errors.push({
          code: "EPOCH_CHAIN_BROKEN",
          message: "Genesis epoch must have prevEpochId null.",
          commitId,
          entryId,
        });
      }

      if (lastEpochId && payload.prevEpochId !== lastEpochId) {
        errors.push({
          code: "EPOCH_CHAIN_BROKEN",
          message: "Epoch prevEpochId must equal the previous epochId.",
          commitId,
          entryId,
        });
      }

      if (!lastEpochId && !isGenesisEpoch && payload.prevEpochId) {
        legacyEpochPlacement = true;
      }

      const signerKeyId = await deriveSignerKeyId(entry.author);
      if (payload.signerKeyId !== signerKeyId) {
        errors.push({
          code: "SIGNER_KEY_ID_MISMATCH",
          message: "Epoch signerKeyId does not match author identity.",
          commitId,
          entryId,
        });
      }

      const derivedEpochId: string = await deriveEpochId({
        signerKeyId,
        encryptionPublicKey: canonicalizeAgeRecipient(
          payload.encryptionPublicKey || ""
        ),
        prevEpochId: payload.prevEpochId ?? null,
        createdAt: payload.createdAt || "",
      });

      if (payload.epochId !== derivedEpochId) {
        errors.push({
          code: "EPOCH_ID_MISMATCH",
          message: "EpochId does not match deterministic hash.",
          commitId,
          entryId,
        });
      }

      if (payload.encryptionKeyId !== payload.epochId) {
        errors.push({
          code: "EPOCH_ID_MISMATCH",
          message: "encryptionKeyId must equal epochId.",
          commitId,
          entryId,
        });
      }

      if (payload.createdAt !== entry.timestamp) {
        errors.push({
          code: "EPOCH_CREATED_AT_MISMATCH",
          message: "Epoch createdAt must equal entry timestamp.",
          commitId,
          entryId,
        });
      }

      if (options?.verifyEntrySignature) {
        try {
          const ok = await options.verifyEntrySignature(entry);
          if (!ok) {
            errors.push({
              code: "EPOCH_ENTRY_SIGNATURE_INVALID",
              message: "Epoch entry signature invalid.",
              commitId,
              entryId,
            });
          }
        } catch (err) {
          errors.push({
            code: "EPOCH_ENTRY_SIGNATURE_INVALID",
            message: `Epoch entry signature error: ${String(err)}`,
            commitId,
            entryId,
          });
        }
      }

      lastEpochId = payload.epochId || lastEpochId;
    }
  }

  if (prevNullEpochCount === 0 && epochEntryIds.length > 0) {
    errors.push({
      code: "EPOCH_CHAIN_BROKEN",
      message: "No genesis epoch found with prevEpochId null.",
      commitId: genesisId,
    });
  }

  return { ok: errors.length === 0, errors, legacyEpochPlacement };
}

export function validateLedgerEncryptionKeyIds(ledger: {
  commits: Record<
    string,
    { parent: string | null; entries: string[]; timestamp: string }
  >;
  entries: Record<string, EpochEntry>;
  head: string;
}): { ok: boolean; errors: EpochValidationError[] } {
  const errors: EpochValidationError[] = [];
  const chain = getCommitChain(ledger as any);
  const knownEpochIds = new Set<string>();

  for (const commitId of chain) {
    const commit = ledger.commits[commitId];
    for (const entryId of commit.entries || []) {
      const entry = ledger.entries[entryId];
      if (!entry) continue;

      if (entry.kind === "epochs" && entry.payload?.type === "epoch") {
        const epochId = entry.payload.epochId;
        if (typeof epochId === "string") {
          knownEpochIds.add(epochId);
        }
      }

      if (!isPayloadObject(entry.payload)) continue;
      const payload = entry.payload;
      const requiresKey =
        "permissionId" in payload ||
        "encrypted" in payload ||
        "secret" in payload;
      const encryptionKeyId =
        typeof payload.encryptionKeyId === "string"
          ? payload.encryptionKeyId
          : null;

      if (requiresKey && !encryptionKeyId) {
        errors.push({
          code: "EPOCH_UNKNOWN_ENCRYPTION_KEY",
          message: "Entry missing encryptionKeyId for encrypted payload.",
          commitId,
          entryId,
        });
        continue;
      }

      if (encryptionKeyId && !knownEpochIds.has(encryptionKeyId)) {
        errors.push({
          code: "EPOCH_UNKNOWN_ENCRYPTION_KEY",
          message: "Entry references unknown encryptionKeyId.",
          commitId,
          entryId,
        });
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
