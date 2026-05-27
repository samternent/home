import { computed } from "vue";
import type { SolidWorkspaceEntry } from "@ternent/solid";
import { createConcordOsOpenTarget, resolveConcordOsLedgerCompatibility } from "./apps";
import { useConcordOsCore } from "./core";

export type ConcordLibraryItemKind = "ledger" | "space" | "resource";
export type ConcordLibraryCapabilityStatus = "available";

export type ConcordLibraryCapability = {
  id: string;
  appId: string;
  label: string;
  description: string;
  status: ConcordLibraryCapabilityStatus;
  actionLabel: string;
  isDefault: boolean;
};

export type ConcordLibraryItem = {
  entry: SolidWorkspaceEntry;
  kind: ConcordLibraryItemKind;
  title: string;
  summary: string;
  badges: string[];
  capabilities: ConcordLibraryCapability[];
  appCountLabel: string | null;
  modifiedLabel: string;
  primaryCapability: ConcordLibraryCapability | null;
};

function formatModifiedLabel(value: string | null): string {
  if (!value) {
    return "No replay activity yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return `Updated ${new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date)}`;
}

function createLedgerCapabilities(entry: SolidWorkspaceEntry): ConcordLibraryCapability[] {
  return resolveConcordOsLedgerCompatibility(createConcordOsOpenTarget(entry)).map((app) => ({
    id: `${entry.url}#${app.appId}`,
    appId: app.appId,
    label: app.label,
    description: app.description,
    status: "available",
    actionLabel: app.openLabel,
    isDefault: app.isDefault,
  }));
}

function toLibraryItem(entry: SolidWorkspaceEntry): ConcordLibraryItem {
  if (entry.isLedger) {
    const capabilities = createLedgerCapabilities(entry);
    return {
      entry,
      kind: "ledger",
      title: entry.name.replace(/\.json$/i, ""),
      summary: "Portable Concord history ready to open in compatible apps.",
      badges: ["ledger", entry.scope],
      capabilities,
      appCountLabel: `${capabilities.length} compatible app${capabilities.length === 1 ? "" : "s"}`,
      modifiedLabel: formatModifiedLabel(entry.lastModified),
      primaryCapability: capabilities[0] ?? null,
    };
  }

  if (entry.kind === "container") {
    return {
      entry,
      kind: "space",
      title: entry.name,
      summary: "A structured space for related ledgers and app-owned material.",
      badges: ["space", entry.scope],
      capabilities: [],
      appCountLabel: null,
      modifiedLabel: formatModifiedLabel(entry.lastModified),
      primaryCapability: null,
    };
  }

  return {
    entry,
    kind: "resource",
    title: entry.name,
    summary: "Supporting material attached to the workspace structure.",
    badges: ["resource", entry.scope],
    capabilities: [],
    appCountLabel: null,
    modifiedLabel: formatModifiedLabel(entry.lastModified),
    primaryCapability: null,
  };
}

export function useConcordOsLibrary() {
  const workspace = useConcordOsCore();

  const items = computed(() => (workspace.currentBrowse.value?.entries ?? []).map(toLibraryItem));
  const ledgers = computed(() => items.value.filter((item) => item.kind === "ledger"));
  const spaces = computed(() => items.value.filter((item) => item.kind === "space"));
  const resources = computed(() => items.value.filter((item) => item.kind === "resource"));
  const selectedItem = computed(() => {
    const selectedUrl = workspace.selectedEntry.value?.url;
    return items.value.find((item) => item.entry.url === selectedUrl) ?? null;
  });

  return {
    items,
    ledgers,
    spaces,
    resources,
    selectedItem,
    hasLedgers: computed(() => ledgers.value.length > 0),
  };
}
