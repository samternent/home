import type { ConcordReplayPlugin } from "@ternent/concord";
import type {
  SolidConcordPaths,
  SolidWorkspaceEntry,
  SolidWorkspaceLedgerSummary,
  SolidWorkspaceScope,
} from "@ternent/solid";
import { createConcordTodoHostedPlugin } from "./todo";

export type ConcordOsOpenTarget = {
  url: string;
  scope: SolidWorkspaceScope;
  path: string;
  name: string;
  title: string;
  entry: SolidWorkspaceEntry;
  ledgerSummary: SolidWorkspaceLedgerSummary | null;
};

export type ConcordOsHostedAppDefinition = {
  id: string;
  label: string;
  title: string;
  description: string;
  openLabel: string;
  createPlugins(): ConcordReplayPlugin[];
  supports(target: ConcordOsOpenTarget): {
    supported: boolean;
    reason: string | null;
    isDefault: boolean;
  };
};

export type ConcordOsLedgerCompatibility = {
  appId: string;
  label: string;
  title: string;
  description: string;
  openLabel: string;
  supported: boolean;
  reason: string | null;
  isDefault: boolean;
};

function titleFromEntry(entry: SolidWorkspaceEntry): string {
  return entry.name.replace(/\.json$/i, "");
}

const hostedApps: ConcordOsHostedAppDefinition[] = [
  {
    id: "todo",
    label: "Todo",
    title: "Todo",
    description: "A simple Concord task app for durable lists and completion history.",
    openLabel: "Open in Todo",
    createPlugins() {
      return [createConcordTodoHostedPlugin()];
    },
    supports(target) {
      if (!target.entry.isLedger) {
        return {
          supported: false,
          reason: "Only Concord ledgers can open in hosted apps.",
          isDefault: false,
        };
      }

      return {
        supported: true,
        reason: "Todo can project any Concord ledger and ignores unrelated history it does not understand.",
        isDefault: true,
      };
    },
  },
];

export function createConcordOsOpenTarget(
  entry: SolidWorkspaceEntry,
  ledgerSummary: SolidWorkspaceLedgerSummary | null = null,
): ConcordOsOpenTarget {
  return {
    url: entry.url,
    scope: entry.scope,
    path: entry.path,
    name: entry.name,
    title: titleFromEntry(entry),
    entry,
    ledgerSummary,
  };
}

export function getConcordOsHostedApps(): ConcordOsHostedAppDefinition[] {
  return hostedApps;
}

export function getConcordOsHostedApp(appId: string): ConcordOsHostedAppDefinition | null {
  return hostedApps.find((app) => app.id === appId) ?? null;
}

export function resolveConcordOsLedgerCompatibility(
  target: ConcordOsOpenTarget,
): ConcordOsLedgerCompatibility[] {
  return hostedApps
    .map((app) => {
      const support = app.supports(target);
      return {
        appId: app.id,
        label: app.label,
        title: app.title,
        description: app.description,
        openLabel: app.openLabel,
        supported: support.supported,
        reason: support.reason,
        isDefault: support.isDefault,
      };
    })
    .filter((app) => app.supported);
}

export function buildConcordOsHostedAppRoute(
  target: ConcordOsOpenTarget,
  appId: string,
) {
  const relativePath = target.path.replace(/^\/+/, "").replace(/\/+$/, "");
  return {
    name: "app-open",
    params: {
      scope: target.scope,
      appId,
      encodedPath: encodeURIComponent(relativePath),
    },
  };
}

export function resolveConcordOsTargetUrl(
  paths: SolidConcordPaths,
  scope: SolidWorkspaceScope,
  encodedPath: string,
): string {
  const relativePath = decodeURIComponent(String(encodedPath || ""))
    .trim()
    .replace(/^\/+/, "");

  if (!relativePath) {
    throw new Error("A ledger path is required to open a hosted app.");
  }

  const root =
    scope === "shared"
      ? paths.workspaceSharedRootUrl
      : scope === "public"
        ? paths.workspacePublicRootUrl
        : paths.workspacePrivateRootUrl;

  return new URL(relativePath, root).toString();
}

export function useConcordOsAppRegistry() {
  return {
    apps: hostedApps,
    getAppById: getConcordOsHostedApp,
    resolveCompatibility: resolveConcordOsLedgerCompatibility,
  };
}
