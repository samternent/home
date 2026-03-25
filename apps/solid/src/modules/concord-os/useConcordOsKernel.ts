import { computed, ref, watch, type ComputedRef } from "vue";
import { useSolidSession, type SolidSessionController } from "@/modules/solid-session";
import { useConcordOsAppHost, type ConcordOsAppHost, type ConcordOsWorkspaceTab } from "./useConcordOsAppHost";
import { useConcordOsCore, type ConcordOsCoreStore } from "./core";
import { useConcordOsLibrary } from "./useConcordOsLibrary";
import { useConcordOsUi, type ConcordOsUiStore } from "./useConcordOsUi";
import { useConcordTodoWorkingCopy, type ConcordTodoWorkingCopy } from "./useConcordTodoWorkingCopy";
import { useConcordOsWorkbenchView, type ConcordOsRecentWorkItem, type ConcordOsWorkbenchView } from "./useConcordOsWorkbenchView";

export type ConcordOsKernelSurface = "home" | "app" | "sharing" | "people" | "account";
export type ConcordOsKernelInspectorMode = "meta" | "history" | "threads";
export type ConcordOsKernelEvent = {
  id: string;
  message: string;
  detail?: string;
  createdAt: string;
  level: "info" | "warning" | "error";
};

export type ConcordOsKernel = {
  solid: SolidSessionController;
  workspace: ConcordOsCoreStore;
  library: ReturnType<typeof useConcordOsLibrary>;
  appHost: ConcordOsAppHost;
  workbench: ConcordOsWorkbenchView;
  todo: ConcordTodoWorkingCopy;
  ui: ConcordOsUiStore;
  surface: ComputedRef<ConcordOsKernelSurface>;
  surfaceLabel: ComputedRef<string>;
  launcherOpen: ComputedRef<boolean>;
  inspectorMode: ComputedRef<ConcordOsKernelInspectorMode>;
  openContexts: ComputedRef<ConcordOsWorkspaceTab[]>;
  activeContext: ComputedRef<ConcordOsWorkspaceTab | null>;
  recentContexts: ComputedRef<ConcordOsRecentWorkItem[]>;
  shellStatus: ComputedRef<string>;
  statusTone: ComputedRef<"neutral" | "success" | "warning">;
  webIdShort: ComputedRef<string>;
  systemSummaryLines: ComputedRef<string[]>;
  eventLog: ComputedRef<ConcordOsKernelEvent[]>;
  consolePulse: ComputedRef<boolean>;
  consoleVisible: ComputedRef<boolean>;
  showTodoConsole: ComputedRef<boolean>;
  openTodoCount: ComputedRef<number>;
  completedTodoCount: ComputedRef<number>;
  hostedStatusLabel: ComputedRef<string>;
  inspectorMeta: ComputedRef<{
    title: string;
    rows: Array<{ label: string; value: string }>;
  }>;
  setSurface(surface: ConcordOsKernelSurface): void;
  showLauncher(): void;
  hideLauncher(): void;
  toggleLauncher(): void;
  setInspectorMode(mode: ConcordOsKernelInspectorMode): void;
  pushEvent(message: string, detail?: string, level?: "info" | "warning" | "error"): void;
};

let singleton: ConcordOsKernel | null = null;

function createKernelEvent(
  message: string,
  detail?: string,
  level: "info" | "warning" | "error" = "info",
): ConcordOsKernelEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    detail,
    createdAt: new Date().toISOString(),
    level,
  };
}

function createKernel(): ConcordOsKernel {
  const solid = useSolidSession();
  const workspace = useConcordOsCore();
  const library = useConcordOsLibrary();
  const appHost = useConcordOsAppHost();
  const workbench = useConcordOsWorkbenchView();
  const todo = useConcordTodoWorkingCopy();
  const ui = useConcordOsUi();

  const surfaceState = ref<ConcordOsKernelSurface>("home");
  const launcherOpenState = ref(false);
  const inspectorModeState = ref<ConcordOsKernelInspectorMode>("meta");
  const eventLogState = ref<ConcordOsKernelEvent[]>([]);
  const consolePulseState = ref(false);
  let consolePulseTimer: ReturnType<typeof setTimeout> | null = null;

  const openTodoCount = computed(
    () => todo.items.value.filter((item) => !item.completed).length,
  );
  const completedTodoCount = computed(
    () => todo.items.value.filter((item) => item.completed).length,
  );

  const shellStatus = computed(() => {
    if (solid.status.value === "restoring") return "restoring";
    if (solid.status.value === "redirecting") return "signing-in";
    if (workspace.status.value === "loading") return "loading";
    if (solid.isAuthenticated.value) return "connected";
    if (solid.error.value) return "attention";
    return "login-required";
  });

  const statusTone = computed(() => {
    if (solid.status.value === "error" || workspace.status.value === "error") {
      return "warning" as const;
    }
    if (solid.isAuthenticated.value) {
      return "success" as const;
    }
    return "neutral" as const;
  });

  const webIdShort = computed(() => {
    if (!solid.webId.value) {
      return "No active WebID";
    }

    const value = solid.webId.value;
    if (value.length <= 44) {
      return value;
    }

    return `${value.slice(0, 18)}...${value.slice(-16)}`;
  });

  const openContexts = computed(() => appHost.tabs.value);
  const activeContext = computed(() =>
    appHost.tabs.value.find((tab) => tab.id === appHost.activeTabId.value) ?? null,
  );
  const recentContexts = computed(() => workbench.recentWork.value);

  const showTodoConsole = computed(
    () => appHost.activeAppId.value === "todo" && Boolean(appHost.activeTarget.value),
  );
  const consoleVisible = computed(
    () =>
      ui.consoleOpen.value ||
      (showTodoConsole.value &&
        (todo.stagedCount.value > 0 || todo.saving.value || Boolean(todo.error.value))),
  );

  const hostedStatusLabel = computed(() => {
    if (appHost.error.value || todo.error.value) return "error";
    if (todo.saving.value) return "committing";
    if (todo.stagedCount.value > 0) return "pending";
    if (appHost.status.value === "loading") return "loading";
    return "ready";
  });

  const surfaceLabel = computed(() => {
    if (surfaceState.value === "app" && appHost.activeTarget.value) {
      return `${appHost.activeTarget.value.title} · ${appHost.activeAppLabel.value || "App"}`;
    }

    if (surfaceState.value === "sharing") return "Sharing";
    if (surfaceState.value === "people") return "People";
    if (surfaceState.value === "account") return "Account";
    return "Library";
  });

  const systemSummaryLines = computed(() => {
    if (!solid.isAuthenticated.value) {
      return ["session locked", "workspace idle", "no active context"];
    }

    return [
      `pod ${workspace.selectedPod.value || "unselected"}`,
      `scope ${workspace.currentScope.value}`,
      `target ${workspace.currentTargetUrl.value || "none"}`,
      `app ${appHost.activeAppLabel.value || "none"}`,
    ];
  });

  const inspectorMeta = computed(() => {
    if (!solid.isAuthenticated.value) {
      return {
        title: "System state",
        rows: [
          { label: "session", value: "locked" },
          { label: "workspace", value: "awaiting Solid login" },
        ],
      };
    }

    if (appHost.activeTarget.value) {
      return {
        title: `${appHost.activeTarget.value.title} · ${appHost.activeAppLabel.value || "App"}`,
        rows: [
          { label: "path", value: appHost.activeTarget.value.path },
          { label: "scope", value: appHost.activeTarget.value.scope },
          { label: "status", value: hostedStatusLabel.value },
          { label: "open", value: String(openTodoCount.value) },
          { label: "completed", value: String(completedTodoCount.value) },
        ],
      };
    }

    if (workspace.selectedEntry.value) {
      return {
        title: library.selectedItem.value?.title || workspace.selectedEntry.value.name,
        rows: [
          { label: "path", value: workspace.selectedEntry.value.path },
          { label: "scope", value: workspace.selectedEntry.value.scope },
          { label: "kind", value: library.selectedItem.value?.kind || workspace.selectedEntry.value.kind },
        ],
      };
    }

    return {
      title: "System state",
      rows: [
        { label: "session", value: "ready" },
        { label: "workspace", value: workspace.status.value },
        { label: "scope", value: workspace.currentScope.value },
      ],
    };
  });

  function pulseConsole() {
    consolePulseState.value = true;
    if (consolePulseTimer) {
      clearTimeout(consolePulseTimer);
    }
    consolePulseTimer = setTimeout(() => {
      consolePulseState.value = false;
    }, 1200);
  }

  function pushEvent(
    message: string,
    detail?: string,
    level: "info" | "warning" | "error" = "info",
  ) {
    eventLogState.value = [
      createKernelEvent(message, detail, level),
      ...eventLogState.value,
    ].slice(0, 20);
    pulseConsole();
  }

  watch(
    () => solid.isAuthenticated.value,
    (next, previous) => {
      if (next === previous) {
        return;
      }

      if (next) {
        pushEvent("Solid session active", solid.webId.value || undefined);
        return;
      }

      if (previous) {
        pushEvent("Solid session closed");
      }
    },
  );

  watch(
    () => workspace.status.value,
    (next, previous) => {
      if (next === previous) {
        return;
      }

      if (next === "ready" && solid.isAuthenticated.value) {
        pushEvent("Workspace mounted", workspace.currentTargetUrl.value || undefined);
      }
    },
  );

  watch(
    () => `${appHost.activeTarget.value?.url || ""}:${appHost.activeAppLabel.value || ""}`,
    (next, previous) => {
      if (!next || next === previous || !appHost.activeTarget.value) {
        return;
      }

      pushEvent(
        `Opened ${appHost.activeTarget.value.title}`,
        appHost.activeAppLabel.value ? `capability ${appHost.activeAppLabel.value}` : undefined,
      );
    },
  );

  watch(
    () => todo.stagedCount.value,
    (next, previous) => {
      if (next > 0 && previous === 0) {
        pushEvent("Working copy staged", `${next} entity change${next === 1 ? "" : "s"} ready`);
        return;
      }

      if (next === 0 && previous > 0 && !todo.saving.value) {
        pushEvent("Working copy clean");
      }
    },
  );

  watch(
    () => todo.saving.value,
    (next, previous) => {
      if (next && !previous) {
        pushEvent("Commit started", todo.commitMessage.value || "Writing staged changes");
        return;
      }

      if (!next && previous && !todo.error.value) {
        pushEvent("Commit complete", todo.lastAction.value || undefined);
      }
    },
  );

  watch(
    () => todo.error.value,
    (next, previous) => {
      if (next && next !== previous) {
        pushEvent("Commit failed", next, "error");
      }
    },
  );

  return {
    solid,
    workspace,
    library,
    appHost,
    workbench,
    todo,
    ui,
    surface: computed(() => surfaceState.value),
    surfaceLabel,
    launcherOpen: computed(() => launcherOpenState.value),
    inspectorMode: computed(() => inspectorModeState.value),
    openContexts,
    activeContext,
    recentContexts,
    shellStatus,
    statusTone,
    webIdShort,
    systemSummaryLines,
    eventLog: computed(() => eventLogState.value),
    consolePulse: computed(() => consolePulseState.value),
    consoleVisible,
    showTodoConsole,
    openTodoCount,
    completedTodoCount,
    hostedStatusLabel,
    inspectorMeta,
    setSurface(surface) {
      surfaceState.value = surface;
    },
    showLauncher() {
      launcherOpenState.value = true;
    },
    hideLauncher() {
      launcherOpenState.value = false;
    },
    toggleLauncher() {
      launcherOpenState.value = !launcherOpenState.value;
    },
    setInspectorMode(mode) {
      inspectorModeState.value = mode;
    },
    pushEvent,
  };
}

export function useConcordOsKernel(): ConcordOsKernel {
  if (!singleton) {
    singleton = createKernel();
  }
  return singleton;
}
