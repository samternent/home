import { computed, ref } from "vue";
import { useRunTerminalLanguage } from "@/modules/run/services";
import { useRunExplorerSurface } from "./useRunExplorerSurface";
import type { RunTerminalEntry, RunTerminalSurface } from "./types";

let singleton: RunTerminalSurface | null = null;
let entryId = 0;

function createTerminalEntry(kind: RunTerminalEntry["kind"], lines: string[]): RunTerminalEntry {
  entryId += 1;
  return {
    id: `terminal:${entryId}`,
    kind,
    lines,
  };
}

function createTerminalSurface(): RunTerminalSurface {
  const language = useRunTerminalLanguage();
  const explorer = useRunExplorerSurface();
  const history = ref<RunTerminalEntry[]>([
    createTerminalEntry("output", [
      "Verified workspace terminal ready.",
      "Try: help, ls, pwd, cd private, select journal, mkdir notes, mkledger journal, app open tasks",
    ]),
  ]);
  const draft = ref("");

  async function run(input: string) {
    const trimmed = input.trim();
    if (!trimmed) {
      return false;
    }

    draft.value = "";
    history.value = [...history.value, createTerminalEntry("command", [`$ ${trimmed}`])];
    const result = await language.execute(trimmed);

    if (result.clear) {
      history.value = [];
    }

    if (result.chunks.length) {
      history.value = [
        ...history.value,
        ...result.chunks.map((chunk) => createTerminalEntry(chunk.kind, chunk.lines)),
      ];
    }

    return result.handled;
  }

  return {
    history: computed(() => history.value),
    draft: computed(() => draft.value),
    promptPath: computed(() => explorer.currentPath.value || "/"),
    run,
    setDraft(input: string) {
      draft.value = input;
    },
    clear() {
      history.value = [];
      draft.value = "";
    },
  };
}

export function useRunTerminalSurface(): RunTerminalSurface {
  if (!singleton) {
    singleton = createTerminalSurface();
  }

  return singleton;
}
