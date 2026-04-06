import { describe, expect, it, vi } from "vitest";
import { createIdentity, deriveAgeRecipient } from "@ternent/identity";
import { taskPlugin } from "@/modules/run/tasks/plugin";
import { createEmptyTaskProjection } from "@/modules/run/tasks/state";
import {
  createTaskPermissionKey,
  isProtectedTaskPayloadEnvelope,
} from "@/modules/run/tasks/crypto";
import type { TaskProjection } from "@/modules/run/tasks/types";

function createCommandContext(projection: TaskProjection, identity: any) {
  return {
    now() {
      return "2026-03-28T00:00:00.000Z";
    },
    identity,
    getReplayState<T>() {
      return projection as T;
    },
  };
}

function createReplayContext(projection: TaskProjection) {
  let state = projection;
  const replay = {
    phase: "idle" as "idle" | "applyEntry",
    entryIndex: 0,
    entryCount: 0,
    isPartial: false,
  };

  return {
    getState() {
      return state;
    },
    setState(next: TaskProjection | ((prev: TaskProjection) => TaskProjection)) {
      state = typeof next === "function" ? next(state) : next;
    },
    replay,
    get value() {
      return state;
    },
  };
}

describe("task plugin protection", () => {
  it("creates permission keys without relying on Buffer globals", () => {
    vi.stubGlobal("Buffer", undefined);

    try {
      const permissionKey = createTaskPermissionKey();
      expect(permissionKey).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(permissionKey.length).toBeGreaterThan(20);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("creates a permission and auto-grants the creator", async () => {
    const identity = await createIdentity("2026-03-28T00:00:00.000Z");
    const plugin = taskPlugin({ activeIdentity: identity });

    const result = await plugin.commands!["taskpermission.create-group"](
      createCommandContext(createEmptyTaskProjection(), identity) as never,
      {
        permissionId: "permission:maintainers",
        title: "Maintainers",
      },
    );

    expect(Array.isArray(result)).toBe(true);
    const entries = result as Array<{ kind: string; payload: unknown }>;
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      kind: "task.permission.created",
      payload: {
        permissionId: "permission:maintainers",
        title: "Maintainers",
      },
    });
    expect(entries[1]).toMatchObject({
      kind: "task.permission-grant.created",
      payload: {
        permissionId: "permission:maintainers",
        userId: `user:${identity.keyId}`,
        keyEncoding: "armor",
      },
    });
    expect((entries[1] as { payload: { wrappedPermissionKey: string } }).payload.wrappedPermissionKey)
      .toContain("BEGIN AGE ENCRYPTED FILE");
  });

  it("encrypts task entries to the permission key instead of recipient protection", async () => {
    const identity = await createIdentity("2026-03-28T00:00:00.000Z");
    const plugin = taskPlugin({ activeIdentity: identity });
    const projection: TaskProjection = {
      ...createEmptyTaskProjection(),
      permissionsById: {
        "permission:maintainers": {
          permissionId: "permission:maintainers",
          title: "Maintainers",
          scope: "document",
          createdAt: "2026-03-28T00:00:00.000Z",
          updatedAt: "2026-03-28T00:00:00.000Z",
        },
      },
      orderedPermissionIds: ["permission:maintainers"],
      permissionKeysById: {
        "permission:maintainers": createTaskPermissionKey(),
      },
      accessiblePermissionIds: ["permission:maintainers"],
    };

    const result = await plugin.commands!["task.create-item"](
      createCommandContext(projection, identity) as never,
      {
        taskId: "task:1",
        title: "Protected task",
        permissionId: "permission:maintainers",
      },
    );

    expect(result).toMatchObject({
      kind: "task.item.created",
    });
    expect("protection" in result).toBe(false);
    expect(isProtectedTaskPayloadEnvelope((result as { payload: unknown }).payload)).toBe(true);
  });

  it("replays protected task entries only when the active identity can unwrap the permission key", async () => {
    const identity = await createIdentity("2026-03-28T00:00:00.000Z");
    const creatorPlugin = taskPlugin({ activeIdentity: identity });
    const creatorProjection = createEmptyTaskProjection();

    const permissionEntries = await creatorPlugin.commands!["taskpermission.create-group"](
      createCommandContext(creatorProjection, identity) as never,
      {
        permissionId: "permission:maintainers",
        title: "Maintainers",
      },
    ) as Array<{ kind: string; payload: unknown }>;

    const replayCtx = createReplayContext(createEmptyTaskProjection());
    for (const entry of permissionEntries) {
      await creatorPlugin.applyEntry!(
        {
          entryId: crypto.randomUUID(),
          kind: entry.kind,
          author: identity.publicKey,
          authoredAt: "2026-03-28T00:00:00.000Z",
          meta: null,
          verified: true,
          payload: {
            type: "plain",
            data: entry.payload,
          },
        } as never,
        replayCtx as never,
      );
    }

    const createTaskEntry = await creatorPlugin.commands!["task.create-item"](
      createCommandContext(replayCtx.value, identity) as never,
      {
        taskId: "task:1",
        title: "Protected task",
        permissionId: "permission:maintainers",
      },
    ) as { kind: string; payload: unknown };

    await creatorPlugin.applyEntry!(
      {
        entryId: "entry:task",
        kind: createTaskEntry.kind,
        author: identity.publicKey,
        authoredAt: "2026-03-28T00:01:00.000Z",
        meta: null,
        verified: true,
        payload: {
          type: "plain",
          data: createTaskEntry.payload,
        },
      } as never,
      replayCtx as never,
    );

    expect(replayCtx.value.tasksById["task:1"]).toMatchObject({
      taskId: "task:1",
      title: "Protected task",
      permissionId: "permission:maintainers",
    });

    const unauthorizedPlugin = taskPlugin();
    const unauthorizedCtx = createReplayContext(createEmptyTaskProjection());

    for (const entry of permissionEntries) {
      await unauthorizedPlugin.applyEntry!(
        {
          entryId: crypto.randomUUID(),
          kind: entry.kind,
          author: identity.publicKey,
          authoredAt: "2026-03-28T00:00:00.000Z",
          meta: null,
          verified: true,
          payload: {
            type: "plain",
            data: entry.payload,
          },
        } as never,
        unauthorizedCtx as never,
      );
    }

    await unauthorizedPlugin.applyEntry!(
      {
        entryId: "entry:task",
        kind: createTaskEntry.kind,
        author: identity.publicKey,
        authoredAt: "2026-03-28T00:01:00.000Z",
        meta: null,
        verified: true,
        payload: {
          type: "plain",
          data: createTaskEntry.payload,
        },
      } as never,
      unauthorizedCtx as never,
    );

    expect(unauthorizedCtx.value.tasksById["task:1"]).toBeUndefined();
    expect(unauthorizedCtx.value.hiddenProtectedTaskCount).toBe(1);
    expect(
      unauthorizedCtx.value.hiddenProtectedByPermissionId[
        "permission:maintainers"
      ],
    ).toMatchObject({
      taskCount: 1,
      updateCount: 0,
    });
  });

  it("replays older protected tasks after a later permission grant", async () => {
    const owner = await createIdentity("2026-03-28T00:00:00.000Z");
    const member = await createIdentity("2026-03-28T00:02:00.000Z");
    const ownerPlugin = taskPlugin({ activeIdentity: owner });

    const ownerCtx = createReplayContext(createEmptyTaskProjection());
    const permissionEntries = await ownerPlugin.commands!["taskpermission.create-group"](
      createCommandContext(createEmptyTaskProjection(), owner) as never,
      {
        permissionId: "permission:maintainers",
        title: "Maintainers",
      },
    ) as Array<{ kind: string; payload: unknown }>;

    for (const entry of permissionEntries) {
      await ownerPlugin.applyEntry!(
        {
          entryId: crypto.randomUUID(),
          kind: entry.kind,
          author: owner.publicKey,
          authoredAt: "2026-03-28T00:00:00.000Z",
          meta: null,
          verified: true,
          payload: {
            type: "plain",
            data: entry.payload,
          },
        } as never,
        ownerCtx as never,
      );
    }

    await ownerPlugin.applyEntry!(
      {
        entryId: "entry:user-member",
        kind: "task.user.upserted",
        author: owner.publicKey,
        authoredAt: "2026-03-28T00:00:30.000Z",
        meta: null,
        verified: true,
        payload: {
          type: "plain",
          data: {
            userId: `user:${member.keyId}`,
            name: "Member",
            publicIdentityKey: member.publicKey,
            publicEncryptionKey: await deriveAgeRecipient(member),
          },
        },
      } as never,
      ownerCtx as never,
    );

    const protectedTaskEntry = await ownerPlugin.commands!["task.create-item"](
      createCommandContext(ownerCtx.value, owner) as never,
      {
        taskId: "task:retro",
        title: "Protected before grant",
        permissionId: "permission:maintainers",
      },
    ) as { kind: string; payload: unknown };

    const grantEntry = await ownerPlugin.commands!["taskpermission.grant-access"](
      createCommandContext(ownerCtx.value, owner) as never,
      {
        permissionGrantId: "permission-grant:retro",
        permissionId: "permission:maintainers",
        userId: `user:${member.keyId}`,
        recipient: await deriveAgeRecipient(member),
      },
    ) as { kind: string; payload: unknown };

    const memberPlugin = taskPlugin({ activeIdentity: member });
    const memberReplay = createReplayContext(createEmptyTaskProjection());
    const replayEntries = [
      permissionEntries[0],
      protectedTaskEntry,
      {
        kind: "task.user.upserted",
        payload: {
          userId: `user:${member.keyId}`,
          name: "Member",
          publicIdentityKey: member.publicKey,
          publicEncryptionKey: await deriveAgeRecipient(member),
        },
      },
      grantEntry,
    ];

    await memberPlugin.beginReplay!(memberReplay as never);
    memberReplay.replay.phase = "applyEntry";
    memberReplay.replay.entryCount = replayEntries.length;

    for (const [entryIndex, entry] of replayEntries.entries()) {
      memberReplay.replay.entryIndex = entryIndex;
      await memberPlugin.applyEntry!(
        {
          entryId: crypto.randomUUID(),
          kind: entry.kind,
          author: owner.publicKey,
          authoredAt: "2026-03-28T00:03:00.000Z",
          meta: null,
          verified: true,
          payload: {
            type: "plain",
            data: entry.payload,
          },
        } as never,
        memberReplay as never,
      );
    }

    memberReplay.replay.phase = "idle";
    await memberPlugin.endReplay!(memberReplay as never);

    expect(memberReplay.value.tasksById["task:retro"]).toMatchObject({
      taskId: "task:retro",
      title: "Protected before grant",
      permissionId: "permission:maintainers",
    });
    expect(memberReplay.value.accessiblePermissionIds).toContain("permission:maintainers");
  });
});
