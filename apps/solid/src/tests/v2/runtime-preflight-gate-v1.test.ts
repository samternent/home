import { describe, expect, it, vi } from "vitest";
import type { ConcordReplayPlugin } from "@ternent/concord";
import { createIdentity } from "@ternent/identity";
import { createAppApi } from "@/app/api";
import { createApp, createConcordLocalStorageAdapter, type LocalStorageLike } from "@/app/runtime";
import {
  createPermissionsPlugin,
  createProfilesPlugin,
  createRuntimeReplayContext,
  createTasksPlugin,
  createUsersPlugin,
  hasActivePermissionMembership,
  hasHistoricalPermissionGrant,
  type PermissionsState,
} from "@/app/plugins";

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

describe("runtime preflight gate v1", () => {
  it("runs replay in system phase before workspace phase", async () => {
    const storage = createMemoryStorage();
    const replayContext = createRuntimeReplayContext();
    const phases: string[] = [];

    const probePlugin: ConcordReplayPlugin<Record<string, unknown>> = {
      id: "probe",
      initialState: () => ({}),
      commands: {
        "probe.create": async () => ({
          kind: "probe.create",
          payload: {
            value: 1,
          },
        }),
      },
      applyEntry() {
        phases.push(replayContext.isSystemPhase() ? "system" : "workspace");
      },
    };

    const runtime = await createApp({
      identity: await createIdentity("2026-04-20T10:00:00.000Z"),
      storage: createConcordLocalStorageAdapter({ storage, storageKey: "test/v2/preflight-replay-order" }),
      plugins: [{ plugin: probePlugin }],
      replayContext,
    });

    await runtime.loadWithReplayPipeline();
    await runtime.command("probe.create", {});
    phases.splice(0, phases.length);
    await runtime.replayPipeline({ replay: { reason: "manual" } });

    expect(phases.length).toBeGreaterThanOrEqual(2);
    const firstSystem = phases.indexOf("system");
    const firstWorkspace = phases.indexOf("workspace");

    expect(firstSystem).toBeGreaterThanOrEqual(0);
    expect(firstWorkspace).toBeGreaterThan(firstSystem);
  });

  it("hides privacy-group metadata from non-members", async () => {
    const sharedStorage = createMemoryStorage();
    const ownerIdentity = await createIdentity("2026-04-20T10:00:00.000Z");
    const guestIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const storageKey = "test/v2/preflight-privacy-hidden";

    const ownerApp = createAppApi({
      identity: ownerIdentity,
      storage: createConcordLocalStorageAdapter({ storage: sharedStorage, storageKey }),
    });
    await ownerApp.load();

    await ownerApp.permissions.create({ title: "Owners" });
    await ownerApp.commit();

    const guestApp = createAppApi({
      identity: guestIdentity,
      storage: createConcordLocalStorageAdapter({ storage: sharedStorage, storageKey }),
    });
    await guestApp.load();

    expect(guestApp.permissions.all()).toHaveLength(0);
  });

  it("keeps historical grant and active membership as separate states", async () => {
    const storage = createMemoryStorage();
    const app = createAppApi({
      identity: await createIdentity("2026-04-20T10:00:00.000Z"),
      storage: createConcordLocalStorageAdapter({ storage, storageKey: "test/v2/preflight-membership-split" }),
    });
    await app.load();

    const actor = await app.identity.ensureActiveIdentity();
    await app.permissions.create({ title: "Editors" });
    const permissionId = app.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();

    let state = app.getPluginState<PermissionsState>("permissions");
    expect(hasHistoricalPermissionGrant(state, permissionId!, actor.identityKey)).toBe(true);
    expect(hasActivePermissionMembership(state, permissionId!, actor.identityKey)).toBe(true);

    await app.permissions.revoke({ permissionId: permissionId!, memberId: actor.identityKey });

    state = app.getPluginState<PermissionsState>("permissions");
    expect(hasHistoricalPermissionGrant(state, permissionId!, actor.identityKey)).toBe(true);
    expect(hasActivePermissionMembership(state, permissionId!, actor.identityKey)).toBe(false);
  });

  it("routes task privacy checks through runtime privacy service", async () => {
    const storage = createMemoryStorage();
    const replayContext = createRuntimeReplayContext();
    const canWriteSpy = vi.fn(() => false);

    const tasksPlugin = createTasksPlugin({
      replayContext,
      privacyService: {
        resolveProtection: async () => ({ type: "none" }),
        canReadAudience: () => true,
        canWriteAudience: (...args) => canWriteSpy(...args),
        listReadableAudiences: () => [],
        getReplayDecryptionKeys: () => [],
      },
    });

    const app = createAppApi({
      identity: await createIdentity("2026-04-20T10:00:00.000Z"),
      storage: createConcordLocalStorageAdapter({ storage, storageKey: "test/v2/preflight-tasks-privacy" }),
      plugins: [
        createUsersPlugin(),
        createProfilesPlugin(),
        createPermissionsPlugin({ replayContext }),
        tasksPlugin,
      ],
    });

    await app.load();

    await app.permissions.create({ title: "Scoped", scope: "tasks" });
    const permissionId = app.permissions.all().at(0)?.id;
    expect(permissionId).toBeTruthy();

    await expect(
      app.tasks.create({
        title: "Denied task",
        permissionId: permissionId!,
        audienceType: "permission",
        audienceId: permissionId!,
      }),
    ).rejects.toThrow("Actor does not have permission access");

    expect(canWriteSpy).toHaveBeenCalled();
  });
});
