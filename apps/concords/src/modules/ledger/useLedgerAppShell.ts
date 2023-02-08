import { provide, inject, shallowRef } from "vue";

const ledgerAppShellSymbol = Symbol("ledgerAppShell");

function ledgerAppShell() {
  const showPermissionsPanel = shallowRef<boolean>(false);

  return { showPermissionsPanel };
}

export function provideLedgerAppShell() {
  const ledgerShell = ledgerAppShell();

  provide(ledgerAppShellSymbol, ledgerShell);
  return ledgerShell;
}
export function useLedgerAppShell() {
  return inject(ledgerAppShellSymbol);
}
