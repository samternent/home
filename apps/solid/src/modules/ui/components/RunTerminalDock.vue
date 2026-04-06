<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { Button } from "ternent-ui/primitives";
import { useRunCoreRuntime } from "@/modules/run/core";
import { useAppShellState } from "@/modules/ui/useAppShellState";
import type { RunTerminalEntry } from "@/modules/run/surfaces";

const runtime = useRunCoreRuntime();
const shellState = useAppShellState();
const containerRef = ref<HTMLElement | null>(null);
let term: Terminal | null = null;
let currentLine = "";
let renderedEntryCount = 0;

function writePrompt() {
  if (!term) {
    return;
  }

  const path = runtime.terminal.promptPath.value || "~";
  term.write("\x1b[1;32mrun@solid\x1b[0m ");
  term.write(`\x1b[1;34m${path}\x1b[0m `);
  term.write("\x1b[0m$ ");
  if (currentLine) {
    term.write(currentLine);
  }
}

function writeEntry(entry: RunTerminalEntry) {
  if (!term) {
    return;
  }

  for (const line of entry.lines) {
    if (entry.kind === "error") {
      term.writeln(`\x1b[31m${line}\x1b[0m`);
      continue;
    }

    term.writeln(line);
  }
}

function syncHistory(entries: RunTerminalEntry[]) {
  if (!term) {
    return;
  }

  if (entries.length < renderedEntryCount) {
    term.clear();
    renderedEntryCount = 0;
  }

  for (const entry of entries.slice(renderedEntryCount)) {
    writeEntry(entry);
  }

  renderedEntryCount = entries.length;
}

async function submitCurrentLine() {
  if (!term) {
    return;
  }

  const submittedLine = currentLine;
  term.write("\r\n");
  currentLine = "";

  if (!submittedLine.trim()) {
    runtime.terminal.setDraft("");
    writePrompt();
    return;
  }

  renderedEntryCount += 1;
  await runtime.terminal.run(submittedLine);
  currentLine = runtime.terminal.draft.value;
  syncHistory(runtime.terminal.history.value);
  writePrompt();
}

function mountTerminal() {
  if (term || !containerRef.value) {
    return;
  }

  term = new Terminal({
    cursorBlink: true,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 13,
    lineHeight: 1.5,
    theme: {
      background: "#181818",
    },
  });

  term.open(containerRef.value);
  currentLine = runtime.terminal.draft.value;
  syncHistory(runtime.terminal.history.value);
  writePrompt();

  term.onData((data) => {
    const code = data.charCodeAt(0);

    if (code === 13) {
      void submitCurrentLine();
      return;
    }

    if (code === 127) {
      if (currentLine.length > 0) {
        currentLine = currentLine.slice(0, -1);
        runtime.terminal.setDraft(currentLine);
        term?.write("\b \b");
      }
      return;
    }

    if (code >= 32) {
      currentLine += data;
      runtime.terminal.setDraft(currentLine);
      term?.write(data);
    }
  });
}

onMounted(() => {
  mountTerminal();
});

onBeforeUnmount(() => {
  term?.dispose();
  term = null;
});

watch(
  () => runtime.terminal.history.value,
  (entries) => {
    syncHistory(entries);
  },
  { deep: true },
);

watch(
  () => runtime.terminal.draft.value,
  (nextDraft) => {
    currentLine = nextDraft;
  },
);

watch(
  containerRef,
  () => {
    mountTerminal();
  },
);
</script>

<template>
  <section class="pointer-events-auto fixed inset-x-4 bottom-14 z-40">
    <div class="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/95 shadow-2xl backdrop-blur-xl">
      <div class="flex items-center justify-between border-b border-[var(--ui-border)] px-4 py-3">
        <div>
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Terminal
          </p>
          <p class="m-0 mt-1 text-xs text-[var(--ui-fg-muted)]">
            Commands target the active ledger and projection.
          </p>
        </div>
        <Button size="xs" variant="plain-secondary" @click="shellState.closeTerminal()">
          Hide
        </Button>
      </div>
      <div ref="containerRef" class="h-[320px] bg-[#181818] p-4" />
    </div>
  </section>
</template>
