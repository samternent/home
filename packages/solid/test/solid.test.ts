import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerPersistenceSnapshot } from "@ternent/ledger";
import {
  addUrl,
  createSolidDataset,
  createThing,
  getSolidDataset,
  getThing,
  getThingAll,
  getUrl,
  getUrlAll,
  setThing,
  setUrl,
  solidDatasetAsTurtle,
} from "@inrupt/solid-client";
import {
  SOLID_CONCORD_LEDGER_CLASS,
  SOLID_CONCORD_IDENTITY_CLASS,
  SOLID_CONCORD_MNEMONIC_CLASS,
  SOLID_CONCORD_PEOPLE_CLASS,
  SOLID_CONCORD_VERIFICATION_CLASS,
  SOLID_CONCORD_WALLET_CLASS,
  createConcordOsPeopleStorage,
  createSolidConcordApp,
  createSolidConcordManager,
  createSolidConcordPaths,
  createSolidEncryptedIdentityBlob,
  createSolidIdentityCache,
  createSolidIdentity,
  createSolidMnemonicSecret,
  createSolidMnemonicIdentity,
  createSolidStorage,
  createSolidWorkspace,
  createSolidWalletBackup,
  createSolidWalletStorage,
  createStaticSolidIdentityUnlocker,
  discoverSolidConcordResources,
  validateSolidConcordAccess,
  provisionSolidIdentity,
  restoreSolidIdentityFromMnemonicSecret,
  restoreSolidIdentityFromBackup,
  type SolidSessionLike,
} from "../src/index.ts";

const solidClientMocks = vi.hoisted(() => ({
  createContainerAt: vi.fn(async () => undefined),
  universalAccess: {
    getPublicAccess: vi.fn(async () => ({
      read: false,
      append: false,
      write: false,
      control: false,
    })),
    getAgentAccessAll: vi.fn(async () => ({})),
    setPublicAccess: vi.fn(async () => undefined),
    setAgentAccess: vi.fn(async () => undefined),
  },
}));
const armourMocks = vi.hoisted(() => ({
  initArmour: vi.fn(async () => undefined),
  encryptTextWithPassphrase: vi.fn(async ({ text }: { text: string }) => `ENC:${text}`),
  decryptTextWithPassphrase: vi.fn(async ({ data }: { data: string }) => {
    if (!String(data).startsWith("ENC:")) {
      throw new Error("Invalid ciphertext");
    }
    return String(data).slice(4);
  }),
}));
const concordMocks = vi.hoisted(() => ({
  createConcordApp: vi.fn(),
}));

vi.mock("@inrupt/solid-client", async () => {
  const actual = await vi.importActual<typeof import("@inrupt/solid-client")>(
    "@inrupt/solid-client",
  );
  return {
    ...actual,
    createContainerAt: solidClientMocks.createContainerAt,
    universalAccess: solidClientMocks.universalAccess,
  };
});

vi.mock("@ternent/armour", () => ({
  initArmour: armourMocks.initArmour,
  encryptTextWithPassphrase: armourMocks.encryptTextWithPassphrase,
  decryptTextWithPassphrase: armourMocks.decryptTextWithPassphrase,
}));

vi.mock("@ternent/concord", () => ({
  createConcordApp: concordMocks.createConcordApp,
}));

vi.mock("@ternent/concord/browser", () => ({
  createConcordApp: concordMocks.createConcordApp,
}));

function createSession(
  overrides: Partial<SolidSessionLike> & {
    webId?: string;
    fetchImpl?: typeof fetch;
  } = {},
): SolidSessionLike {
  return {
    info: {
      webId: overrides.webId ?? "https://alice.example/profile/card#me",
      isLoggedIn: true,
    },
    fetch:
      overrides.fetchImpl ??
      ((async () => new Response(null, { status: 404 })) as typeof fetch),
  };
}

function createTodoPlugin(): ConcordReplayPlugin<{
  items: Record<string, { id: string; title: string }>;
}> {
  return {
    id: "todo",
    initialState() {
      return {
        items: {},
      };
    },
    commands: {
      "todo.create": async (_ctx, input: { id: string; title: string }) => ({
        kind: "todo.created",
        payload: input,
      }),
    },
    applyEntry(entry, ctx) {
      if (entry.kind !== "todo.created" || entry.payload.type !== "plain") {
        return;
      }

      const payload = entry.payload.data as { id: string; title: string };
      ctx.setState((state) => ({
        items: {
          ...(state as { items: Record<string, { id: string; title: string }> }).items,
          [payload.id]: payload,
        },
      }));
    },
  };
}

function createFetchSequence(
  responses: Array<
    | Response
    | ((input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>)
  >,
): typeof fetch {
  let index = 0;

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const next = responses[Math.min(index++, responses.length - 1)];
    if (typeof next === "function") {
      return await next(input, init);
    }
    return next;
  }) as typeof fetch;
}

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

function createTestUnlocker(seed = "default") {
  return createStaticSolidIdentityUnlocker(`test-passkey:${seed}`);
}

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RDFS_SEE_ALSO = "http://www.w3.org/2000/01/rdf-schema#seeAlso";
const FOAF_AGENT = "http://xmlns.com/foaf/0.1/Agent";
const PIM_STORAGE = "http://www.w3.org/ns/pim/space#storage";
const PIM_PREFERENCES_FILE = "http://www.w3.org/ns/pim/space#preferencesFile";
const SOLID_PUBLIC_TYPE_INDEX = "http://www.w3.org/ns/solid/terms#publicTypeIndex";
const SOLID_PRIVATE_TYPE_INDEX = "http://www.w3.org/ns/solid/terms#privateTypeIndex";
const SOLID_FOR_CLASS = "http://www.w3.org/ns/solid/terms#forClass";
const SOLID_INSTANCE = "http://www.w3.org/ns/solid/terms#instance";
const LDP_CONTAINS = "http://www.w3.org/ns/ldp#contains";

type StoredResource = {
  body: string;
  contentType: string;
  etag: string;
  publicReadable?: boolean;
};

function defaultPublicReadable(url: string): boolean {
  return (
    url.includes("/public/") ||
    url.endsWith("/publicTypeIndex.ttl") ||
    url.includes("/profile/card")
  );
}

function createPodFetch(
  initial: Record<string, { body: string; contentType: string; publicReadable?: boolean }>,
) {
  let etagCounter = 0;
  const resources = new Map<string, StoredResource>();

  for (const [url, resource] of Object.entries(initial)) {
    etagCounter += 1;
    resources.set(new URL(url).toString(), {
      body: resource.body,
      contentType: resource.contentType,
      etag: `"etag-${etagCounter}"`,
      publicReadable: resource.publicReadable ?? false,
    });
  }

  const buildFetch = (publicOnly: boolean) =>
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input.toString()).toString();
      const method = String(init?.method || "GET").toUpperCase();
      const existing = resources.get(url) ?? null;

      if (publicOnly && (!existing || !existing.publicReadable)) {
        return new Response(null, { status: 404 });
      }

      if (method === "GET") {
        if (!existing) {
          return new Response(null, { status: 404 });
        }
        return new Response(existing.body, {
          status: 200,
          headers: {
            "Content-Type": existing.contentType,
            ETag: existing.etag,
          },
        });
      }

      if (method === "HEAD") {
        if (!existing) {
          return new Response(null, { status: 404 });
        }
        return new Response(null, {
          status: 200,
          headers: {
            "Content-Type": existing.contentType,
            ETag: existing.etag,
          },
        });
      }

      if (method === "PUT") {
        etagCounter += 1;
        const next = {
          body: String(init?.body ?? ""),
          contentType:
            new Headers(init?.headers).get("Content-Type") ?? "application/octet-stream",
          etag: `"etag-${etagCounter}"`,
          publicReadable: existing?.publicReadable ?? defaultPublicReadable(url),
        };
        const status = existing ? 200 : 201;
        resources.set(url, next);
        return new Response(null, {
          status,
          headers: {
            ETag: next.etag,
          },
        });
      }

      if (method === "DELETE") {
        resources.delete(url);
        return new Response(null, { status: existing ? 205 : 404 });
      }

      return new Response(null, { status: 405 });
    }) as typeof fetch;

  return {
    fetchImpl: buildFetch(false),
    publicFetch: buildFetch(true),
    resources,
  };
}

function createWorkspacePod(podRoot = "https://pod.example/") {
  const resources = new Map<string, StoredResource>();
  const containers = new Map<string, Set<string>>();
  const accessState = new Map<
    string,
    {
      publicRead: boolean;
      agents: Record<string, { read: boolean; append: boolean; write: boolean; control: boolean }>;
    }
  >();
  let etagCounter = 0;

  function nextEtag() {
    etagCounter += 1;
    return `"etag-${etagCounter}"`;
  }

  async function writeContainer(url: string) {
    const normalized = normalizeContainer(url);
    const children = [...(containers.get(normalized) ?? new Set<string>())].sort();
    let dataset = createSolidDataset();
    let thing = createThing({ url: normalized });
    for (const child of children) {
      thing = addUrl(thing, LDP_CONTAINS, child);
    }
    dataset = setThing(dataset, thing);
    resources.set(normalized, {
      body: await solidDatasetAsTurtle(dataset),
      contentType: "text/turtle",
      etag: nextEtag(),
      publicReadable: accessState.get(normalized)?.publicRead ?? defaultPublicReadable(normalized),
    });
  }

  function normalizeContainer(url: string) {
    return url.endsWith("/") ? url : `${url}/`;
  }

  function parentContainer(url: string) {
    const target = new URL(url);
    const parts = target.pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      return null;
    }
    parts.pop();
    target.pathname = `/${parts.join("/")}/`;
    target.search = "";
    target.hash = "";
    return target.toString();
  }

  async function ensureContainer(url: string) {
    const normalized = normalizeContainer(url);
    if (!containers.has(normalized)) {
      containers.set(normalized, new Set<string>());
      accessState.set(normalized, {
        publicRead: defaultPublicReadable(normalized),
        agents: {},
      });
      const parent = parentContainer(normalized);
      if (parent) {
        await ensureContainer(parent);
        containers.get(parent)?.add(normalized);
        await writeContainer(parent);
      }
    }
    await writeContainer(normalized);
  }

  async function putFile(
    url: string,
    body: string,
    contentType = "application/octet-stream",
  ) {
    const normalized = new URL(url).toString();
    const parent = parentContainer(normalized);
    if (parent) {
      await ensureContainer(parent);
      containers.get(parent)?.add(normalized);
      await writeContainer(parent);
    }
    resources.set(normalized, {
      body,
      contentType,
      etag: nextEtag(),
      publicReadable: accessState.get(normalized)?.publicRead ?? defaultPublicReadable(normalized),
    });
    accessState.set(normalized, {
      publicRead: defaultPublicReadable(normalized),
      agents: accessState.get(normalized)?.agents ?? {},
    });
  }

  async function removeResource(url: string): Promise<void> {
    const normalized = url.endsWith("/") ? normalizeContainer(url) : new URL(url).toString();
    if (containers.has(normalized)) {
      for (const child of [...(containers.get(normalized) ?? [])]) {
        await removeResource(child);
      }
      containers.delete(normalized);
    }
    resources.delete(normalized);
    accessState.delete(normalized);
    const parent = parentContainer(normalized);
    if (parent) {
      containers.get(parent)?.delete(normalized);
      await writeContainer(parent);
    }
  }

  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString()).toString();
    const normalized = url.endsWith("/") ? normalizeContainer(url) : url;
    const method = String(init?.method || "GET").toUpperCase();

    if (method === "GET") {
      const resource = resources.get(normalized);
      if (!resource) {
        return new Response(null, { status: 404 });
      }
      return new Response(resource.body, {
        status: 200,
        headers: {
          "Content-Type": resource.contentType,
          ETag: resource.etag,
        },
      });
    }

    if (method === "HEAD") {
      const resource = resources.get(normalized);
      if (!resource) {
        return new Response(null, { status: 404 });
      }
      return new Response(null, {
        status: 200,
        headers: {
          "Content-Type": resource.contentType,
          ETag: resource.etag,
          "Content-Length": String(resource.body.length),
        },
      });
    }

    if (method === "PUT") {
      const body = typeof init?.body === "string" ? init.body : await new Response(init?.body).text();
      await putFile(
        normalized,
        body,
        new Headers(init?.headers).get("Content-Type") ?? "application/octet-stream",
      );
      return new Response(null, { status: 201, headers: { ETag: nextEtag() } });
    }

    if (method === "DELETE") {
      await removeResource(normalized);
      return new Response(null, { status: 205 });
    }

    return new Response(null, { status: 405 });
  }) as typeof fetch;

  async function initialize() {
    await ensureContainer(podRoot);
  }

  return {
    fetchImpl,
    resources,
    accessState,
    ensureContainer,
    putFile,
    initialize,
  };
}

async function createProfileDocument(webId: string, podRoot: string): Promise<string> {
  let dataset = createSolidDataset();
  let profileThing = createThing({ url: webId });
  profileThing = addUrl(profileThing, RDF_TYPE, FOAF_AGENT);
  profileThing = addUrl(profileThing, PIM_STORAGE, podRoot);
  dataset = setThing(dataset, profileThing);
  return await solidDatasetAsTurtle(dataset);
}

function getRegisteredResourceUrl(
  dataset: Awaited<ReturnType<typeof getSolidDataset>>,
  classUrl: string,
) {
  for (const thing of getThingAll(dataset)) {
    if (!getUrlAll(thing, SOLID_FOR_CLASS).includes(classUrl)) {
      continue;
    }
    return getUrl(thing, SOLID_INSTANCE);
  }
  return null;
}

describe("@ternent/solid", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    solidClientMocks.createContainerAt.mockClear();
    solidClientMocks.universalAccess.getPublicAccess.mockClear();
    solidClientMocks.universalAccess.getAgentAccessAll.mockClear();
    solidClientMocks.universalAccess.setPublicAccess.mockClear();
    solidClientMocks.universalAccess.setAgentAccess.mockClear();
    solidClientMocks.universalAccess.getPublicAccess.mockResolvedValue({
      read: false,
      append: false,
      write: false,
      control: false,
    });
    solidClientMocks.universalAccess.getAgentAccessAll.mockResolvedValue({});
    solidClientMocks.universalAccess.setPublicAccess.mockResolvedValue(undefined);
    solidClientMocks.universalAccess.setAgentAccess.mockResolvedValue(undefined);
    armourMocks.initArmour.mockClear();
    armourMocks.encryptTextWithPassphrase.mockClear();
    armourMocks.decryptTextWithPassphrase.mockClear();
    concordMocks.createConcordApp.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates mnemonic-backed identities and restores them deterministically", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });

    const restored = await createSolidIdentity({
      mnemonic: created.mnemonic,
      createdAt: "2026-03-22T00:00:00.000Z",
    });

    expect(created.identity.keyId).toBe(restored.keyId);
    expect(created.identity.publicKey).toBe(restored.publicKey);
    expect(created.mnemonic.split(" ")).toHaveLength(12);
  });

  it("creates and restores encrypted Solid wallet backups", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });

    const backup = await createSolidWalletBackup({
      identity: created.identity,
      passphrase: created.mnemonic,
      webId: "https://alice.example/profile/card#me",
      createdAt: "2026-03-22T00:01:00.000Z",
    });

    const restored = await restoreSolidIdentityFromBackup({
      backup,
      passphrase: created.mnemonic,
      expectedWebId: "https://alice.example/profile/card#me",
    });

    expect(restored.keyId).toBe(created.identity.keyId);
    expect(backup.keyId).toBe(created.identity.keyId);
    expect(armourMocks.initArmour).toHaveBeenCalled();
  });

  it("creates and restores Solid mnemonic secrets", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });

    const secret = await createSolidMnemonicSecret({
      mnemonic: created.mnemonic,
      createdAt: "2026-03-22T00:01:00.000Z",
      webId: "https://alice.example/profile/card#me",
      identity: created.identity,
    });

    const restored = await restoreSolidIdentityFromMnemonicSecret({
      secret,
      expectedWebId: "https://alice.example/profile/card#me",
    });

    expect(secret.keyId).toBe(created.identity.keyId);
    expect(restored.keyId).toBe(created.identity.keyId);
  });

  it("rejects wallet backups built from inconsistent identity material", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });
    const other = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:05:00.000Z",
    });

    await expect(
      createSolidWalletBackup({
        identity: {
          ...created.identity,
          material: {
            ...created.identity.material,
            seed: other.identity.material.seed,
          },
        },
        passphrase: created.mnemonic,
      }),
    ).rejects.toThrow("Identity publicKey does not match the stored seed.");
  });

  it("rejects restored backups whose decrypted identity is internally inconsistent", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });
    const other = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:05:00.000Z",
    });

    const tamperedPlaintext = JSON.stringify({
      ...created.identity,
      material: {
        ...created.identity.material,
        seed: other.identity.material.seed,
      },
    });

    await expect(
      restoreSolidIdentityFromBackup({
        backup: {
          format: "ternent-solid-wallet",
          version: "1",
          createdAt: "2026-03-22T00:10:00.000Z",
          webId: "https://alice.example/profile/card#me",
          keyId: created.identity.keyId,
          publicKey: created.identity.publicKey,
          ciphertext: `ENC:${tamperedPlaintext}`,
          encryption: {
            scheme: "armour-passphrase",
            encoding: "armor",
          },
        },
        passphrase: created.mnemonic,
      }),
    ).rejects.toThrow("Identity publicKey does not match the stored seed.");
  });

  it("persists wallet and ledger resources with optimistic concurrency headers", async () => {
    const walletPayload = {
      format: "ternent-solid-wallet" as const,
      version: "1" as const,
      createdAt: "2026-03-22T00:00:00.000Z",
      webId: "https://alice.example/profile/card#me",
      keyId: "key-1",
      publicKey: "pub-1",
      ciphertext: "ENC:{}",
      encryption: {
        scheme: "armour-passphrase" as const,
        encoding: "armor" as const,
      },
    };
    const ledgerSnapshot: LedgerPersistenceSnapshot = {
      container: null,
      staged: [],
    };

    const fetchImpl = vi.fn(
      createFetchSequence([
        new Response(null, { status: 404 }),
        new Response(null, { status: 201, headers: { ETag: '"wallet-1"' } }),
        new Response(JSON.stringify(walletPayload), {
          status: 200,
          headers: { ETag: '"wallet-2"' },
        }),
        new Response(null, { status: 404 }),
        new Response(null, { status: 201, headers: { ETag: '"ledger-1"' } }),
      ]),
    );
    const session = createSession({
      fetchImpl,
    });

    const walletStorage = createSolidWalletStorage(
      session,
      "https://pod.example/concord/wallet/private/identity.json",
    );
    const ledgerStorage = createSolidStorage(
      session,
      "https://pod.example/apps/todo/ledger.json",
    );

    await expect(walletStorage.load()).resolves.toBeNull();
    await walletStorage.save(walletPayload);
    await expect(walletStorage.load()).resolves.toEqual(walletPayload);
    await expect(ledgerStorage.load()).resolves.toBeNull();
    await ledgerStorage.save(ledgerSnapshot);

    const putCalls = fetchImpl.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(putCalls).toHaveLength(2);
    expect((putCalls[0][1]?.headers as Headers).get("If-None-Match")).toBe("*");
    expect((putCalls[1][1]?.headers as Headers).get("If-None-Match")).toBe("*");
    expect(solidClientMocks.createContainerAt).toHaveBeenCalled();
  });

  it("provisions encrypted identity persistence, wallet backup, and encrypted local cache together", async () => {
    const cacheStorage = createMemoryStorage();
    const fetchImpl = vi.fn(
      createFetchSequence([
        new Response(null, { status: 201, headers: { ETag: '"identity-1"' } }),
        new Response(null, { status: 201, headers: { ETag: '"wallet-1"' } }),
      ]),
    );
    const session = createSession({ fetchImpl });
    const unlocker = createTestUnlocker("provision");
    const cache = createSolidIdentityCache({
      session,
      storage: cacheStorage,
      unlocker,
    });

    const provisioned = await provisionSolidIdentity({
      session,
      words: 12,
      identityUrl: "https://pod.example/concord/system/private/identity.enc.json",
      walletUrl: "https://pod.example/concord/wallet/private/identity.json",
      walletPassphrase: "wallet-passphrase-1",
      unlocker,
      cache,
    });

    expect(provisioned.mnemonic.split(" ")).toHaveLength(12);
    expect(provisioned.mnemonicSecret.keyId).toBe(provisioned.identity.keyId);
    expect(provisioned.encryptedIdentity.keyId).toBe(provisioned.identity.keyId);
    expect(provisioned.walletBackup?.keyId).toBe(provisioned.identity.keyId);
    await expect(cache.load()).resolves.toMatchObject({
      keyId: provisioned.identity.keyId,
    });
  });

  it("creates a Solid Concord app from a wallet backup instead of deriving from WebID", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });
    const backup = await createSolidWalletBackup({
      identity: created.identity,
      passphrase: created.mnemonic,
      webId: "https://alice.example/profile/card#me",
    });
    const plugin = createTodoPlugin();
    const mockApp = {
      load: vi.fn(async () => undefined),
      getState: vi.fn(() => ({
        ready: true,
        integrityValid: true,
        stagedCount: 0,
        replay: {
          todo: {
            items: {},
          },
        },
        verification: null,
      })),
      subscribe: vi.fn(() => () => undefined),
      command: vi.fn(),
      commit: vi.fn(),
      replay: vi.fn(),
      verify: vi.fn(),
      destroy: vi.fn(),
    };

    concordMocks.createConcordApp.mockResolvedValue(mockApp);

    const result = await createSolidConcordApp({
      session: createSession(),
      ledgerUrl: "https://pod.example/apps/todo/ledger.json",
      plugins: [plugin],
      encryption: true,
      walletBackup: backup,
      walletPassphrase: created.mnemonic,
    });

    expect(concordMocks.createConcordApp).toHaveBeenCalledTimes(1);
    expect(concordMocks.createConcordApp.mock.calls[0][0].identity.keyId).toBe(
      created.identity.keyId,
    );
    expect(result.identity.keyId).toBe(created.identity.keyId);
  });

  it("loads encrypted identity blobs from Solid storage with a passkey unlocker", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });
    const unlocker = createTestUnlocker("encrypted-solid-load");
    const blob = await createSolidEncryptedIdentityBlob({
      identity: created.identity,
      unlocker,
      webId: "https://alice.example/profile/card#me",
      storage: "solid-resource",
      resourceUrl: "https://pod.example/concord/system/private/identity.enc.json",
      createdAt: "2026-03-22T00:00:00.000Z",
    });

    const fetchImpl = vi.fn(
      createFetchSequence([
        () =>
          new Response(JSON.stringify(blob), {
            status: 200,
            headers: { ETag: '"identity-2"' },
          }),
      ]),
    );

    const mockApp = {
      load: vi.fn(async () => undefined),
      getState: vi.fn(() => ({
        ready: true,
        integrityValid: true,
        stagedCount: 0,
        replay: {},
        verification: null,
      })),
      subscribe: vi.fn(() => () => undefined),
      command: vi.fn(),
      commit: vi.fn(),
      replay: vi.fn(),
      verify: vi.fn(),
      destroy: vi.fn(),
    };
    concordMocks.createConcordApp.mockResolvedValue(mockApp);

    const result = await createSolidConcordApp({
      session: createSession({ fetchImpl }),
      ledgerUrl: "https://pod.example/apps/todo/ledger.json",
      plugins: [createTodoPlugin()],
      encryptedIdentityUrl: "https://pod.example/concord/system/private/identity.enc.json",
      unlocker,
    });

    expect(result.identity.keyId).toBe(created.identity.keyId);
  });

  it("uses explicit identity input before cache values", async () => {
    const cached = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });
    const explicit = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:10:00.000Z",
    });
    const cacheStorage = createMemoryStorage();
    const unlocker = createTestUnlocker("cache");
    const cache = createSolidIdentityCache({
      webId: "https://alice.example/profile/card#me",
      storage: cacheStorage,
      unlocker,
    });
    await cache.save(cached.identity);

    const mockApp = {
      load: vi.fn(async () => undefined),
      getState: vi.fn(() => ({
        ready: true,
        integrityValid: true,
        stagedCount: 0,
        replay: {},
        verification: null,
      })),
      subscribe: vi.fn(() => () => undefined),
      command: vi.fn(),
      commit: vi.fn(),
      replay: vi.fn(),
      verify: vi.fn(),
      destroy: vi.fn(),
    };
    concordMocks.createConcordApp.mockResolvedValue(mockApp);

    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 })) as typeof fetch;

    const result = await createSolidConcordApp({
      session: createSession({ fetchImpl }),
      ledgerUrl: "https://pod.example/apps/todo/ledger.json",
      plugins: [createTodoPlugin()],
      cache,
      identity: explicit.identity,
    });

    expect(result.identity.keyId).toBe(explicit.identity.keyId);
  });

  it("derives identity from explicit mnemonic input", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });
    const session = createSession();

    const mockApp = {
      load: vi.fn(async () => undefined),
      getState: vi.fn(() => ({
        ready: true,
        integrityValid: true,
        stagedCount: 0,
        replay: {},
        verification: null,
      })),
      subscribe: vi.fn(() => () => undefined),
      command: vi.fn(),
      commit: vi.fn(),
      replay: vi.fn(),
      verify: vi.fn(),
      destroy: vi.fn(),
    };
    concordMocks.createConcordApp.mockResolvedValue(mockApp);

    const result = await createSolidConcordApp({
      session,
      ledgerUrl: "https://pod.example/apps/todo/ledger.json",
      plugins: [createTodoPlugin()],
      mnemonic: created.mnemonic,
      mnemonicPassphrase: undefined,
      createdAt: created.identity.createdAt,
    });

    expect(result.identity.keyId).toBe(created.identity.keyId);
  });

  it("bootstraps profile discovery documents and publishes verification metadata", async () => {
    const webId = "https://alice.example/profile/card#me";
    const podRoot = "https://pod.example/";
    const profileUrl = "https://alice.example/profile/card";
    const { fetchImpl, publicFetch } = createPodFetch({
      [profileUrl]: {
        body: await createProfileDocument(webId, podRoot),
        contentType: "text/turtle",
        publicReadable: true,
      },
    });
    vi.stubGlobal("fetch", publicFetch);
    const session = createSession({ webId, fetchImpl });
    const unlocker = createTestUnlocker("profile-bootstrap");

    const provisioned = await provisionSolidIdentity({
      session,
      words: 12,
      unlocker,
      profile: {
        enabled: true,
        bootstrap: true,
      },
    });

    expect(provisioned.resources?.identityUrl).toBe(
      "https://pod.example/concord/system/private/identity.enc.json",
    );

    expect(provisioned.resources?.mnemonicUrl).toBe(
      "https://pod.example/concord/system/private/mnemonic.json",
    );
    expect(provisioned.resources?.walletUrl).toBe(
      "https://pod.example/concord/system/private/wallet.json",
    );
    expect(provisioned.resources?.ledgerUrl).toBe(
      "https://pod.example/concord/system/private/ledger.json",
    );
    expect(provisioned.resources?.peopleUrl).toBe(
      "https://pod.example/concord/system/private/people.json",
    );
    expect(provisioned.resources?.verificationUrl).toBe(
      "https://pod.example/concord/public/seal-identity.json",
    );

    const profileDataset = await getSolidDataset(profileUrl, { fetch: fetchImpl });
    const profileThing = getThing(profileDataset, webId);
    expect(getUrl(profileThing, PIM_PREFERENCES_FILE)).toBe(
      "https://pod.example/settings/preferences.ttl",
    );
    expect(getUrl(profileThing, SOLID_PUBLIC_TYPE_INDEX)).toBe(
      "https://pod.example/settings/publicTypeIndex.ttl",
    );
    expect(getUrl(profileThing, SOLID_PRIVATE_TYPE_INDEX)).toBeNull();
    expect(getUrlAll(profileThing, RDFS_SEE_ALSO)).toContain(
      "https://pod.example/concord/public/seal-identity.json",
    );

    const preferencesDataset = await getSolidDataset(
      "https://pod.example/settings/preferences.ttl",
      { fetch: fetchImpl },
    );
    const preferencesThing = getThing(
      preferencesDataset,
      "https://pod.example/settings/preferences.ttl",
    );
    expect(getUrl(preferencesThing, SOLID_PRIVATE_TYPE_INDEX)).toBe(
      "https://pod.example/settings/privateTypeIndex.ttl",
    );

    const privateIndex = await getSolidDataset(
      "https://pod.example/settings/privateTypeIndex.ttl",
      { fetch: fetchImpl },
    );
    expect(getRegisteredResourceUrl(privateIndex, SOLID_CONCORD_IDENTITY_CLASS)).toBe(
      "https://pod.example/concord/system/private/identity.enc.json",
    );
    expect(getRegisteredResourceUrl(privateIndex, SOLID_CONCORD_MNEMONIC_CLASS)).toBe(
      null,
    );
    expect(getRegisteredResourceUrl(privateIndex, SOLID_CONCORD_WALLET_CLASS)).toBe(
      null,
    );
    expect(getRegisteredResourceUrl(privateIndex, SOLID_CONCORD_LEDGER_CLASS)).toBe(
      "https://pod.example/concord/system/private/ledger.json",
    );
    expect(getRegisteredResourceUrl(privateIndex, SOLID_CONCORD_PEOPLE_CLASS)).toBe(
      "https://pod.example/concord/system/private/people.json",
    );

    const publicIndex = await getSolidDataset(
      "https://pod.example/settings/publicTypeIndex.ttl",
      { fetch: fetchImpl },
    );
    expect(getRegisteredResourceUrl(publicIndex, SOLID_CONCORD_VERIFICATION_CLASS)).toBe(
      "https://pod.example/concord/public/seal-identity.json",
    );

    const verificationResponse = await fetchImpl(
      "https://pod.example/concord/public/seal-identity.json",
      { method: "GET" },
    );
    const verification = (await verificationResponse.json()) as {
      publicKey: string;
      keyId: string;
      webId: string | null;
    };
    expect(verification.publicKey).toBe(provisioned.identity.publicKey);
    expect(verification.keyId).toBe(provisioned.identity.keyId);
    expect(verification.webId).toBe(webId);
  });

  it("discovers mnemonic and ledger resources from Solid profile registrations", async () => {
    const webId = "https://alice.example/profile/card#me";
    const podRoot = "https://pod.example/";
    const profileUrl = "https://alice.example/profile/card";
    const { fetchImpl, publicFetch } = createPodFetch({
      [profileUrl]: {
        body: await createProfileDocument(webId, podRoot),
        contentType: "text/turtle",
        publicReadable: true,
      },
    });
    vi.stubGlobal("fetch", publicFetch);
    const session = createSession({ webId, fetchImpl });
    const unlocker = createTestUnlocker("profile-discovery");
    const provisioned = await provisionSolidIdentity({
      session,
      words: 12,
      unlocker,
      profile: {
        enabled: true,
        bootstrap: true,
      },
    });

    const discovery = await discoverSolidConcordResources(session, {
      appPath: "concord",
    });
    expect(discovery.identityUrl).toBe("https://pod.example/concord/system/private/identity.enc.json");
    expect(discovery.mnemonicUrl).toBe("https://pod.example/concord/system/private/mnemonic.json");
    expect(discovery.ledgerUrl).toBe("https://pod.example/concord/system/private/ledger.json");
    expect(discovery.peopleUrl).toBe("https://pod.example/concord/system/private/people.json");

    const mockApp = {
      load: vi.fn(async () => undefined),
      getState: vi.fn(() => ({
        ready: true,
        integrityValid: true,
        stagedCount: 0,
        replay: {},
        verification: null,
      })),
      subscribe: vi.fn(() => () => undefined),
      command: vi.fn(),
      commit: vi.fn(),
      replay: vi.fn(),
      verify: vi.fn(),
      destroy: vi.fn(),
    };

    concordMocks.createConcordApp.mockImplementation(async ({ identity, storage }) => {
      expect(identity.keyId).toBe(provisioned.identity.keyId);
      await expect(storage.load()).resolves.toBeNull();
      return mockApp;
    });

    const result = await createSolidConcordApp({
      session,
      plugins: [createTodoPlugin()],
      unlocker,
      profile: {
        enabled: true,
        discover: true,
      },
    });

    expect(result.identity.keyId).toBe(provisioned.identity.keyId);
    expect(result.resources?.ledgerUrl).toBe(
      "https://pod.example/concord/system/private/ledger.json",
    );
    expect(concordMocks.createConcordApp).toHaveBeenCalledTimes(1);
  });

  it("derives managed concord workspace paths under the selected pod", async () => {
    const webId = "https://alice.example/profile/card#me";
    const podRoot = "https://pod.example/";
    const profileUrl = "https://alice.example/profile/card";
    const { fetchImpl } = createPodFetch({
      [profileUrl]: {
        body: await createProfileDocument(webId, podRoot),
        contentType: "text/turtle",
        publicReadable: true,
      },
    });

    const paths = await createSolidConcordPaths(
      createSession({ webId, fetchImpl }),
      {
        appPath: "concord",
        podRoot,
      },
    );

    expect(paths.appRootUrl).toBe("https://pod.example/concord/");
    expect(paths.systemPrivateRootUrl).toBe("https://pod.example/concord/system/private/");
    expect(paths.workspacePrivateRootUrl).toBe("https://pod.example/concord/workspace/private/");
    expect(paths.workspaceSharedRootUrl).toBe("https://pod.example/concord/workspace/shared/");
    expect(paths.workspacePublicRootUrl).toBe("https://pod.example/concord/workspace/public/");
    expect(paths.identityUrl).toBe("https://pod.example/concord/system/private/identity.enc.json");
    expect(paths.peopleUrl).toBe("https://pod.example/concord/system/private/people.json");
  });

  it("persists a Concord OS people registry in the managed system area", async () => {
    const webId = "https://alice.example/profile/card#me";
    const podRoot = "https://pod.example/";
    const profileUrl = "https://alice.example/profile/card";
    const workspacePod = createWorkspacePod(podRoot);
    await workspacePod.initialize();
    await workspacePod.putFile(
      profileUrl,
      await createProfileDocument(webId, podRoot),
      "text/turtle",
    );

    solidClientMocks.createContainerAt.mockImplementation(async (url: string) => {
      await workspacePod.ensureContainer(url);
    });

    const session = createSession({ webId, fetchImpl: workspacePod.fetchImpl });
    const storage = createConcordOsPeopleStorage(
      session,
      "https://pod.example/concord/system/private/people.json",
    );

    await storage.save({
      format: "ternent-concord-os-people",
      version: "1",
      createdAt: "2026-03-23T00:00:00.000Z",
      updatedAt: "2026-03-23T00:00:00.000Z",
      people: [
        {
          webId: "https://bob.example/profile/card#me",
          label: "Bob",
          note: "Editor",
          createdAt: "2026-03-23T00:00:00.000Z",
          updatedAt: "2026-03-23T00:00:00.000Z",
          lastUsedAt: null,
        },
      ],
    });

    await expect(storage.load()).resolves.toMatchObject({
      people: [
        expect.objectContaining({
          webId: "https://bob.example/profile/card#me",
          label: "Bob",
        }),
      ],
    });
  });

  it("browses and mutates managed workspace resources", async () => {
    const webId = "https://alice.example/profile/card#me";
    const podRoot = "https://pod.example/";
    const profileUrl = "https://alice.example/profile/card";
    const workspacePod = createWorkspacePod(podRoot);
    await workspacePod.initialize();
    await workspacePod.putFile(
      profileUrl,
      await createProfileDocument(webId, podRoot),
      "text/turtle",
    );

    solidClientMocks.createContainerAt.mockImplementation(async (url: string) => {
      await workspacePod.ensureContainer(url);
    });
    solidClientMocks.universalAccess.setPublicAccess.mockImplementation(
      async (url: string, access: { read?: boolean }) => {
        const current = workspacePod.accessState.get(url) ?? {
          publicRead: false,
          agents: {},
        };
        workspacePod.accessState.set(url, {
          ...current,
          publicRead: Boolean(access.read),
        });
      },
    );
    solidClientMocks.universalAccess.getPublicAccess.mockImplementation(async (url: string) => {
      const current = workspacePod.accessState.get(url);
      return {
        read: Boolean(current?.publicRead),
        append: false,
        write: false,
        control: false,
      };
    });
    solidClientMocks.universalAccess.getAgentAccessAll.mockImplementation(async (url: string) => {
      return workspacePod.accessState.get(url)?.agents ?? {};
    });
    solidClientMocks.universalAccess.setAgentAccess.mockImplementation(
      async (
        url: string,
        webId: string,
        access: { read?: boolean; append?: boolean; write?: boolean; control?: boolean },
      ) => {
        const current = workspacePod.accessState.get(url) ?? {
          publicRead: false,
          agents: {},
        };
        const nextAgents = {
          ...current.agents,
        };
        if (!access.read && !access.append && !access.write && !access.control) {
          delete nextAgents[webId];
        } else {
          nextAgents[webId] = {
            read: Boolean(access.read),
            append: Boolean(access.append),
            write: Boolean(access.write),
            control: Boolean(access.control),
          };
        }
        workspacePod.accessState.set(url, {
          ...current,
          agents: nextAgents,
        });
      },
    );

    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-23T00:00:00.000Z",
    });
    concordMocks.createConcordApp.mockResolvedValue({
      load: vi.fn(async () => undefined),
      exportLedger: vi.fn(async () => ({
        format: "concord-ledger",
        version: "1",
        head: "commit-1",
        commits: {
          "commit-1": {
            hash: "commit-1",
          },
        },
        entries: {
          "entry-1": {
            hash: "entry-1",
          },
        },
      })),
      destroy: vi.fn(async () => undefined),
    });
    const session = createSession({ webId, fetchImpl: workspacePod.fetchImpl });
    const workspace = await createSolidWorkspace({
      session,
      appPath: "concord",
      podRoot,
    });

    await workspace.ensure();
    await workspace.createFolder(
      workspace.paths.workspacePrivateRootUrl,
      "docs",
    );
    await workspace.createLedger(
      workspace.paths.workspacePrivateRootUrl,
      "project-ledger.json",
      {
        identity: created.identity,
      },
    );
    await workspace.uploadFile(
      workspace.paths.workspacePrivateRootUrl,
      "notes.md",
      "# Notes\n\nHello\n",
      {
        contentType: "text/markdown",
      },
    );

    const privateListing = await workspace.list(workspace.paths.workspacePrivateRootUrl);
    expect(privateListing.entries.map((entry) => entry.name)).toEqual([
      "docs",
      "notes.md",
      "project-ledger.json",
    ]);

    const ledgerEntry = privateListing.entries.find((entry) => entry.name === "project-ledger.json");
    expect(ledgerEntry?.isLedger).toBe(true);

    const preview = await workspace.read(ledgerEntry!.url);
    expect(preview.mode).toBe("ledger");
    expect(preview.ledger?.commitCount).toBeGreaterThan(0);

    await workspace.createLedger(
      workspace.paths.workspacePrivateRootUrl,
      "roadmap",
      {
        identity: created.identity,
      },
    );

    const plainNamedLedger = await workspace.stat(
      "https://pod.example/concord/workspace/private/roadmap.json",
    );
    expect(plainNamedLedger?.isLedger).toBe(true);
    expect(plainNamedLedger?.contentType).toContain("concord-ledger");

    await workspace.rename(ledgerEntry!.url, "renamed-ledger.json");
    await workspace.move(
      "https://pod.example/concord/workspace/private/docs/",
      workspace.paths.workspaceSharedRootUrl,
    );

    const sharedListing = await workspace.list(workspace.paths.workspaceSharedRootUrl);
    expect(sharedListing.entries.map((entry) => entry.name)).toContain("docs");

    const renamed = await workspace.stat(
      "https://pod.example/concord/workspace/private/renamed-ledger.json",
    );
    expect(renamed?.name).toBe("renamed-ledger.json");

    const notes = await workspace.stat(
      "https://pod.example/concord/workspace/private/notes.md",
    );
    expect(notes?.contentType).toContain("markdown");

    await workspace.delete("https://pod.example/concord/workspace/private/notes.md");
    await expect(
      workspace.stat("https://pod.example/concord/workspace/private/notes.md"),
    ).resolves.toBeNull();
  });

  it("inspects and applies workspace access using direct WebID grants", async () => {
    const webId = "https://alice.example/profile/card#me";
    const podRoot = "https://pod.example/";
    const profileUrl = "https://alice.example/profile/card";
    const workspacePod = createWorkspacePod(podRoot);
    await workspacePod.initialize();
    await workspacePod.putFile(
      profileUrl,
      await createProfileDocument(webId, podRoot),
      "text/turtle",
    );
    await workspacePod.putFile(
      "https://pod.example/concord/workspace/private/spec.txt",
      "spec",
      "text/plain",
    );

    solidClientMocks.createContainerAt.mockImplementation(async (url: string) => {
      await workspacePod.ensureContainer(url);
    });
    solidClientMocks.universalAccess.getPublicAccess.mockImplementation(async (url: string) => {
      const current = workspacePod.accessState.get(url);
      return {
        read: Boolean(current?.publicRead),
        append: false,
        write: false,
        control: false,
      };
    });
    solidClientMocks.universalAccess.getAgentAccessAll.mockImplementation(async (url: string) => {
      return workspacePod.accessState.get(url)?.agents ?? {};
    });
    solidClientMocks.universalAccess.setPublicAccess.mockImplementation(
      async (url: string, access: { read?: boolean }) => {
        const current = workspacePod.accessState.get(url) ?? {
          publicRead: false,
          agents: {},
        };
        workspacePod.accessState.set(url, {
          ...current,
          publicRead: Boolean(access.read),
        });
      },
    );
    solidClientMocks.universalAccess.setAgentAccess.mockImplementation(
      async (
        url: string,
        agentWebId: string,
        access: { read?: boolean; append?: boolean; write?: boolean; control?: boolean },
      ) => {
        const current = workspacePod.accessState.get(url) ?? {
          publicRead: false,
          agents: {},
        };
        const nextAgents = {
          ...current.agents,
          [agentWebId]: {
            read: Boolean(access.read),
            append: Boolean(access.append),
            write: Boolean(access.write),
            control: Boolean(access.control),
          },
        };
        workspacePod.accessState.set(url, {
          ...current,
          agents: nextAgents,
        });
      },
    );

    const workspace = await createSolidWorkspace({
      session: createSession({ webId, fetchImpl: workspacePod.fetchImpl }),
      appPath: "concord",
      podRoot,
    });

    const initial = await workspace.inspectAccess(
      "https://pod.example/concord/workspace/private/spec.txt",
    );
    expect(initial.visibility).toBe("private");

    const updated = await workspace.applyAccess(
      "https://pod.example/concord/workspace/private/spec.txt",
      {
        publicRead: true,
        agents: ["https://bob.example/profile/card#me"],
      },
    );

    expect(updated.publicRead).toBe("yes");
    expect(updated.grants).toEqual([
      expect.objectContaining({
        webId: "https://bob.example/profile/card#me",
        read: true,
      }),
    ]);
    expect(updated.visibility).toBe("public");
  });

  it("flags anonymously readable mnemonic secrets as unsafe", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "https://pod.example/concord/system/private/mnemonic.json") {
          return new Response("{}", { status: 200 });
        }
        if (url === "https://pod.example/concord/system/private/wallet.json") {
          return new Response(null, { status: 404 });
        }
        if (url === "https://pod.example/concord/public/seal-identity.json") {
          return new Response("{}", { status: 200 });
        }
        return new Response(null, { status: 404 });
      }) as typeof fetch,
    );

    const report = await validateSolidConcordAccess({
      webId: "https://alice.example/profile/card#me",
      profileUrl: "https://alice.example/profile/card",
      podRoot: "https://pod.example/",
      settingsRootUrl: "https://pod.example/settings/",
      appRootUrl: "https://pod.example/concord/",
      systemRootUrl: "https://pod.example/concord/system/",
      systemPrivateRootUrl: "https://pod.example/concord/system/private/",
      workspaceRootUrl: "https://pod.example/concord/workspace/",
      workspacePrivateRootUrl: "https://pod.example/concord/workspace/private/",
      workspaceSharedRootUrl: "https://pod.example/concord/workspace/shared/",
      workspacePublicRootUrl: "https://pod.example/concord/workspace/public/",
      privateRootUrl: "https://pod.example/concord/system/private/",
      publicRootUrl: "https://pod.example/concord/public/",
      preferencesUrl: "https://pod.example/settings/preferences.ttl",
      publicTypeIndexUrl: "https://pod.example/settings/publicTypeIndex.ttl",
      privateTypeIndexUrl: "https://pod.example/settings/privateTypeIndex.ttl",
      identityUrl: "https://pod.example/concord/system/private/identity.enc.json",
      mnemonicUrl: "https://pod.example/concord/system/private/mnemonic.json",
      walletUrl: "https://pod.example/concord/system/private/wallet.json",
      ledgerUrl: "https://pod.example/concord/system/private/ledger.json",
      peopleUrl: "https://pod.example/concord/system/private/people.json",
      verificationUrl: "https://pod.example/concord/public/seal-identity.json",
      seeAlso: ["https://pod.example/concord/public/seal-identity.json"],
    });

    expect(report.safe).toBe(false);
    expect(report.issues).toContain(
      "Solid mnemonic resource is anonymously readable: https://pod.example/concord/system/private/mnemonic.json",
    );
  });

  it("updates manager status when Concord becomes unhealthy after initialization", async () => {
    const created = await createSolidMnemonicIdentity({
      words: 12,
      createdAt: "2026-03-22T00:00:00.000Z",
    });
    const listeners = new Set<(state: any) => void>();
    const mockApp = {
      load: vi.fn(async () => undefined),
      getState: vi.fn(() => ({
        ready: true,
        integrityValid: true,
        stagedCount: 0,
        replay: {},
        verification: null,
      })),
      subscribe: vi.fn((listener: (state: any) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
      command: vi.fn(),
      commit: vi.fn(),
      replay: vi.fn(),
      verify: vi.fn(),
      destroy: vi.fn(),
    };

    concordMocks.createConcordApp.mockResolvedValue(mockApp);

    const manager = createSolidConcordManager({
      session: createSession(),
      ledgerUrl: "https://pod.example/apps/todo/ledger.json",
      plugins: [createTodoPlugin()],
      identity: created.identity,
    });

    await manager.init();
    expect(manager.getState().status).toBe("ready");

    for (const listener of listeners) {
      listener({
        ready: false,
        integrityValid: false,
        stagedCount: 0,
        replay: {},
        verification: {
          valid: false,
          committedHistoryValid: false,
          commitChainValid: false,
          commitProofsValid: false,
          entriesValid: false,
          entryProofsValid: false,
          payloadHashesValid: false,
          proofsValid: false,
          invalidCommitIds: ["commit-1"],
          invalidEntryIds: [],
        },
      });
    }

    expect(manager.getState().ready).toBe(false);
    expect(manager.getState().status).toBe("error");
  });
});
