import { describe, expect, it } from "vitest";
import { recipientFromIdentity } from "@ternent/armour";
import { createIdentity } from "@ternent/identity";
import {
  createLedger,
  type LedgerContainer,
  type LedgerInstance,
  type LedgerReplayEntry,
  type LedgerStorageAdapter,
} from "@ternent/ledger";
import {
  ConcordBoundaryError,
  createConcordApp,
  type ConcordReplayMetadata,
  type ConcordReplayPlugin,
} from "../src/index.ts";

function createSequenceNow(values: string[]): () => string {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

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

function createTodoPlugin(): ConcordReplayPlugin<{
  items: Record<string, { id: string; title: string; completed: boolean }>;
}> {
  return {
    id: "todo",
    initialState() {
      return { items: {} };
    },
    commands: {
      "todo.create-item": async (_ctx, input: { id: string; title: string }) => ({
        kind: "todo.item.created",
        payload: input,
      }),
      "todo.complete-item": async (_ctx, input: { id: string }) => ({
        kind: "todo.item.completed",
        payload: input,
      }),
    },
    applyEntry(entry, ctx) {
      if (entry.kind === "todo.item.created" && entry.payload.type === "plain") {
        const payload = entry.payload.data as { id: string; title: string };
        ctx.setState((state) => {
          const current = state as {
            items: Record<string, { id: string; title: string; completed: boolean }>;
          };
          return {
            items: {
              ...current.items,
              [payload.id]: {
                id: payload.id,
                title: payload.title,
                completed: false,
              },
            },
          };
        });
        return;
      }

      if (
        entry.kind === "todo.item.completed" &&
        entry.payload.type === "plain"
      ) {
        const payload = entry.payload.data as { id: string };
        ctx.setState((state) => {
          const current = state as {
            items: Record<string, { id: string; title: string; completed: boolean }>;
          };
          const item = current.items[payload.id];
          if (!item) {
            return current;
          }

          return {
            items: {
              ...current.items,
              [payload.id]: {
                ...item,
                completed: true,
              },
            },
          };
        });
      }
    },
  };
}

function createAuditPlugin(): ConcordReplayPlugin<{ entryIds: string[] }> {
  return {
    id: "audit",
    initialState() {
      return { entryIds: [] };
    },
    applyEntry(entry, ctx) {
      ctx.setState((state) => ({
        entryIds: [...(state as { entryIds: string[] }).entryIds, entry.entryId],
      }));
    },
  };
}

function createSecretPlugin(): ConcordReplayPlugin<{ values: string[] }> {
  return {
    id: "secret",
    initialState() {
      return { values: [] };
    },
    commands: {
      "secret.write": async (
        _ctx,
        input: { text: string; recipients: string[] },
      ) => ({
        kind: "secret.created",
        payload: { text: input.text },
        protection: {
          type: "recipients",
          recipients: input.recipients,
          encoding: "armor",
        },
      }),
    },
    applyEntry(entry, ctx) {
      if (entry.kind !== "secret.created") {
        return;
      }

      ctx.setState((state) => {
        const current = state as { values: string[] };
        if (entry.payload.type === "decrypted") {
          const payload = entry.payload.data as { text: string };
          return {
            values: [...current.values, payload.text],
          };
        }

        return {
          values: [...current.values, entry.payload.type],
        };
      });
    },
  };
}

describe("@ternent/concord", () => {
  it("auto-creates on load, persists, and notifies once per completed operation", async () => {
    const identity = await createIdentity("2026-03-18T12:00:00.000Z");
    const storage = createMemoryStorage();
    const app = await createConcordApp({
      identity,
      storage,
      plugins: [createTodoPlugin(), createAuditPlugin()],
    });

    const notifications: boolean[] = [];
    app.subscribe((nextState) => {
      notifications.push(nextState.ready);
    });

    await app.load();

    expect(storage.snapshot).not.toBeNull();
    expect(app.getState().ready).toBe(true);
    expect(app.getState().integrityValid).toBe(true);
    expect(app.getState().stagedCount).toBe(0);
    expect(notifications).toEqual([true]);
  });

  it("stages multiple commands by default and commits them explicitly", async () => {
    const identity = await createIdentity("2026-03-18T12:00:00.000Z");
    const storage = createMemoryStorage();
    const app = await createConcordApp({
      identity,
      storage,
      plugins: [createTodoPlugin(), createAuditPlugin()],
    });

    const notifications: number[] = [];
    app.subscribe(() => {
      notifications.push(notifications.length + 1);
    });

    await app.load();

    const first = await app.command("todo.create-item", {
      id: "todo-1",
      title: "Buy milk",
    });
    const second = await app.command("todo.create-item", {
      id: "todo-2",
      title: "Buy oats",
    });

    expect(first.commitId).toBeUndefined();
    expect(first.stagedCount).toBe(1);
    expect(second.commitId).toBeUndefined();
    expect(second.stagedCount).toBe(2);
    expect(notifications).toHaveLength(3);
    expect(app.getState().stagedCount).toBe(2);
    expect(app.getReplayState("todo")).toEqual({
      items: {
        "todo-1": {
          id: "todo-1",
          title: "Buy milk",
          completed: false,
        },
        "todo-2": {
          id: "todo-2",
          title: "Buy oats",
          completed: false,
        },
      },
    });
    expect(Object.keys((await app.exportLedger()).entries)).toHaveLength(0);

    const commit = await app.commit({
      metadata: {
        message: "Create first todo batch",
      },
    });

    expect(commit.entryIds).toHaveLength(2);
    expect(app.getState().stagedCount).toBe(0);
    expect(app.getState().integrityValid).toBe(true);
    expect(notifications).toHaveLength(4);
    expect(app.getReplayState<{ entryIds: string[] }>("audit").entryIds).toHaveLength(2);

    const exported = await app.exportLedger();
    expect(Object.keys(exported.entries)).toHaveLength(2);
    expect(exported.commits[commit.commitId]?.metadata).toEqual({
      message: "Create first todo batch",
    });
  });

  it("can still auto-commit when explicitly configured, but it is not the default", async () => {
    const identity = await createIdentity("2026-03-18T12:05:00.000Z");
    const storage = createMemoryStorage();
    const ledger = await createLedger<LedgerReplayEntry[]>({
      identity: {
        signer: { identity },
        authorResolver: () => "did:bob",
      },
      initialProjection: [],
      projector: (entries, entry) => [...entries, entry],
      storage,
      autoCommit: false,
    });

    const app = await createConcordApp({
      identity,
      plugins: [createTodoPlugin()],
      ledger,
      policy: {
        autoCommit: true,
      },
    });

    await app.load();
    const result = await app.command("todo.create-item", {
      id: "todo-2",
      title: "Commit me",
    });

    expect(result.commitId).toEqual(expect.any(String));
    expect(result.stagedCount).toBe(0);
    expect(app.getState().integrityValid).toBe(true);
    expect(ledger.getState().staged).toHaveLength(0);
    expect(Object.keys((await app.exportLedger()).entries)).toHaveLength(1);
  });

  it("uses a single injected clock for command context and internal ledger timing", async () => {
    const identity = await createIdentity("2026-03-18T12:07:00.000Z");
    const now = createSequenceNow([
      "2026-03-18T12:07:00.000Z",
      "2026-03-18T12:07:01.000Z",
      "2026-03-18T12:07:02.000Z",
      "2026-03-18T12:07:03.000Z",
    ]);
    const storage = createMemoryStorage();
    const app = await createConcordApp({
      identity,
      now,
      storage,
      plugins: [
        {
          id: "clock",
          initialState() {
            return { timestamps: [] as string[] };
          },
          commands: {
            "clock.tick": async (ctx) => ({
              kind: "clock.ticked",
              payload: {
                observedAt: ctx.now(),
                actorKeyId: ctx.identity.keyId,
              },
            }),
          },
          applyEntry(entry, ctx) {
            if (entry.kind !== "clock.ticked" || entry.payload.type !== "plain") {
              return;
            }

            ctx.setState((state) => ({
              timestamps: [
                ...(state as { timestamps: string[] }).timestamps,
                String(
                  (
                    entry.payload.data as {
                      observedAt: string;
                      actorKeyId: string;
                    }
                  ).observedAt,
                ),
              ],
            }));
          },
        },
      ],
    });

    await app.load();
    const staged = await app.command("clock.tick", undefined);
    const commit = await app.commit({
      metadata: {
        message: "Tick clock",
      },
    });

    const exported = await app.exportLedger();
    const [entryId] = Object.keys(exported.entries);

    expect(staged.stagedCount).toBe(1);
    expect(commit.entryIds).toEqual([entryId]);
    expect(app.getReplayState<{ timestamps: string[] }>("clock").timestamps).toEqual([
      "2026-03-18T12:07:01.000Z",
    ]);
    expect(exported.entries[entryId]?.authoredAt).toBe("2026-03-18T12:07:02.000Z");
    expect(exported.commits[commit.commitId]?.committedAt).toBe(
      "2026-03-18T12:07:03.000Z",
    );
  });

  it("create replaces currently loaded replay state in memory", async () => {
    const identity = await createIdentity("2026-03-18T12:10:00.000Z");
    const storage = createMemoryStorage();
    const app = await createConcordApp({
      identity,
      storage,
      plugins: [createTodoPlugin()],
    });

    await app.load();
    await app.command("todo.create-item", {
      id: "todo-3",
      title: "Reset me",
    });

    expect(
      app.getReplayState<{ items: Record<string, { title: string }> }>("todo").items[
        "todo-3"
      ]?.title,
    ).toBe("Reset me");

    await app.create();

    expect(app.getReplayState<{ items: Record<string, unknown> }>("todo").items).toEqual(
      {},
    );
    expect(app.getState().integrityValid).toBe(true);
  });

  it("lets replay plugins buffer external materialization and publish in endReplay", async () => {
    const identity = await createIdentity("2026-03-18T12:15:00.000Z");
    const storage = createMemoryStorage();
    const source = await createConcordApp({
      identity,
      storage,
      plugins: [createTodoPlugin()],
    });

    await source.load();
    await source.command("todo.create-item", {
      id: "todo-a",
      title: "A",
    });
    await source.command("todo.create-item", {
      id: "todo-b",
      title: "B",
    });
    await source.commit({
      metadata: {
        message: "Commit imported todos",
      },
    });

    const events: string[] = [];
    let working: string[] = [];
    let published: string[] = ["stale"];
    const materializer: ConcordReplayPlugin<undefined> = {
      id: "memory-index",
      reset() {
        events.push("reset");
        working = [];
      },
      beginReplay(ctx) {
        events.push(`begin:${ctx.replay.entryCount}`);
      },
      applyEntry(entry) {
        events.push(`apply:${entry.entryId}`);
        working.push(entry.entryId);
      },
      endReplay() {
        events.push("end");
        published = [...working];
      },
    };

    const targetApp = await createConcordApp({
      identity,
      storage: createMemoryStorage(),
      plugins: [createTodoPlugin(), materializer],
    });

    await targetApp.importLedger(await source.exportLedger());

    expect(events).toEqual([
      "reset",
      "begin:2",
      expect.stringMatching(/^apply:/),
      expect.stringMatching(/^apply:/),
      "end",
    ]);
    expect(published).toHaveLength(2);
    expect(published).not.toEqual(["stale"]);
  });

  it("fails the operation when a replay plugin throws in beginReplay and does not publish partial state", async () => {
    const identity = await createIdentity("2026-03-18T12:20:00.000Z");
    const storage = createMemoryStorage();
    const app = await createConcordApp({
      identity,
      storage,
      plugins: [
        createTodoPlugin(),
        {
          id: "broken",
          beginReplay() {
            throw new Error("plugin begin failed");
          },
        },
      ],
    });

    const notifications: number[] = [];
    app.subscribe(() => {
      notifications.push(notifications.length + 1);
    });

    await expect(app.load()).rejects.toThrow("plugin begin failed");
    expect(notifications).toHaveLength(0);
    expect(app.getState().ready).toBe(false);
    expect(app.getReplayState<{ items: Record<string, unknown> }>("todo").items).toEqual(
      {},
    );
  });

  it("keeps the last published state untouched when a replay plugin throws in applyEntry", async () => {
    const identity = await createIdentity("2026-03-18T12:20:00.000Z");
    const storage = createMemoryStorage();
    let shouldThrow = false;
    const app = await createConcordApp({
      identity,
      storage,
      plugins: [
        createTodoPlugin(),
        {
          id: "broken",
          applyEntry(entry) {
            if (shouldThrow && entry.kind === "todo.item.created") {
              throw new Error("plugin apply failed");
            }
          },
        },
      ],
    });

    await app.load();
    await app.command("todo.create-item", {
      id: "todo-good",
      title: "Safe state",
    });
    await app.commit({
      metadata: {
        message: "Initial good state",
      },
    });

    const before = structuredClone(
      app.getReplayState<{ items: Record<string, { title: string }> }>("todo"),
    );
    shouldThrow = true;

    await expect(
      app.command("todo.create-item", {
        id: "todo-bad",
        title: "Break replay",
      }),
    ).rejects.toThrow("plugin apply failed");

    expect(app.getReplayState("todo")).toEqual(before);
    expect(app.getState().stagedCount).toBe(0);
    expect(Object.keys((await app.exportLedger()).entries)).toHaveLength(1);
  });

  it("keeps the last published state untouched when a replay plugin throws in endReplay", async () => {
    const identity = await createIdentity("2026-03-18T12:22:00.000Z");
    const storage = createMemoryStorage();
    const source = await createConcordApp({
      identity,
      storage,
      plugins: [createTodoPlugin()],
    });

    await source.load();
    await source.command("todo.create-item", {
      id: "todo-end",
      title: "End fails",
    });
    await source.commit({
      metadata: {
        message: "Commit end failure source",
      },
    });

    let shouldThrow = false;
    const target = await createConcordApp({
      identity,
      storage: createMemoryStorage(),
      plugins: [
        createTodoPlugin(),
        {
          id: "broken",
          endReplay() {
            if (shouldThrow) {
              throw new Error("plugin end failed");
            }
          },
        },
      ],
    });

    await target.load();
    const before = structuredClone(target.getState());
    shouldThrow = true;

    await expect(target.importLedger(await source.exportLedger())).rejects.toThrow(
      "plugin end failed",
    );

    expect(target.getState()).toEqual(before);
  });

  it("notifies subscribers with a final reset state on destroy, then clears listeners", async () => {
    const identity = await createIdentity("2026-03-18T12:23:00.000Z");
    const storage = createMemoryStorage();
    const app = await createConcordApp({
      identity,
      storage,
      plugins: [createTodoPlugin()],
    });

    const notifications: boolean[] = [];
    app.subscribe((nextState) => {
      notifications.push(nextState.ready);
    });

    await app.load();
    await app.destroy();

    expect(notifications).toEqual([true, false]);
    expect(app.getState().ready).toBe(false);
    expect(app.getState().integrityValid).toBe(false);
    expect(app.getReplayState<{ items: Record<string, unknown> }>("todo").items).toEqual(
      {},
    );
  });

  it("fails fast when internal ledger requirements are missing", async () => {
    await expect(
      createConcordApp({
        identity: { keyId: "" } as never,
        storage: createMemoryStorage(),
        plugins: [createTodoPlugin()],
      }),
    ).rejects.toMatchObject({
      name: "ConcordBoundaryError",
      code: "INVALID_IDENTITY",
    });
  });

  it("fails fast when a supplied ledger does not replay LedgerReplayEntry[]", async () => {
    const fakeLedger = {
      async create() {},
      async load() {},
      async loadFromStorage() {
        return false;
      },
      async append() {
        throw new Error("not used");
      },
      async appendMany() {
        throw new Error("not used");
      },
      async commit() {
        throw new Error("not used");
      },
      async replay() {
        return { invalid: true };
      },
      async recompute() {
        return { invalid: true };
      },
      async verify() {
        return {
          valid: true,
          committedHistoryValid: true,
          commitChainValid: true,
          commitProofsValid: true,
          entriesValid: true,
          entryProofsValid: true,
          payloadHashesValid: true,
          proofsValid: true,
          invalidCommitIds: [],
          invalidEntryIds: [],
        };
      },
      async export() {
        throw new Error("not used");
      },
      async import() {},
      getState() {
        return {
          container: null,
          staged: [],
          projection: { invalid: true },
          verification: null,
        };
      },
      subscribe() {
        return () => {};
      },
      async clearStaged() {},
      async destroy() {},
    } as unknown as LedgerInstance<LedgerReplayEntry[]>;

    const app = await createConcordApp({
      identity: await createIdentity("2026-03-18T12:24:00.000Z"),
      storage: createMemoryStorage(),
      plugins: [createTodoPlugin()],
      ledger: fakeLedger,
    });

    await expect(app.load()).rejects.toMatchObject({
      name: "ConcordBoundaryError",
      code: "INVALID_LEDGER_PROJECTION",
    });
    expect(app.getState().ready).toBe(false);
    expect(app.getState().integrityValid).toBe(false);
  });

  it("replays encrypted entries as decrypted using identity-derived decrypt capability", async () => {
    const identity = await createIdentity("2026-03-18T12:25:00.000Z");
    const recipient = await recipientFromIdentity(identity);
    const encryptedApp = await createConcordApp({
      identity,
      storage: createMemoryStorage(),
      plugins: [createSecretPlugin()],
    });

    await encryptedApp.load();
    await encryptedApp.command("secret.write", {
      text: "secret note",
      recipients: [recipient],
    });
    await encryptedApp.commit({
      metadata: {
        message: "Commit secret note",
      },
    });

    expect(encryptedApp.getReplayState<{ values: string[] }>("secret").values).toEqual([
      "secret note",
    ]);
  });

  it("marks imported corrupted history as globally invalid and does not project it", async () => {
    const identity = await createIdentity("2026-03-18T12:30:00.000Z");
    const source = await createConcordApp({
      identity,
      storage: createMemoryStorage(),
      plugins: [createTodoPlugin()],
    });

    await source.load();
    await source.command("todo.create-item", {
      id: "todo-5",
      title: "Verify me",
    });
    await source.commit({
      metadata: {
        message: "Commit verification example",
      },
    });

    const tampered = structuredClone(await source.exportLedger());
    const [entryId] = Object.keys(tampered.entries);
    tampered.entries[entryId] = {
      ...tampered.entries[entryId],
      payload: {
        type: "plain",
        data: { id: "todo-5", title: "tampered" },
      },
    };

    const target = await createConcordApp({
      identity,
      storage: createMemoryStorage(),
      plugins: [createTodoPlugin()],
    });

    await target.importLedger(tampered);

    expect(target.getState().ready).toBe(false);
    expect(target.getState().integrityValid).toBe(false);
    expect(target.getReplayState<{ items: Record<string, unknown> }>("todo").items).toEqual(
      {},
    );
    expect(target.getState().verification?.valid).toBe(false);
    expect(target.getState().verification?.committedHistoryValid).toBe(false);

    const verification = await target.verify();

    expect(verification.valid).toBe(false);
    expect(verification.committedHistoryValid).toBe(false);
    expect(target.getState().verification).toEqual(verification);
    expect(() => target.getReplayState("missing")).toThrow(ConcordBoundaryError);
  });

  it("passes ranged replay metadata to replay plugins", async () => {
    const identity = await createIdentity("2026-03-18T12:35:00.000Z");
    const storage = createMemoryStorage();
    const seen: ConcordReplayMetadata[] = [];
    const app = await createConcordApp({
      identity,
      storage,
      plugins: [
        createTodoPlugin(),
        {
          id: "range-probe",
          applyEntry(_entry, ctx) {
            seen.push(structuredClone(ctx.replay));
          },
        },
      ],
    });

    await app.load();
    await app.command("todo.create-item", {
      id: "todo-r1",
      title: "One",
    });
    await app.command("todo.create-item", {
      id: "todo-r2",
      title: "Two",
    });
    const commit = await app.commit({
      metadata: {
        message: "Range probe",
      },
    });

    const exported = await app.exportLedger();
    const [firstEntryId, secondEntryId] = commit.entryIds;
    expect(Object.keys(exported.entries)).toEqual([firstEntryId, secondEntryId]);

    seen.length = 0;
    await app.replay({
      fromEntryId: secondEntryId,
      toEntryId: secondEntryId,
    });

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      phase: "applyEntry",
      entryIndex: 0,
      entryCount: 1,
      fromEntryId: secondEntryId,
      toEntryId: secondEntryId,
      isPartial: true,
    });
  });
});
