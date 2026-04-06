import { useRunIdentityService } from "@/modules/run/identity";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { useRunTasksRuntime } from "@/modules/run/tasks/useRunTasksRuntime";
import { useRunWorkspaceRuntime, useRunWorkspaceState } from "@/modules/run/workspace";
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
  const runtime = useRunWorkspaceRuntime();
  const storage = useRunStorageCatalog();
  const workspace = useRunWorkspaceState();
  const identity = useRunIdentityService();
  const projection = useRunProjectionState();
  const tasks = useRunTasksRuntime();
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
            "Commands: help, pwd, ls, mounts, status, cd <target>, select <target>, mkdir <name>, mkledger <name>, tasks, app open [tasks], clear",
          );

        case "clear":
          return {
            handled: true,
            clear: true,
            chunks: [],
          };

        case "pwd":
          return output(runtime.currentBrowse.value?.url ?? "No active workspace path.");

        case "ls": {
          const entries = runtime.currentBrowse.value?.entries ?? [];
          if (!entries.length) {
            return output("No entries in the current location.");
          }

          return output(
            ...entries.map((entry) => {
              return `${entry.kind.padEnd(9, " ")} ${entry.name}`;
            }),
          );
        }

        case "mounts":
          return output(
            ...storage.mounts.value.map((mount) => {
              const label = mount.scope ?? mount.id;
              return `${label.padEnd(7, " ")} ${mount.rootUrl}`;
            }),
          );

        case "status":
          return output(
            `identity: ${identity.activeIdentity.value?.profile.label ?? "missing"}`,
            `scope: ${workspace.selection.value.activeScope ?? "none"}`,
            `mount: ${workspace.selection.value.activeMountId ?? "none"}`,
            `selection: ${workspace.selection.value.activeResourceId ?? "none"}`,
            `projection: ${projection.activeProjection.value.id ?? "none"}`,
            `inspectable: ${projection.activeProjection.value.readiness.inspectable ? "yes" : "no"}`,
            `verification: ${projection.activeProjection.value.verification.status}`,
            `interactive: ${projection.activeProjection.value.openContext?.capabilities.interactive ? "yes" : "no"}`,
            `tasks: ${tasks.mode.value}`,
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
          if (!identity.activeIdentity.value) {
            return error("Set an identity before creating a ledger.");
          }

          const ledgerName = args.join(" ").trim();
          if (!ledgerName) {
            return error("Usage: mkledger <name>");
          }

          const result = await actions.createLedger(ledgerName);
          return result.ok ? output(`Created ledger ${result.value.entry.name}`) : error(result.error);
        }

        case "tasks": {
          const ready = await tasks.ensureReady();
          if (!ready) {
            return error(tasks.reason.value ?? "Tasks is not ready for the current projection.");
          }

          return output(
            `Tasks ready (${tasks.mode.value}) on ${tasks.activeLedgerId.value ?? "unknown"}`,
          );
        }

        case "app": {
          const mode = args[0]?.trim();
          if (mode === "open") {
            const appId = args[1]?.trim();
            if (appId && appId !== "tasks") {
              return error("Tasks is the only app available in this runtime right now.");
            }

            const ready = await tasks.ensureReady();
            return ready
              ? output(`Tasks ready (${tasks.mode.value}) on ${tasks.activeLedgerId.value ?? "unknown"}`)
              : error(tasks.reason.value ?? "Tasks is not ready for the current projection.");
          }

          return error("Usage: app open [tasks]");
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
