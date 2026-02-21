<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { Accordian, AccordianItem } from "ternent-ui/primitives";
import { useLedger } from "../../../module/ledger/useLedger";
import { buildPixPaxApiUrl } from "../../../module/pixpax/api/client";
import { usePixpaxCloudSync } from "../../../module/pixpax/context/usePixpaxCloudSync";
import { usePixbook } from "../../../module/pixpax/state/usePixbook";
import VerifyLedger from "../../../module/verify/VerifyLedger.vue";

type PackReceiptRow = {
  entryId: string;
  commitId: string;
  timestamp: string;
  author: string;
  packId: string;
  collectionId: string;
  collectionVersion: string;
  dropId: string;
  issuedTo: string;
  packRoot: string;
  itemHashes: string[];
  contentsCommitment: string;
  issuanceMode: string;
  untracked: boolean;
  issuerKeyId: string;
  issuerSignature: string;
  segmentKey: string;
  segmentHash: string;
  issuerIssuePayload: Record<string, unknown>;
  verifyUrl: string;
  packVerifyUrl: string;
};

type ReceiptVerificationResult = {
  ok: boolean;
  method: "receipt-proof" | "pack-verify";
  httpStatus: number;
  fetchedAt: string;
  response: Record<string, any> | null;
  error?: string;
};

const cloudSync = usePixpaxCloudSync();
const { receivedPacks } = usePixbook();
const { ledger } = useLedger();

const verifyingAll = shallowRef(false);
const verifyingByEntry = shallowRef<Record<string, boolean>>({});
const verifyResults = shallowRef<Record<string, ReceiptVerificationResult>>({});
let autoVerifyTimer: ReturnType<typeof setTimeout> | null = null;

const commitByEntryId = computed(() => {
  const map: Record<string, string> = {};
  for (const [commitId, commit] of Object.entries(ledger.value?.commits || {})) {
    const entryIds = Array.isArray((commit as any)?.entries)
      ? ((commit as any).entries as string[])
      : [];
    for (const entryId of entryIds) {
      map[entryId] = commitId;
    }
  }
  return map;
});

const receiptRows = computed<PackReceiptRow[]>(() => {
  return (receivedPacks.value as any[])
    .map((entry) => {
      const payload = (entry?.data || {}) as Record<string, unknown>;
      const issuerIssuePayload = (payload.issuerIssuePayload || {}) as Record<
        string,
        unknown
      >;
      const receiptRef = (payload.receiptRef || {}) as Record<string, unknown>;
      const packId = String(payload.packId || issuerIssuePayload.packId || "").trim();
      const segmentKey = String(receiptRef.segmentKey || "").trim();
      const verifyUrl = segmentKey
        ? buildPixPaxApiUrl(
            `/v1/pixpax/receipt/${encodeURIComponent(
              packId
            )}?segmentKey=${encodeURIComponent(segmentKey)}`
          )
        : "";
      const collectionId = String(issuerIssuePayload.collectionId || "").trim();
      const collectionVersion = String(
        issuerIssuePayload.collectionVersion || ""
      ).trim();
      const packVerifyUrl =
        packId && collectionId && collectionVersion
          ? buildPixPaxApiUrl(
              `/v1/pixpax/collections/${encodeURIComponent(
                collectionId
              )}/${encodeURIComponent(
                collectionVersion
              )}/packs/${encodeURIComponent(packId)}/verify`
            )
          : "";
      return {
        entryId: String(entry?.entryId || "").trim(),
        commitId: String(commitByEntryId.value[String(entry?.entryId || "")] || "").trim(),
        timestamp: String(entry?.timestamp || "").trim(),
        author: String(entry?.author || "").trim(),
        packId,
        collectionId,
        collectionVersion,
        dropId: String(issuerIssuePayload.dropId || "").trim(),
        issuedTo: String(issuerIssuePayload.issuedTo || "").trim(),
        packRoot: String(issuerIssuePayload.packRoot || "").trim(),
        itemHashes: Array.isArray(issuerIssuePayload.itemHashes)
          ? (issuerIssuePayload.itemHashes as unknown[]).map((value) =>
              String(value || "").trim()
            )
          : [],
        contentsCommitment: String(
          issuerIssuePayload.contentsCommitment || ""
        ).trim(),
        issuanceMode: String(issuerIssuePayload.issuanceMode || "").trim(),
        untracked: issuerIssuePayload.untracked === true,
        issuerKeyId: String(payload.issuerKeyId || issuerIssuePayload.issuerKeyId || "").trim(),
        issuerSignature: String(payload.issuerSignature || "").trim(),
        segmentKey,
        segmentHash: String(receiptRef.segmentHash || "").trim(),
        issuerIssuePayload,
        verifyUrl,
        packVerifyUrl,
      };
    })
    .filter((entry) => entry.packId)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
});

function formatDate(iso: string) {
  if (!iso) return "n/a";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortValue(value: string, max = 18) {
  if (!value) return "n/a";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function setVerifying(entryId: string, value: boolean) {
  verifyingByEntry.value = {
    ...verifyingByEntry.value,
    [entryId]: value,
  };
}

function verificationFor(entryId: string) {
  return verifyResults.value[entryId] || null;
}

function isVerifying(entryId: string) {
  return !!verifyingByEntry.value[entryId];
}

function isUntrackedResult(
  row: PackReceiptRow,
  result: ReceiptVerificationResult | null
) {
  if (row.untracked) return true;
  if (row.issuanceMode === "dev-untracked") return true;
  if (result?.response?.reason === "dev-untracked") return true;
  return result?.response?.checks?.signature === "skipped-untracked";
}

function verificationSummary(
  row: PackReceiptRow,
  result: ReceiptVerificationResult | null
) {
  if (!result) return "";
  const responseSummary = String(result.response?.summary || "").trim();
  if (responseSummary) return responseSummary;
  if (result.ok && result.method === "receipt-proof") {
    return "Receipt verified against issuer segment chain.";
  }
  if (result.ok && result.method === "pack-verify") {
    if (isUntrackedResult(row, result)) {
      return "Dev-untracked pack: content and structure verify; receipt proof is intentionally not expected.";
    }
    return "Pack cryptographic checks passed. Receipt segment key was not returned yet (issuer ledger flush may be pending).";
  }
  if (result.error) return `Verification failed: ${result.error}`;
  return `Verification failed: ${result.response?.reason || "unknown"}`;
}

async function verifyReceipt(row: PackReceiptRow) {
  if (!row.packId) return;
  if (!row.segmentKey) {
    if (!row.packVerifyUrl) {
      verifyResults.value = {
        ...verifyResults.value,
        [row.entryId]: {
          ok: false,
          method: "pack-verify",
          httpStatus: 0,
          fetchedAt: new Date().toISOString(),
          response: null,
          error: "No segment key stored and pack verify endpoint is unavailable.",
        },
      };
      return;
    }
    setVerifying(row.entryId, true);
    try {
      const response = await fetch(row.packVerifyUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
      const text = await response.text();
      let parsed: Record<string, any> | null = null;
      try {
        parsed = text ? (JSON.parse(text) as Record<string, any>) : null;
      } catch {
        parsed = null;
      }
      verifyResults.value = {
        ...verifyResults.value,
        [row.entryId]: {
          ok: Boolean(parsed?.ok),
          method: "pack-verify",
          httpStatus: response.status,
          fetchedAt: new Date().toISOString(),
          response: parsed,
          error: response.ok
            ? undefined
            : String(
                parsed?.reason ||
                  parsed?.error ||
                  "Pack verification failed."
              ),
        },
      };
    } catch (error: unknown) {
      verifyResults.value = {
        ...verifyResults.value,
        [row.entryId]: {
          ok: false,
          method: "pack-verify",
          httpStatus: 0,
          fetchedAt: new Date().toISOString(),
          response: null,
          error: String(
            (error as Error)?.message || "Pack verification request failed."
          ),
        },
      };
    } finally {
      setVerifying(row.entryId, false);
    }
    return;
  }

  setVerifying(row.entryId, true);
  try {
    const response = await fetch(row.verifyUrl, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    const text = await response.text();
    let parsed: Record<string, any> | null = null;
    try {
      parsed = text ? (JSON.parse(text) as Record<string, any>) : null;
    } catch {
      parsed = null;
    }

    verifyResults.value = {
      ...verifyResults.value,
      [row.entryId]: {
        ok: Boolean(parsed?.ok),
        method: "receipt-proof",
        httpStatus: response.status,
        fetchedAt: new Date().toISOString(),
        response: parsed,
        error: response.ok ? undefined : String(parsed?.reason || parsed?.error || "Verification failed."),
      },
    };
  } catch (error: unknown) {
    verifyResults.value = {
      ...verifyResults.value,
      [row.entryId]: {
        ok: false,
        method: "receipt-proof",
        httpStatus: 0,
        fetchedAt: new Date().toISOString(),
        response: null,
        error: String((error as Error)?.message || "Verification request failed."),
      },
    };
  } finally {
    setVerifying(row.entryId, false);
  }
}

async function verifyAllReceipts() {
  if (!receiptRows.value.length) return;
  verifyingAll.value = true;
  try {
    const rows = [...receiptRows.value];
    const response = await fetch(buildPixPaxApiUrl("/v1/pixpax/packs/verify-bulk"), {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        packs: rows.map((row) => ({
          packId: row.packId,
          collectionId: row.collectionId,
          collectionVersion: row.collectionVersion,
          segmentKey: row.segmentKey || null,
        })),
      }),
    });
    const text = await response.text();
    let parsed: Record<string, any> | null = null;
    try {
      parsed = text ? (JSON.parse(text) as Record<string, any>) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok || !parsed?.ok || !Array.isArray(parsed?.results)) {
      throw new Error(
        String(parsed?.error || parsed?.message || "Bulk verification failed.")
      );
    }

    const nextResults: Record<string, ReceiptVerificationResult> = {
      ...verifyResults.value,
    };
    for (const raw of parsed.results as Array<Record<string, any>>) {
      const index = Number(raw?.index);
      if (!Number.isInteger(index) || index < 0 || index >= rows.length) continue;
      const row = rows[index];
      nextResults[row.entryId] = {
        ok: raw?.ok === true,
        method: raw?.method === "receipt-proof" ? "receipt-proof" : "pack-verify",
        httpStatus: raw?.ok ? 200 : 422,
        fetchedAt: new Date().toISOString(),
        response: raw || null,
        error: raw?.ok ? undefined : String(raw?.summary || raw?.reason || "Verification failed."),
      };
    }
    verifyResults.value = nextResults;
  } catch (error) {
    for (const row of receiptRows.value) {
      await verifyReceipt(row);
    }
  } finally {
    verifyingAll.value = false;
  }
}

const receiptRowsVerificationKey = computed(() =>
  receiptRows.value
    .map(
      (row) =>
        `${row.entryId}:${row.packId}:${row.collectionId}:${row.collectionVersion}:${row.segmentKey}`
    )
    .join("|")
);

watch(
  () => receiptRowsVerificationKey.value,
  (next) => {
    if (autoVerifyTimer) {
      clearTimeout(autoVerifyTimer);
      autoVerifyTimer = null;
    }
    if (!next) {
      verifyResults.value = {};
      return;
    }
    autoVerifyTimer = setTimeout(() => {
      void verifyAllReceipts();
    }, 250);
  },
  { immediate: true }
);

function downloadVerificationBundle() {
  if (typeof window === "undefined") return;

  const payload = {
    generatedAt: new Date().toISOString(),
    ledgerHead: String(ledger.value?.head || "").trim(),
    packCount: receiptRows.value.length,
    packs: receiptRows.value.map((row) => ({
      ...row,
      verification: verificationFor(row.entryId),
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pixpax-pack-verification-${Date.now()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-lg font-semibold">Sync / Backup</h1>
    <p class="text-xs text-[var(--ui-fg-muted)]">
      Changes are persisted on this device immediately. Account sync is optional and retries safely.
    </p>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-3">
      <label class="flex items-center gap-2 text-xs">
        <input v-model="cloudSync.cloudAutoSync.value" type="checkbox" />
        Auto-sync after pack open
      </label>

      <div class="grid gap-2 md:grid-cols-2">
        <button
          type="button"
          class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
          :disabled="!cloudSync.canCloudSync.value || cloudSync.cloudSyncing.value"
          @click="cloudSync.saveCloudSnapshot()"
        >
          {{ cloudSync.cloudSyncing.value ? "Saving..." : "Save now" }}
        </button>

        <button
          type="button"
          class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
          :disabled="cloudSync.cloudSyncing.value"
          @click="cloudSync.restoreCloudSnapshot()"
        >
          Restore
        </button>
      </div>

      <div class="grid gap-2 md:grid-cols-2">
        <label class="text-xs flex flex-col gap-1">
          <span class="text-[var(--ui-fg-muted)]">Identity profile</span>
          <select
            v-model="cloudSync.selectedCloudProfileId.value"
            class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-2 py-1 text-xs"
          >
            <option value="">Select profile</option>
            <option
              v-for="entry in cloudSync.cloudProfiles.value"
              :key="entry.id"
              :value="entry.id"
            >
              {{ entry.displayName || "Identity" }}
            </option>
          </select>
        </label>
        <label class="text-xs flex flex-col gap-1">
          <span class="text-[var(--ui-fg-muted)]">Pixbook</span>
          <select
            v-model="cloudSync.selectedCloudBookId.value"
            class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-2 py-1 text-xs"
          >
            <option value="">Select pixbook</option>
            <option
              v-for="entry in cloudSync.filteredCloudBooks.value"
              :key="entry.id"
              :value="entry.id"
            >
              {{ entry.name }} (v{{ entry.currentVersion }})
            </option>
          </select>
        </label>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
          :disabled="cloudSync.cloudLibraryLoading.value"
          @click="cloudSync.refreshCloudLibrary()"
        >
          {{ cloudSync.cloudLibraryLoading.value ? "Refreshing..." : "Refresh library" }}
        </button>
        <button
          type="button"
          class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
          :disabled="cloudSync.cloudSyncing.value || !cloudSync.selectedCloudBookId.value"
          @click="cloudSync.openSelectedCloudBook()"
        >
          Open selected pixbook
        </button>
      </div>

      <p v-if="cloudSync.cloudSnapshotVersion.value !== null" class="text-xs text-[var(--ui-fg-muted)]">
        Latest snapshot v{{ cloudSync.cloudSnapshotVersion.value }}
        <span v-if="cloudSync.cloudSnapshotAt.value">({{ new Date(cloudSync.cloudSnapshotAt.value).toLocaleString() }})</span>
      </p>
      <p v-if="cloudSync.cloudLibraryError.value" class="text-xs text-amber-600">
        {{ cloudSync.cloudLibraryError.value }}
      </p>
      <p v-if="cloudSync.cloudSyncStatus.value" class="text-xs text-green-600">
        {{ cloudSync.cloudSyncStatus.value }}
      </p>
      <p v-if="cloudSync.cloudSyncError.value" class="text-xs text-red-600">
        {{ cloudSync.cloudSyncError.value }}
      </p>
    </section>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-semibold">Pack Issuance Verification</h2>
          <p class="text-xs text-[var(--ui-fg-muted)]">
            Every opened pack with receipt refs, issuer payload, and direct verification endpoint.
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
            :disabled="verifyingAll || !receiptRows.length"
            @click="verifyAllReceipts"
          >
            {{ verifyingAll ? "Verifying..." : "Verify all receipts" }}
          </button>
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
            :disabled="!receiptRows.length"
            @click="downloadVerificationBundle"
          >
            Export verification bundle
          </button>
        </div>
      </div>

      <p v-if="!receiptRows.length" class="text-xs text-[var(--ui-fg-muted)]">
        No opened packs recorded in this pixbook yet.
      </p>

      <Accordian v-else>
        <AccordianItem
          v-for="row in receiptRows"
          :key="row.entryId"
          :value="row.entryId"
        >
          <template #title>
            <div class="flex-1 flex items-center gap-2 min-w-0">
              <span class="text-sm font-semibold">Pack {{ shortValue(row.packId, 20) }}</span>
              <span
                class="text-[10px] uppercase tracking-wide rounded-full border border-[var(--ui-border)] px-2 py-0.5 text-[var(--ui-fg-muted)]"
              >
                {{ row.collectionId || "collection" }} {{ row.collectionVersion || "" }}
              </span>
              <span
                v-if="isUntrackedResult(row, verificationFor(row.entryId))"
                class="text-[10px] uppercase tracking-wide rounded-full border border-amber-600/40 px-2 py-0.5 text-amber-700"
              >
                untracked
              </span>
              <span
                v-else-if="verificationFor(row.entryId)?.ok && verificationFor(row.entryId)?.method === 'receipt-proof'"
                class="text-[10px] uppercase tracking-wide rounded-full border border-green-600/40 px-2 py-0.5 text-green-600"
              >
                verified
              </span>
              <span
                v-else-if="verificationFor(row.entryId)?.ok"
                class="text-[10px] uppercase tracking-wide rounded-full border border-sky-600/40 px-2 py-0.5 text-sky-700"
              >
                checked
              </span>
              <span
                v-else-if="verificationFor(row.entryId)"
                class="text-[10px] uppercase tracking-wide rounded-full border border-red-600/40 px-2 py-0.5 text-red-600"
              >
                failed
              </span>
            </div>
            <div class="text-xs text-[var(--ui-fg-muted)]">{{ formatDate(row.timestamp) }}</div>
          </template>

          <div class="p-2 bg-[var(--ui-surface)] rounded-md flex flex-col gap-3">
            <div class="grid gap-2 md:grid-cols-2 text-xs">
              <p><span class="text-[var(--ui-fg-muted)]">Pack ID:</span> <code>{{ row.packId || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Drop:</span> <code>{{ row.dropId || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Ledger entry:</span> <code>{{ row.entryId || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Commit:</span> <code>{{ row.commitId || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Ledger author:</span> <code>{{ row.author || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Receipt segment key:</span> <code>{{ row.segmentKey || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Receipt segment hash:</span> <code>{{ row.segmentHash || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Issuer key ID:</span> <code>{{ row.issuerKeyId || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Issued to:</span> <code>{{ row.issuedTo || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Pack root:</span> <code>{{ row.packRoot || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Contents commitment:</span> <code>{{ row.contentsCommitment || "n/a" }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Issuance mode:</span> <code>{{ row.issuanceMode || (row.untracked ? "dev-untracked" : "tracked") }}</code></p>
              <p><span class="text-[var(--ui-fg-muted)]">Item hash count:</span> <code>{{ row.itemHashes.length }}</code></p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
                :disabled="isVerifying(row.entryId)"
                @click="verifyReceipt(row)"
              >
                {{ isVerifying(row.entryId) ? "Verifying..." : "Verify receipt" }}
              </button>
              <a
                v-if="row.verifyUrl"
                :href="row.verifyUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
              >
                Open receipt endpoint
              </a>
            </div>

            <div v-if="verificationFor(row.entryId)" class="text-xs rounded-md border border-[var(--ui-border)] p-2">
              <p
                :class="
                  verificationFor(row.entryId)?.ok ? 'text-green-600' : 'text-red-600'
                "
              >
                {{ verificationSummary(row, verificationFor(row.entryId)) }}
              </p>
              <p class="text-[var(--ui-fg-muted)]">
                {{ verificationFor(row.entryId)?.method === "pack-verify" ? "Pack verify" : "Receipt proof" }} ·
                HTTP {{ verificationFor(row.entryId)?.httpStatus || 0 }} · Checked
                {{ formatDate(verificationFor(row.entryId)?.fetchedAt || "") }}
              </p>
              <p
                v-if="verificationFor(row.entryId)?.response?.checkpoint?.headSegmentKey"
                class="text-[var(--ui-fg-muted)]"
              >
                Checkpoint head:
                <code>{{ verificationFor(row.entryId)?.response?.checkpoint?.headSegmentKey }}</code>
              </p>
            </div>

            <details class="rounded-md border border-[var(--ui-border)] p-2">
              <summary class="cursor-pointer text-xs font-semibold">Issuer payload + signature</summary>
              <pre class="mt-2 text-[11px] overflow-auto">{{
                JSON.stringify(
                  {
                    issuerIssuePayload: row.issuerIssuePayload,
                    issuerSignature: row.issuerSignature,
                    issuerKeyId: row.issuerKeyId,
                    receiptRef: {
                      segmentKey: row.segmentKey,
                      segmentHash: row.segmentHash,
                    },
                  },
                  null,
                  2
                )
              }}</pre>
            </details>

            <details
              v-if="verificationFor(row.entryId)?.response"
              class="rounded-md border border-[var(--ui-border)] p-2"
            >
              <summary class="cursor-pointer text-xs font-semibold">Verification response</summary>
              <pre class="mt-2 text-[11px] overflow-auto">{{
                JSON.stringify(verificationFor(row.entryId)?.response, null, 2)
              }}</pre>
            </details>
          </div>
        </AccordianItem>
      </Accordian>
    </section>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-3">
      <h2 class="text-sm font-semibold">Concord Ledger Health</h2>
      <p class="text-xs text-[var(--ui-fg-muted)]">
        Validates commit chain integrity, entry IDs, and entry signatures for this pixbook ledger.
      </p>
      <VerifyLedger :ledger="ledger" />
    </section>
  </div>
</template>
