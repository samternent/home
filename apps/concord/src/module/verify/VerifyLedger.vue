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

const props = defineProps<{
  ledger: LedgerContainer | null;
}>();

type VerificationResult = {
  status: "idle" | "verifying" | "ok" | "error";
  errors: string[];
  warnings: string[];
  checkedAt: string | null;
};

const result = ref<VerificationResult>({
  status: "idle",
  errors: [],
  warnings: [],
  checkedAt: null,
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
      };
      return;
    }

    result.value = {
      status: "verifying",
      errors: [],
      warnings: [],
      checkedAt: result.value.checkedAt,
    };
    const errors: string[] = [];
    const warnings: string[] = [];
    const ledger = nextLedger;

    const commitIds = Object.keys(ledger.commits || {});
    const entryIds = Object.keys(ledger.entries || {});

    if (!ledger.head || !ledger.commits[ledger.head]) {
      errors.push("Ledger head is missing or not found in commits.");
    }

    try {
      const chain = getCommitChain(ledger);
      for (let i = 1; i < chain.length; i += 1) {
        const currentCommit = ledger.commits[chain[i]];
        if (currentCommit?.parent !== chain[i - 1]) {
          errors.push(`Commit parent mismatch at ${chain[i]}.`);
        }
      }

      if (chain.length !== commitIds.length) {
        warnings.push("Ledger contains commits outside the head chain.");
      }
    } catch (err) {
      errors.push(
        `Commit chain invalid: ${(err as Error)?.message || String(err)}`
      );
    }

    for (const commitId of commitIds) {
      const commit = ledger.commits[commitId];
      try {
        const expectedId = await deriveCommitId(commit);
        if (expectedId !== commitId) {
          errors.push(`Commit hash mismatch for ${commitId}.`);
        }
      } catch (err) {
        errors.push(
          `Commit hash error for ${commitId}: ${(err as Error)?.message || String(err)}`
        );
      }

      for (const entryId of commit.entries || []) {
        if (!ledger.entries[entryId]) {
          errors.push(
            `Commit ${commitId} references missing entry ${entryId}.`
          );
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
          errors.push(`Entry hash mismatch for ${entryId}.`);
        }
      } catch (err) {
        errors.push(
          `Entry hash error for ${entryId}: ${(err as Error)?.message || String(err)}`
        );
      }

      if (!entry.signature) {
        errors.push(`Entry ${entryId} is missing a signature.`);
        continue;
      }

      if (!entry.author) {
        errors.push(`Entry ${entryId} is missing an author.`);
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
          errors.push(`Entry signature invalid for ${entryId}.`);
        }
      } catch (err) {
        errors.push(
          `Entry signature error for ${entryId}: ${(err as Error)?.message || String(err)}`
        );
      }
    }

    if (current !== runId) return;
    result.value = {
      status: errors.length ? "error" : "ok",
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
    };
  },
  { immediate: true }
);
</script>

<template>
  <div class="border border-[var(--rule)] rounded-2xl p-4 flex flex-col gap-2">
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
              : 'text-[var(--muted)]'
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
      <summary class="text-xs cursor-pointer text-[var(--muted)]">
        View details
      </summary>
      <div class="mt-2 flex flex-col gap-2">
        <div v-if="result.errors.length" class="text-xs text-red-600">
          <div v-for="(err, index) in result.errors" :key="`err-${index}`">
            {{ err }}
          </div>
        </div>
        <div v-if="result.warnings.length" class="text-xs text-yellow-700">
          <div v-for="(warn, index) in result.warnings" :key="`warn-${index}`">
            {{ warn }}
          </div>
        </div>
      </div>
    </details>
  </div>
</template>
