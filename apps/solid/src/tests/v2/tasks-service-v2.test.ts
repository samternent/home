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

async function createTestApp(storage: LocalStorageLike, storageKey: string, createdAt: string) {
  const app = createAppApi({
    identity: await createIdentity(createdAt),
    storage: createConcordLocalStorageAdapter({
      storage,
      storageKey,
    }),
  });

  await app.load();

  return app;
}

describe("concord host tasks flow", () => {
  it("creates public tasks as plain audience payloads", async () => {
    const storage = createMemoryStorage();
    const app = await createTestApp(storage, "test/v2/tasks-public", "2026-04-20T10:00:00.000Z");

    await app.tasks.create({
      title: "Public task",
      audienceType: "everyone",
    });

    const task = app.tasks.all().at(0);
    expect(task).toBeTruthy();
    expect(task?.audienceType).toBe("everyone");
    expect(task?.cipher).toBeNull();
    expect(app.getState().stagedCount).toBe(1);
  });

  it("blocks assigning permission tasks to users without key access", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const storageKey = "test/v2/tasks-assignee-key-check";
    const guestIdentityKey = toDidKeyFromPublicKey(guestIdentity.publicKey);

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
      title: "Task Owners",
      scope: "tasks",
    });

    const permissionId = ownerApp.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();

    await expect(
      ownerApp.tasks.create({
        title: "Private task",
        permissionId,
        audienceType: "permission",
        audienceId: permissionId,
        assigneeIdentityKey: guestIdentityKey,
      }),
    ).rejects.toThrow("Assignee does not have audience access");

    await ownerApp.permissions.grantFromUser({
      permissionId: permissionId!,
      identityKey: guestIdentityKey,
    });

    await ownerApp.tasks.create({
      title: "Private task",
      permissionId,
      audienceType: "permission",
      audienceId: permissionId,
      assigneeIdentityKey: guestIdentityKey,
    });
    await ownerApp.commit();

    const task = ownerApp.tasks.all().at(0);
    const ledger = await ownerApp.exportLedger();
    const encryptedCreateEntry = Object.values(ledger.entries).find((entry) => entry.kind === "task.create");
    expect(task?.assigneeIdentityKey).toBe(guestIdentityKey);
    expect(task?.permissionId).toBe(permissionId);
    expect(encryptedCreateEntry?.payload.type).toBe("encrypted");
  });

  it("rejects forged actor identity for task mutations", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const storageKey = "test/v2/tasks-forged-actor";
    const ownerIdentityKey = toDidKeyFromPublicKey(ownerIdentity.publicKey);

    const ownerApp = createAppApi({
      identity: ownerIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await ownerApp.load();

    await ownerApp.tasks.create({
      title: "Rename target",
      audienceType: "everyone",
    });
    const taskId = ownerApp.tasks.all().at(0)?.id;
    expect(taskId).toBeTruthy();
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
      guestApp.command("task.rename", {
        taskId,
        title: "Forged rename",
        actorIdentityKey: ownerIdentityKey,
      }),
    ).rejects.toThrow("does not match the active signer");
  });

  it("rejects permission task mutations when actor cannot read the task audience", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const storageKey = "test/v2/tasks-permission-mutation-authz";
    const guestIdentityKey = toDidKeyFromPublicKey(guestIdentity.publicKey);

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
      title: "Mutation Permission",
      scope: "tasks",
    });
    const permissionId = ownerApp.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();

    await ownerApp.tasks.create({
      title: "Permission task",
      permissionId: permissionId!,
      audienceType: "permission",
      audienceId: permissionId!,
    });
    const taskId = ownerApp.tasks.all().at(0)?.id;
    expect(taskId).toBeTruthy();
    await ownerApp.commit();

    const guestApp = createAppApi({
      identity: guestIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await guestApp.load();

    const boardId = guestApp.tasks.defaultBoardId();
    const doingColumnId = guestApp.tasks.boardColumns(boardId).at(1)?.id;
    expect(doingColumnId).toBeTruthy();

    await expect(
      guestApp.command("task.move", {
        taskId,
        columnId: doingColumnId!,
        actorIdentityKey: guestIdentityKey,
      }),
    ).rejects.toThrow("Task does not exist");
  });

  it("stores permission task mutations as native encrypted ledger entries", async () => {
    const storage = createMemoryStorage();
    const app = await createTestApp(
      storage,
      "test/v2/tasks-permission-encrypted-rename",
      "2026-04-20T10:00:00.000Z",
    );

    await app.permissions.create({
      title: "Secure Tasks",
      scope: "tasks",
    });
    const permissionId = app.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();

    await app.tasks.create({
      title: "Initial secure title",
      permissionId: permissionId!,
      audienceType: "permission",
      audienceId: permissionId!,
    });

    const taskId = app.tasks.all().at(0)?.id;
    expect(taskId).toBeTruthy();

    await app.tasks.rename({
      taskId: taskId!,
      title: "Renamed secure title",
    });
    await app.commit();

    const taskAfterRename = app.tasks.byId(taskId!);
    const ledger = await app.exportLedger();
    const encryptedEntries = Object.values(ledger.entries).filter(
      (entry) => entry.kind === "task.create" || entry.kind === "task.rename",
    );

    expect(taskAfterRename?.title).toBe("Renamed secure title");
    expect(encryptedEntries).toHaveLength(2);
    expect(encryptedEntries.every((entry) => entry.payload.type === "encrypted")).toBe(true);
  });

  it("is deterministic across replay after create and move", async () => {
    const storage = createMemoryStorage();
    const app = await createTestApp(
      storage,
      "test/v2/tasks-replay-deterministic",
      "2026-04-20T10:00:00.000Z",
    );

    await app.tasks.create({
      title: "Replay me",
      audienceType: "everyone",
    });

    const task = app.tasks.all().at(0);
    const columns = app.tasks.boardColumns(app.tasks.defaultBoardId());
    const doingColumnId = columns[1]?.id;
    expect(task).toBeTruthy();
    expect(doingColumnId).toBeTruthy();

    await app.tasks.move({
      taskId: task!.id,
      columnId: doingColumnId!,
    });

    const stateBeforeReplay = structuredClone(app.getState().replay);
    await app.replay();
    const stateAfterReplay = structuredClone(app.getState().replay);

    expect(stateAfterReplay).toEqual(stateBeforeReplay);
  });

  it("hides non-readable tasks from other identities", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const storageKey = "test/v2/tasks-visibility";

    const ownerApp = createAppApi({
      identity: ownerIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await ownerApp.load();

    await ownerApp.tasks.create({
      title: "Owner-only task",
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

    expect(guestApp.tasks.all()).toHaveLength(0);
  });

  it("retro-decrypts historical permission tasks for newly granted members", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const storageKey = "test/v2/tasks-historical-permission-decrypt";
    const guestIdentityKey = toDidKeyFromPublicKey(guestIdentity.publicKey);

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
      title: "History Permission",
      scope: "tasks",
    });
    const permissionId = ownerApp.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();

    await ownerApp.tasks.create({
      title: "Historical private task",
      permissionId: permissionId!,
      audienceType: "permission",
      audienceId: permissionId!,
    });
    await ownerApp.commit();

    const guestBeforeGrant = createAppApi({
      identity: guestIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await guestBeforeGrant.load();
    expect(guestBeforeGrant.tasks.all()).toHaveLength(0);

    await ownerApp.permissions.grantFromUser({
      permissionId: permissionId!,
      identityKey: guestIdentityKey,
    });
    await ownerApp.commit();

    const guestAfterGrant = createAppApi({
      identity: guestIdentity,
      storage: createConcordLocalStorageAdapter({
        storage: sharedStorage,
        storageKey,
      }),
    });
    await guestAfterGrant.load();

    const historicalTasks = guestAfterGrant.tasks.all();
    expect(historicalTasks).toHaveLength(1);
    expect(historicalTasks[0]?.title).toBe("Historical private task");
  });
});
