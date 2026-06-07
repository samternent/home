import type { LedgerContainer } from "@ternent/ledger";
import type {
  LedgerHead,
  RuntimeStorageCapabilities,
  RuntimeStorageProvider,
  StoragePushInput,
  StoragePushResult,
  WorkspaceStorageRef,
} from "@/app/runtime/contracts";
import { createHeadsFromContainer, createLedgerSnapshot } from "./helpers";

type HttpMethod = "GET" | "PUT" | "POST";

type HttpProviderMode = "single-writer" | "shared" | "test";

export type HttpStorageProviderOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
  loadMethod?: "GET";
  saveMethod?: "PUT" | "POST";
  pushMethod?: "PUT" | "POST";
  supportsCompareAndSwap?: boolean;
  mode?: HttpProviderMode;
  allowUnsafeSharedPush?: boolean;
  fetchImpl?: typeof fetch;
};

type RemoteSnapshotBody =
  | LedgerContainer
  | {
      container: LedgerContainer;
      heads?: LedgerHead[];
    };

function resolveFetchImpl(fetchImpl?: typeof fetch): typeof fetch {
  const value = fetchImpl ?? globalThis.fetch;
  if (!value) {
    throw new Error("Fetch is unavailable in this runtime.");
  }
  return value;
}

function toUrl(baseUrl: string | undefined, pointer: string): string {
  if (/^https?:\/\//.test(pointer)) {
    return pointer;
  }

  if (!baseUrl) {
    throw new Error("HTTP provider requires baseUrl for non-URL pointers.");
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPointer = pointer.startsWith("/") ? pointer : `/${pointer}`;
  return `${normalizedBase}${normalizedPointer}`;
}

function isLedgerContainer(value: unknown): value is LedgerContainer {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    record.format === "concord-ledger" &&
    record.version === "1" &&
    typeof record.head === "string" &&
    typeof record.commits === "object" &&
    record.commits !== null &&
    typeof record.entries === "object" &&
    record.entries !== null
  );
}

function parseContainerPayload(payload: unknown): {
  container: LedgerContainer;
  heads: LedgerHead[];
} {
  if (isLedgerContainer(payload)) {
    const heads = createHeadsFromContainer(payload);
    return {
      container: payload,
      heads,
    };
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid HTTP provider payload.");
  }

  const record = payload as Record<string, unknown>;
  if (!isLedgerContainer(record.container)) {
    throw new Error("HTTP provider payload is missing a valid container.");
  }

  const heads = Array.isArray(record.heads)
    ? record.heads.filter(
        (head): head is LedgerHead =>
          Boolean(head) && typeof head === "object" && typeof (head as LedgerHead).entryId === "string",
      )
    : createHeadsFromContainer(record.container);

  return {
    container: record.container,
    heads,
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`HTTP provider expected JSON response, got status ${response.status}.`);
  }

  return body as T;
}

function buildCapabilities(options: HttpStorageProviderOptions): RuntimeStorageCapabilities {
  const supportsCompareAndSwap = Boolean(options.supportsCompareAndSwap);
  return {
    supportsLoad: true,
    supportsSave: true,
    supportsPull: true,
    supportsPush: true,
    supportsCompareAndSwap,
    supportsWatch: false,
  };
}

function appendExpectedHeadHeaders(headers: Headers, input: StoragePushInput): void {
  const expectedHead = input.expectedHeads?.at(0);
  if (!expectedHead) {
    return;
  }

  if (expectedHead.hash) {
    headers.set("if-match", expectedHead.hash);
  } else if (expectedHead.entryId) {
    headers.set("x-expected-head", expectedHead.entryId);
  }
}

function ensureSharedPushSafety(options: HttpStorageProviderOptions): void {
  const mode = options.mode ?? "shared";
  if (mode !== "shared") {
    return;
  }

  if (options.supportsCompareAndSwap || options.allowUnsafeSharedPush) {
    return;
  }

  throw new Error(
    "HTTP provider push is unsafe in shared mode without compare-and-swap support.",
  );
}

async function performRequest(input: {
  fetchImpl: typeof fetch;
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<Response> {
  const headers = new Headers(input.headers ?? {});
  if (input.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return await input.fetchImpl(input.url, {
    method: input.method,
    headers,
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });
}

function resolveRemoteHeads(response: Response, fallback: LedgerHead[]): LedgerHead[] {
  const etag = response.headers.get("etag");
  if (!etag) {
    return fallback;
  }

  const [head] = fallback;
  if (!head) {
    return fallback;
  }

  return [
    {
      ...head,
      hash: etag,
    },
  ];
}

export function createHttpRuntimeStorageProvider(
  options: HttpStorageProviderOptions,
): RuntimeStorageProvider {
  const fetchImpl = resolveFetchImpl(options.fetchImpl);
  const capabilities = buildCapabilities(options);

  async function loadLike(ref: WorkspaceStorageRef) {
    const url = toUrl(options.baseUrl, ref.pointer);
    const response = await performRequest({
      fetchImpl,
      url,
      method: options.loadMethod ?? "GET",
      headers: options.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP provider load failed with status ${response.status}.`);
    }

    const payload = await parseJsonResponse<RemoteSnapshotBody>(response);
    const parsed = parseContainerPayload(payload);
    const remoteHeads = resolveRemoteHeads(response, parsed.heads);

    return {
      snapshot: createLedgerSnapshot({
        workspaceId: ref.workspaceId,
        container: parsed.container,
      }),
      remoteHeads,
    };
  }

  async function writeLike(ref: WorkspaceStorageRef, method: HttpMethod, body: unknown) {
    const url = toUrl(options.baseUrl, ref.pointer);

    const response = await performRequest({
      fetchImpl,
      url,
      method,
      headers: options.headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP provider write failed with status ${response.status}.`);
    }

    return response;
  }

  return {
    id: "http",
    label: "HTTP Storage",
    capabilities,
    async load(ref) {
      const { snapshot } = await loadLike(ref);
      return snapshot;
    },
    async save(ref, snapshot) {
      await writeLike(ref, options.saveMethod ?? "PUT", {
        container: snapshot.container,
        heads: snapshot.heads,
      });
    },
    async pull(ref) {
      return await loadLike(ref);
    },
    async push(input) {
      try {
        ensureSharedPushSafety(options);
      } catch {
        return {
          accepted: false,
          rejectedReason: "provider-error",
          remoteHeads: input.expectedHeads ?? [],
        } satisfies StoragePushResult;
      }

      const url = toUrl(options.baseUrl, input.ref.pointer);
      const headers = new Headers(options.headers ?? {});
      headers.set("content-type", "application/json");

      if (capabilities.supportsCompareAndSwap) {
        appendExpectedHeadHeaders(headers, input);
      }

      const response = await fetchImpl(url, {
        method: options.pushMethod ?? options.saveMethod ?? "PUT",
        headers,
        body: JSON.stringify({
          container: input.snapshot.container,
          heads: input.snapshot.heads,
        }),
      });

      if (response.status === 409 || response.status === 412) {
        const remoteHeads = input.expectedHeads ?? [];
        return {
          accepted: false,
          rejectedReason: "head-mismatch",
          remoteHeads,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          accepted: false,
          rejectedReason: "unauthorized",
          remoteHeads: input.expectedHeads ?? [],
        };
      }

      if (!response.ok) {
        return {
          accepted: false,
          rejectedReason: "provider-error",
          remoteHeads: input.expectedHeads ?? [],
        };
      }

      let remoteHeads = input.snapshot.heads;
      try {
        const payload = await parseJsonResponse<RemoteSnapshotBody>(response);
        remoteHeads = parseContainerPayload(payload).heads;
      } catch {
        remoteHeads = resolveRemoteHeads(response, input.snapshot.heads);
      }

      return {
        accepted: true,
        remoteHeads,
      };
    },
  };
}
