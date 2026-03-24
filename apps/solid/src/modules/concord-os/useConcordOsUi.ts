import { computed, ref } from "vue";

export type ConcordOsUiStore = {
  sidebarCollapsed: ReturnType<typeof computed<boolean>>;
  consoleOpen: ReturnType<typeof computed<boolean>>;
  inspectorOpen: ReturnType<typeof computed<boolean>>;
  toggleSidebar(): void;
  toggleConsole(): void;
  toggleInspector(): void;
};

const uiStorageKey = "solid/concord-ui";

let singleton: ConcordOsUiStore | null = null;

function canUseBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function loadUiState() {
  if (!canUseBrowser()) {
    return {
      sidebarCollapsed: false,
      consoleOpen: false,
      inspectorOpen: false,
    };
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(uiStorageKey) || "{}");
    return {
      sidebarCollapsed: parsed.sidebarCollapsed === true,
      consoleOpen: parsed.consoleOpen === true,
      inspectorOpen: parsed.inspectorOpen === true,
    };
  } catch {
    return {
      sidebarCollapsed: false,
      consoleOpen: false,
      inspectorOpen: false,
    };
  }
}

function persistUiState(input: ReturnType<typeof loadUiState>) {
  if (!canUseBrowser()) {
    return;
  }

  try {
    localStorage.setItem(uiStorageKey, JSON.stringify(input));
  } catch {
    return;
  }
}

function createUiStore(): ConcordOsUiStore {
  const initial = loadUiState();
  const sidebarCollapsed = ref(initial.sidebarCollapsed);
  const consoleOpen = ref(initial.consoleOpen);
  const inspectorOpen = ref(initial.inspectorOpen);

  function save() {
    persistUiState({
      sidebarCollapsed: sidebarCollapsed.value,
      consoleOpen: consoleOpen.value,
      inspectorOpen: inspectorOpen.value,
    });
  }

  return {
    sidebarCollapsed: computed(() => sidebarCollapsed.value),
    consoleOpen: computed(() => consoleOpen.value),
    inspectorOpen: computed(() => inspectorOpen.value),
    toggleSidebar() {
      sidebarCollapsed.value = !sidebarCollapsed.value;
      save();
    },
    toggleConsole() {
      consoleOpen.value = !consoleOpen.value;
      save();
    },
    toggleInspector() {
      inspectorOpen.value = !inspectorOpen.value;
      save();
    },
  };
}

export function useConcordOsUi(): ConcordOsUiStore {
  if (!singleton) {
    singleton = createUiStore();
  }
  return singleton;
}
