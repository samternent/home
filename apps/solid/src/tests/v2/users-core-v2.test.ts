import { describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import { createAppApi } from "@/app/api";
import { toDidKeyFromPublicKey } from "@/app/plugins/identityKey";
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
  it("creates users and stages self profile updates via linked projection", async () => {
    const app = await createTestApp("test/v2/users-create-update");
    const identity = await app.identity.ensureActiveIdentity();

    await app.profiles.upsert({
      identityKey: identity.identityKey,
      displayName: "Primary User",
      bio: "Replay-first builder",
      avatarUrl: "https://example.test/avatar.png",
    });

    const user = app.users.byIdentityKey(identity.identityKey);
    const profile = app.profiles.byIdentityKey(identity.identityKey);

    expect(user?.identityKey).toBe(identity.identityKey);
    expect(user?.addedBy).toBe(identity.identityKey);
    expect(profile?.displayName).toBe("Primary User");
    expect(profile?.bio).toBe("Replay-first builder");
    expect(profile?.avatarUrl).toBe("https://example.test/avatar.png");
  });

  it("rejects duplicate user create and non-owner profile updates", async () => {
    const app = await createTestApp("test/v2/users-rules");
    const identity = await app.identity.ensureActiveIdentity();

    await expect(
      app.users.create({
        identityKey: identity.identityKey,
      }),
    ).rejects.toThrow("User already exists");

    const anotherIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const anotherIdentityKey = toDidKeyFromPublicKey(anotherIdentity.publicKey);

    await app.users.create({
      identityKey: anotherIdentityKey,
    });

    await expect(
      app.profiles.upsert({
        identityKey: anotherIdentityKey,
        displayName: "Should fail",
      }),
    ).rejects.toThrow("self-service only");
  });

  it("does not mutate state outside replay operations", async () => {
    const app = await createTestApp("test/v2/no-hidden-mutation");
    await app.identity.ensureActiveIdentity();

    const before = structuredClone(app.getState());
    await Promise.resolve();
    const after = structuredClone(app.getState());

    expect(after).toEqual(before);
  });
});
