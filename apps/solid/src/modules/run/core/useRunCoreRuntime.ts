import { computed } from "vue";
import { useSolidSession } from "@/modules/solid-session";
import { useRunIdentityService } from "@/modules/run/identity";
import { useRunStorageCatalog } from "@/modules/run/storage";
import {
  useRunWorkspaceRuntime,
  useRunWorkspaceState,
} from "@/modules/run/workspace";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunTasksRuntime } from "@/modules/run/tasks/useRunTasksRuntime";
import { useRunExplorerSurface, useRunTerminalSurface } from "@/modules/run/surfaces";
import type {
  RunSurfaceDescriptor,
  RunCoreRuntime,
} from "./types";

let singleton: RunCoreRuntime | null = null;

function createRuntime(): RunCoreRuntime {
  const solid = useSolidSession();
  const identity = useRunIdentityService();
  const workspace = useRunWorkspaceRuntime();
  const storage = useRunStorageCatalog();
  const workspaceState = useRunWorkspaceState();
  const projectionState = useRunProjectionState();
  const tasks = useRunTasksRuntime();
  const explorer = useRunExplorerSurface();
  const terminal = useRunTerminalSurface();

  const bootStatus = computed<"booting" | "ready" | "error">(() => {
    if (workspace.status.value === "loading") {
      return "booting";
    }

    if (workspace.status.value === "error") {
      return "error";
    }

    return "ready";
  });

  const surfaces = computed<RunSurfaceDescriptor[]>(() => {
    const ready = bootStatus.value === "ready";
    const hasBrowsableMounts = workspace.hasBrowsableMounts.value;

    return [
      {
        id: "core",
        label: "Core",
        available: true,
        active: true,
        reason: null,
      },
      {
        id: "explorer",
        label: "Explorer",
        available: ready && hasBrowsableMounts,
        active: false,
        reason:
          ready && !hasBrowsableMounts
            ? "Explorer unlocks when a connected provider exposes a browsable mount."
            : ready
              ? null
              : "Workspace runtime is still booting.",
      },
      {
        id: "terminal",
        label: "Terminal",
        available: ready,
        active: false,
        reason: ready ? null : "Terminal depends on the workspace runtime being ready.",
      },
      {
        id: "identity",
        label: "Identity",
        available: ready,
        active: identity.status.value !== "ready",
        reason:
          identity.status.value === "ready"
            ? null
            : "Create, import, or recover a valid local identity when you need signed actions.",
      },
    ];
  });

  const authStatus = computed(() => {
    if (solid.status.value === "error") {
      return "error" as const;
    }
    if (solid.status.value === "restoring" || solid.status.value === "redirecting") {
      return "authenticating" as const;
    }
    if (solid.isAuthenticated.value) {
      return "authenticated" as const;
    }
    return "anonymous" as const;
  });

  const facts = computed(() => [
    {
      label: "Storage providers",
      value: `${workspace.providers.value.filter((provider) => provider.status === "ready").length}/${workspace.providers.value.length} ready`,
    },
    {
      label: "Concord identity",
      value: identity.activeIdentity.value?.profile.label ?? "Unavailable",
    },
    {
      label: "Verification",
      value: "Strict verification runtime",
    },
    {
      label: "Projection",
      value: projectionState.activeProjection.value.readiness.inspectable
        ? projectionState.activeProjection.value.readiness.interactive
          ? "Interactive"
          : "Inspectable"
        : "Unavailable",
    },
    {
      label: "Active provider",
      value: workspaceState.selection.value.activeProviderId || "Unselected",
    },
    {
      label: "Tasks",
      value: tasks.mode.value,
    },
  ]);

  const summaryLines = computed(() => {
    return [
      `boot ${bootStatus.value}`,
      `auth ${authStatus.value}`,
      `identity ${identity.status.value}`,
      `providers ${workspace.providers.value.length}`,
      `mounts ${storage.mounts.value.length}`,
      `resources ${storage.resources.value.length}`,
      `ledgers ${storage.ledgers.value.length}`,
      `active mount ${workspaceState.selection.value.activeMountId || "none"}`,
      `active scope ${workspaceState.selection.value.activeScope || "none"}`,
      `active selection ${workspaceState.selection.value.activeResourceId || "none"}`,
      `projection inspectable ${projectionState.activeProjection.value.readiness.inspectable ? "yes" : "no"}`,
      `projection interactive ${projectionState.activeProjection.value.readiness.interactive ? "yes" : "no"}`,
      `tasks status ${tasks.status.value}`,
      `active projection ${projectionState.activeProjection.value.ledgerId || "none"}`,
    ];
  });

  return {
    boot: {
      status: bootStatus,
      ready: computed(() => bootStatus.value === "ready"),
    },
    auth: {
      isAuthenticated: computed(() => solid.isAuthenticated.value),
      status: authStatus,
      issuer: computed(() => solid.issuer.value || null),
      providers: solid.providers,
      webId: computed(() => solid.webId.value),
      error: computed(() => solid.error.value),
      async login() {
        await solid.login();
      },
      async logout() {
        await solid.logout();
      },
      setIssuer(next) {
        solid.setIssuer(next);
      },
    },
    identity: {
      status: computed(() => identity.status.value),
      ready: computed(() => identity.status.value === "ready"),
      verificationMode: computed(() => "strict" as const),
      activeIdentity: identity.activeIdentity,
      identities: identity.identities,
      bootstrapCandidates: identity.bootstrapCandidates,
      async createMnemonicIdentity(input) {
        return await identity.createMnemonicIdentity(input);
      },
      async importMnemonic(input) {
        return await identity.importMnemonic(input);
      },
      async importSerializedIdentity(input) {
        return await identity.importSerializedIdentity(input);
      },
      async switchIdentity(identityId) {
        if (identity.activeIdentity.value?.id === identityId) {
          return identity.activeIdentity.value;
        }

        return await identity.setActiveIdentity(identityId);
      },
      async removeIdentity(identityId) {
        await identity.removeIdentity(identityId);
      },
      async exportActiveIdentity() {
        return await identity.exportIdentity(identity.activeIdentity.value?.id ?? undefined);
      },
      async syncActiveIdentityToProvider(providerId) {
        await identity.syncIdentityToProvider(providerId, identity.activeIdentity.value?.id ?? undefined);
      },
      async adoptBootstrapCandidate(candidateId) {
        return await identity.adoptBootstrapCandidate(candidateId);
      },
      async refreshBootstrapCandidates() {
        await identity.refreshBootstrapCandidates();
      },
      error: identity.error,
    },
    workspace: {
      providers: workspace.providers,
      mounts: storage.mounts,
      resources: storage.resources,
      ledgers: storage.ledgers,
      selection: workspaceState.selection,
      activeProjection: projectionState.activeProjection,
    },
    surfaces: {
      available: surfaces,
      active: computed(() => {
        if (
          bootStatus.value === "ready" &&
          workspace.hasBrowsableMounts.value
        ) {
          return "explorer" as const;
        }
        if (bootStatus.value === "ready") {
          return "terminal" as const;
        }
        return null;
      }),
    },
    diagnostics: {
      facts,
      summaryLines,
    },
    explorer,
    terminal,
    actions: {
      async selectScope(scope) {
        await workspaceState.selectScope(scope);
      },
      async selectLedger(ledgerId) {
        await workspaceState.selectLedger(ledgerId);
      },
    },
    async init() {
      await Promise.all([identity.init(), workspace.init()]);
    },
  };
}

export function useRunCoreRuntime(): RunCoreRuntime {
  if (!singleton) {
    singleton = createRuntime();
  }

  return singleton;
}
