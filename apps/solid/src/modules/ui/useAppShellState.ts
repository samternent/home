import { computed, ref, type ComputedRef } from "vue";

export type AppShellPanelId = "connect" | "explorer" | "add" | null;
export type AppShellConnectIntent = "create" | "mnemonic" | "json" | "recover" | null;

type AppShellState = {
  activePanel: ComputedRef<AppShellPanelId>;
  connectIntent: ComputedRef<AppShellConnectIntent>;
  terminalOpen: ComputedRef<boolean>;
  togglePanel(panel: Exclude<AppShellPanelId, null>): void;
  openPanel(panel: Exclude<AppShellPanelId, null>): void;
  toggleConnect(intent?: Exclude<AppShellConnectIntent, null>): void;
  openConnect(intent?: Exclude<AppShellConnectIntent, null>): void;
  toggleTerminal(): void;
  openTerminal(): void;
  closeTerminal(): void;
  clearConnectIntent(): void;
  closePanel(): void;
};

let activePanelState = ref<AppShellPanelId>(null);
let connectIntentState = ref<AppShellConnectIntent>(null);
let terminalOpenState = ref(false);
let singleton: AppShellState | null = null;

function createAppShellState(): AppShellState {
  return {
    activePanel: computed(() => activePanelState.value),
    connectIntent: computed(() => connectIntentState.value),
    terminalOpen: computed(() => terminalOpenState.value),
    togglePanel(panel) {
      if (panel !== "connect") {
        connectIntentState.value = null;
      }
      activePanelState.value = activePanelState.value === panel ? null : panel;
    },
    openPanel(panel) {
      if (panel !== "connect") {
        connectIntentState.value = null;
      }
      activePanelState.value = panel;
    },
    toggleConnect(intent) {
      connectIntentState.value = intent ?? null;
      activePanelState.value = activePanelState.value === "connect" ? null : "connect";
    },
    openConnect(intent) {
      connectIntentState.value = intent ?? null;
      activePanelState.value = "connect";
    },
    toggleTerminal() {
      terminalOpenState.value = !terminalOpenState.value;
    },
    openTerminal() {
      terminalOpenState.value = true;
    },
    closeTerminal() {
      terminalOpenState.value = false;
    },
    clearConnectIntent() {
      connectIntentState.value = null;
    },
    closePanel() {
      activePanelState.value = null;
      connectIntentState.value = null;
    },
  };
}

export function useAppShellState(): AppShellState {
  if (!singleton) {
    singleton = createAppShellState();
  }

  return singleton;
}
