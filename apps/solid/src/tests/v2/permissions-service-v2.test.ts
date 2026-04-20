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

  return { app, storage };
}

describe("concord host permissions flow", () => {
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
});
