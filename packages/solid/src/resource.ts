import { createContainerAt } from "@inrupt/solid-client";
import type { SolidSessionLike } from "./types.js";

const DEFAULT_CONTENT_TYPE = "application/json";

export type SolidJsonResource<T> = {
  name: string;
  load(): Promise<T | null>;
  save(value: T): Promise<void>;
  clear(): Promise<void>;
};

function isAlreadyExistsError(error: unknown): boolean {
  const statusCode =
    typeof error === "object" && error !== null
      ? Number(
          Reflect.get(error, "statusCode") ??
            Reflect.get(error, "status") ??
            Reflect.get(error, "code"),
        )
      : NaN;
  const message = String(error ?? "");
  return (
    statusCode === 409 ||
    statusCode === 412 ||
    message.includes("409") ||
    message.includes("already exists")
  );
}

function isNotFoundStatus(status: number): boolean {
  return status === 404;
}

function assertSessionFetch(session: SolidSessionLike): typeof fetch {
  if (typeof session.fetch !== "function") {
    throw new Error("Solid session must provide a fetch implementation.");
  }
  return session.fetch;
}

function normalizeUrl(value: string): string {
  return new URL(value).toString();
}

function getContainerUrls(resourceUrl: string): string[] {
  const url = new URL(resourceUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [];
  }

  segments.pop();
  const root = `${url.protocol}//${url.host}`;
  const urls: string[] = [];
  let currentPath = "/";

  for (const segment of segments) {
    currentPath = `${currentPath}${segment}/`;
    urls.push(new URL(currentPath, root).toString());
  }

  return urls;
}

async function refreshEtag(
  fetchImpl: typeof fetch,
  resourceUrl: string,
): Promise<string | null> {
  const response = await fetchImpl(resourceUrl, {
    method: "HEAD",
  });

  if (!response.ok) {
    return null;
  }

  return response.headers.get("etag");
}

export function createSolidJsonResource<T>(input: {
  session: SolidSessionLike;
  url: string;
  name: string;
  contentType?: string;
  coerce(value: unknown): T;
}): SolidJsonResource<T> {
  const fetchImpl = assertSessionFetch(input.session);
  const resourceUrl = normalizeUrl(input.url);
  const contentType = input.contentType ?? DEFAULT_CONTENT_TYPE;
  let etag: string | null = null;

  async function ensureContainers(): Promise<void> {
    for (const containerUrl of getContainerUrls(resourceUrl)) {
      try {
        await createContainerAt(containerUrl, {
          fetch: fetchImpl,
        });
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          continue;
        }
        throw error;
      }
    }
  }

  return {
    name: input.name,
    async load() {
      const response = await fetchImpl(resourceUrl, {
        method: "GET",
        headers: {
          Accept: contentType,
        },
      });

      if (isNotFoundStatus(response.status)) {
        etag = null;
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to load Solid resource from ${resourceUrl}: ${response.status} ${response.statusText}`,
        );
      }

      etag = response.headers.get("etag");
      const payload = input.coerce(await response.json());
      if (!etag) {
        etag = await refreshEtag(fetchImpl, resourceUrl);
      }
      return payload;
    },
    async save(value: T) {
      await ensureContainers();

      const body = `${JSON.stringify(value, null, 2)}\n`;
      const headers = new Headers({
        "Content-Type": contentType,
      });

      if (etag) {
        headers.set("If-Match", etag);
      } else {
        headers.set("If-None-Match", "*");
      }

      const response = await fetchImpl(resourceUrl, {
        method: "PUT",
        headers,
        body,
      });

      if (response.status === 409 || response.status === 412) {
        throw new Error(
          `Solid resource write conflict at ${resourceUrl}. Reload before retrying.`,
        );
      }

      if (!response.ok) {
        throw new Error(
          `Failed to save Solid resource to ${resourceUrl}: ${response.status} ${response.statusText}`,
        );
      }

      etag = response.headers.get("etag");
      if (!etag) {
        etag = await refreshEtag(fetchImpl, resourceUrl);
      }
    },
    async clear() {
      const response = await fetchImpl(resourceUrl, {
        method: "DELETE",
      });

      if (!response.ok && !isNotFoundStatus(response.status)) {
        throw new Error(
          `Failed to clear Solid resource at ${resourceUrl}: ${response.status} ${response.statusText}`,
        );
      }

      etag = null;
    },
  };
}
