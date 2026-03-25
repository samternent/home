import { computed } from "vue";
import { useSolidSession } from "@/modules/solid-session";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { useRunWorkspaceSource, useRunWorkspaceState } from "@/modules/run/workspace";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunHostedAppRuntime } from "@/modules/run/hosted-apps";
import { useRunWorkspaceActions } from "@/modules/run/services";
import { useRunExplorerSurface, useRunTerminalSurface } from "@/modules/run/surfaces";
import type {
  RunSurfaceDescriptor,
  RunCoreRuntime,
} from "./types";

let singleton: RunCoreRuntime | null = null;

function createRuntime(): RunCoreRuntime {
  const solid = useSolidSession();
  const workspace = useRunWorkspaceSource();
  const storage = useRunStorageCatalog();
  const workspaceState = useRunWorkspaceState();
  const projectionState = useRunProjectionState();
  const hostedApps = useRunHostedAppRuntime();
  const workspaceActions = useRunWorkspaceActions();
  const explorer = useRunExplorerSurface();
  const terminal = useRunTerminalSurface();

  const bootStatus = computed<"booting" | "ready" | "error">(() => {
    if (
      solid.status.value === "restoring" ||
      solid.status.value === "redirecting" ||
      (solid.isAuthenticated.value && workspace.status.value === "loading")
    ) {
      return "booting";
    }

    if (workspace.status.value === "error" || solid.status.value === "error") {
      return "error";
    }

    return "ready";
  });

  const surfaces = computed<RunSurfaceDescriptor[]>(() => {
    const authenticated = solid.isAuthenticated.value;
    const ready = bootStatus.value === "ready" && authenticated;

    return [
      {
        id: "core",
        label: "Core",
        available: authenticated,
        active: true,
        reason: authenticated ? null : "Sign in with Solid to initialize the workspace runtime.",
      },
      {
        id: "explorer",
        label: "Explorer",
        available: ready,
        active: false,
        reason: ready ? null : "Workspace discovery unlocks after Solid authentication and workspace init.",
      },
      {
        id: "terminal",
        label: "Terminal",
        available: ready,
        active: false,
        reason: ready ? null : "Terminal depends on the workspace runtime being ready.",
      },
      {
        id: "concord-host",
        label: "Concord Host",
        available: ready && hostedApps.canHostSelection.value,
        active: hostedApps.hasActiveHost.value,
        reason:
          ready && !hostedApps.canHostSelection.value
            ? "Select a compatible ledger to host it in a Concord app."
            : ready
              ? null
              : "Host activation depends on the workspace runtime being ready.",
      },
      {
        id: "identity",
        label: "Identity",
        available: authenticated,
        active: false,
        reason: authenticated ? null : "Identity is provisioned from the Solid-authenticated session.",
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

  const identityStatus = computed(() => {
    if (bootStatus.value === "error") {
      return "error" as const;
    }
    if (workspace.identityReady.value) {
      return "verified" as const;
    }
    if (solid.isAuthenticated.value && workspace.status.value === "loading") {
      return "resolving" as const;
    }
    return "unresolved" as const;
  });

  const facts = computed(() => [
    {
      label: "Solid session",
      value: solid.webId.value || "Authenticated",
    },
    {
      label: "Concord identity",
      value: workspace.identityReady.value ? "Ready" : "Required",
    },
    {
      label: "Verification",
      value: "Strict verification runtime",
    },
    {
      label: "Selected pod",
      value: workspace.selectedPod.value || "Unselected",
    },
  ]);

  const summaryLines = computed(() => {
    if (!solid.isAuthenticated.value) {
      return [
        "auth anonymous",
        "workspace unavailable",
        "ledgers undiscovered",
      ];
    }

    return [
      `boot ${bootStatus.value}`,
      `auth ${authStatus.value}`,
      `identity ${identityStatus.value}`,
      `mounts ${storage.mounts.value.length}`,
      `resources ${storage.resources.value.length}`,
      `ledgers ${storage.ledgers.value.length}`,
      `active scope ${workspaceState.selection.value.activeScope || "none"}`,
      `active selection ${workspaceState.selection.value.activeResourceId || "none"}`,
      `host status ${hostedApps.hostStatusLabel.value}`,
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
      status: identityStatus,
      ready: computed(() => workspace.identityReady.value),
      verificationMode: computed(() => "strict" as const),
    },
    workspace: {
      mounts: storage.mounts,
      resources: storage.resources,
      ledgers: storage.ledgers,
      selection: workspaceState.selection,
      activeProjection: projectionState.activeProjection,
    },
    surfaces: {
      available: surfaces,
      active: computed(() => {
        if (hostedApps.hasActiveHost.value) {
          return "concord-host" as const;
        }
        if (bootStatus.value === "ready" && solid.isAuthenticated.value) {
          return "explorer" as const;
        }
        return null;
      }),
    },
    apps: {
      active: computed(() => {
        if (
          !hostedApps.activeHostAppId.value ||
          !hostedApps.activeHostLedgerId.value ||
          !hostedApps.activeHostProjectionId.value
        ) {
          return null;
        }

        return {
          appId: hostedApps.activeHostAppId.value,
          ledgerId: hostedApps.activeHostLedgerId.value,
          projectionId: hostedApps.activeHostProjectionId.value,
        };
      }),
    },
    diagnostics: {
      facts,
      summaryLines,
    },
    explorer,
    terminal,
    actions: {
      selectScope: workspaceState.selectScope,
      selectLedger: workspaceState.selectLedger,
      async openApp(appId) {
        const result = await workspaceActions.openApp(appId);
        return result.ok;
      },
      closeApp: workspaceActions.closeApp,
    },
    async init() {
      await workspace.init();
    },
  };
}

export function useRunCoreRuntime(): RunCoreRuntime {
  if (!singleton) {
    singleton = createRuntime();
  }

  return singleton;
}
