import { afterEach, describe, expect, it, vi } from "vitest";
import { createIdentity } from "@ternent/identity";
import type { LedgerContainer } from "@ternent/ledger";
import { createAppApi } from "@/app/api";
import { createConcordLocalStorageAdapter, type LocalStorageLike } from "@/app/runtime";

function createMemoryStorage(): LocalStorageLike {
  const records = new Map<string, string>();
  return {
    getItem(key) {
      return records.get(key) ?? null;
    },
    setItem(key, value) {
      records.set(key, value);
    },
    removeItem(key) {
      records.delete(key);
    },
  };
}

function responseJson(value: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(value), {
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    status: init?.status ?? 200,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runtime storage sync v1", () => {
  it("keeps local provider commit behavior and returns typed committed result", async () => {
    const storage = createMemoryStorage();
    const app = createAppApi({
      identity: await createIdentity("2026-04-20T10:00:00.000Z"),
      storage: createConcordLocalStorageAdapter({
        storage,
        storageKey: "test/v2/runtime-storage-local",
      }),
    });

    await app.load();

    await app.permissions.create({ title: "Local Group" });
    const result = await app.commit();

    expect(result.status).toBe("committed");
    if (result.status === "committed") {
      expect(result.pulledEntryCount).toBe(0);
      expect(result.pushed).toBe(false);
    }
  });

  it("rejects shared HTTP push when compare-and-swap is unavailable", async () => {
    const storage = createMemoryStorage();
    const identity = await createIdentity("2026-04-20T10:00:00.000Z");
    const pointer = "https://example.test/ledger/shared";

    const bootstrapApp = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({ storage, storageKey: "test/v2/runtime-storage-http-unsafe" }),
    });
    await bootstrapApp.load();
    const initialRemote = await bootstrapApp.exportLedger();

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        const method = (init?.method ?? "GET").toUpperCase();
        if (method === "GET") {
          return responseJson(initialRemote);
        }
        return responseJson({}, { status: 200 });
      });

    const app = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({ storage, storageKey: "test/v2/runtime-storage-http-unsafe" }),
      workspaceStorageRef: {
        providerId: "http",
        workspaceId: "workspace-http-unsafe",
        pointer,
      },
      storageSync: {
        providerId: "http",
        mode: "shared",
        supportsCompareAndSwap: false,
      },
    });

    await app.load();
    await app.permissions.create({ title: "Unsafe push test" });
    const result = await app.commit();

    expect(result.status).toBe("rejected");
    if (result.status === "rejected") {
      expect(result.reason).toBe("provider-error");
    }

    expect(fetchMock).toHaveBeenCalled();
  });

  it("pulls remote entries before commit and pushes on success", async () => {
    const storageA = createMemoryStorage();
    const storageB = createMemoryStorage();
    const identity = await createIdentity("2026-04-20T10:00:00.000Z");
    const pointer = "https://example.test/ledger/sync";

    const appA = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({ storage: storageA, storageKey: "test/v2/runtime-storage-a" }),
    });
    await appA.load();
    const baseLedger = await appA.exportLedger();

    const appB = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({ storage: storageB, storageKey: "test/v2/runtime-storage-b" }),
    });
    await appB.load();
    await appB.importLedger(baseLedger);

    await appB.permissions.create({ title: "Remote change" });
    await appB.commit();

    let remoteContainer: LedgerContainer = await appB.exportLedger();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const method = (init?.method ?? "GET").toUpperCase();

      if (method === "GET") {
        return responseJson(remoteContainer, {
          headers: {
            etag: remoteContainer.head,
          },
        });
      }

      const body = init?.body ? JSON.parse(String(init.body)) : null;
      if (body && body.container) {
        remoteContainer = body.container as LedgerContainer;
      }

      return responseJson({ container: remoteContainer }, {
        headers: {
          etag: remoteContainer.head,
        },
      });
    });

    const syncedApp = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({ storage: storageA, storageKey: "test/v2/runtime-storage-a" }),
      workspaceStorageRef: {
        providerId: "http",
        workspaceId: "workspace-sync",
        pointer,
      },
      storageSync: {
        providerId: "http",
        mode: "shared",
        supportsCompareAndSwap: true,
      },
    });

    await syncedApp.load();
    await syncedApp.tasks.create({
      title: "Local staged task",
      audienceType: "everyone",
    });

    const result = await syncedApp.commit();

    expect(result.status).toBe("committed");
    if (result.status === "committed") {
      expect(result.pulledEntryCount).toBeGreaterThan(0);
      expect(result.pushed).toBe(true);
    }
  });

  it("rejects same-task same-field conflict after pull", async () => {
    const storageA = createMemoryStorage();
    const storageB = createMemoryStorage();
    const identityA = await createIdentity("2026-04-20T10:00:00.000Z");
    const identityB = await createIdentity("2026-04-21T10:00:00.000Z");
    const pointer = "https://example.test/ledger/conflict";

    const seedApp = createAppApi({
      identity: identityA,
      storage: createConcordLocalStorageAdapter({
        storage: storageA,
        storageKey: "test/v2/runtime-storage-conflict-a",
      }),
    });
    await seedApp.load();
    await seedApp.tasks.create({ title: "Original", audienceType: "everyone" });
    await seedApp.commit();

    const baseLedger = await seedApp.exportLedger();

    const appB = createAppApi({
      identity: identityB,
      storage: createConcordLocalStorageAdapter({
        storage: storageB,
        storageKey: "test/v2/runtime-storage-conflict-b",
      }),
    });

    await appB.load();
    await appB.importLedger(baseLedger);

    const taskId = seedApp.tasks.all().at(0)?.id;
    expect(taskId).toBeTruthy();

    await appB.tasks.rename({ taskId: taskId!, title: "Remote rename" });
    await appB.commit();

    let remoteContainer: LedgerContainer = await appB.exportLedger();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const method = (init?.method ?? "GET").toUpperCase();

      if (method === "GET") {
        return responseJson(remoteContainer, {
          headers: {
            etag: remoteContainer.head,
          },
        });
      }

      const body = init?.body ? JSON.parse(String(init.body)) : null;
      if (body && body.container) {
        remoteContainer = body.container as LedgerContainer;
      }

      return responseJson({ container: remoteContainer }, {
        headers: {
          etag: remoteContainer.head,
        },
      });
    });

    const appA = createAppApi({
      identity: identityA,
      storage: createConcordLocalStorageAdapter({
        storage: storageA,
        storageKey: "test/v2/runtime-storage-conflict-a",
      }),
      workspaceStorageRef: {
        providerId: "http",
        workspaceId: "workspace-conflict",
        pointer,
      },
      storageSync: {
        providerId: "http",
        mode: "shared",
        supportsCompareAndSwap: true,
      },
    });
    await appA.load();
    await appA.tasks.rename({ taskId: taskId!, title: "Local rename" });

    const result = await appA.commit();

    expect(result.status).toBe("rejected");
    if (result.status === "rejected") {
      expect(result.reason).toBe("conflict");
      expect(result.conflicts.some((conflict) => conflict.kind === "same-aggregate-field-conflict")).toBe(true);
    }
  });
});
