import { platformAuthClient } from "../auth/platform-auth-client";

export class PixPaxApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "PixPaxApiError";
    this.status = status;
    this.body = body;
  }
}

function resolveApiBase() {
  if (import.meta.env.DEV) return "";
  const configured = String(import.meta.env.VITE_TERNENT_API_URL || "").trim();
  if (/^https?:\/\//i.test(configured)) return configured;
  return "https://api.ternent.dev";
}

const apiBase = resolveApiBase();

export function buildPixPaxApiUrl(path: string) {
  if (!apiBase) return path;
  return new URL(path, apiBase).toString();
}

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers || {}),
  };
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(buildPixPaxApiUrl(path), {
    method: options.method || "GET",
    credentials: options.credentials || "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const parsed = text ? safeParseJson(text) : null;
  if (!response.ok) {
    throw new PixPaxApiError(
      `${response.status} ${response.statusText}: ${text || "request failed"}`,
      response.status,
      parsed
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

export type PixPaxAdminSessionResponse = {
  ok: boolean;
  authenticated: boolean;
  permissions: string[];
};

export type PlatformAuthSessionResponse = {
  ok: boolean;
  authenticated: boolean;
  session?: {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
    session: {
      id?: string;
      expiresAt?: string;
    };
  };
  error?: string;
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

export function getPlatformAuthSession() {
  return platformAuthClient.getSession().then((result) => {
    if (result.error) {
      throw new PixPaxApiError(
        result.error.message || "Platform auth session request failed.",
        Number(result.error.status || 500),
        result.error
      );
    }

    if (!result.data?.user?.id) {
      return {
        ok: false,
        authenticated: false,
        error: "Unauthorized.",
      } satisfies PlatformAuthSessionResponse;
    }

    return {
      ok: true,
      authenticated: true,
      session: {
        user: result.data.user,
        session: result.data.session || {},
      },
    } satisfies PlatformAuthSessionResponse;
  });
}

export function getPlatformAccountSession() {
  return requestJson<PlatformAccountSessionResponse>("/v1/account/session");
}

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
  workspaceId: string;
  users: AccountManagedUser[];
};

export type AccountBooksResponse = {
  ok: boolean;
  workspaceId: string;
  books: AccountBook[];
};

function withWorkspaceQuery(path: string, workspaceId?: string) {
  const query = new URLSearchParams();
  if (workspaceId) query.set("workspaceId", workspaceId);
  return `${path}${query.toString() ? `?${query.toString()}` : ""}`;
}

export function listAccountManagedUsers(workspaceId?: string) {
  return requestJson<AccountUsersResponse>(withWorkspaceQuery("/v1/account/users", workspaceId));
}

export function createAccountManagedUser(
  input: {
    displayName: string;
    profileId: string;
    identityPublicKey: string;
    userKey?: string;
    avatarPublicId?: string;
  },
  workspaceId?: string
) {
  return requestJson<{ ok: boolean; id: string }>(withWorkspaceQuery("/v1/account/users", workspaceId), {
    method: "POST",
    body: input,
  });
}

export function updateAccountManagedUser(
  userId: string,
  input: {
    displayName?: string;
    status?: string;
    avatarPublicId?: string;
    profileId?: string;
    identityPublicKey?: string;
  },
  workspaceId?: string
) {
  return requestJson<{ ok: boolean; id: string }>(
    withWorkspaceQuery(`/v1/account/users/${encodeURIComponent(userId)}`, workspaceId),
    {
      method: "PATCH",
      body: input,
    }
  );
}

export function listAccountBooks(workspaceId?: string) {
  return requestJson<AccountBooksResponse>(withWorkspaceQuery("/v1/account/books", workspaceId));
}

export function createAccountBook(
  input: { managedUserId: string; name: string; collectionId?: string },
  workspaceId?: string
) {
  return requestJson<{ ok: boolean; id: string }>(withWorkspaceQuery("/v1/account/books", workspaceId), {
    method: "POST",
    body: input,
  });
}

export function updateAccountBook(
  bookId: string,
  input: { name?: string; status?: string },
  workspaceId?: string
) {
  return requestJson<{ ok: boolean; id: string }>(
    withWorkspaceQuery(`/v1/account/books/${encodeURIComponent(bookId)}`, workspaceId),
    {
      method: "PATCH",
      body: input,
    }
  );
}

export function removeAccountManagedIdentity(userId: string, workspaceId?: string) {
  return requestJson<{ ok: boolean; id: string; removedBookIds: string[] }>(
    withWorkspaceQuery(
      `/v1/account/users/${encodeURIComponent(userId)}/identity`,
      workspaceId
    ),
    {
      method: "DELETE",
    }
  );
}

export function validateAdminSession(token?: string | null) {
  return requestJson<PixPaxAdminSessionResponse>("/v1/pixpax/admin/session", {
    token: token || undefined,
  });
}

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

export type PixbookCloudBinding = {
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

export function getPixbookCloudState(
  workspaceId?: string,
  binding?: PixbookCloudBinding,
  bookId?: string,
  collectionId?: string
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
  return requestJson<PixbookCloudStateResponse>(path);
}

export function savePixbookCloudSnapshot(input: {
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
    body: {
      payload: input.payload,
      ledgerHead: input.ledgerHead || "",
      expectedVersion: input.expectedVersion,
      expectedLedgerHead: input.expectedLedgerHead || "",
      collectionId: input.collectionId || "",
      profileId: normalizedBinding?.profileId || "",
      identityPublicKey: normalizedBinding?.identityPublicKey || "",
      profileDisplayName: normalizedBinding?.profileDisplayName || "",
    },
  });
}

export type PixPaxAnalyticsResponse = {
  ok: boolean;
  packsTotal: number;
  packsReturned: number;
  truncated?: boolean;
  insights: {
    totalPacks: number;
    totalCardsIssued: number;
    uniqueCollections: number;
    uniqueDrops: number;
    firstIssuedAt: string | null;
    lastIssuedAt: string | null;
    topDrops: Array<{ dropId: string; packs: number }>;
    issuanceModes: Array<{ mode: string; packs: number }>;
    packsByCollectionVersion: Array<{
      collectionId: string;
      collectionVersion: string;
      packs: number;
    }>;
    packsByDay: Array<{ day: string; packs: number }>;
  };
  packs: Array<{
    packId: string;
    collectionId: string;
    collectionVersion: string;
    dropId: string;
    issuedAt: string;
    count: number;
    issuanceMode: string;
    untracked: boolean;
    publicId?: string | null;
    avatarSeed?: string | null;
  }>;
};

export function getPackAnalytics(
  params: { limit?: number | null; collectionId?: string; version?: string; dropId?: string },
  token?: string | null
) {
  const query = new URLSearchParams();
  if (params.collectionId) query.set("collectionId", params.collectionId);
  if (params.version) query.set("version", params.version);
  if (params.dropId) query.set("dropId", params.dropId);
  if (typeof params.limit === "number" && Number.isFinite(params.limit) && params.limit > 0) {
    query.set("limit", String(Math.floor(params.limit)));
  }
  const path = `/v1/pixpax/analytics/packs${query.toString() ? `?${query.toString()}` : ""}`;
  return requestJson<PixPaxAnalyticsResponse>(path, { token: token || undefined });
}

export type PixPaxCodeTokenResponse = {
  ok: boolean;
  token: string;
  tokenHash: string;
  payload: Record<string, unknown>;
  codeId: string;
  collectionId: string;
  version: string;
  expiresAt: string;
  issuedAt: string;
  label: string;
  kind: "pack" | "fixed-card";
  cardId?: string | null;
  count?: number | null;
  dropId?: string | null;
  kid?: string;
  redeemUrl: string;
  qrSvg: string;
  qrErrorCorrection: string;
  qrQuietZoneModules: number;
};

export type PixPaxCodeCardItem = {
  token: string;
  tokenHash: string;
  label: string;
  redeemUrl: string;
  qrSvg: string;
  qrErrorCorrection: string;
  qrQuietZoneModules: number;
  codeId: string;
  issuedAt: string;
  expiresAt: string;
  collectionId: string;
  version: string;
  kind: "pack" | "fixed-card";
  cardId?: string;
  count?: number;
  dropId?: string;
  seriesTitle?: string;
  issuerName?: string;
};

export function createCodeToken(
  collectionId: string,
  version: string,
  payload: unknown,
  token?: string | null
) {
  return requestJson<PixPaxCodeTokenResponse>(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(
      version
    )}/override-codes`,
    {
      method: "POST",
      token: token || undefined,
      body: payload,
    }
  );
}

export const createOverrideCode = createCodeToken;

export function createCodeCardsJson(
  collectionId: string,
  version: string,
  payload: unknown,
  token?: string | null
) {
  return requestJson<{
    ok: boolean;
    collectionId: string;
    version: string;
    quantity: number;
    items: PixPaxCodeCardItem[];
  }>(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(
      version
    )}/code-cards`,
    {
      method: "POST",
      token: token || undefined,
      body: {
        ...(payload && typeof payload === "object" ? payload : {}),
        format: "json",
      },
    }
  );
}

export type PixPaxIssuerRegistryResponse = {
  ok: boolean;
  issuers: Array<{
    issuerKeyId: string;
    kid: string;
    name: string;
    status: "active" | "revoked";
    publicKeyPem: string;
    createdAt?: string | null;
    notes?: string | null;
  }>;
};

export type PixPaxReceiptKeyRegistryResponse = {
  ok: boolean;
  receiptKeys: Array<{
    receiptKeyId: string;
    name: string;
    status: "active" | "revoked";
    publicKeyPem: string;
    createdAt?: string | null;
    notes?: string | null;
  }>;
};

export function listPixpaxIssuers() {
  return requestJson<PixPaxIssuerRegistryResponse>("/v1/pixpax/issuers");
}

export function listPixpaxReceiptKeys() {
  return requestJson<PixPaxReceiptKeyRegistryResponse>("/v1/pixpax/receipt-keys");
}

export type PixPaxRedeemResponse = {
  ok: boolean;
  packId: string;
  packModel: string;
  collectionId: string;
  collectionVersion: string;
  dropId: string;
  issuedAt: string;
  entry?: {
    kind?: string;
    payload?: Record<string, any>;
    signature?: string;
  };
  cards: Array<{
    cardId: string;
    seriesId?: string | null;
    slotIndex?: number | null;
    role?: string | null;
    renderPayload?: Record<string, unknown> | null;
  }>;
  receipt: {
    payload: Record<string, any>;
    signature: string;
    receiptKeyId: string;
    tokenHash: string;
    segmentKey?: string | null;
    segmentHash?: string | null;
  };
  packRoot: string;
  itemHashes: string[];
  issuance: {
    mode: string;
    reused: boolean;
    override: boolean;
    untracked: boolean;
    codeId: string;
    dropId: string;
  };
};

export function redeemPixpaxToken(input: {
  token: string;
  collectorPubKey: string;
  collectorSig?: string;
}) {
  return requestJson<PixPaxRedeemResponse>("/v1/pixpax/redeem", {
    method: "POST",
    body: input,
  });
}

export type PixPaxRedeemCodeResolveResponse = {
  ok: boolean;
  codeId: string;
  token: string;
  label?: string;
  kind?: "pack" | "fixed-card";
  collectionId?: string | null;
  version?: string | null;
  expiresAt?: string | null;
};

export function resolvePixpaxRedeemCode(codeId: string) {
  return requestJson<PixPaxRedeemCodeResolveResponse>(
    `/v1/pixpax/redeem-code/${encodeURIComponent(String(codeId || "").trim())}`
  );
}

export type PixPaxCollectionSettings = {
  visibility: "public" | "unlisted";
  issuanceMode: "scheduled" | "codes-only";
  [key: string]: unknown;
};

export type PixPaxIssuerDisplay = {
  name: string;
  avatarUrl?: string;
};

export type PixPaxCollectionResolveResponse = {
  ok: boolean;
  collectionId: string;
  resolvedVersion: string;
  settings: PixPaxCollectionSettings;
  issuer: PixPaxIssuerDisplay;
};

export type PixPaxCollectionSettingsResponse = {
  ok: boolean;
  collectionId: string;
  settings: PixPaxCollectionSettings;
};

export type PixPaxCollectionCatalogResponse = {
  ok: boolean;
  collections: Array<{
    collectionId: string;
    resolvedVersion: string;
    settings: PixPaxCollectionSettings;
    issuer: PixPaxIssuerDisplay;
    name: string;
    description?: string;
  }>;
};

export type PixPaxAdminCollectionsResponse = {
  ok: boolean;
  refs: Array<{
    collectionId: string;
    version: string;
  }>;
};

export function resolvePixpaxCollection(collectionId: string, version?: string) {
  const query = new URLSearchParams();
  if (version) query.set("version", String(version || "").trim());
  return requestJson<PixPaxCollectionResolveResponse>(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/resolve${
      query.toString() ? `?${query.toString()}` : ""
    }`
  );
}

export function getPixpaxCollectionSettings(collectionId: string) {
  return requestJson<PixPaxCollectionSettingsResponse>(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/settings`
  );
}

export function putPixpaxCollectionSettings(
  collectionId: string,
  payload: Record<string, unknown>,
  token?: string | null
) {
  return requestJson<PixPaxCollectionSettingsResponse>(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/settings`,
    {
      method: "PUT",
      token: token || undefined,
      body: payload,
    }
  );
}

export function listPixpaxCollectionCatalog() {
  return requestJson<PixPaxCollectionCatalogResponse>("/v1/pixpax/collections/catalog");
}

export function listPixpaxAdminCollections(token?: string | null) {
  return requestJson<PixPaxAdminCollectionsResponse>("/v1/pixpax/admin/collections", {
    token: token || undefined,
  });
}

export function getPixpaxCollectionBundle(collectionId: string, version: string) {
  return requestJson<{
    collection?: Record<string, unknown>;
    index?: {
      cards?: string[];
    };
    settings?: PixPaxCollectionSettings;
    cards?: Array<Record<string, unknown>>;
    missingCardIds?: string[];
  }>(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(
      version
    )}/bundle`
  );
}

export function putCollectionJson(
  collectionId: string,
  version: string,
  payload: unknown,
  token?: string | null
) {
  return requestJson(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(
      version
    )}/collection`,
    {
      method: "PUT",
      token: token || undefined,
      body: payload,
    }
  );
}

export function putIndexJson(
  collectionId: string,
  version: string,
  payload: unknown,
  token?: string | null
) {
  return requestJson(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(version)}/index`,
    {
      method: "PUT",
      token: token || undefined,
      body: payload,
    }
  );
}

export function putCardJson(
  collectionId: string,
  version: string,
  cardId: string,
  payload: unknown,
  token?: string | null
) {
  return requestJson(
    `/v1/pixpax/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(
      version
    )}/cards/${encodeURIComponent(cardId)}`,
    {
      method: "PUT",
      token: token || undefined,
      body: payload,
    }
  );
}
