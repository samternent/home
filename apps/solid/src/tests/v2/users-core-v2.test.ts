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

async function createTestApp(storageKey: string) {
  const storage = createMemoryStorage();
  const app = createAppApi({
    identity: await createIdentity("2026-04-20T10:00:00.000Z"),
    storage: createConcordLocalStorageAdapter({
      storage,
      storageKey,
    }),
  });

  await app.load();

  return app;
}

describe("concord host users flow", () => {
  it("creates and updates user profiles via replay", async () => {
    const app = await createTestApp("test/v2/users-create-update");
    const identity = await app.identity.ensureActiveIdentity();

    await app.users.create({
      identityId: identity.identityId,
      label: identity.label,
      displayName: "Primary User",
      attributes: {
        tier: "owner",
      },
    });

    await app.users.updateProfile({
      identityId: identity.identityId,
      email: "primary@example.test",
      attributes: {
        tier: "admin",
      },
    });

    const user = app.users.byId(identity.identityId);
    expect(user?.profile.displayName).toBe("Primary User");
    expect(user?.profile.email).toBe("primary@example.test");
    expect(user?.profile.attributes.tier).toBe("admin");
  });

  it("keeps plugin state isolated", async () => {
    const app = await createTestApp("test/v2/plugin-isolation");
    const identity = await app.identity.ensureActiveIdentity();

    const permissionsBefore = app.permissions.all();

    await app.users.create({
      identityId: identity.identityId,
      label: identity.label,
    });

    expect(app.permissions.all()).toEqual(permissionsBefore);
  });

  it("does not mutate state outside replay operations", async () => {
    const app = await createTestApp("test/v2/no-hidden-mutation");
    const identity = await app.identity.ensureActiveIdentity();

    await app.users.create({
      identityId: identity.identityId,
      label: identity.label,
    });

    const before = structuredClone(app.getState());
    await Promise.resolve();
    const after = structuredClone(app.getState());

    expect(after).toEqual(before);
  });
});
