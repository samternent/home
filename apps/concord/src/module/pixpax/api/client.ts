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
  input: { managedUserId: string; name: string },
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
  bookId?: string
) {
  const query = new URLSearchParams();
  if (workspaceId) query.set("workspaceId", workspaceId);
  if (bookId) query.set("bookId", String(bookId || "").trim());
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
  binding?: PixbookCloudBinding;
}) {
  const query = new URLSearchParams();
  if (input.workspaceId) query.set("workspaceId", input.workspaceId);
  if (input.bookId) query.set("bookId", String(input.bookId || "").trim());
  const normalizedBinding = toPixbookBinding(input.binding);
  const path = `/v1/account/pixbook/snapshot${query.toString() ? `?${query.toString()}` : ""}`;
  return requestJson<PixbookCloudStateResponse>(path, {
    method: "PUT",
    body: {
      payload: input.payload,
      ledgerHead: input.ledgerHead || "",
      expectedVersion: input.expectedVersion,
      expectedLedgerHead: input.expectedLedgerHead || "",
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

export function createOverrideCode(
  collectionId: string,
  version: string,
  payload: unknown,
  token?: string | null
) {
  return requestJson<{
    ok: boolean;
    code: string;
    giftCode?: string;
    codeId: string;
    collectionId: string;
    version: string;
    dropId: string;
    count: number;
    bindToUser?: boolean;
    issuedTo?: string | null;
    expiresAt: string;
    issuedAt: string;
  }>(
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
