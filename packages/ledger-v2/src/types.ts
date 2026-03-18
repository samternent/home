import type { SerializedIdentity } from "@ternent/identity";

export type SealProof = {
  version: string;
  type: "seal-proof";
  algorithm: string;
  createdAt: string;
  subject: {
    kind: "file" | "manifest" | "artifact";
    path: string;
    hash: `sha256:${string}`;
  };
  signer: {
    publicKey: string;
    keyId: string;
  };
  signature: string;
};

export type SealSigner = {
  identity: SerializedIdentity;
};

export type LedgerDecryptor = {
  identity: SerializedIdentity;
};

export type LedgerRecipientResolver = (
  recipients: string[]
) => Promise<string[]> | string[];

export type LedgerIdentityContext = {
  signer: SealSigner;
  authorResolver: () => Promise<string> | string;
  recipientResolver?: LedgerRecipientResolver;
  decryptor?: LedgerDecryptor;
};

export type LedgerPlainPayloadRecord = {
  type: "plain";
  data: unknown;
};

export type LedgerEncryptedPayloadRecord = {
  type: "encrypted";
  scheme: "age";
  mode: "recipients";
  encoding: "armor" | "binary";
  data: string;
  payloadHash: `sha256:${string}` | string;
};

export type LedgerPayloadRecord =
  | LedgerPlainPayloadRecord
  | LedgerEncryptedPayloadRecord;

export type LedgerEntryRecord = {
  entryId: string;
  kind: string;
  authoredAt: string;
  author: string;
  meta: Record<string, unknown> | null;
  payload: LedgerPayloadRecord;
  seal: SealProof;
};

export type LedgerCommitRecord = {
  commitId: string;
  parentCommitId: string | null;
  committedAt: string;
  metadata: Record<string, unknown> | null;
  entryIds: string[];
  seal: SealProof;
};

export type LedgerUnsignedCommitRecord = Omit<
  LedgerCommitRecord,
  "commitId" | "seal"
>;

export type LedgerContainer = {
  format: "concord-ledger";
  version: "1";
  commits: Record<string, LedgerCommitRecord>;
  entries: Record<string, LedgerEntryRecord>;
  head: string;
};

export type LedgerVerificationSnapshot = {
  valid: boolean;
  checkedAt: string;
};

export type LedgerState<P> = {
  container: LedgerContainer | null;
  staged: LedgerEntryRecord[];
  projection: P;
  verification: LedgerVerificationSnapshot | null;
};

export type LedgerProtectionInput =
  | { type: "none" }
  | {
      type: "recipients";
      recipients: string[];
      encoding?: "armor" | "binary";
    };

export type LedgerAppendInput = {
  kind: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
  protection?: LedgerProtectionInput;
};

export type LedgerAppendResult = {
  entry: LedgerEntryRecord;
  stagedCount: number;
};

export type LedgerCommitInput = {
  metadata?: Record<string, unknown>;
};

export type LedgerCommitResult = {
  commit: LedgerCommitRecord;
  committedEntries: LedgerEntryRecord[];
  committedEntryIds: string[];
};

export type LedgerReplayOptions = {
  fromEntryId?: string;
  toEntryId?: string;
  verify?: boolean;
  decrypt?: boolean;
};

export type LedgerVerifyOptions = {
  includeProofs?: boolean;
  includePayloadHashes?: boolean;
};

export type LedgerReplayEntry =
  | {
      entryId: string;
      kind: string;
      author: string;
      authoredAt: string;
      meta: Record<string, unknown> | null;
      payload: { type: "plain"; data: unknown };
      verified: true;
    }
  | {
      entryId: string;
      kind: string;
      author: string;
      authoredAt: string;
      meta: Record<string, unknown> | null;
      payload: {
        type: "encrypted";
        scheme: "age";
        mode: "recipients";
        encoding: "armor" | "binary";
        data: string;
      };
      verified: true;
      decrypted: false;
    }
  | {
      entryId: string;
      kind: string;
      author: string;
      authoredAt: string;
      meta: Record<string, unknown> | null;
      payload: {
        type: "decrypted";
        original: "encrypted";
        data: unknown;
      };
      verified: true;
      decrypted: true;
    };

export type LedgerProjector<P> = (projection: P, entry: LedgerReplayEntry) => P;

export type LedgerVerificationResult = {
  valid: boolean;
  committedHistoryValid: boolean;
  commitChainValid: boolean;
  commitProofsValid: boolean;
  entriesValid: boolean;
  entryProofsValid: boolean;
  payloadHashesValid: boolean;
  proofsValid: boolean;
  invalidCommitIds: string[];
  invalidEntryIds: string[];
};

export type LedgerPersistenceSnapshot = {
  container: LedgerContainer | null;
  staged: LedgerEntryRecord[];
};

export type LedgerStorageAdapter = {
  name: string;
  load(): Promise<LedgerPersistenceSnapshot | null>;
  save(snapshot: LedgerPersistenceSnapshot): Promise<void>;
  clear?(): Promise<void>;
};

export type LedgerReplayPolicy = {
  verify?: boolean;
  decrypt?: boolean;
};

export type LedgerProtocolContract = {
  canonicalizePayload: (value: unknown) => string;
  getEntrySubjectBytes: (
    entry: Omit<LedgerEntryRecord, "entryId" | "seal">
  ) => Uint8Array;
  getCommitSubjectBytes: (commit: LedgerUnsignedCommitRecord) => Uint8Array;
  deriveEntryId: (entry: LedgerEntryRecord) => Promise<string>;
  deriveCommitId: (commit: LedgerUnsignedCommitRecord) => Promise<string>;
  getCommitChain: (container: LedgerContainer) => string[];
  validateContainer: (container: LedgerContainer) => {
    ok: boolean;
    errors: string[];
  };
};

export type LedgerSealContract = {
  createEntryProof: (input: {
    entry: Omit<LedgerEntryRecord, "entryId" | "seal">;
    subjectBytes: Uint8Array;
    signer: SealSigner;
  }) => Promise<SealProof>;
  verifyEntryProof: (input: {
    entry: LedgerEntryRecord;
    subjectBytes: Uint8Array;
    proof: SealProof;
  }) => Promise<boolean>;
  createCommitProof: (input: {
    commit: LedgerUnsignedCommitRecord;
    commitId: string;
    subjectBytes: Uint8Array;
    signer: SealSigner;
  }) => Promise<SealProof>;
  verifyCommitProof: (input: {
    commit: LedgerCommitRecord;
    subjectBytes: Uint8Array;
    proof: SealProof;
  }) => Promise<boolean>;
};

export type LedgerArmourContract = {
  encrypt: (input: {
    recipients: string[];
    data: Uint8Array;
    encoding: "armor" | "binary";
  }) => Promise<{
    data: string;
    payloadHash: `sha256:${string}` | string;
  }>;
  decrypt: (input: {
    payload: LedgerEncryptedPayloadRecord;
    decryptor: LedgerDecryptor;
  }) => Promise<unknown>;
};

export type CreateLedgerParams = {
  metadata?: Record<string, unknown>;
};

export type CreateLedgerConfig<P> = {
  identity: LedgerIdentityContext;
  initialProjection: P;
  projector: LedgerProjector<P>;
  storage?: LedgerStorageAdapter;
  protocol?: LedgerProtocolContract;
  seal?: LedgerSealContract;
  armour?: LedgerArmourContract;
  now?: () => string;
  autoCommit?: boolean;
  replayPolicy?: LedgerReplayPolicy;
};

export type LedgerInstance<P> = {
  create(params?: CreateLedgerParams): Promise<void>;
  load(container: LedgerContainer): Promise<void>;
  loadFromStorage(): Promise<boolean>;
  append(input: LedgerAppendInput): Promise<LedgerAppendResult>;
  appendMany(inputs: LedgerAppendInput[]): Promise<LedgerAppendResult[]>;
  commit(input?: LedgerCommitInput): Promise<LedgerCommitResult>;
  replay(options?: LedgerReplayOptions): Promise<P>;
  recompute(): Promise<P>;
  verify(options?: LedgerVerifyOptions): Promise<LedgerVerificationResult>;
  export(): Promise<LedgerContainer>;
  import(container: LedgerContainer): Promise<void>;
  getState(): Readonly<LedgerState<P>>;
  subscribe(listener: (state: Readonly<LedgerState<P>>) => void): () => void;
  clearStaged(): Promise<void>;
  destroy(): Promise<void>;
};
