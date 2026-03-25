import { useRunHostedAppRuntime } from "@/modules/run/hosted-apps";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { useRunWorkspaceSource, useRunWorkspaceState } from "@/modules/run/workspace";
import { useRunWorkspaceActions } from "./useRunWorkspaceActions";
import type { RunTerminalLanguageResult } from "./types";

let singleton: { execute(input: string): Promise<RunTerminalLanguageResult> } | null = null;

function tokenize(input: string): string[] {
  const matches = input.match(/"([^"]*)"|'([^']*)'|[^\s]+/g) ?? [];
  return matches.map((token) => token.replace(/^['"]|['"]$/g, ""));
}

function output(...lines: string[]): RunTerminalLanguageResult {
  return {
    handled: true,
    clear: false,
    chunks: [{ kind: "output", lines }],
  };
}

function error(message: string): RunTerminalLanguageResult {
  return {
    handled: true,
    clear: false,
    chunks: [{ kind: "error", lines: [message] }],
  };
}

function createTerminalLanguage() {
  const source = useRunWorkspaceSource();
  const storage = useRunStorageCatalog();
  const workspace = useRunWorkspaceState();
  const hostedApps = useRunHostedAppRuntime();
  const projection = useRunProjectionState();
  const actions = useRunWorkspaceActions();

  return {
    async execute(input: string): Promise<RunTerminalLanguageResult> {
      const trimmed = input.trim();
      if (!trimmed) {
        return {
          handled: false,
          clear: false,
          chunks: [],
        };
      }

      const [name, ...args] = tokenize(trimmed);

      switch (name) {
        case "help":
          return output(
            "Commands: help, pwd, ls, mounts, status, cd <target>, select <target>, mkdir <name>, mkledger <name>, app open [appId], app close, clear",
          );

        case "clear":
          return {
            handled: true,
            clear: true,
            chunks: [],
          };

        case "pwd":
          return output(source.currentBrowse.value?.url ?? "No active workspace path.");

        case "ls": {
          const entries = source.currentBrowse.value?.entries ?? [];
          if (!entries.length) {
            return output("No entries in the current location.");
          }

          return output(
            ...entries.map((entry) => {
              const kind = entry.isLedger ? "ledger" : entry.kind;
              return `${kind.padEnd(9, " ")} ${entry.name}`;
            }),
          );
        }

        case "mounts":
          return output(
            ...storage.mounts.value.map((mount) => `${mount.scope.padEnd(7, " ")} ${mount.rootUrl}`),
          );

        case "status":
          return output(
            `scope: ${workspace.selection.value.activeScope ?? "none"}`,
            `selection: ${workspace.selection.value.activeResourceId ?? "none"}`,
            `projection: ${projection.activeProjection.value.id ?? "none"}`,
            `verification: ${projection.activeProjection.value.verification.status}`,
            `app: ${hostedApps.activeHostAppId.value ?? "none"}`,
          );

        case "cd": {
          const target = args.join(" ").trim();
          if (!target) {
            return error("Usage: cd <private|shared|public|..|path>");
          }

          if (target === "..") {
            const result = await actions.navigateUp();
            return result.ok ? output(`Moved to ${result.value.url}`) : error(result.error);
          }

          if (target === "private" || target === "shared" || target === "public") {
            await actions.navigateToScope(target);
            return output(`Moved to ${target}`);
          }

          const entry = await actions.resolveTarget(target);
          if (!entry) {
            return error(`Target not found: ${target}`);
          }

          if (entry.kind !== "container") {
            return error(`Target is not a container: ${target}`);
          }

          const result = await actions.openEntryByUrl(entry.url);
          return result.ok ? output(`Moved to ${result.value.entry.url}`) : error(result.error);
        }

        case "select":
        case "open": {
          const target = args.join(" ").trim();
          if (!target) {
            return error(`Usage: ${name} <resource>`);
          }

          const result = await actions.openTarget(target);
          if (!result.ok) {
            return error(result.error);
          }

          return output(
            result.value.mode === "navigated"
              ? `Opened container ${result.value.entry.url}`
              : `Selected ${result.value.entry.url}`,
          );
        }

        case "mkdir": {
          const folderName = args.join(" ").trim();
          if (!folderName) {
            return error("Usage: mkdir <name>");
          }

          const result = await actions.createFolder(folderName);
          return result.ok ? output(`Created folder ${result.value.entry.name}`) : error(result.error);
        }

        case "mkledger": {
          const ledgerName = args.join(" ").trim();
          if (!ledgerName) {
            return error("Usage: mkledger <name>");
          }

          const result = await actions.createLedger(ledgerName);
          return result.ok ? output(`Created ledger ${result.value.entry.name}`) : error(result.error);
        }

        case "app": {
          const mode = args[0]?.trim();
          if (mode === "close") {
            await actions.closeApp();
            return output("Hosted app deactivated.");
          }

          if (mode === "open") {
            const result = await actions.openApp(args[1]);
            return result.ok
              ? output(`Hosted app active on ${result.value.ledgerId ?? "unknown"}`)
              : error(result.error);
          }

          return error("Usage: app <open [appId]|close>");
        }

        default:
          return error(`Unknown command: ${name}`);
      }
    },
  };
}

export function useRunTerminalLanguage() {
  if (!singleton) {
    singleton = createTerminalLanguage();
  }

  return singleton;
}
