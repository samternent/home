<script setup lang="ts">
import type { LedgerContainer, LedgerEntryRecord } from "@ternent/ledger";
import { computed, ref } from "vue";
import { Button, TreeView } from "ternent-ui/primitives";
import { useAppApi } from "@/app/api";
import { DEFAULT_CONCORD_STORAGE_KEY } from "@/app/runtime";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type TreeNode = {
  id: string;
  label: string;
  meta?: string;
  value?: string;
  children?: TreeNode[];
};

type ConcordStorageSnapshot = {
  container: LedgerContainer | null;
  staged: LedgerEntryRecord[];
};

const appApi = useAppApi();
const loading = ref(false);
const error = ref<string | null>(null);
const snapshot = ref<ConcordStorageSnapshot>({
  container: null,
  staged: [],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isLedgerEntryRecord(value: unknown): value is LedgerEntryRecord {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.entryId === "string" &&
    typeof value.kind === "string" &&
    typeof value.authoredAt === "string" &&
    typeof value.author === "string" &&
    isRecord(value.payload) &&
    isRecord(value.seal)
  );
}

function isLedgerContainer(value: unknown): value is LedgerContainer {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.format === "concord-ledger" &&
    value.version === "1" &&
    typeof value.head === "string" &&
    isRecord(value.commits) &&
    isRecord(value.entries)
  );
}

async function refreshSnapshot(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    await appApi.load();

    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(DEFAULT_CONCORD_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            container?: unknown;
            staged?: unknown;
          };
          snapshot.value = {
            container: isLedgerContainer(parsed.container) ? parsed.container : null,
            staged: Array.isArray(parsed.staged)
              ? parsed.staged.filter(isLedgerEntryRecord)
              : ([] as LedgerEntryRecord[]),
          };
          return;
        } catch {
          // Fall through to runtime export.
        }
      }
    }

    const ledger = await appApi.exportLedger();
    snapshot.value = {
      container: ledger,
      staged: [],
    };
  } catch (nextError) {
    error.value = nextError instanceof Error ? nextError.message : String(nextError);
  } finally {
    loading.value = false;
  }
}

void refreshSnapshot();

appApi.subscribe(refreshSnapshot)

function formatValue(value: JsonValue): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  return String(value);
}

function truncate(value: string, max = 56): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 3)}...`;
}

function buildTreeNode(label: string, value: JsonValue, path: string): TreeNode {
  if (Array.isArray(value)) {
    return {
      id: path,
      label,
      meta: `${value.length} items`,
      children: value.map((item, index) => buildTreeNode(`[${index}]`, item, `${path}/${index}`)),
    };
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    return {
      id: path,
      label,
      meta: `${entries.length} keys`,
      children: entries.map(([key, child]) => buildTreeNode(key, child, `${path}/${key}`)),
    };
  }

  return {
    id: path,
    label,
    value: truncate(formatValue(value)),
  };
}

const treeNodes = computed(() => {
  const documentValue: JsonValue = {
    container: snapshot.value.container,
    staged: snapshot.value.staged,
  };
  return [buildTreeNode("LedgerDocument", documentValue, "ledger")];
});
</script>

<template>
  <section class="flex flex-col p-4 bg-[var(--ui-surface)] font-mono" data-test="tamper-v0">

    <p v-if="error" class="mt-3 rounded-md border border-[var(--ui-critical)] p-2 text-xs text-[var(--ui-critical)]">
      {{ error }}
    </p>

    <TreeView
      :nodes="treeNodes"
      :default-expanded-depth="2"
      aria-label="Concord tamper tree view"
      text-size="xs"
    />
  </section>
</template>
