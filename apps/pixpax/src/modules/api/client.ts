import type {
  PixpaxPackIssuance,
  PixpaxSignedArtifact,
  PixpaxTransferAcceptance,
  PixpaxTransferOffer,
} from "@ternent/pixpax-core";

export class PixpaxApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "PixpaxApiError";
    this.status = status;
    this.body = body;
  }
}

export type PixpaxPublicCollectionSummary = {
  collectionId: string;
  resolvedVersion: string;
  name: string;
  description: string;
  settings: Record<string, unknown> | null;
};

export type PixpaxPublicCollectionCard = {
  cardId: string;
  label?: string;
  title?: string;
  name?: string;
  description?: string;
  seriesId?: string | null;
  role?: string | null;
  attributes?: Record<string, unknown> | null;
  renderPayload?: Record<string, unknown> | null;
};

export type PixpaxPalette16 = {
  id?: string;
  colors?: number[];
};

export type PixpaxPublicCollection = {
  collectionId?: string;
  version?: string;
  name?: string;
  description?: string;
  gridSize?: number;
  palette?: PixpaxPalette16 | null;
};

export type PixpaxPublicCollectionBundle = {
  collectionId: string;
  resolvedVersion: string;
  collection: PixpaxPublicCollection | null;
  index: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  cards: PixpaxPublicCollectionCard[];
};

export type PixpaxDesignatedRedeemResponse = {
  ok: true;
  recovered?: boolean;
  artifact: PixpaxSignedArtifact<PixpaxPackIssuance>;
  claim: {
    codeId: string;
    claimedAt: string;
    sourceCodeId: string | null;
    policyConfirmed: true;
    source: "server-designated-claim";
    claimantPublicKey: string;
  };
  verification: {
    ok: boolean;
    hashMatch: boolean;
    signatureValid: boolean;
    keyId: string;
    errors: string[];
  };
};

export type PixpaxAdminPermission =
  | "pixpax.admin.manage"
  | "pixpax.analytics.read"
  | "pixpax.creator.publish"
  | "pixpax.creator.view";

export type PixpaxAdminSessionResponse = {
  ok: boolean;
  authenticated: boolean;
  permissions: PixpaxAdminPermission[];
};

export type PlatformAccountSessionResponse = {
  ok: boolean;
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  } | null;
  workspace: {
    workspaceId: string;
    name: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    capabilities: string[];
  } | null;
};

export type AccountManagedUser = {
  id: string;
  displayName: string;
  avatarPublicId?: string | null;
  userKey: string;
  profileId?: string | null;
  identityPublicKey?: string | null;
  identityKeyFingerprint?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AccountBook = {
  id: string;
  managedUserId: string;
  collectionId: string;
  managedUserDisplayName?: string;
  name: string;
  status: string;
  currentVersion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AccountUsersResponse = {
  ok: boolean;
  accountId?: string;
  workspaceId: string;
  users: AccountManagedUser[];
};

export type AccountBooksResponse = {
  ok: boolean;
  accountId?: string;
  workspaceId: string;
  books: AccountBook[];
};

export type EncryptedIdentityBackupEnvelopeV1 = {
  format: "pixpax-identity-backup-encrypted";
  version: "1.0";
  accountId: string;
  managedUserId: string;
  profileId: string;
  identityPublicKey: string;
  identityKeyFingerprint: string;
  label: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  crypto: {
    kdf: {
      name: "PBKDF2-SHA256";
      iterations: 310000;
      saltB64: string;
    };
    cipher: {
      name: "AES-256-GCM";
      ivB64: string;
    };
    aad: {
      accountId: string;
      managedUserId: string;
      profileId: string;
      identityKeyFingerprint: string;
      format: "pixpax-identity-backup-encrypted";
      version: "1.0";
    };
  };
  ciphertextB64: string;
};

export type EncryptedIdentityBackupEnvelopeV2 = {
  format: "pixpax-identity-backup-encrypted";
  version: "2.0";
  accountId: string;
  managedUserId: string;
  profileId: string;
  identityPublicKey: string;
  identityKeyFingerprint: string;
  label: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  crypto: {
    kdf: {
      name: "PBKDF2-SHA256";
      iterations: 310000;
      saltB64: string;
    };
    cipher: {
      name: "AES-256-GCM";
      ivB64: string;
    };
    aad: {
      accountId: string;
      managedUserId: string;
      profileId: string;
      identityKeyFingerprint: string;
      format: "pixpax-identity-backup-encrypted";
      version: "2.0";
    };
  };
  ciphertextB64: string;
};

export type EncryptedIdentityBackupEnvelope =
  | EncryptedIdentityBackupEnvelopeV1
  | EncryptedIdentityBackupEnvelopeV2;

export type IdentityBackupMetadata = {
  id: string;
  managedUserId: string;
  backupVersion: number;
  createdAt: string;
  profileId: string;
  identityKeyFingerprint: string;
};

export type CreateIdentityBackupResponse = {
  ok: boolean;
  backup: IdentityBackupMetadata;
};

export type LatestIdentityBackupResponse = {
  ok: boolean;
  managedUserId: string;
  backup: IdentityBackupMetadata & {
    envelope: EncryptedIdentityBackupEnvelope;
  };
};

export type PixbookCloudSnapshot = {
  id: string;
  bookId: string;
  version: number;
  ledgerHead: string | null;
  checksum: string;
  createdAt: string;
  payload: unknown;
};

export type PixbookCloudStateResponse = {
  ok: boolean;
  workspaceId: string;
  managedUser: {
    id: string;
    displayName: string;
    avatarPublicId?: string | null;
    userKey: string;
    status: string;
  };
  book: {
    id: string;
    managedUserId: string;
    collectionId: string;
    name: string;
    status: string;
    currentVersion: number;
    createdAt?: string;
    updatedAt?: string;
  };
  snapshot: PixbookCloudSnapshot | null;
};

export type PixpaxAdminCollectionsResponse = {
  ok: boolean;
  refs: Array<{
    collectionId: string;
    version: string;
  }>;
};

export type PixpaxV2MetaResponse = {
  ok: boolean;
  version: string;
  invariants: string[];
  capabilities: {
    deterministicPreview: boolean;
    deterministicIssue: boolean;
    designatedIssue: boolean;
    publicCollections: boolean;
    designatedRedeem: boolean;
    proofVerify: boolean;
  };
  issuer: {
    sealIdentityConfigured: boolean;
  };
};

export type PixpaxV2IssueResponse = {
  ok: boolean;
  codeId?: string;
  redeemUrl?: string;
  qrSvg?: string;
  artifact: PixpaxSignedArtifact<PixpaxPackIssuance>;
  verification: PixpaxDesignatedRedeemResponse["verification"];
};

export type PixpaxV2PreviewResponse = {
  ok: boolean;
  issuance: Record<string, unknown>;
};

export type PixpaxQrSvgResponse = {
  ok: true;
  qrSvg: string;
};

export type PixpaxSwapOfferRecord = {
  transferId: string;
  status: "offered" | "accepted" | "completed";
  collectionId: string;
  collectionVersion: string;
  cardInstanceId: string;
  cardId: string;
  sourceClaimEntryId: string;
  sourcePackId: string;
  seriesId?: string | null;
  slotIndex: number;
  role?: string | null;
  offeredAt: string;
  acceptedAt?: string | null;
  recipientCompletedAt?: string | null;
  senderCompletedAt?: string | null;
  senderPublicKey: string;
  recipientPublicKey: string;
  senderHash: string;
  recipientHash: string;
  offerArtifact: PixpaxSignedArtifact<PixpaxTransferOffer>;
  acceptanceArtifact?: PixpaxSignedArtifact<PixpaxTransferAcceptance> | null;
};

export type PixpaxV2DesignatedCodeSummary = {
  codeId: string;
  status: "unused" | "claimed" | "revoked";
  kind: string;
  collectionId: string;
  collectionVersion: string;
  dropId: string | null;
  sourceCodeId: string | null;
  issuedAt: string | null;
  redeemUrl: string | null;
  claimedAt: string | null;
  claimantPublicKey: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  artifact: PixpaxSignedArtifact<PixpaxPackIssuance> | null;
};

function resolveApiBase() {
  if (import.meta.env.DEV) return "";
  const configured = String(import.meta.env.VITE_TERNENT_API_URL || "").trim();
  if (/^https?:\/\//i.test(configured)) return configured;
  return "https://api.ternent.dev";
}

const apiBase = resolveApiBase();

function buildApiUrl(path: string) {
  if (!apiBase) return path;
  return new URL(path, apiBase).toString();
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function requestJson<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const token = String(init.token || "").trim();
  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: init.credentials ?? "same-origin",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const parsed = text ? safeParseJson(text) : null;

  if (!response.ok) {
    throw new PixpaxApiError(
      `${response.status} ${response.statusText}: ${text || "request failed"}`,
      response.status,
      parsed,
    );
  }

  return parsed as T;
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function withWorkspaceQuery(path: string, workspaceId?: string) {
  const query = new URLSearchParams();
  if (workspaceId) query.set("workspaceId", workspaceId);
  return `${path}${query.toString() ? `?${query.toString()}` : ""}`;
}

function withWorkspaceAndManagedUserQuery(
  path: string,
  managedUserId: string,
  workspaceId?: string,
) {
  const query = new URLSearchParams();
  if (workspaceId) query.set("workspaceId", workspaceId);
  query.set("managedUserId", String(managedUserId || "").trim());
  return `${path}?${query.toString()}`;
}

export async function fetchPublicCollectionCatalog() {
  const payload = await requestJson<{
    ok: true;
    collections: PixpaxPublicCollectionSummary[];
  }>("/v1/pixpax/v2/collections/catalog");
  return payload.collections;
}

export async function createSwapRecipientQr(value: string) {
  const payload = await requestJson<PixpaxQrSvgResponse>("/v1/pixpax/v2/swaps/recipient-qr", {
    method: "POST",
    body: JSON.stringify({
      value: String(value || "").trim(),
    }),
  });
  return payload.qrSvg;
}

export async function createSwapOfferRecord(offerArtifact: PixpaxSignedArtifact<PixpaxTransferOffer>) {
  const payload = await requestJson<{
    ok: true;
    created: boolean;
    offer: PixpaxSwapOfferRecord;
  }>("/v1/pixpax/v2/swaps/offers", {
    method: "POST",
    body: JSON.stringify({ offerArtifact }),
  });
  return payload.offer;
}

export async function listIncomingSwapOffers(recipientPublicKey: string) {
  const query = new URLSearchParams({
    recipientPublicKey: String(recipientPublicKey || "").trim(),
  });
  const payload = await requestJson<{
    ok: true;
    offers: PixpaxSwapOfferRecord[];
  }>(`/v1/pixpax/v2/swaps/inbox?${query.toString()}`);
  return payload.offers;
}

export async function listOutgoingSwapOffers(senderPublicKey: string) {
  const query = new URLSearchParams({
    senderPublicKey: String(senderPublicKey || "").trim(),
  });
  const payload = await requestJson<{
    ok: true;
    offers: PixpaxSwapOfferRecord[];
  }>(`/v1/pixpax/v2/swaps/outbox?${query.toString()}`);
  return payload.offers;
}

export async function acceptSwapOfferRecord(input: {
  transferId: string;
  offerArtifact: PixpaxSignedArtifact<PixpaxTransferOffer>;
  acceptanceArtifact: PixpaxSignedArtifact<PixpaxTransferAcceptance>;
}) {
  const payload = await requestJson<{
    ok: true;
    offer: PixpaxSwapOfferRecord;
  }>(`/v1/pixpax/v2/swaps/offers/${encodeURIComponent(String(input.transferId || "").trim())}/accept`, {
    method: "POST",
    body: JSON.stringify({
      offerArtifact: input.offerArtifact,
      acceptanceArtifact: input.acceptanceArtifact,
    }),
  });
  return payload.offer;
}

export async function completeSwapOfferRecord(input: {
  transferId: string;
  offerArtifact: PixpaxSignedArtifact<PixpaxTransferOffer>;
}) {
  const payload = await requestJson<{
    ok: true;
    offer: PixpaxSwapOfferRecord;
  }>(`/v1/pixpax/v2/swaps/offers/${encodeURIComponent(String(input.transferId || "").trim())}/complete`, {
    method: "POST",
    body: JSON.stringify({
      offerArtifact: input.offerArtifact,
    }),
  });
  return payload.offer;
}

export async function fetchPublicCollectionBundle(
  collectionId: string,
  version = "",
) {
  const query = version ? `?version=${encodeURIComponent(version)}` : "";
  const path = `/v1/pixpax/v2/collections/${encodeURIComponent(collectionId)}/bundle${query}`;
  const payload = await requestJson<{
    ok: true;
  } & PixpaxPublicCollectionBundle>(path);
  return payload;
}

export async function fetchAdminCollectionBundle(collectionId: string, version: string) {
  return requestJson<{
    collection?: PixpaxPublicCollection | null;
    index?: Record<string, unknown> | null;
    settings?: Record<string, unknown> | null;
    cards?: PixpaxPublicCollectionCard[];
  }>(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(version)}/bundle`,
  );
}

export async function redeemDesignatedCode(input: {
  code: string;
  claimantPublicKey: string;
}) {
  return requestJson<PixpaxDesignatedRedeemResponse>(
    "/v1/pixpax/v2/designated/redeem",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function verifyIssuedArtifact(
  artifact: PixpaxSignedArtifact<PixpaxPackIssuance>,
) {
  const payload = await requestJson<{
    ok: true;
    verification: PixpaxDesignatedRedeemResponse["verification"];
  }>("/v1/pixpax/v2/proofs/verify", {
    method: "POST",
    body: JSON.stringify(artifact),
  });
  return payload.verification;
}

export async function getPlatformAccountSession() {
  return requestJson<PlatformAccountSessionResponse>("/v1/account/session", {
    credentials: "include",
  });
}

export async function listAccountManagedUsers(workspaceId?: string) {
  return requestJson<AccountUsersResponse>(withWorkspaceQuery("/v1/account/users", workspaceId), {
    credentials: "include",
  });
}

export async function createAccountManagedUser(
  input: {
    displayName: string;
    profileId: string;
    identityPublicKey: string;
    userKey?: string;
    avatarPublicId?: string;
  },
  workspaceId?: string,
) {
  return requestJson<{ ok: boolean; id: string; user?: AccountManagedUser }>(
    withWorkspaceQuery("/v1/account/users", workspaceId),
    {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(input),
    },
  );
}

export async function updateAccountManagedUser(
  userId: string,
  input: {
    displayName?: string;
    status?: string;
    avatarPublicId?: string;
    profileId?: string;
    identityPublicKey?: string;
  },
  workspaceId?: string,
) {
  return requestJson<{ ok: boolean; id: string }>(
    withWorkspaceQuery(`/v1/account/users/${encodeURIComponent(userId)}`, workspaceId),
    {
      method: "PATCH",
      credentials: "include",
      body: JSON.stringify(input),
    },
  );
}

export async function listAccountBooks(workspaceId?: string) {
  return requestJson<AccountBooksResponse>(withWorkspaceQuery("/v1/account/books", workspaceId), {
    credentials: "include",
  });
}

export async function createAccountBook(
  input: {
    managedUserId: string;
    name: string;
    collectionId?: string;
  },
  workspaceId?: string,
) {
  return requestJson<{ ok: boolean; id: string }>(
    withWorkspaceQuery("/v1/account/books", workspaceId),
    {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(input),
    },
  );
}

export async function createIdentityBackup(
  input: {
    managedUserId: string;
    backupNonce: string;
    envelope: EncryptedIdentityBackupEnvelope;
  },
  workspaceId?: string,
) {
  return requestJson<CreateIdentityBackupResponse>(
    withWorkspaceQuery("/v1/account/identity-backups", workspaceId),
    {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(input),
    },
  );
}

export async function getLatestIdentityBackup(managedUserId: string, workspaceId?: string) {
  return requestJson<LatestIdentityBackupResponse>(
    withWorkspaceAndManagedUserQuery(
      "/v1/account/identity-backups/latest",
      managedUserId,
      workspaceId,
    ),
    {
      credentials: "include",
    },
  );
}

type PixbookCloudBinding = {
  profileId: string;
  identityPublicKey: string;
  profileDisplayName?: string;
};

function toPixbookBinding(binding?: PixbookCloudBinding) {
  if (!binding) return null;
  const profileId = String(binding.profileId || "").trim();
  const identityPublicKey = String(binding.identityPublicKey || "").trim();
  const profileDisplayName = String(binding.profileDisplayName || "").trim();
  if (!profileId || !identityPublicKey) return null;
  return {
    profileId,
    identityPublicKey,
    ...(profileDisplayName ? { profileDisplayName } : {}),
  };
}

export async function getPixbookCloudState(
  workspaceId?: string,
  binding?: PixbookCloudBinding,
  bookId?: string,
  collectionId?: string,
) {
  const query = new URLSearchParams();
  if (workspaceId) query.set("workspaceId", workspaceId);
  if (bookId) query.set("bookId", String(bookId || "").trim());
  if (collectionId) query.set("collectionId", String(collectionId || "").trim());
  const normalizedBinding = toPixbookBinding(binding);
  if (normalizedBinding?.profileId) query.set("profileId", normalizedBinding.profileId);
  if (normalizedBinding?.identityPublicKey) {
    query.set("identityPublicKey", normalizedBinding.identityPublicKey);
  }
  if (normalizedBinding?.profileDisplayName) {
    query.set("profileDisplayName", normalizedBinding.profileDisplayName);
  }
  const path = `/v1/account/pixbook${query.toString() ? `?${query.toString()}` : ""}`;
  return requestJson<PixbookCloudStateResponse>(path, {
    credentials: "include",
  });
}

export async function savePixbookCloudSnapshot(input: {
  payload: unknown;
  ledgerHead?: string;
  expectedVersion?: number | null;
  expectedLedgerHead?: string | null;
  workspaceId?: string;
  bookId?: string;
  collectionId?: string;
  binding?: PixbookCloudBinding;
}) {
  const query = new URLSearchParams();
  if (input.workspaceId) query.set("workspaceId", input.workspaceId);
  if (input.bookId) query.set("bookId", String(input.bookId || "").trim());
  if (input.collectionId) {
    query.set("collectionId", String(input.collectionId || "").trim());
  }
  const normalizedBinding = toPixbookBinding(input.binding);
  const path = `/v1/account/pixbook/snapshot${query.toString() ? `?${query.toString()}` : ""}`;
  return requestJson<PixbookCloudStateResponse>(path, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify({
      payload: input.payload,
      ledgerHead: input.ledgerHead || "",
      expectedVersion: input.expectedVersion,
      expectedLedgerHead: input.expectedLedgerHead || "",
      collectionId: input.collectionId || "",
      profileId: normalizedBinding?.profileId || "",
      identityPublicKey: normalizedBinding?.identityPublicKey || "",
      profileDisplayName: normalizedBinding?.profileDisplayName || "",
    }),
  });
}

export async function validatePixpaxAdminSession(token?: string | null) {
  return requestJson<PixpaxAdminSessionResponse>("/v1/pixpax/admin/session", {
    token,
    credentials: "include",
  });
}

export async function listPixpaxAdminCollections(token?: string | null) {
  return requestJson<PixpaxAdminCollectionsResponse>("/v1/pixpax/admin/collections", {
    token,
    credentials: "include",
  });
}

export async function getPixpaxV2Meta() {
  return requestJson<PixpaxV2MetaResponse>("/v1/pixpax/v2/meta", {
    credentials: "include",
  });
}

export async function previewPixpaxV2DeterministicIssue(
  payload: {
    collectionId: string;
    collectionVersion: string;
    dropId: string;
    claimantPublicKey: string;
    count: number;
  },
  token?: string | null,
) {
  return requestJson<PixpaxV2PreviewResponse>("/v1/pixpax/v2/deterministic/preview", {
    method: "POST",
    token,
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function issuePixpaxV2DeterministicPack(
  payload: {
    collectionId: string;
    collectionVersion: string;
    dropId: string;
    claimantPublicKey: string;
    count: number;
  },
  token?: string | null,
) {
  return requestJson<PixpaxV2IssueResponse>("/v1/pixpax/v2/deterministic/issue", {
    method: "POST",
    token,
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function issuePixpaxV2DesignatedPack(
  payload: {
    collectionId: string;
    collectionVersion: string;
    dropId: string;
    sourceCodeId: string;
    cardIds: string[];
  },
  token?: string | null,
) {
  return requestJson<PixpaxV2IssueResponse>("/v1/pixpax/v2/designated/issue", {
    method: "POST",
    token,
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function listPixpaxV2DesignatedCodes(
  input: {
    collectionId?: string;
    collectionVersion?: string;
    dropId?: string;
    status?: string;
    limit?: number;
  } = {},
  token?: string | null,
) {
  const query = new URLSearchParams();
  if (input.collectionId) query.set("collectionId", String(input.collectionId || "").trim());
  if (input.collectionVersion) query.set("collectionVersion", String(input.collectionVersion || "").trim());
  if (input.dropId) query.set("dropId", String(input.dropId || "").trim());
  if (input.status) query.set("status", String(input.status || "").trim());
  if (Number.isFinite(Number(input.limit))) query.set("limit", String(Number(input.limit)));
  const path = `/v1/pixpax/v2/designated/codes${query.toString() ? `?${query.toString()}` : ""}`;
  return requestJson<{
    ok: true;
    codes: PixpaxV2DesignatedCodeSummary[];
  }>(path, {
    token,
    credentials: "include",
  });
}

export async function revokePixpaxV2DesignatedCode(
  codeId: string,
  input: {
    reason?: string;
  } = {},
  token?: string | null,
) {
  return requestJson<{
    ok: true;
    alreadyRevoked: boolean;
    code: PixpaxV2DesignatedCodeSummary;
  }>(`/v1/pixpax/v2/designated/codes/${encodeURIComponent(String(codeId || "").trim())}/revoke`, {
    method: "POST",
    token,
    credentials: "include",
    body: JSON.stringify(input),
  });
}
