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
  return requestJson<PlatformAuthSessionResponse>("/v1/auth/session");
}

export function getPlatformAccountSession() {
  return requestJson<PlatformAccountSessionResponse>("/v1/account/session");
}

export function validateAdminSession(token?: string | null) {
  return requestJson<PixPaxAdminSessionResponse>("/v1/pixpax/admin/session", {
    token: token || undefined,
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
