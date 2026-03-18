import {
  canonicalStringify,
  deriveCommitId as protocolDeriveCommitId,
  deriveEntryId as protocolDeriveEntryId,
  getCommitChain as protocolGetCommitChain,
  getCommitSigningPayload,
  getEntrySigningPayload,
  validateLedger as protocolValidateLedger,
  type Commit as ProtocolCommit,
  type Entry as ProtocolEntry,
  type LedgerContainer as ProtocolLedgerContainer
} from "@ternent/concord-protocol";
import {
  decryptWithIdentity,
  encryptForRecipients,
  initArmour
} from "@ternent/armour";
import {
  createSealHash,
  createSealProof,
  verifySealProofAgainstBytes
} from "@ternent/seal-cli";
import type {
  CreateLedgerConfig,
  CreateLedgerParams,
  LedgerAppendInput,
  LedgerAppendResult,
  LedgerArmourContract,
  LedgerCommitInput,
  LedgerCommitRecord,
  LedgerCommitResult,
  LedgerContainer,
  LedgerDecryptor,
  LedgerEncryptedPayloadRecord,
  LedgerEntryRecord,
  LedgerIdentityContext,
  LedgerInstance,
  LedgerPayloadRecord,
  LedgerPersistenceSnapshot,
  LedgerProjector,
  LedgerProtocolContract,
  LedgerReplayEntry,
  LedgerReplayOptions,
  LedgerReplayPolicy,
  LedgerSealContract,
  LedgerState,
  LedgerStorageAdapter,
  LedgerUnsignedCommitRecord,
  LedgerVerificationResult,
  LedgerVerifyOptions,
  SealProof
} from "./types.js";

type UnsignedLedgerEntry = Omit<LedgerEntryRecord, "entryId" | "seal">;
type UnsignedLedgerCommit = LedgerUnsignedCommitRecord;

const LEDGER_FORMAT = "concord-ledger";
const LEDGER_VERSION = "1" as const;
const LEDGER_SPEC = "@ternent/ledger@2";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeMeta(
  value: Record<string, unknown> | undefined
): Record<string, unknown> | null {
  return value ?? null;
}

function normalizePayloadInput(value: unknown): unknown {
  return value === undefined ? null : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertRecordOrNull(
  value: unknown,
  label: string
): Record<string, unknown> | null {
  if (value === null) return null;
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object or null.`);
  }
  return value;
}

function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return new Uint8Array(Buffer.from(`${normalized}${pad}`, "base64"));
}

function toCiphertextBytes(payload: LedgerEncryptedPayloadRecord): Uint8Array {
  return payload.encoding === "armor"
    ? textEncoder.encode(payload.data)
    : base64UrlDecode(payload.data);
}

function createShadowEntryCore(entry: UnsignedLedgerEntry): ProtocolEntry {
  return {
    kind: entry.kind,
    timestamp: entry.authoredAt,
    author: entry.author,
    payload: {
      meta: entry.meta,
      payload: entry.payload
    },
    signature: null
  };
}

function createShadowEntry(entry: LedgerEntryRecord): ProtocolEntry {
  return {
    ...createShadowEntryCore(entry),
    signature: JSON.stringify(entry.seal)
  };
}

function buildUnsignedEntrySubject(entry: UnsignedLedgerEntry): Uint8Array {
  return textEncoder.encode(getEntrySigningPayload(createShadowEntryCore(entry)));
}

function createShadowCommit(commit: LedgerCommitRecord): ProtocolCommit {
  return {
    ...createShadowCommitCore(commit),
    signature: JSON.stringify(commit.seal)
  };
}

function createShadowCommitCore(
  commit: UnsignedLedgerCommit | LedgerCommitRecord
): ProtocolCommit {
  return {
    parent: commit.parentCommitId,
    timestamp: commit.committedAt,
    metadata: commit.metadata,
    entries: commit.entryIds,
    signature: null
  };
}

function createShadowContainer(container: LedgerContainer): ProtocolLedgerContainer {
  const commits: Record<string, ProtocolCommit> = {};
  const entries: Record<string, ProtocolEntry> = {};

  for (const [commitId, commit] of Object.entries(container.commits)) {
    commits[commitId] = createShadowCommit(commit);
  }

  for (const [entryId, entry] of Object.entries(container.entries)) {
    entries[entryId] = createShadowEntry(entry);
  }

  return {
    format: "concord-ledger",
    version: "1.0",
    commits,
    entries,
    head: container.head
  };
}

function validatePayloadShape(payload: LedgerPayloadRecord): string[] {
  if (payload.type === "plain") {
    return [];
  }

  const errors: string[] = [];
  if (payload.scheme !== "age") {
    errors.push("Encrypted payload scheme must be age.");
  }
  if (payload.mode !== "recipients") {
    errors.push("Encrypted payload mode must be recipients.");
  }
  if (payload.encoding !== "armor" && payload.encoding !== "binary") {
    errors.push("Encrypted payload encoding must be armor or binary.");
  }
  if (typeof payload.data !== "string" || payload.data.length === 0) {
    errors.push("Encrypted payload data must be a non-empty string.");
  }
  if (typeof payload.payloadHash !== "string" || payload.payloadHash.length === 0) {
    errors.push("Encrypted payload payloadHash must be a non-empty string.");
  }
  return errors;
}

function validateEntryShape(entry: LedgerEntryRecord): string[] {
  const errors: string[] = [];
  if (typeof entry.entryId !== "string" || entry.entryId.length === 0) {
    errors.push("Entry.entryId must be a non-empty string.");
  }
  if (typeof entry.kind !== "string" || entry.kind.length === 0) {
    errors.push("Entry.kind must be a non-empty string.");
  }
  if (typeof entry.authoredAt !== "string" || entry.authoredAt.length === 0) {
    errors.push("Entry.authoredAt must be a non-empty string.");
  }
  if (typeof entry.author !== "string" || entry.author.length === 0) {
    errors.push("Entry.author must be a non-empty string.");
  }
  if (entry.meta !== null && !isRecord(entry.meta)) {
    errors.push("Entry.meta must be an object or null.");
  }
  errors.push(...validatePayloadShape(entry.payload));
  if (!isRecord(entry.seal)) {
    errors.push("Entry.seal must be an object.");
  }
  return errors;
}

function validateCommitShape(commit: LedgerCommitRecord): string[] {
  const errors: string[] = [];
  if (typeof commit.commitId !== "string" || commit.commitId.length === 0) {
    errors.push("Commit.commitId must be a non-empty string.");
  }
  if (
    commit.parentCommitId !== null &&
    (typeof commit.parentCommitId !== "string" || commit.parentCommitId.length === 0)
  ) {
    errors.push("Commit.parentCommitId must be a non-empty string or null.");
  }
  if (typeof commit.committedAt !== "string" || commit.committedAt.length === 0) {
    errors.push("Commit.committedAt must be a non-empty string.");
  }
  if (commit.metadata !== null && !isRecord(commit.metadata)) {
    errors.push("Commit.metadata must be an object or null.");
  }
  if (!Array.isArray(commit.entryIds)) {
    errors.push("Commit.entryIds must be an array.");
  } else if (commit.entryIds.some((entryId) => typeof entryId !== "string")) {
    errors.push("Commit.entryIds must contain only strings.");
  }
  if (!isRecord(commit.seal)) {
    errors.push("Commit.seal must be an object.");
  }
  return errors;
}

function validatePublicContainerShape(container: LedgerContainer): string[] {
  const errors: string[] = [];

  if (container.format !== LEDGER_FORMAT) {
    errors.push(`Ledger.format must be "${LEDGER_FORMAT}".`);
  }
  if (container.version !== LEDGER_VERSION) {
    errors.push(`Ledger.version must be "${LEDGER_VERSION}".`);
  }
  if (!isRecord(container.commits)) {
    errors.push("Ledger.commits must be an object.");
  }
  if (!isRecord(container.entries)) {
    errors.push("Ledger.entries must be an object.");
  }
  if (typeof container.head !== "string" || container.head.length === 0) {
    errors.push("Ledger.head must be a non-empty string.");
  }

  if (errors.length > 0) {
    return errors;
  }

  for (const [commitId, commit] of Object.entries(container.commits)) {
    if (commit.commitId !== commitId) {
      errors.push(`Commit key mismatch for ${commitId}.`);
    }
    errors.push(...validateCommitShape(commit));
  }

  for (const [entryId, entry] of Object.entries(container.entries)) {
    if (entry.entryId !== entryId) {
      errors.push(`Entry key mismatch for ${entryId}.`);
    }
    errors.push(...validateEntryShape(entry));
  }

  if (!container.commits[container.head]) {
    errors.push(`Ledger head ${container.head} does not exist in commits.`);
  }

  return errors;
}

function createDefaultProtocolContract(): LedgerProtocolContract {
  return {
    canonicalizePayload(value) {
      return canonicalStringify(normalizePayloadInput(value));
    },
    getEntrySubjectBytes(entry) {
      return buildUnsignedEntrySubject(entry);
    },
    getCommitSubjectBytes(commit) {
      return textEncoder.encode(getCommitSigningPayload(createShadowCommitCore(commit)));
    },
    async deriveEntryId(entry) {
      return protocolDeriveEntryId(createShadowEntry(entry));
    },
    async deriveCommitId(commit) {
      return protocolDeriveCommitId(createShadowCommitCore(commit));
    },
    getCommitChain(container) {
      return protocolGetCommitChain(createShadowContainer(container));
    },
    validateContainer(container) {
      const errors = validatePublicContainerShape(container);
      if (errors.length > 0) {
        return { ok: false, errors };
      }

      try {
        const shadowValidation = protocolValidateLedger(createShadowContainer(container), {
          strictSpec: false
        });
        return shadowValidation.ok
          ? { ok: true, errors: [] }
          : { ok: false, errors: shadowValidation.errors };
      } catch (error) {
        return {
          ok: false,
          errors: [error instanceof Error ? error.message : "Invalid container."]
        };
      }
    }
  };
}

function createDefaultSealContract(): LedgerSealContract {
  return {
    async createEntryProof(input) {
      return (await createSealProof({
        createdAt: input.entry.authoredAt,
        signer: input.signer,
        subject: {
          kind: "artifact",
          path: `ledger-entry:${input.entry.kind}:${input.entry.authoredAt}`,
          hash: await createSealHash(input.subjectBytes)
        }
      })) as SealProof;
    },
    async verifyEntryProof(input) {
      const result = await verifySealProofAgainstBytes(
        input.proof as never,
        input.subjectBytes
      );
      return result.valid;
    },
    async createCommitProof(input) {
      return (await createSealProof({
        createdAt: input.commit.committedAt,
        signer: input.signer,
        subject: {
          kind: "artifact",
          path: `ledger-commit:${input.commitId}`,
          hash: await createSealHash(input.subjectBytes)
        }
      })) as SealProof;
    },
    async verifyCommitProof(input) {
      const result = await verifySealProofAgainstBytes(
        input.proof as never,
        input.subjectBytes
      );
      return result.valid;
    }
  };
}

function createDefaultArmourContract(): LedgerArmourContract {
  return {
    async encrypt(input) {
      await initArmour();
      const ciphertext = await encryptForRecipients({
        recipients: input.recipients,
        data: input.data,
        output: input.encoding
      });
      return {
        data:
          input.encoding === "armor"
            ? textDecoder.decode(ciphertext)
            : base64UrlEncode(ciphertext),
        payloadHash: await createSealHash(ciphertext)
      };
    },
    async decrypt(input) {
      await initArmour();
      const plaintext = await decryptWithIdentity({
        identity: input.decryptor.identity,
        data: toCiphertextBytes(input.payload)
      });
      return JSON.parse(textDecoder.decode(plaintext)) as unknown;
    }
  };
}

function createEmptyProjection<P>(value: P): P {
  return cloneValue(value);
}

function createInitialState<P>(initialProjection: P): LedgerState<P> {
  return {
    container: null,
    staged: [],
    projection: createEmptyProjection(initialProjection),
    verification: null
  };
}

function sortStrings(values: Iterable<string>): string[] {
  return Array.from(values).sort((left, right) => left.localeCompare(right));
}

function mergeReplayOptions(
  defaults: LedgerReplayPolicy | undefined,
  options: LedgerReplayOptions | undefined,
  hasDecryptor: boolean
): Required<LedgerReplayOptions> {
  const verify = options?.verify ?? defaults?.verify ?? true;
  const decrypt = options?.decrypt ?? defaults?.decrypt ?? true;
  return {
    fromEntryId: options?.fromEntryId ?? "",
    toEntryId: options?.toEntryId ?? "",
    verify,
    decrypt: decrypt && hasDecryptor
  };
}

function assertAppendInput(input: LedgerAppendInput): void {
  if (typeof input.kind !== "string" || input.kind.length === 0) {
    throw new Error("append input kind is required.");
  }
  if (input.meta !== undefined) {
    assertRecordOrNull(input.meta, "append input meta");
  }
  if (input.protection?.type === "recipients") {
    if (!Array.isArray(input.protection.recipients)) {
      throw new Error("append protection recipients must be an array.");
    }
    if (input.protection.recipients.length === 0) {
      throw new Error("append protection recipients must not be empty.");
    }
  }
}

function assertContainerInput(container: LedgerContainer): void {
  const errors = validatePublicContainerShape(container);
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}

function getCommittedEntriesInOrder(
  container: LedgerContainer,
  protocol: LedgerProtocolContract
): LedgerEntryRecord[] {
  const ordered: LedgerEntryRecord[] = [];
  for (const commitId of protocol.getCommitChain(container)) {
    const commit = container.commits[commitId];
    if (!commit) continue;
    for (const entryId of commit.entryIds) {
      const entry = container.entries[entryId];
      if (entry) {
        ordered.push(entry);
      }
    }
  }
  return ordered;
}

function getProjectionSlice(
  entries: LedgerEntryRecord[],
  fromEntryId: string,
  toEntryId: string
): LedgerEntryRecord[] {
  const startIndex = fromEntryId
    ? entries.findIndex((entry) => entry.entryId === fromEntryId)
    : 0;
  const endIndex = toEntryId
    ? entries.findIndex((entry) => entry.entryId === toEntryId)
    : entries.length - 1;

  if (startIndex < 0) {
    throw new Error(`from entry not found: ${fromEntryId}`);
  }
  if (toEntryId && endIndex < 0) {
    throw new Error(`to entry not found: ${toEntryId}`);
  }
  if (entries.length === 0) {
    return [];
  }

  return entries.slice(startIndex, endIndex + 1);
}

async function toReplayEntry(
  entry: LedgerEntryRecord,
  decrypt: boolean,
  identity: LedgerIdentityContext,
  armour: LedgerArmourContract
): Promise<LedgerReplayEntry> {
  if (entry.payload.type === "plain") {
    return {
      entryId: entry.entryId,
      kind: entry.kind,
      author: entry.author,
      authoredAt: entry.authoredAt,
      meta: entry.meta,
      payload: {
        type: "plain",
        data: cloneValue(entry.payload.data)
      },
      verified: true
    };
  }

  if (decrypt && identity.decryptor) {
    return {
      entryId: entry.entryId,
      kind: entry.kind,
      author: entry.author,
      authoredAt: entry.authoredAt,
      meta: entry.meta,
      payload: {
        type: "decrypted",
        original: "encrypted",
        data: await armour.decrypt({
          payload: entry.payload,
          decryptor: identity.decryptor
        })
      },
      verified: true,
      decrypted: true
    };
  }

  return {
    entryId: entry.entryId,
    kind: entry.kind,
    author: entry.author,
    authoredAt: entry.authoredAt,
    meta: entry.meta,
    payload: {
      type: "encrypted",
      scheme: entry.payload.scheme,
      mode: entry.payload.mode,
      encoding: entry.payload.encoding,
      data: entry.payload.data
    },
    verified: true,
    decrypted: false
  };
}

function createGenesisCommitDraft(
  timestamp: string,
  metadata: Record<string, unknown> | null
): UnsignedLedgerCommit {
  return {
    parentCommitId: null,
    committedAt: timestamp,
    metadata: {
      genesis: true,
      spec: LEDGER_SPEC,
      ...(metadata ?? {})
    },
    entryIds: []
  };
}

export async function createLedger<P>(
  config: CreateLedgerConfig<P>
): Promise<LedgerInstance<P>> {
  const now = config.now ?? (() => new Date().toISOString());
  const protocol = config.protocol ?? createDefaultProtocolContract();
  const seal = config.seal ?? createDefaultSealContract();
  const armour = config.armour ?? createDefaultArmourContract();
  const replayPolicy = config.replayPolicy;
  const state = createInitialState(config.initialProjection);
  const listeners = new Set<(state: Readonly<LedgerState<P>>) => void>();

  function notify() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  async function persist() {
    if (!config.storage) return;
    const snapshot: LedgerPersistenceSnapshot = {
      container: state.container ? cloneValue(state.container) : null,
      staged: cloneValue(state.staged)
    };
    await config.storage.save(snapshot);
  }

  async function buildCommitRecord(
    unsignedCommit: UnsignedLedgerCommit
  ): Promise<LedgerCommitRecord> {
    const subjectBytes = protocol.getCommitSubjectBytes(unsignedCommit);
    const commitId = await protocol.deriveCommitId(unsignedCommit);
    const sealProof = await seal.createCommitProof({
      commit: unsignedCommit,
      commitId,
      subjectBytes,
      signer: config.identity.signer
    });

    return {
      ...unsignedCommit,
      commitId,
      seal: sealProof
    };
  }

  async function verifySnapshot(
    container: LedgerContainer | null,
    staged: LedgerEntryRecord[],
    options?: LedgerVerifyOptions
  ): Promise<LedgerVerificationResult> {
    if (!container) {
      return {
        valid: true,
        committedHistoryValid: true,
        commitChainValid: true,
        commitProofsValid: true,
        entriesValid: true,
        entryProofsValid: true,
        payloadHashesValid: true,
        proofsValid: true,
        invalidCommitIds: [],
        invalidEntryIds: []
      };
    }

    const invalidCommitIds = new Set<string>();
    const invalidEntryIds = new Set<string>();
    let commitChainValid = true;
    let commitProofsValid = true;
    let entriesValid = true;
    let entryProofsValid = true;
    let payloadHashesValid = true;
    let proofsValid = true;
    let committedEntriesValid = true;
    let committedEntryProofsValid = true;
    let committedPayloadHashesValid = true;

    const containerValidation = protocol.validateContainer(container);
    if (!containerValidation.ok) {
      commitChainValid = false;
    }

    const reachableCommitIds = new Set<string>();
    const reachableEntryIds = new Set<string>();

    for (const [commitId, commit] of Object.entries(container.commits)) {
      try {
        const derivedCommitId = await protocol.deriveCommitId({
          parentCommitId: commit.parentCommitId,
          committedAt: commit.committedAt,
          metadata: commit.metadata,
          entryIds: commit.entryIds
        });
        if (derivedCommitId !== commitId) {
          invalidCommitIds.add(commitId);
          commitChainValid = false;
        }
      } catch {
        invalidCommitIds.add(commitId);
        commitChainValid = false;
      }

      if (commit.parentCommitId !== null && !container.commits[commit.parentCommitId]) {
        invalidCommitIds.add(commitId);
        commitChainValid = false;
      }

      if (options?.includeProofs !== false) {
        try {
          const proofValid = await seal.verifyCommitProof({
            commit,
            subjectBytes: protocol.getCommitSubjectBytes({
              parentCommitId: commit.parentCommitId,
              committedAt: commit.committedAt,
              metadata: commit.metadata,
              entryIds: commit.entryIds
            }),
            proof: commit.seal
          });
          if (!proofValid) {
            invalidCommitIds.add(commitId);
            commitProofsValid = false;
            proofsValid = false;
          }
        } catch {
          invalidCommitIds.add(commitId);
          commitProofsValid = false;
          proofsValid = false;
        }
      }

      for (const entryId of commit.entryIds) {
        if (!container.entries[entryId]) {
          invalidEntryIds.add(entryId);
          entriesValid = false;
        }
      }
    }

    try {
      const chain = protocol.getCommitChain(container);
      for (const commitId of chain) {
        reachableCommitIds.add(commitId);
        for (const entryId of container.commits[commitId]?.entryIds ?? []) {
          reachableEntryIds.add(entryId);
        }
      }
    } catch {
      invalidCommitIds.add(container.head);
      commitChainValid = false;
      committedEntriesValid = false;
      committedEntryProofsValid = false;
      committedPayloadHashesValid = false;
    }

    const entriesToVerify = [
      ...Object.entries(container.entries).map(([recordKey, entry]) => ({
        recordKey,
        entry
      })),
      ...staged.map((entry) => ({ recordKey: null, entry }))
    ];

    for (const { recordKey, entry } of entriesToVerify) {
      const isReachableCommittedEntry =
        (recordKey !== null && reachableEntryIds.has(recordKey)) ||
        reachableEntryIds.has(entry.entryId);

      try {
        const derivedEntryId = await protocol.deriveEntryId(entry);
        if (derivedEntryId !== entry.entryId) {
          invalidEntryIds.add(entry.entryId);
          entriesValid = false;
          if (isReachableCommittedEntry) {
            committedEntriesValid = false;
          }
        }
      } catch {
        invalidEntryIds.add(entry.entryId);
        entriesValid = false;
        if (isReachableCommittedEntry) {
          committedEntriesValid = false;
        }
      }

      const subjectBytes = buildUnsignedEntrySubject({
        kind: entry.kind,
        authoredAt: entry.authoredAt,
        author: entry.author,
        meta: entry.meta,
        payload: entry.payload
      });

      if (options?.includeProofs !== false) {
        try {
          const proofValid = await seal.verifyEntryProof({
            entry,
            subjectBytes,
            proof: entry.seal
          });
          if (!proofValid) {
            invalidEntryIds.add(entry.entryId);
            entriesValid = false;
            entryProofsValid = false;
            proofsValid = false;
            if (isReachableCommittedEntry) {
              committedEntriesValid = false;
              committedEntryProofsValid = false;
            }
          }
        } catch {
          invalidEntryIds.add(entry.entryId);
          entriesValid = false;
          entryProofsValid = false;
          proofsValid = false;
          if (isReachableCommittedEntry) {
            committedEntriesValid = false;
            committedEntryProofsValid = false;
          }
        }
      }

      if (entry.payload.type === "encrypted" && options?.includePayloadHashes !== false) {
        try {
          const payloadHash = await createSealHash(toCiphertextBytes(entry.payload));
          if (payloadHash !== entry.payload.payloadHash) {
            invalidEntryIds.add(entry.entryId);
            entriesValid = false;
            payloadHashesValid = false;
            if (isReachableCommittedEntry) {
              committedEntriesValid = false;
              committedPayloadHashesValid = false;
            }
          }
        } catch {
          invalidEntryIds.add(entry.entryId);
          entriesValid = false;
          payloadHashesValid = false;
          if (isReachableCommittedEntry) {
            committedEntriesValid = false;
            committedPayloadHashesValid = false;
          }
        }
      }
    }

    for (const entryId of reachableEntryIds) {
      if (!container.entries[entryId]) {
        committedEntriesValid = false;
        committedEntryProofsValid = false;
        committedPayloadHashesValid = false;
      }
    }

    const committedHistoryValid =
      commitChainValid &&
      commitProofsValid &&
      committedEntriesValid &&
      committedEntryProofsValid &&
      committedPayloadHashesValid &&
      containerValidation.ok;

    return {
      valid: committedHistoryValid,
      committedHistoryValid,
      commitChainValid,
      commitProofsValid,
      entriesValid,
      entryProofsValid,
      payloadHashesValid,
      proofsValid,
      invalidCommitIds: sortStrings(invalidCommitIds),
      invalidEntryIds: sortStrings(invalidEntryIds)
    };
  }

  async function verifyCurrent(
    options?: LedgerVerifyOptions
  ): Promise<LedgerVerificationResult> {
    return verifySnapshot(state.container, state.staged, options);
  }

  async function rebuildProjection(options?: LedgerReplayOptions): Promise<P> {
    const merged = mergeReplayOptions(
      replayPolicy,
      options,
      !!config.identity.decryptor
    );

    if (merged.verify) {
      const verification = await verifyCurrent();
      state.verification = {
        valid: verification.valid,
        checkedAt: now()
      };
      notify();
      if (!verification.valid) {
        throw new Error("Ledger verification failed.");
      }
    }

    let orderedCommitted: LedgerEntryRecord[] = [];
    if (state.container) {
      try {
        orderedCommitted = getCommittedEntriesInOrder(state.container, protocol);
      } catch (error) {
        if (merged.verify) {
          throw error;
        }
      }
    }
    const orderedEntries = [...orderedCommitted, ...state.staged];
    const slice = getProjectionSlice(
      orderedEntries,
      merged.fromEntryId,
      merged.toEntryId
    );

    let projection = createEmptyProjection(config.initialProjection);
    for (const entry of slice) {
      projection = config.projector(
        projection,
        await toReplayEntry(entry, merged.decrypt, config.identity, armour)
      );
    }

    state.projection = projection;
    notify();
    return projection;
  }

  async function buildEntryRecord(input: LedgerAppendInput): Promise<LedgerEntryRecord> {
    assertAppendInput(input);
    protocol.canonicalizePayload(input.payload);

    const payloadValue = normalizePayloadInput(input.payload);
    const meta = normalizeMeta(input.meta);
    const authoredAt = now();
    const author = await config.identity.authorResolver();

    const payload: LedgerPayloadRecord =
      input.protection?.type === "recipients"
        ? {
            type: "encrypted",
            scheme: "age",
            mode: "recipients",
            encoding: input.protection.encoding ?? "armor",
            ...(await armour.encrypt({
              recipients: config.identity.recipientResolver
                ? await config.identity.recipientResolver(input.protection.recipients)
                : input.protection.recipients,
              data: textEncoder.encode(protocol.canonicalizePayload(payloadValue)),
              encoding: input.protection.encoding ?? "armor"
            }))
          }
        : {
            type: "plain",
            data: cloneValue(payloadValue)
          };

    const unsignedEntry: UnsignedLedgerEntry = {
      kind: input.kind,
      authoredAt,
      author,
      meta,
      payload
    };
    const subjectBytes = buildUnsignedEntrySubject(unsignedEntry);
    const sealProof = await seal.createEntryProof({
      entry: unsignedEntry,
      subjectBytes,
      signer: config.identity.signer
    });
    const draft: LedgerEntryRecord = {
      entryId: "",
      ...unsignedEntry,
      seal: sealProof
    };

    return {
      ...draft,
      entryId: await protocol.deriveEntryId(draft)
    };
  }

  function assertContainerExists(): LedgerContainer {
    if (!state.container) {
      throw new Error("Ledger has not been created or loaded.");
    }
    return state.container;
  }

  async function stageEntries(
    inputs: LedgerAppendInput[]
  ): Promise<LedgerAppendResult[]> {
    const container = assertContainerExists();
    const existingIds = new Set<string>([
      ...Object.keys(container.entries),
      ...state.staged.map((entry) => entry.entryId)
    ]);
    const entries: LedgerEntryRecord[] = [];

    for (const input of inputs) {
      const entry = await buildEntryRecord(input);
      if (existingIds.has(entry.entryId)) {
        throw new Error(`Entry ${entry.entryId} already exists.`);
      }
      existingIds.add(entry.entryId);
      entries.push(entry);
    }

    const baseCount = state.staged.length;
    state.staged = [...state.staged, ...entries];
    const results = entries.map((entry, index) => ({
      entry,
      stagedCount: baseCount + index + 1
    }));

    if (config.autoCommit && entries.length > 0) {
      await commit();
      return results;
    }

    await rebuildProjection();
    await persist();

    return results;
  }

  async function create(params?: CreateLedgerParams): Promise<void> {
    const genesis = await buildCommitRecord(
      createGenesisCommitDraft(now(), normalizeMeta(params?.metadata))
    );

    state.container = {
      format: LEDGER_FORMAT,
      version: LEDGER_VERSION,
      commits: {
        [genesis.commitId]: genesis
      },
      entries: {},
      head: genesis.commitId
    };
    state.staged = [];
    state.verification = null;

    await rebuildProjection();
    await persist();
  }

  async function load(container: LedgerContainer): Promise<void> {
    assertContainerInput(container);
    state.container = cloneValue(container);
    state.staged = [];
    state.verification = null;
    await rebuildProjection();
    await persist();
  }

  async function loadFromStorage(): Promise<boolean> {
    if (!config.storage) {
      return false;
    }

    const snapshot = await config.storage.load();
    if (!snapshot) {
      return false;
    }

    if (snapshot.container) {
      assertContainerInput(snapshot.container);
    }
    for (const stagedEntry of snapshot.staged) {
      const errors = validateEntryShape(stagedEntry);
      if (errors.length > 0) {
        throw new Error(errors.join("; "));
      }
    }

    state.container = snapshot.container ? cloneValue(snapshot.container) : null;
    state.staged = cloneValue(snapshot.staged);
    state.verification = null;
    await rebuildProjection();
    return true;
  }

  async function append(input: LedgerAppendInput): Promise<LedgerAppendResult> {
    const [result] = await stageEntries([input]);
    return result;
  }

  async function appendMany(
    inputs: LedgerAppendInput[]
  ): Promise<LedgerAppendResult[]> {
    if (inputs.length === 0) {
      return [];
    }
    return stageEntries(inputs);
  }

  async function commit(input?: LedgerCommitInput): Promise<LedgerCommitResult> {
    const container = assertContainerExists();
    if (state.staged.length === 0) {
      throw new Error("No staged entries to commit.");
    }

    const staged = cloneValue(state.staged);
    const entries = { ...container.entries };
    for (const entry of staged) {
      entries[entry.entryId] = entry;
    }

    const unsignedCommit: UnsignedLedgerCommit = {
      parentCommitId: container.head,
      committedAt: now(),
      metadata: normalizeMeta(input?.metadata),
      entryIds: staged.map((entry) => entry.entryId)
    };
    const commitRecord = await buildCommitRecord(unsignedCommit);

    state.container = {
      format: container.format,
      version: container.version,
      commits: {
        ...container.commits,
        [commitRecord.commitId]: commitRecord
      },
      entries,
      head: commitRecord.commitId
    };
    state.staged = [];

    await rebuildProjection();
    await persist();

    return {
      commit: cloneValue(commitRecord),
      committedEntries: staged,
      committedEntryIds: staged.map((entry) => entry.entryId)
    };
  }

  async function replay(options?: LedgerReplayOptions): Promise<P> {
    return rebuildProjection(options);
  }

  async function recompute(): Promise<P> {
    return rebuildProjection();
  }

  async function verify(
    options?: LedgerVerifyOptions
  ): Promise<LedgerVerificationResult> {
    return verifyCurrent(options);
  }

  async function exportContainer(): Promise<LedgerContainer> {
    const container = assertContainerExists();
    return cloneValue(container);
  }

  async function importContainer(container: LedgerContainer): Promise<void> {
    await load(container);
  }

  function getState(): Readonly<LedgerState<P>> {
    return state;
  }

  function subscribe(
    listener: (state: Readonly<LedgerState<P>>) => void
  ): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  async function clearStaged(): Promise<void> {
    state.staged = [];
    await rebuildProjection();
    await persist();
  }

  async function destroy(): Promise<void> {
    state.container = null;
    state.staged = [];
    state.projection = createEmptyProjection(config.initialProjection);
    state.verification = null;
    notify();
    if (config.storage?.clear) {
      await config.storage.clear();
    }
  }

  return {
    create,
    load,
    loadFromStorage,
    append,
    appendMany,
    commit,
    replay,
    recompute,
    verify,
    export: exportContainer,
    import: importContainer,
    getState,
    subscribe,
    clearStaged,
    destroy
  };
}

export type {
  CreateLedgerConfig,
  CreateLedgerParams,
  LedgerProjector,
  LedgerStorageAdapter
};
