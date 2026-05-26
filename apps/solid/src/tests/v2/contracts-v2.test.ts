import { describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
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

describe("concord host contracts", () => {
  it("rebuilds committed replay state on reload", async () => {
    const storage = createMemoryStorage();
    const identity = await createIdentity("2026-04-20T10:00:00.000Z");
    const storageKey = "test/v2/reload";

    const appA = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({
        storage,
        storageKey,
      }),
    });
    await appA.load();

    const actor = await appA.identity.ensureActiveIdentity();

    await appA.permissions.create({
      title: "Reload Permission",
      scope: "workspace",
    });
    await appA.commit();

    const expectedReplay = structuredClone(appA.getState().replay);

    const appB = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({
        storage,
        storageKey,
      }),
    });
    await appB.load();

    expect(appB.getState().replay).toEqual(expectedReplay);
    expect(appB.permissions.all()).toHaveLength(1);
    expect(appB.users.all()).toHaveLength(1);
  });

  it("keeps users state unchanged when permission entries replay", async () => {
    const storage = createMemoryStorage();
    const identity = await createIdentity("2026-04-20T10:00:00.000Z");

    const app = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({
        storage,
        storageKey: "test/v2/permission-isolation",
      }),
    });
    await app.load();

    const actor = await app.identity.ensureActiveIdentity();

    const usersBeforePermissionCommand = app.users.all();

    await app.permissions.create({
      title: "Scoped Permission",
    });

    expect(app.users.all()).toEqual(usersBeforePermissionCommand);
  });

  it("fails explicitly when partial replay is requested", async () => {
    const storage = createMemoryStorage();
    const identity = await createIdentity("2026-04-20T10:00:00.000Z");

    const app = createAppApi({
      identity,
      storage: createConcordLocalStorageAdapter({
        storage,
        storageKey: "test/v2/partial-replay-unsupported",
      }),
    });
    await app.load();

    await expect(
      app.replay({
        reason: "manual",
        fromEntryId: "entry-1",
      }),
    ).rejects.toThrow("Partial replay is unsupported in MVP.");
  });
});
