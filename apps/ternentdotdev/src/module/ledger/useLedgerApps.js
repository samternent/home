// Ledger Apps composable - for managing apps within the ledger
import { computed, provide, inject } from "vue";

const useLedgerAppsSymbol = Symbol("useLedgerApps");

export function provideLedgerApps(appBuilder) {
  // Use the provided app builder's reactive data
  const { apps: builderApps } = appBuilder;

  // Computed properties that use the shared app builder data
  const apps = computed(() => builderApps.value);
  const hasApps = computed(() => apps.value.length > 0);

  // Get apps by type
  const getAppsByType = (type) => computed(() => 
    apps.value.filter(app => app.type === type)
  );

  // Get app by ID
  const getAppById = (appId) => computed(() => 
    apps.value.find(app => app.id === appId)
  );

  const ledgerApps = {
    // Data
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
    throw new Error("useLedgerApps must be used within a component that provides ledger apps");
  }
  return ledgerApps;
}
