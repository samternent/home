export type PixpaxProofSubjectHash = `sha256:${string}`;

export type PixpaxClaimantRef = {
  type: "identity-public-key";
  value: string;
};

export type PixpaxClaimantIdentity = PixpaxClaimantRef & {
  normalizedValue: string;
  fingerprint: string;
};

export type PixpaxCollectionScope = {
  collectionId: string;
  collectionVersion: string;
};

export type PixpaxDropScope = {
  dropId: string;
};

export type PixpaxPackIssuanceKind = "deterministic" | "designated";

export type PixpaxClaimUniqueness =
  | "claimant-drop"
  | "designated-code-first-claim";

export type PixpaxPackCard = {
  cardId: string;
  seriesId?: string | null;
  slotIndex: number;
  role?: string | null;
  renderPayload?: Record<string, unknown> | null;
};

export type PixpaxCardCatalogEntry = {
  cardId: string;
  seriesId?: string | null;
  role?: string | null;
  renderPayload?: Record<string, unknown> | null;
};

export type PixpaxCollectionCatalog = PixpaxCollectionScope & {
  cards: PixpaxCardCatalogEntry[];
};

export type PixpaxPackIssuance = PixpaxCollectionScope &
  PixpaxDropScope & {
    version: "1";
    type: "pixpax-pack-issuance";
    proofScheme: "seal";
    issuanceKind: PixpaxPackIssuanceKind;
    derivationVersion: "pixpax-pack/v2";
    claimUniqueness: PixpaxClaimUniqueness;
    packId: string;
    issuedAt: string;
    claimant: PixpaxClaimantIdentity | null;
    issuerKeyId?: string | null;
    sourceCodeId?: string | null;
    deterministicMaterialHash?: string | null;
    cards: PixpaxPackCard[];
    itemHashes: PixpaxProofSubjectHash[];
    packRoot: PixpaxProofSubjectHash;
    contentsHash: PixpaxProofSubjectHash;
  };

export type PixpaxTransferOffer = PixpaxCollectionScope & {
  version: "1";
  type: "pixpax-transfer-offer";
  proofScheme: "seal";
  transferId: string;
  offeredAt: string;
  cardInstanceId: string;
  cardId: string;
  sourceClaimEntryId: string;
  sourcePackId: string;
  seriesId?: string | null;
  slotIndex: number;
  role?: string | null;
  fromClaimant: PixpaxClaimantIdentity;
  toClaimant: PixpaxClaimantIdentity;
};

export type PixpaxTransferAcceptance = PixpaxCollectionScope & {
  version: "1";
  type: "pixpax-transfer-acceptance";
  proofScheme: "seal";
  transferId: string;
  acceptedAt: string;
  offerProofHash: PixpaxProofSubjectHash;
  cardInstanceId: string;
  cardId: string;
  sourceClaimEntryId: string;
  sourcePackId: string;
  seriesId?: string | null;
  slotIndex: number;
  role?: string | null;
  fromClaimant: PixpaxClaimantIdentity;
  toClaimant: PixpaxClaimantIdentity;
};

export type PixpaxSealProof = {
  version: "2";
  type: "seal-proof";
  algorithm: "Ed25519";
  createdAt: string;
  subject: {
    kind: "artifact";
    path: string;
    hash: PixpaxProofSubjectHash;
  };
  signer: {
    publicKey: string;
    keyId: string;
  };
  signature: string;
};

export type PixpaxSignedArtifact<TPayload> = {
  payload: TPayload;
  proof: PixpaxSealProof;
};

export type PixbookClaimVerificationState = {
  proofValidLocal: boolean;
  policyConfirmed: boolean | null;
  verifiedAt: string;
  source: "local-proof" | "server-policy";
  reason?: string | null;
};

export type PixbookClaimPackCommandInput = {
  artifact: PixpaxSignedArtifact<PixpaxPackIssuance>;
  claimedAt?: string;
  verification?: PixbookClaimVerificationState | null;
};

export type PixbookRecordPackOpenedCommandInput = {
  claimEntryId: string;
  packId: string;
  openedAt?: string;
};

export type PixbookSetDisplayProfileCommandInput = {
  displayName?: string;
  avatarUrl?: string;
  updatedAt?: string;
};

export type PixbookTransferDirection = "incoming" | "outgoing";

export type PixbookRecordTransferCommandInput = {
  offerArtifact: PixpaxSignedArtifact<PixpaxTransferOffer>;
  acceptanceArtifact: PixpaxSignedArtifact<PixpaxTransferAcceptance>;
  recordedAt?: string;
  direction?: PixbookTransferDirection;
};

export type PixbookCommandEnvelope =
  | {
      type: "pixbook.claim-pack";
      data: PixbookClaimPackCommandInput;
    }
  | {
      type: "pixbook.record-pack-opened";
      data: PixbookRecordPackOpenedCommandInput;
    }
  | {
      type: "pixbook.set-display-profile";
      data: PixbookSetDisplayProfileCommandInput;
    }
  | {
      type: "pixbook.record-transfer";
      data: PixbookRecordTransferCommandInput;
    };

export type PixbookClaimedPackRecord = {
  claimEntryId: string;
  claimId: string;
  claimedAt: string;
  artifact: PixpaxSignedArtifact<PixpaxPackIssuance>;
  verification: PixbookClaimVerificationState | null;
};

export type PixbookOpenedPackRecord = {
  openEntryId: string;
  claimEntryId: string;
  packId: string;
  openedAt: string;
};

export type PixbookOwnedCardInstance = {
  cardInstanceId: string;
  cardId: string;
  claimEntryId: string;
  packId: string;
  collectionId: string;
  collectionVersion: string;
  seriesId?: string | null;
  slotIndex: number;
  role?: string | null;
};

export type PixbookTransferRecord = {
  transferEntryId: string;
  transferId: string;
  recordedAt: string;
  direction: PixbookTransferDirection;
  offerArtifact: PixpaxSignedArtifact<PixpaxTransferOffer>;
  acceptanceArtifact: PixpaxSignedArtifact<PixpaxTransferAcceptance>;
};

export type PixbookCollectionCompletion = {
  totalCards: number;
  ownedUniqueCards: number;
  progressPercent: number;
  complete: boolean;
};

export type PixbookSeriesCompletion = PixbookCollectionCompletion & {
  seriesId: string;
};

export type PixbookReplayState = {
  displayProfile: {
    displayName: string;
    avatarUrl: string;
    updatedAt: string;
  } | null;
  claimedPacksByEntryId: Record<string, PixbookClaimedPackRecord>;
  openedPacksByClaimEntryId: Record<string, PixbookOpenedPackRecord>;
  transfersByEntryId: Record<string, PixbookTransferRecord>;
  ownedCardInstancesById: Record<string, PixbookOwnedCardInstance>;
  duplicateCountsByCardId: Record<string, number>;
  spareCountsByCardId: Record<string, number>;
  completionByCollectionKey: Record<string, PixbookCollectionCompletion>;
  completionBySeriesKey: Record<string, PixbookSeriesCompletion>;
  verificationByClaimEntryId: Record<string, PixbookClaimVerificationState | null>;
  transferHistory: {
    outgoing: string[];
    incoming: string[];
  };
  ledgerHealth: {
    claimedPackCount: number;
    openedPackCount: number;
    lastEntryId: string | null;
    invalidEntries: string[];
  };
};
