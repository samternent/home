import {
  createContainerAt,
  deleteContainer,
  deleteFile,
  getFile,
  getSolidDataset,
  getThingAll,
  getUrlAll,
  universalAccess,
} from "@inrupt/solid-client";
import { createConcordApp } from "@ternent/concord/browser";
import type { LedgerContainer } from "@ternent/ledger";
import type { SerializedIdentity } from "@ternent/identity";
import { createSolidConcordPaths } from "./profile.js";
import type {
  CreateSolidWorkspaceOptions,
  SolidConcordPaths,
  SolidWorkspace,
  SolidWorkspaceAccessGrant,
  SolidWorkspaceAccessInput,
  SolidWorkspaceAccessSummary,
  SolidWorkspaceAnonymousRead,
  SolidWorkspaceBrowseResult,
  SolidWorkspaceEntry,
  SolidWorkspaceLedgerSummary,
  SolidWorkspaceReadResult,
  SolidWorkspaceScope,
  SolidWorkspaceVisibility,
  SolidWorkspaceWriteOptions,
} from "./types.js";

function normalizeUrl(value: string): string {
  return new URL(value).toString();
}

function normalizeContainerUrl(value: string): string {
  const normalized = normalizeUrl(value);
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStatusCode(error: unknown): number {
  if (!isRecord(error)) {
    return NaN;
  }

  const response = isRecord(error.response) ? error.response : null;
  return Number(error.statusCode ?? error.status ?? response?.status ?? NaN);
}

function isMissingError(error: unknown): boolean {
  const status = getStatusCode(error);
  const message = String(error ?? "");
  return status === 404 || message.includes("404");
}

function isAlreadyExistsError(error: unknown): boolean {
  const status = getStatusCode(error);
  const message = String(error ?? "");
  return status === 409 || status === 412 || message.includes("409");
}

function toWorkspaceScope(url: string, paths: SolidConcordPaths): SolidWorkspaceScope {
  const normalized = normalizeUrl(url);
  if (normalized.startsWith(paths.workspaceSharedRootUrl)) {
    return "shared";
  }
  if (normalized.startsWith(paths.workspacePublicRootUrl)) {
    return "public";
  }
  return "private";
}

function getScopeRoot(paths: SolidConcordPaths, scope: SolidWorkspaceScope): string {
  if (scope === "shared") {
    return paths.workspaceSharedRootUrl;
  }
  if (scope === "public") {
    return paths.workspacePublicRootUrl;
  }
  return paths.workspacePrivateRootUrl;
}

function getRelativePath(url: string, paths: SolidConcordPaths): string {
  const scope = toWorkspaceScope(url, paths);
  const root = getScopeRoot(paths, scope);
  const normalizedUrl = normalizeUrl(url);
  const strippedRoot = normalizeContainerUrl(root);
  const relative = normalizedUrl.startsWith(strippedRoot)
    ? normalizedUrl.slice(strippedRoot.length)
    : normalizedUrl;
  return relative || "/";
}

function sanitizeName(value: string, isContainer = false): string {
  const trimmed = String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "-");

  if (!trimmed) {
    throw new Error("A non-empty resource name is required.");
  }

  return isContainer ? `${trimmed}/` : trimmed;
}

const CONCORD_LEDGER_CONTENT_TYPE = "application/vnd.ternent.concord-ledger+json";

function isLikelyLedgerName(url: string, contentType: string | null): boolean {
  const name = stripTrailingSlash(url).split("/").pop()?.toLowerCase() ?? "";
  if (contentType?.includes("concord-ledger")) {
    return true;
  }

  return (
    name.includes("ledger") && (name.endsWith(".json") || contentType?.includes("json") === true)
  );
}

function isTextLike(contentType: string | null, name: string): boolean {
  const lowerName = name.toLowerCase();
  return Boolean(
    contentType?.startsWith("text/") ||
    contentType?.includes("json") ||
    contentType?.includes("xml") ||
    contentType?.includes("yaml") ||
    contentType?.includes("turtle") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".ttl") ||
    lowerName.endsWith(".txt"),
  );
}

function isImageLike(contentType: string | null): boolean {
  return Boolean(contentType?.startsWith("image/"));
}

const LDP_CONTAINS = "http://www.w3.org/ns/ldp#contains";

function readHeader(headers: Headers, keys: string[]): string | null {
  for (const key of keys) {
    const value = headers.get(key);
    if (value) {
      return value;
    }
  }
  return null;
}

function toEntry(url: string, paths: SolidConcordPaths, headers?: Headers): SolidWorkspaceEntry {
  const normalizedUrl = url.endsWith("/") ? normalizeContainerUrl(url) : normalizeUrl(url);
  const isContainer = normalizedUrl.endsWith("/");
  const parentUrl = (() => {
    const target = new URL(normalizedUrl);
    const parts = target.pathname.split("/").filter(Boolean);
    if (parts.length <= 1) {
      return null;
    }
    parts.pop();
    target.pathname = `/${parts.join("/")}/`;
    target.search = "";
    target.hash = "";
    return target.toString();
  })();

  const contentType = headers
    ? readHeader(headers, ["content-type", "Content-Type"])
    : isContainer
      ? "text/turtle"
      : null;
  const sizeHeader = headers ? readHeader(headers, ["content-length", "Content-Length"]) : null;

  return {
    url: normalizedUrl,
    parentUrl,
    name: stripTrailingSlash(normalizedUrl).split("/").pop() || normalizedUrl,
    path: getRelativePath(normalizedUrl, paths),
    kind: isContainer ? "container" : "file",
    scope: toWorkspaceScope(normalizedUrl, paths),
    contentType,
    size: sizeHeader ? Number(sizeHeader) : null,
    lastModified: headers ? readHeader(headers, ["last-modified", "Last-Modified"]) : null,
    etag: headers ? readHeader(headers, ["etag", "ETag"]) : null,
    isLedger: !isContainer && isLikelyLedgerName(normalizedUrl, contentType),
  };
}

async function head(fetchImpl: typeof fetch, url: string): Promise<Headers | null> {
  const response = await fetchImpl(url, {
    method: "HEAD",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(
      `Failed to inspect Solid resource ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.headers;
}

async function parseLedgerSummary(text: string): Promise<SolidWorkspaceLedgerSummary | null> {
  try {
    const parsed = JSON.parse(text) as LedgerContainer;
    if (
      !isRecord(parsed) ||
      parsed.format !== "concord-ledger" ||
      parsed.version !== "1" ||
      !isRecord(parsed.commits) ||
      !isRecord(parsed.entries)
    ) {
      return null;
    }

    return {
      head: typeof parsed.head === "string" ? parsed.head : null,
      commitCount: Object.keys(parsed.commits).length,
      entryCount: Object.keys(parsed.entries).length,
      valid: typeof parsed.head === "string" && parsed.head.length > 0,
    };
  } catch {
    return null;
  }
}

export async function createEmptyConcordLedger(
  identity: SerializedIdentity,
): Promise<LedgerContainer> {
  const app = await createConcordApp({
    identity,
    plugins: [],
  });

  try {
    await app.load();
    return await app.exportLedger();
  } finally {
    await app.destroy?.();
  }
}

export async function createSolidWorkspace(
  input: CreateSolidWorkspaceOptions,
): Promise<SolidWorkspace> {
  const paths =
    input.paths ??
    (await createSolidConcordPaths(input.session, {
      appPath: input.appPath,
      podRoot: input.podRoot,
      preferencesUrl: input.preferencesUrl,
      publicTypeIndexUrl: input.publicTypeIndexUrl,
      privateTypeIndexUrl: input.privateTypeIndexUrl,
      verificationUrl: input.verificationUrl,
    }));
  const fetchImpl = input.session.fetch;

  async function ensureContainer(url: string) {
    try {
      await createContainerAt(normalizeContainerUrl(url), {
        fetch: fetchImpl,
      });
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        return;
      }
      throw error;
    }
  }

  async function list(url = paths.workspacePrivateRootUrl): Promise<SolidWorkspaceBrowseResult> {
    const containerUrl = normalizeContainerUrl(url);
    const dataset = await getSolidDataset(containerUrl, {
      fetch: fetchImpl,
    });
    const rawUrls = getThingAll(dataset).flatMap((thing) => getUrlAll(thing, LDP_CONTAINS));
    const entries = (
      await Promise.all(
        rawUrls.map(async (childUrl) => {
          const metadata = childUrl.endsWith("/")
            ? new Headers({
                "Content-Type": "text/turtle",
              })
            : await head(fetchImpl, childUrl);
          return toEntry(childUrl, paths, metadata ?? undefined);
        }),
      )
    ).sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "container" ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

    return {
      url: containerUrl,
      parentUrl: toEntry(containerUrl, paths).parentUrl,
      scope: toWorkspaceScope(containerUrl, paths),
      path: getRelativePath(containerUrl, paths),
      entries,
    };
  }

  async function stat(url: string): Promise<SolidWorkspaceEntry | null> {
    const normalized = url.endsWith("/") ? normalizeContainerUrl(url) : normalizeUrl(url);
    if (normalized.endsWith("/")) {
      try {
        await getSolidDataset(normalized, {
          fetch: fetchImpl,
        });
        return toEntry(normalized, paths, new Headers({ "Content-Type": "text/turtle" }));
      } catch (error) {
        if (isMissingError(error)) {
          return null;
        }
        throw error;
      }
    }

    const headers = await head(fetchImpl, normalized);
    return headers ? toEntry(normalized, paths, headers) : null;
  }

  async function inspectAccess(url: string): Promise<SolidWorkspaceAccessSummary> {
    const normalized = url.endsWith("/") ? normalizeContainerUrl(url) : normalizeUrl(url);
    const scope = toWorkspaceScope(normalized, paths);
    const warnings: string[] = [];
    let publicRead: SolidWorkspaceAnonymousRead = "unknown";
    let grants: SolidWorkspaceAccessGrant[] = [];

    try {
      const result = await universalAccess.getPublicAccess(normalized, {
        fetch: fetchImpl,
      });
      if (result && typeof result.read === "boolean") {
        publicRead = result.read ? "yes" : "no";
      }
    } catch (error) {
      warnings.push(`Public access could not be inspected for ${normalized}: ${String(error)}`);
    }

    try {
      const result = await universalAccess.getAgentAccessAll(normalized, {
        fetch: fetchImpl,
      });
      if (isRecord(result)) {
        grants = Object.entries(result)
          .map(([webId, access]) => {
            if (!isRecord(access)) {
              return null;
            }
            const grant = {
              webId,
              read: Boolean(access.read),
              append: Boolean(access.append),
              write: Boolean(access.write),
              control: false,
            };
            return grant.read || grant.append || grant.write || grant.control ? grant : null;
          })
          .filter((value): value is SolidWorkspaceAccessGrant => value !== null)
          .sort((left, right) => left.webId.localeCompare(right.webId));
      }
    } catch (error) {
      warnings.push(`Agent access could not be inspected for ${normalized}: ${String(error)}`);
    }

    let visibility: SolidWorkspaceVisibility = "unknown";
    if (publicRead === "yes") {
      visibility = "public";
    } else if (grants.length > 0) {
      visibility = "shared";
    } else if (publicRead === "no") {
      visibility = "private";
    } else if (scope === "public") {
      visibility = "public";
      warnings.push(
        "Visibility is inferred from the workspace scope because direct access inspection was unavailable.",
      );
    } else if (scope === "shared") {
      visibility = "shared";
      warnings.push(
        "Visibility is inferred from the workspace scope because direct access inspection was unavailable.",
      );
    } else {
      visibility = "private";
      warnings.push(
        "Visibility is inferred from the workspace scope because direct access inspection was unavailable.",
      );
    }

    return {
      url: normalized,
      scope,
      visibility,
      publicRead,
      grants,
      warnings,
    };
  }

  async function applyAccess(
    url: string,
    input: SolidWorkspaceAccessInput,
  ): Promise<SolidWorkspaceAccessSummary> {
    const normalized = url.endsWith("/") ? normalizeContainerUrl(url) : normalizeUrl(url);
    const warnings: string[] = [];

    if (typeof input.publicRead === "boolean") {
      try {
        await universalAccess.setPublicAccess(
          normalized,
          {
            read: input.publicRead,
            append: false,
            write: false,
          },
          {
            fetch: fetchImpl,
          },
        );
      } catch (error) {
        warnings.push(`Public access could not be updated for ${normalized}: ${String(error)}`);
      }
    }

    if (Array.isArray(input.agents)) {
      const desired = [...new Set(input.agents.map((value) => value.trim()).filter(Boolean))];
      const current = await inspectAccess(normalized);
      const currentIds = current.grants.map((grant) => grant.webId);

      for (const webId of currentIds) {
        if (desired.includes(webId)) {
          continue;
        }
        try {
          await universalAccess.setAgentAccess(
            normalized,
            webId,
            {
              read: false,
              append: false,
              write: false,
            },
            {
              fetch: fetchImpl,
            },
          );
        } catch (error) {
          warnings.push(`Access could not be revoked for ${webId}: ${String(error)}`);
        }
      }

      for (const webId of desired) {
        try {
          await universalAccess.setAgentAccess(
            normalized,
            webId,
            {
              read: true,
              append: true,
              write: true,
            },
            {
              fetch: fetchImpl,
            },
          );
        } catch (error) {
          warnings.push(`Access could not be granted for ${webId}: ${String(error)}`);
        }
      }
    }

    const summary = await inspectAccess(normalized);
    return {
      ...summary,
      warnings: [...summary.warnings, ...warnings],
    };
  }

  async function applyDefaultAccess(url: string, options: SolidWorkspaceWriteOptions = {}) {
    const scope = toWorkspaceScope(url, paths);
    const publicRead = options.publicRead ?? scope === "public";
    const agents = options.agents ?? [];
    await applyAccess(url, {
      publicRead,
      agents,
    });
  }

  async function createFolder(
    parentUrl: string,
    name: string,
    options: SolidWorkspaceWriteOptions = {},
  ) {
    const folderUrl = new URL(
      sanitizeName(name, true),
      normalizeContainerUrl(parentUrl),
    ).toString();
    await ensureContainer(folderUrl);
    await applyDefaultAccess(folderUrl, options);
    const entry = await stat(folderUrl);
    if (!entry) {
      throw new Error(`Failed to create Solid folder ${folderUrl}.`);
    }
    return entry;
  }

  async function uploadFile(
    parentUrl: string,
    name: string,
    data: Blob | ArrayBuffer | string,
    options: SolidWorkspaceWriteOptions = {},
  ) {
    const fileUrl = new URL(sanitizeName(name, false), normalizeContainerUrl(parentUrl)).toString();
    const contentType =
      options.contentType ??
      (typeof Blob !== "undefined" && data instanceof Blob
        ? data.type || "application/octet-stream"
        : "application/octet-stream");
    const body =
      typeof data === "string"
        ? data
        : typeof Blob !== "undefined" && data instanceof Blob
          ? data
          : new Blob([data], { type: contentType });

    const response = await fetchImpl(fileUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to save Solid file ${fileUrl}: ${response.status} ${response.statusText}`,
      );
    }

    await applyDefaultAccess(fileUrl, {
      ...options,
      contentType,
    });
    const entry = await stat(fileUrl);
    if (!entry) {
      throw new Error(`Failed to inspect Solid file ${fileUrl} after upload.`);
    }
    return entry;
  }

  async function createLedgerFile(
    parentUrl: string,
    name: string,
    input: SolidWorkspaceWriteOptions & { identity: SerializedIdentity },
  ) {
    const ledger = await createEmptyConcordLedger(input.identity);
    return await uploadFile(
      parentUrl,
      sanitizeName(name.endsWith(".json") ? name : `${name}.json`),
      `${JSON.stringify(ledger, null, 2)}\n`,
      {
        ...input,
        contentType: CONCORD_LEDGER_CONTENT_TYPE,
      },
    );
  }

  async function copyResource(url: string, parentUrl: string, nextName?: string) {
    const normalized = url.endsWith("/") ? normalizeContainerUrl(url) : normalizeUrl(url);
    const source = await stat(normalized);
    if (!source) {
      throw new Error(`Solid resource not found: ${normalized}`);
    }

    const destinationUrl = new URL(
      source.kind === "container"
        ? sanitizeName(nextName ?? source.name, true)
        : sanitizeName(nextName ?? source.name, false),
      normalizeContainerUrl(parentUrl),
    ).toString();

    if (source.kind === "container") {
      await createFolder(parentUrl, nextName ?? source.name);
      const listing = await list(source.url);
      for (const entry of listing.entries) {
        await copyResource(entry.url, destinationUrl);
      }
      return destinationUrl;
    }

    const file = await getFile(source.url, {
      fetch: fetchImpl,
    });
    await uploadFile(parentUrl, nextName ?? source.name, file, {
      contentType: file.type,
    });
    return destinationUrl;
  }

  async function deleteResource(url: string): Promise<void> {
    const normalized = url.endsWith("/") ? normalizeContainerUrl(url) : normalizeUrl(url);
    const entry = await stat(normalized);
    if (!entry) {
      return;
    }

    if (entry.kind === "container") {
      const listing = await list(entry.url);
      for (const child of listing.entries) {
        await deleteResource(child.url);
      }
      await deleteContainer(entry.url, {
        fetch: fetchImpl,
      });
      return;
    }

    await deleteFile(entry.url, {
      fetch: fetchImpl,
    });
  }

  async function rename(url: string, nextName: string, options: SolidWorkspaceWriteOptions = {}) {
    const entry = await stat(url);
    if (!entry?.parentUrl) {
      throw new Error("Solid resource cannot be renamed because it has no parent container.");
    }
    return await move(url, entry.parentUrl, nextName, options);
  }

  async function move(
    url: string,
    parentUrl: string,
    nextName?: string,
    options: SolidWorkspaceWriteOptions = {},
  ) {
    const destinationUrl = await copyResource(url, parentUrl, nextName);
    await deleteResource(url);
    await applyDefaultAccess(destinationUrl, options);
    const entry = await stat(destinationUrl);
    if (!entry) {
      throw new Error(`Failed to inspect moved Solid resource ${destinationUrl}.`);
    }
    return entry;
  }

  async function read(url: string): Promise<SolidWorkspaceReadResult> {
    const entry = await stat(url);
    if (!entry || entry.kind !== "file") {
      throw new Error(`Solid file not found: ${url}`);
    }

    const file = await getFile(entry.url, {
      fetch: fetchImpl,
    });
    const contentType = file.type || entry.contentType;

    if (entry.isLedger || isLikelyLedgerName(entry.url, contentType)) {
      const text = await file.text();
      const ledger = await parseLedgerSummary(text);
      if (ledger) {
        return {
          entry: {
            ...entry,
            isLedger: true,
          },
          mode: "ledger",
          contentType,
          text,
          blob: null,
          ledger,
        };
      }
    }

    if (isTextLike(contentType, entry.name)) {
      return {
        entry,
        mode: "text",
        contentType,
        text: await file.text(),
        blob: null,
        ledger: null,
      };
    }

    if (isImageLike(contentType)) {
      return {
        entry,
        mode: "image",
        contentType,
        text: null,
        blob: file,
        ledger: null,
      };
    }

    return {
      entry,
      mode: "binary",
      contentType,
      text: null,
      blob: file,
      ledger: null,
    };
  }

  async function ensure() {
    await ensureContainer(paths.appRootUrl);
    await ensureContainer(paths.systemRootUrl);
    await ensureContainer(paths.systemPrivateRootUrl);
    await ensureContainer(paths.workspaceRootUrl);
    await ensureContainer(paths.workspacePrivateRootUrl);
    await ensureContainer(paths.workspaceSharedRootUrl);
    await ensureContainer(paths.workspacePublicRootUrl);
    await ensureContainer(paths.publicRootUrl);

    await applyDefaultAccess(paths.workspacePrivateRootUrl, { publicRead: false });
    await applyDefaultAccess(paths.workspaceSharedRootUrl, { publicRead: false });
    await applyDefaultAccess(paths.workspacePublicRootUrl, { publicRead: true });
    await applyDefaultAccess(paths.publicRootUrl, { publicRead: true });
  }

  return {
    paths,
    ensure,
    list,
    stat,
    createFolder,
    createLedger: createLedgerFile,
    uploadFile,
    rename,
    move,
    delete: deleteResource,
    read,
    inspectAccess,
    applyAccess,
  };
}
