<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Button } from "ternent-ui/primitives";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import {
  PixPaxApiError,
  type PixPaxAnalyticsResponse,
  getPackAnalytics,
} from "../../module/pixpax/api/client";
import { usePixpaxAuth } from "../../module/pixpax/auth/usePixpaxAuth";

const router = useRouter();
const auth = usePixpaxAuth();

const loading = ref(false);
const error = ref("");
const data = ref<PixPaxAnalyticsResponse | null>(null);

const limitInput = ref("");
const collectionIdFilter = ref("");

const packs = computed(() => data.value?.packs || []);
const insights = computed(() => data.value?.insights || null);

function toLocaleDate(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

async function loadAnalytics() {
  const token = String(auth.token.value || "").trim();
  if (!token) {
    await router.replace({
      path: "/pixpax/control/login",
      query: { redirect: "/pixpax/control/analytics" },
    });
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    let parsedLimit: number | null = null;
    const rawLimit = Number(limitInput.value);
    if (Number.isFinite(rawLimit) && rawLimit > 0) {
      parsedLimit = Math.floor(rawLimit);
    }
    data.value = await getPackAnalytics(
      {
        limit: parsedLimit,
        collectionId: collectionIdFilter.value.trim() || undefined,
      },
      token,
    );
  } catch (nextError: unknown) {
    if (nextError instanceof PixPaxApiError && nextError.status === 401) {
      auth.logout();
      await router.replace({
        path: "/pixpax/control/login",
        query: { redirect: "/pixpax/control/analytics" },
      });
      return;
    }
    error.value = String((nextError as Error)?.message || nextError);
    data.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadAnalytics();
});
</script>

<template>
  <div class="w-full max-w-[1100px] mx-auto py-8 px-4 md:px-6 flex flex-col gap-6">
    <div class="flex flex-col gap-3">
      <h1 class="text-xl md:text-2xl font-semibold tracking-tight">PixPax Pack Analytics</h1>
      <p class="text-sm text-[var(--ui-fg-muted)]">
        Authenticated S3-backed issuance analytics with no user-identifying fields.
      </p>
    </div>

    <div
      class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 p-4 flex flex-col md:flex-row md:items-end gap-3"
    >
      <label class="flex flex-col gap-1 text-xs uppercase tracking-wide text-[var(--ui-fg-muted)]">
        Collection Filter
        <input
          v-model="collectionIdFilter"
          type="text"
          placeholder="e.g. premier-league-2026"
          class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)] px-2 py-1.5 text-sm text-[var(--ui-fg)]"
        />
      </label>

      <label class="flex flex-col gap-1 text-xs uppercase tracking-wide text-[var(--ui-fg-muted)]">
        Limit
        <input
          v-model="limitInput"
          type="number"
          min="1"
          max="50000"
          placeholder="All"
          class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)] px-2 py-1.5 text-sm text-[var(--ui-fg)]"
        />
      </label>

      <Button :disabled="loading" size="sm" @click="loadAnalytics">
        {{ loading ? "Loading..." : "Refresh" }}
      </Button>
    </div>

    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-if="insights" class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 p-3">
        <p class="text-[10px] uppercase tracking-wide text-[var(--ui-fg-muted)]">Total Packs</p>
        <p class="text-lg font-semibold">{{ insights.totalPacks }}</p>
      </div>
      <div class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 p-3">
        <p class="text-[10px] uppercase tracking-wide text-[var(--ui-fg-muted)]">Cards Issued</p>
        <p class="text-lg font-semibold">{{ insights.totalCardsIssued }}</p>
      </div>
      <div class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 p-3">
        <p class="text-[10px] uppercase tracking-wide text-[var(--ui-fg-muted)]">Collections</p>
        <p class="text-lg font-semibold">{{ insights.uniqueCollections }}</p>
      </div>
      <div class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 p-3">
        <p class="text-[10px] uppercase tracking-wide text-[var(--ui-fg-muted)]">Drops</p>
        <p class="text-lg font-semibold">{{ insights.uniqueDrops }}</p>
      </div>
    </div>

    <div v-if="insights" class="grid md:grid-cols-3 gap-4">
      <div class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 p-3">
        <h2 class="text-sm font-semibold mb-2">Top Drops</h2>
        <ul class="text-xs space-y-1">
          <li v-for="entry in insights.topDrops" :key="entry.dropId" class="flex justify-between gap-2">
            <span class="truncate">{{ entry.dropId }}</span>
            <span>{{ entry.packs }}</span>
          </li>
        </ul>
      </div>

      <div class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 p-3">
        <h2 class="text-sm font-semibold mb-2">Issuance Modes</h2>
        <ul class="text-xs space-y-1">
          <li v-for="entry in insights.issuanceModes" :key="entry.mode" class="flex justify-between gap-2">
            <span>{{ entry.mode }}</span>
            <span>{{ entry.packs }}</span>
          </li>
        </ul>
      </div>

      <div class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 p-3">
        <h2 class="text-sm font-semibold mb-2">Window</h2>
        <div class="text-xs space-y-1">
          <p><span class="text-[var(--ui-fg-muted)]">First:</span> {{ toLocaleDate(insights.firstIssuedAt) }}</p>
          <p><span class="text-[var(--ui-fg-muted)]">Last:</span> {{ toLocaleDate(insights.lastIssuedAt) }}</p>
          <p><span class="text-[var(--ui-fg-muted)]">Returned:</span> {{ data?.packsReturned || 0 }}</p>
          <p v-if="data?.truncated"><span class="text-[var(--ui-fg-muted)]">Note:</span> list truncated by limit.</p>
        </div>
      </div>
    </div>

    <div class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 overflow-auto">
      <table class="w-full text-xs min-w-[920px]">
        <thead>
          <tr class="text-left text-[var(--ui-fg-muted)] uppercase tracking-wide border-b border-[var(--ui-border)]">
            <th class="px-3 py-2">Issued</th>
            <th class="px-3 py-2">Collection</th>
            <th class="px-3 py-2">Version</th>
            <th class="px-3 py-2">Drop</th>
            <th class="px-3 py-2">Public ID</th>
            <th class="px-3 py-2">Pack ID</th>
            <th class="px-3 py-2">Cards</th>
            <th class="px-3 py-2">Mode</th>
            <th class="px-3 py-2">Tracked</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="pack in packs"
            :key="`${pack.collectionId}:${pack.collectionVersion}:${pack.packId}`"
            class="border-b border-[var(--ui-border)]/60"
          >
            <td class="px-3 py-2 whitespace-nowrap">{{ toLocaleDate(pack.issuedAt) }}</td>
            <td class="px-3 py-2">{{ pack.collectionId }}</td>
            <td class="px-3 py-2">{{ pack.collectionVersion }}</td>
            <td class="px-3 py-2">{{ pack.dropId || "-" }}</td>
            <td class="px-3 py-2">
              <div v-if="pack.publicId" class="flex items-center gap-2">
                <IdentityAvatar :identity="pack.avatarSeed || pack.publicId" size="xs" />
                <span class="font-mono">{{ pack.publicId }}</span>
              </div>
              <span v-else>-</span>
            </td>
            <td class="px-3 py-2 font-mono">{{ pack.packId }}</td>
            <td class="px-3 py-2">{{ pack.count }}</td>
            <td class="px-3 py-2">{{ pack.issuanceMode || "weekly" }}</td>
            <td class="px-3 py-2">{{ pack.untracked ? "No" : "Yes" }}</td>
          </tr>
          <tr v-if="!loading && packs.length === 0">
            <td colspan="9" class="px-3 py-4 text-center text-[var(--ui-fg-muted)]">
              No pack issuance events found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
