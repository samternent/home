<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { LedgerContainer } from "@ternent/concord-protocol";
import {
  deriveCommitId,
  deriveEntryId,
  getCommitChain,
  getEntrySigningPayload,
} from "@ternent/concord-protocol";
import { importPublicKeyFromPem, verify } from "ternent-identity";

type VerificationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
  commitId?: string;
  entryId?: string;
};

type VerificationStatus = {
  status: "idle" | "verifying" | "ok" | "error";
  issues: VerificationIssue[];
};

const props = defineProps<{
  ledger: LedgerContainer | null;
  compact?: boolean;
}>();

const emit = defineEmits<{
  (event: "status", payload: VerificationStatus): void;
}>();

type VerificationResult = {
  status: "idle" | "verifying" | "ok" | "error";
  errors: string[];
  warnings: string[];
  checkedAt: string | null;
  issues: VerificationIssue[];
};

const result = ref<VerificationResult>({
  status: "idle",
  errors: [],
  warnings: [],
  checkedAt: null,
  issues: [],
});

const issueCount = computed(
  () => result.value.errors.length + result.value.warnings.length
);

let runId = 0;

watch(
  () => props.ledger,
  async (nextLedger) => {
    const current = ++runId;
    if (!nextLedger) {
      result.value = {
        status: "idle",
        errors: [],
        warnings: [],
        checkedAt: null,
        issues: [],
      };
      emit("status", { status: "idle", issues: [] });
      return;
    }

    result.value = {
      status: "verifying",
      errors: [],
      warnings: [],
      checkedAt: result.value.checkedAt,
      issues: [],
    };
    emit("status", { status: "verifying", issues: [] });

    const errors: string[] = [];
    const warnings: string[] = [];
    const issues: VerificationIssue[] = [];
    const ledger = nextLedger;

    const pushIssue = (issue: VerificationIssue) => {
      issues.push(issue);
      if (issue.level === "error") {
        errors.push(issue.message);
      } else {
        warnings.push(issue.message);
      }
    };

    const commitIds = Object.keys(ledger.commits || {});
    const entryIds = Object.keys(ledger.entries || {});

    if (!ledger.head || !ledger.commits[ledger.head]) {
      pushIssue({
        level: "error",
        code: "ledger-head-missing",
        message: "Ledger head is missing or not found in commits.",
      });
    }

    try {
      const chain = getCommitChain(ledger);
      for (let i = 1; i < chain.length; i += 1) {
        const currentCommit = ledger.commits[chain[i]];
        if (currentCommit?.parent !== chain[i - 1]) {
          pushIssue({
            level: "error",
            code: "commit-parent-mismatch",
            commitId: chain[i],
            message: `Commit parent mismatch at ${chain[i]}.`,
          });
        }
      }

      if (chain.length !== commitIds.length) {
        pushIssue({
          level: "warning",
          code: "commit-chain-diverges",
          message: "Ledger contains commits outside the head chain.",
        });
      }
    } catch (err) {
      pushIssue({
        level: "error",
        code: "commit-chain-invalid",
        message: `Commit chain invalid: ${
          (err as Error)?.message || String(err)
        }`,
      });
    }

    for (const commitId of commitIds) {
      const commit = ledger.commits[commitId];
      try {
        const expectedId = await deriveCommitId(commit);
        if (expectedId !== commitId) {
          pushIssue({
            level: "error",
            code: "commit-hash-mismatch",
            commitId,
            message: `Commit hash mismatch for ${commitId}.`,
          });
        }
      } catch (err) {
        pushIssue({
          level: "error",
          code: "commit-hash-error",
          commitId,
          message: `Commit hash error for ${commitId}: ${
            (err as Error)?.message || String(err)
          }`,
        });
      }

      for (const entryId of commit.entries || []) {
        if (!ledger.entries[entryId]) {
          pushIssue({
            level: "error",
            code: "commit-missing-entry",
            commitId,
            entryId,
            message: `Commit ${commitId} references missing entry ${entryId}.`,
          });
        }
      }
    }

    const authorKeyCache = new Map<string, CryptoKey>();

    for (const entryId of entryIds) {
      const entry = ledger.entries[entryId];
      if (!entry) continue;

      try {
        const expectedId = await deriveEntryId(entry);
        if (expectedId !== entryId) {
          pushIssue({
            level: "error",
            code: "entry-hash-mismatch",
            entryId,
            message: `Entry hash mismatch for ${entryId}.`,
          });
        }
      } catch (err) {
        pushIssue({
          level: "error",
          code: "entry-hash-error",
          entryId,
          message: `Entry hash error for ${entryId}: ${
            (err as Error)?.message || String(err)
          }`,
        });
      }

      if (!entry.signature) {
        pushIssue({
          level: "error",
          code: "entry-signature-missing",
          entryId,
          message: `Entry ${entryId} is missing a signature.`,
        });
        continue;
      }

      if (!entry.author) {
        pushIssue({
          level: "error",
          code: "entry-author-missing",
          entryId,
          message: `Entry ${entryId} is missing an author.`,
        });
        continue;
      }

      try {
        let authorKey = authorKeyCache.get(entry.author);
        if (!authorKey) {
          authorKey = await importPublicKeyFromPem(entry.author);
          authorKeyCache.set(entry.author, authorKey);
        }
        const payload = getEntrySigningPayload(entry);
        const ok = await verify(entry.signature, payload, authorKey);
        if (!ok) {
          pushIssue({
            level: "error",
            code: "entry-signature-invalid",
            entryId,
            message: `Entry signature invalid for ${entryId}.`,
          });
        }
      } catch (err) {
        pushIssue({
          level: "error",
          code: "entry-signature-error",
          entryId,
          message: `Entry signature error for ${entryId}: ${
            (err as Error)?.message || String(err)
          }`,
        });
      }
    }

    if (current !== runId) return;
    result.value = {
      status: errors.length ? "error" : "ok",
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
      issues,
    };
    emit("status", { status: result.value.status, issues });
  },
  { immediate: true }
);
</script>

<template>
  <div
    :class="
      props.compact
        ? 'flex items-center gap-2 text-xs'
        : 'border border-[var(--ui-border)] rounded-2xl p-4 flex flex-col gap-2'
    "
  >
    <template v-if="props.compact">
      <span
        class="inline-flex size-3 rounded-full"
        :class="
          result.status === 'ok'
            ? 'bg-[var(--success)]'
            : result.status === 'error'
            ? 'bg-[var(--critical)]'
            : 'bg-[var(--ui-fg-muted)]'
        "
      ></span>
      <span
        :class="
          result.status === 'ok'
            ? 'text-[var(--text-success)]'
            : result.status === 'error'
            ? 'text-[var(--text-critical)]'
            : 'text-[var(--ui-fg-muted)]'
        "
      >
        {{
          result.status === "verifying"
            ? "Verifying..."
            : result.status === "ok"
            ? ""
            : result.status === "error"
            ? `${issueCount} issue${issueCount === 1 ? "" : "s"}`
            : "Ledger idle"
        }}
      </span>
    </template>

    <template v-else>
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs uppercase tracking-wide opacity-60">
          Ledger verification
        </div>
        <div
          class="text-xs"
          :class="
            result.status === 'ok'
              ? 'text-green-600'
              : result.status === 'error'
              ? 'text-red-600'
              : 'text-[var(--ui-fg-muted)]'
          "
        >
          {{
            result.status === "verifying"
              ? "Verifying..."
              : result.status === "ok"
              ? "OK"
              : result.status === "error"
              ? `${issueCount} issue${issueCount === 1 ? "" : "s"}`
              : "Idle"
          }}
        </div>
      </div>

      <p v-if="result.checkedAt" class="text-xs opacity-60">
        Last checked: {{ new Date(result.checkedAt).toLocaleString() }}
      </p>

      <p v-if="result.errors.length" class="text-xs text-red-600">
        {{ result.errors[0] }}
      </p>
      <p v-else-if="result.warnings.length" class="text-xs text-yellow-600">
        {{ result.warnings[0] }}
      </p>
      <p v-else-if="result.status === 'ok'" class="text-xs text-green-600">
        All ledger checks passed.
      </p>

      <details v-if="result.errors.length || result.warnings.length">
        <summary class="text-xs cursor-pointer text-[var(--ui-fg-muted)]">
          View details
        </summary>
        <div class="mt-2 flex flex-col gap-2">
          <div v-if="result.errors.length" class="text-xs text-red-600">
            <div v-for="(err, index) in result.errors" :key="`err-${index}`">
              {{ err }}
            </div>
          </div>
          <div v-if="result.warnings.length" class="text-xs text-yellow-700">
            <div
              v-for="(warn, index) in result.warnings"
              :key="`warn-${index}`"
            >
              {{ warn }}
            </div>
          </div>
        </div>
      </details>
    </template>
  </div>
</template>
