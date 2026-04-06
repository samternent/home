import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createIdentity, deriveAgeRecipient, serializeIdentity } from "@ternent/identity";

let mockTasksRuntime: any;
let mockProjectionState: any;
let mockApp: any;
let mockIdentityService: any;

vi.mock("@/modules/run/tasks/useRunTasksRuntime", () => ({
  useRunTasksRuntime: () => mockTasksRuntime,
}));

vi.mock("@/modules/run/replay", () => ({
  useRunProjectionState: () => mockProjectionState,
}));

vi.mock("@/modules/run/identity", () => ({
  useRunIdentityService: () => mockIdentityService,
}));

async function loadTaskActions() {
  vi.resetModules();
  return await import("@/modules/run/services/useRunTaskActions");
}

describe("run task actions", () => {
  beforeEach(async () => {
    const localIdentity = await createIdentity("2026-03-28T00:00:00.000Z");
    mockApp = {
      command: vi.fn(async () => ({
        entryIds: ["entry:1"],
        stagedCount: 1,
      })),
      getState: vi.fn(() => ({
        stagedCount: 0,
      })),
      clearStaged: vi.fn(async () => undefined),
      commit: vi.fn(async () => ({
        commitId: "commit:1",
        entryIds: ["entry:1"],
      })),
    };
    mockIdentityService = {
      identities: computed(() => [
        {
          id: localIdentity.keyId,
          identity: localIdentity,
          profile: {
            label: "Sam Ternent",
          },
        },
      ]),
    };
    mockTasksRuntime = {
      mode: ref("interactive"),
      ensureReady: vi.fn(async () => true),
      app: computed(() => mockApp),
    };
    mockProjectionState = {
      activeProjection: computed(() => ({
        id: "projection:1",
        readiness: {
          inspectable: true,
          interactive: mockTasksRuntime.mode.value === "interactive",
        },
        taskSupport: {
          supported: true,
          reason: null,
          classification: "task-document",
        },
      })),
    };
  });

  it("stages task creation through the active tasks runtime", async () => {
    const { useRunTaskActions } = await loadTaskActions();
    const actions = useRunTaskActions();

    const result = await actions.createTask({
      title: "Ship Tasks",
      notes: "First hosted app",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.taskId).toMatch(/^task:/);
    }

    expect(mockTasksRuntime.ensureReady).toHaveBeenCalledTimes(1);
    expect(mockApp.command).toHaveBeenCalledWith(
      "task.create-item",
      expect.objectContaining({
        title: "Ship Tasks",
        notes: "First hosted app",
      }),
    );
    expect(mockApp.commit).not.toHaveBeenCalled();
  });

  it("fails closed when Tasks is inspect-only", async () => {
    mockTasksRuntime.mode = ref("inspect");

    const { useRunTaskActions } = await loadTaskActions();
    const result = await useRunTaskActions().setTaskStatus({
      taskId: "task:1",
      status: "done",
    });

    expect(result).toEqual({
      ok: false,
      error: "You're viewing this task document read-only. Add identity to make changes.",
    });
  });

  it("imports a user from a serialized identity document", async () => {
    const identity = await createIdentity("2026-03-28T00:00:00.000Z");
    const { useRunTaskActions } = await loadTaskActions();
    const result = await useRunTaskActions().createTaskUser({
      name: "Sam Ternent",
      serializedIdentity: serializeIdentity(identity),
    });

    expect(result.ok).toBe(true);
    expect(mockApp.command).toHaveBeenCalledWith(
      "taskuser.upsert",
      expect.objectContaining({
        userId: `user:${identity.keyId}`,
        name: "Sam Ternent",
        publicIdentityKey: identity.publicKey,
      }),
    );
    expect(mockApp.commit).not.toHaveBeenCalled();
  });

  it("grants a permission to a local identity", async () => {
    const expectedRecipient = await deriveAgeRecipient(
      mockIdentityService.identities.value[0].identity,
    );
    const { useRunTaskActions } = await loadTaskActions();
    const result = await useRunTaskActions().grantTaskPermission({
      permissionId: "permission:maintainers",
      userId: `user:${mockIdentityService.identities.value[0].identity.keyId}`,
    });

    expect(result.ok).toBe(true);
    expect(mockApp.command).toHaveBeenCalledWith(
      "taskpermission.grant-access",
      expect.objectContaining({
        permissionId: "permission:maintainers",
        userId: `user:${mockIdentityService.identities.value[0].identity.keyId}`,
        recipient: expectedRecipient,
      }),
    );
  });

  it("commits staged changes explicitly with a message", async () => {
    const { useRunTaskActions } = await loadTaskActions();
    const result = await useRunTaskActions().commitStaged("Bundle demo updates");

    expect(result).toEqual({
      ok: true,
      value: {
        commitId: "commit:1",
        entryIds: ["entry:1"],
      },
    });
    expect(mockApp.commit).toHaveBeenCalledWith({
      metadata: {
        message: "Bundle demo updates",
      },
    });
  });

  it("clears staged changes explicitly", async () => {
    mockApp.getState.mockReturnValue({
      stagedCount: 0,
    });

    const { useRunTaskActions } = await loadTaskActions();
    const result = await useRunTaskActions().discardStaged();

    expect(result).toEqual({
      ok: true,
      value: {
        stagedCount: 0,
      },
    });
    expect(mockApp.clearStaged).toHaveBeenCalledTimes(1);
  });
});
