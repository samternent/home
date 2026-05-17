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

  return { app, storage };
}

describe("concord host permissions flow", () => {
  it("creates key-bearing groups with a root grant for the creator", async () => {
    const { app } = await createTestApp("test/v2/key-bearing-root-grant");

    await app.permissions.create({
      title: "Editors",
      scope: "workspace",
    });

    const created = app.permissions.all().at(0);
    expect(created).toBeTruthy();
    expect(created?.publicKey).toMatch(/^age1/);
    expect(created?.createdBy).toBeTruthy();
    expect(created?.grantCount).toBe(1);
    expect(created?.viewerHasKey).toBe(true);
    expect(created?.viewerGrantId).toMatch(/^permission-grant:/);
  });

  it("shows staged state immediately after command", async () => {
    const { app } = await createTestApp("test/v2/staged-visibility");

    await app.permissions.create({
      title: "Editors",
      scope: "workspace",
    });

    expect(app.permissions.all()).toHaveLength(1);
    expect(app.getState().stagedCount).toBe(1);
  });

  it("keeps replay projection stable across commit", async () => {
    const { app } = await createTestApp("test/v2/commit-noop");

    await app.permissions.create({
      title: "Approvers",
    });

    const beforeReplay = structuredClone(app.getState().replay);
    await app.commit();
    const afterReplay = structuredClone(app.getState().replay);

    expect(afterReplay).toEqual(beforeReplay);
    expect(app.getState().stagedCount).toBe(0);
  });

  it("discards staged entries and returns to committed projection", async () => {
    const { app } = await createTestApp("test/v2/discard");

    await app.permissions.create({
      title: "Operators",
    });
    expect(app.permissions.all()).toHaveLength(1);

    await app.discard();
    expect(app.permissions.all()).toHaveLength(0);
    expect(app.getState().stagedCount).toBe(0);
  });

  it("is deterministic for the same committed+staged set", async () => {
    const { app } = await createTestApp("test/v2/determinism");

    await app.permissions.create({ title: "One" });
    await app.permissions.create({ title: "Two" });

    const stateBeforeReplay = structuredClone(app.getState().replay);
    await app.replay();
    const stateAfterReplay = structuredClone(app.getState().replay);

    expect(stateAfterReplay).toEqual(stateBeforeReplay);
  });

  it("preserves staged insertion ordering", async () => {
    const { app } = await createTestApp("test/v2/staged-ordering");

    await app.permissions.create({ title: "A" });
    await app.permissions.create({ title: "B" });

    expect(app.permissions.all().map((record) => record.title)).toEqual(["A", "B"]);
  });

  it("prevents re-adding the creator identity to the same permission", async () => {
    const { app } = await createTestApp("test/v2/no-duplicate-creator");
    const actor = await app.identity.ensureActiveIdentity();

    await app.permissions.create({
      title: "Unique Members",
    });

    const permission = app.permissions.all().at(0);
    expect(permission).toBeTruthy();

    expect(() =>
      app.permissions.grantFromUser({
        permissionId: permission!.id,
        identityKey: actor.identityKey,
      }),
    ).toThrow("already assigned");
  });

  it("allows revoking the current user from a permission", async () => {
    const { app } = await createTestApp("test/v2/revoke-current-user");
    const actor = await app.identity.ensureActiveIdentity();

    await app.permissions.create({
      title: "Temporary Membership",
    });

    const permission = app.permissions.all().at(0);
    expect(permission).toBeTruthy();
    expect(permission!.members.some((member) => member.memberId === actor.identityKey)).toBe(true);

    await app.permissions.revoke({
      permissionId: permission!.id,
      memberId: actor.identityKey,
    });

    const updated = app.permissions.byId(permission!.id);
    expect(updated).toBeNull();
  });

  it("hides groups from non-members and blocks self-escalation", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const guestIdentityKey = toDidKeyFromPublicKey(guestIdentity.publicKey);
    const storageKey = "test/v2/non-member-cannot-escalate";

    const ownerApp = createAppApi({
      identity: ownerIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await ownerApp.load();

    await ownerApp.users.create({
      identityKey: guestIdentityKey,
    });
    await ownerApp.permissions.create({
      title: "Owners",
    });
    const permissionId = ownerApp.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();
    await ownerApp.commit();

    const guestApp = createAppApi({
      identity: guestIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await guestApp.load();

    expect(guestApp.permissions.all()).toHaveLength(0);
    expect(guestApp.permissions.byId(permissionId!)).toBeNull();

    await expect(
      guestApp.command("permission.grant", {
        permissionId: permissionId!,
        memberId: guestIdentityKey,
        actor: {
          memberId: guestIdentityKey,
        },
      }),
    ).rejects.toThrow("existing key holders");
  });

  it("rejects forged actor ids for permission mutations", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const ownerIdentityKey = toDidKeyFromPublicKey(ownerIdentity.publicKey);
    const guestIdentityKey = toDidKeyFromPublicKey(guestIdentity.publicKey);
    const storageKey = "test/v2/forged-actor-blocked";

    const ownerApp = createAppApi({
      identity: ownerIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await ownerApp.load();

    await ownerApp.users.create({
      identityKey: guestIdentityKey,
    });
    await ownerApp.permissions.create({
      title: "Owners",
    });
    const permissionId = ownerApp.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();
    await ownerApp.commit();

    const guestApp = createAppApi({
      identity: guestIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await guestApp.load();

    await expect(
      guestApp.command("permission.grant", {
        permissionId: permissionId!,
        memberId: guestIdentityKey,
        actor: {
          memberId: ownerIdentityKey,
        },
      }),
    ).rejects.toThrow("does not match the active signer");
  });

  it("supports alias commands for create and delegated grant issue", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const guestIdentityKey = toDidKeyFromPublicKey(guestIdentity.publicKey);
    const storageKey = "test/v2/permission-alias-commands";

    const ownerApp = createAppApi({
      identity: ownerIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await ownerApp.load();

    await ownerApp.users.create({
      identityKey: guestIdentityKey,
    });

    await ownerApp.command("permission.group.create", {
      title: "Alias Group",
      actor: {
        memberId: (await ownerApp.identity.ensureActiveIdentity()).identityKey,
      },
    });

    const permissionId = ownerApp.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();

    await ownerApp.command("permission.grant.issue", {
      permissionId: permissionId!,
      memberId: guestIdentityKey,
      actor: {
        memberId: (await ownerApp.identity.ensureActiveIdentity()).identityKey,
      },
    });

    await ownerApp.commit();

    const guestApp = createAppApi({
      identity: guestIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await guestApp.load();

    const granted = guestApp.permissions.byId(permissionId!);
    expect(granted).toBeTruthy();
    expect(granted?.viewerHasKey).toBe(true);
  });
});
