// Ledger Apps composable - for managing apps within the ledger
import { computed, provide, inject } from "vue";
import { provideAppBuilder } from "../builder/useAppBuilder";

const useLedgerAppsSymbol = Symbol("useLedgerApps");

export function provideLedgerApps() {
  // Get the app builder which connects to the actual ledger
  const appBuilder = provideAppBuilder();

  // Use the real apps from the ledger
  const apps = computed(() => appBuilder.apps.value || []);
  const hasApps = computed(() => apps.value.length > 0);

  // Get apps by type
  const getAppsByType = (type) =>
    computed(() => apps.value.filter((app) => app.type === type));

  // Get app by ID
  const getAppById = (appId) =>
    computed(() => apps.value.find((app) => app.id === appId));

  const ledgerApps = {
    apps,
    hasApps,

    // Helpers
    getAppsByType,
    getAppById,
  };

  provide(useLedgerAppsSymbol, ledgerApps);
  return ledgerApps;
}

export function useLedgerApps() {
  const ledgerApps = inject(useLedgerAppsSymbol);
  if (!ledgerApps) {
    throw new Error(
      "useLedgerApps must be used within a component that provides ledger apps"
    );
  }
  return ledgerApps;
}
