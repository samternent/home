import { describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import type { LedgerContainer, LedgerStorageAdapter } from "@ternent/ledger";
import { createConcordApp } from "@ternent/concord";
import { supportsTaskProjection, taskPlugin, type TaskProjection } from "../src/index";

function createMemoryStorage(): LedgerStorageAdapter & {
  snapshot: { container: LedgerContainer | null; staged: unknown[] } | null;
} {
  return {
    name: "memory",
    snapshot: null,
    async load() {
      return this.snapshot;
    },
    async save(snapshot) {
      this.snapshot = structuredClone(snapshot);
    },
    async clear() {
      this.snapshot = null;
    },
  };
}

async function createTaskApp() {
  const identity = await createIdentity("2026-03-27T10:00:00.000Z");
  const storage = createMemoryStorage();
  const app = await createConcordApp({
    identity,
    storage,
    plugins: [taskPlugin()],
  });
  await app.load();
  return { app, storage };
}

describe("@ternent/concord-plugin-task", () => {
  it("replays an empty ledger as a compatible empty task projection", async () => {
    const { app } = await createTaskApp();
    const ledger = await app.exportLedger();

    expect(app.getReplayState<TaskProjection>("tasks")).toEqual({
      tasksById: {},
      orderedTaskIds: [],
      listsByStatus: {
        backlog: [],
        active: [],
        blocked: [],
        done: [],
      },
      countsByStatus: {
        backlog: 0,
        active: 0,
        blocked: 0,
        done: 0,
      },
    });
    expect(supportsTaskProjection(ledger)).toEqual({
      supported: true,
      reason: null,
      classification: "empty",
    });
    await app.destroy();
  });

  it("creates and replays tasks deterministically", async () => {
    const { app } = await createTaskApp();

    await app.command("task.create-item", {
      taskId: "task-1",
      title: "Write task plugin",
      notes: "First shipped projection",
    });
    await app.commit({
      metadata: {
        message: "Create first task",
      },
    });

    expect(app.getReplayState<TaskProjection>("tasks").tasksById["task-1"]).toMatchObject({
      taskId: "task-1",
      title: "Write task plugin",
      notes: "First shipped projection",
      status: "backlog",
      priority: "normal",
    });
    await app.destroy();
  });

  it("applies edits and preserves the latest task values", async () => {
    const { app } = await createTaskApp();

    await app.command("task.create-item", {
      taskId: "task-1",
      title: "Old title",
    });
    await app.commit();
    await app.command("task.edit-item", {
      taskId: "task-1",
      title: "New title",
      notes: "Latest notes",
      priority: "high",
    });
    await app.commit();

    const projection = app.getReplayState<TaskProjection>("tasks");
    expect(projection.tasksById["task-1"]).toMatchObject({
      title: "New title",
      notes: "Latest notes",
      priority: "high",
    });
    await app.destroy();
  });

  it("replays status transitions across the v1 task flow", async () => {
    const { app } = await createTaskApp();

    await app.command("task.create-item", {
      taskId: "task-1",
      title: "Ship Tasks",
    });
    await app.commit();
    await app.command("task.set-status", {
      taskId: "task-1",
      status: "active",
    });
    await app.commit();
    await app.command("task.set-status", {
      taskId: "task-1",
      status: "blocked",
    });
    await app.commit();
    await app.command("task.set-status", {
      taskId: "task-1",
      status: "done",
    });
    await app.commit();

    const projection = app.getReplayState<TaskProjection>("tasks");
    expect(projection.tasksById["task-1"]?.status).toBe("done");
    expect(projection.listsByStatus.done).toEqual(["task-1"]);
    await app.destroy();
  });

  it("detects mixed ledgers as unsupported for the task projection", async () => {
    const { app } = await createTaskApp();

    await app.command("task.create-item", {
      taskId: "task-1",
      title: "Ship Tasks",
    });
    await app.commit();

    const ledger = await app.exportLedger();
    ledger.entries["entry:other"] = {
      entryId: "entry:other",
      authoredAt: "2026-03-27T10:01:00.000Z",
      author: "did:key:test",
      kind: "note.item.created",
      meta: null,
      payload: {
        type: "plain",
        data: {
          noteId: "note-1",
        },
      },
    };

    expect(supportsTaskProjection(ledger)).toEqual({
      supported: false,
      reason: "Tasks currently supports empty or task-only ledgers.",
      classification: "mixed",
    });
    await app.destroy();
  });
});
