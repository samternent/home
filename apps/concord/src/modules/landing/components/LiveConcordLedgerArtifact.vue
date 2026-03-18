<script setup lang="ts">
import { computed, onMounted } from "vue";
import { Badge, Button, Card, TreeView } from "ternent-ui/primitives";
import type { TreeNode } from "ternent-ui/primitives";
import { useConcordLandingDemo } from "@/modules/landing/useConcordLandingDemo";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const props = defineProps<{
  section: {
    supportingText?: string;
  };
}>();

const demo = useConcordLandingDemo();

const validationChecks = computed(() => [
  {
    label: "document valid",
    valid: demo.state.verification?.valid ?? false,
  },
  {
    label: "commit linkage valid",
    valid: demo.state.verification?.commitChainValid ?? false,
  },
  {
    label: "commit proofs valid",
    valid: demo.state.verification?.commitProofsValid ?? false,
  },
  {
    label: "entry identities valid",
    valid: demo.state.verification?.entriesValid ?? false,
  },
  {
    label: "entry proofs valid",
    valid: demo.state.verification?.entryProofsValid ?? false,
  },
  {
    label: "payload hashes valid",
    valid: demo.state.verification?.payloadHashesValid ?? false,
  },
]);

const tamperTitle = computed(() => {
  if (demo.state.selectedTamper === "none") {
    return "Artifact intact";
  }

  return (
    demo.tamperActions.find((action) => action.id === demo.state.selectedTamper)?.label ??
    "Tamper applied"
  );
});

const tamperDescription = computed(() => {
  if (demo.state.selectedTamper === "none") {
    return "Tamper the artifact to see how validation fails.";
  }

  return (
    demo.tamperActions.find((action) => action.id === demo.state.selectedTamper)?.description ??
    "Any invalid committed byte invalidates the whole document."
  );
});

const diagnosisLine = computed(() => {
  if (!demo.state.verification || demo.state.verification.valid) {
    return "Any invalid committed byte invalidates the whole document. Concord diagnoses precisely, but fails globally.";
  }

  const invalidCommits = demo.state.verification.invalidCommitIds.length;
  const invalidEntries = demo.state.verification.invalidEntryIds.length;

  return [
    invalidCommits > 0 ? `${invalidCommits} commit boundary${invalidCommits === 1 ? "" : "ies"} flagged` : null,
    invalidEntries > 0 ? `${invalidEntries} entry record${invalidEntries === 1 ? "" : "s"} flagged` : null,
    "Concord diagnoses precisely, but fails globally.",
  ]
    .filter(Boolean)
    .join(" ");
});

const artifactNodes = computed<TreeNode[]>(() => {
  const artifact = demo.state.ledgerArtifact;
  const highlightedPaths = [...demo.state.highlightedPaths];

  if (!artifact) {
    return [];
  }

  return Object.entries(artifact).map(([key, value]) =>
    buildTreeNode(key, value as JsonValue, `ledger/${key}`, highlightedPaths),
  );
});

const treeKey = computed(() =>
  demo.state.selectedTamper === "none"
    ? "artifact-intact"
    : `artifact-${demo.state.selectedTamper}-${demo.state.highlightedPaths.join("|")}`,
);

const expandedDepth = computed(() =>
  demo.state.selectedTamper === "none" ? 0 : 6,
);

onMounted(() => {
  void demo.ensureStarted();
});

function formatValue(value: JsonValue) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) return "null";
  return String(value);
}

function truncate(value: string, max = 42) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function isHighlighted(path: string, highlightedPaths: string[]) {
  return highlightedPaths.includes(path);
}

function isWithinHighlightedNode(path: string, highlightedPaths: string[]) {
  return highlightedPaths.some(
    (highlightedPath) =>
      highlightedPath.startsWith(`${path}/`) || highlightedPath === path,
  );
}

function buildTreeNode(
  label: string,
  value: JsonValue,
  path: string,
  highlightedPaths: string[],
): TreeNode {
  const tone = isWithinHighlightedNode(path, highlightedPaths)
    ? "critical"
    : "default";
  const badge = isHighlighted(path, highlightedPaths) ? "tampered" : undefined;

  if (Array.isArray(value)) {
    return {
      id: path,
      label,
      meta: `${value.length} items`,
      tone,
      badge,
      children: value.map((child, index) =>
        buildTreeNode(`[${index}]`, child, `${path}/${index}`, highlightedPaths),
      ),
    };
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    return {
      id: path,
      label,
      meta: `${entries.length} keys`,
      tone,
      badge,
      children: entries.map(([key, child]) =>
        buildTreeNode(
          key,
          child as JsonValue,
          `${path}/${key}`,
          highlightedPaths,
        ),
      ),
    };
  }

  return {
    id: path,
    label,
    value: truncate(formatValue(value)),
    rawValue: value,
    tone,
    badge,
  };
}

function runTamper(id: (typeof demo.tamperActions)[number]["id"]) {
  void demo.setTamperScenario(id);
}

function resetTamper() {
  void demo.resetTamperScenario();
}
</script>

<template>
  <div class="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_19rem]">
    <Card variant="panel" padding="sm" class="overflow-hidden">
      <div
        class="flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] px-4 py-3"
      >
        <div>
          <p
            class="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
          >
            concord-ledger.json
          </p>
          <p class="mt-1 m-0 text-sm text-[var(--ui-fg-muted)]">
            Load the artifact, probe a signed boundary, and watch Concord fail globally.
          </p>
        </div>
        <Badge
          :tone="demo.state.verification?.valid ? 'success' : 'critical'"
          variant="outline"
          size="xs"
        >
          {{ demo.state.verification?.valid ? "artifact valid" : "artifact invalid" }}
        </Badge>
      </div>

      <div class="grid gap-4 p-4 sm:p-5">
        <div
          class="flex flex-wrap items-start justify-between gap-3 rounded-[calc(var(--ui-radius-lg)-6px)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_84%,transparent)] px-3 py-3"
        >
          <div class="space-y-1">
            <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">
              {{ tamperTitle }}
            </p>
            <p class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]">
              {{ tamperDescription }}
            </p>
          </div>
          <Badge
            :tone="demo.state.selectedTamper === 'none' ? 'neutral' : 'critical'"
            variant="soft"
            size="xs"
          >
            {{ demo.state.selectedTamper === "none" ? "intact" : "tampered" }}
          </Badge>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            v-for="action in demo.tamperActions"
            :key="action.id"
            size="xs"
            :variant="
              demo.state.selectedTamper === action.id ? 'critical-secondary' : 'plain-secondary'
            "
            :disabled="demo.state.isMutating || !demo.state.baseLedgerArtifact"
            @click="runTamper(action.id)"
          >
            {{ action.label }}
          </Button>
          <Button
            size="xs"
            variant="secondary"
            :disabled="demo.state.isMutating || demo.state.selectedTamper === 'none'"
            @click="resetTamper"
          >
            Reset
          </Button>
        </div>

        <TreeView
          v-if="artifactNodes.length > 0"
          :key="treeKey"
          :nodes="artifactNodes"
          aria-label="Concord ledger artifact"
          :default-expanded-depth="expandedDepth"
          text-size="sm"
        />
        <p
          v-else
          class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]"
        >
          Loading exported ledger artifact...
        </p>
      </div>
    </Card>

    <Card variant="subtle" padding="md" class="self-start">
      <div class="space-y-4">
        <div class="space-y-2">
          <p
            class="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
          >
            Validation
          </p>
          <Badge
            :tone="demo.state.verification?.valid ? 'success' : 'critical'"
            variant="soft"
          >
            {{ demo.state.verification?.valid ? "valid" : "invalid" }}
          </Badge>
        </div>

        <div class="space-y-3">
          <div
            v-for="check in validationChecks"
            :key="check.label"
            class="flex items-center justify-between gap-4 border-b border-[color-mix(in_srgb,var(--ui-border)_70%,transparent)] pb-3 text-sm last:border-b-0 last:pb-0"
          >
            <span class="text-[var(--ui-fg)]">{{ check.label }}</span>
            <span
              :class="
                check.valid
                  ? 'text-[var(--ui-success)]'
                  : 'text-[var(--ui-critical)]'
              "
            >
              {{ check.valid ? "ok" : "fail" }}
            </span>
          </div>
        </div>

        <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
          {{ diagnosisLine }}
        </p>
      </div>
    </Card>
  </div>

  <p
    v-if="props.section.supportingText"
    class="mt-4 m-0 text-sm leading-7 text-[var(--ui-fg-muted)]"
  >
    {{ props.section.supportingText }}
  </p>
</template>
