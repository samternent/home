<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";
import { SBadge, SSegmentedControl } from "ternent-ui/components";
import { stripIdentityKey } from "ternent-utils";
import Sticker from "../../module/stickerbook/Sticker.vue";
import {
  useStickerbook,
  getPeriodId,
} from "../../module/stickerbook/useStickerbook";
import { verifyPackIssue } from "../../module/stickerbook/stickerbook";
import { hashCanonical } from "../../module/stickerbook/crypto";
import {
  generateProof,
  deriveStickerId,
} from "../../module/stickerbook/merkle";
import {
  deriveKitFromCatalogue,
  generatePack,
} from "../../module/stickerbook/generator";
import { resolveOwnership } from "../../module/stickerbook/ownership";

const apiBase = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_TERNENT_API_URL || "https://api.ternent.dev";

function buildApiUrl(path: string) {
  if (!apiBase) return path;
  return new URL(path, apiBase).toString();
}
const issuerPublicKeyPem = import.meta.env.VITE_ISSUER_PUBLIC_KEY_PEM || "";

const { profileId, publicKey, receivedPacks, transfers, recordPackAndCommit } =
  useStickerbook();

const activeTab = ref<"book" | "swaps" | "progress">("book");
const catalogue = ref<any | null>(null);
const isLoading = ref(false);
const loadError = ref("");
const packPhase = ref<"idle" | "opening" | "reveal" | "done">("idle");
const packError = ref("");
const packCards = ref<any[]>([]);
const packMeta = ref<any | null>(null);
const packRevealIndex = ref(0);
const selectedSeriesId = ref("");
const seriesOptions = ref<
  { id: string; label: string; styleType: string; enabled: boolean }[]
>([]);
const now = ref(Date.now());
let nowTimer: number | null = null;
const periodOffset = ref(0);
const devNonce = useLocalStorage("stickerbook/dev-pack-nonce", 0);
const pixbookReadOnly = useLocalStorage("pixpax/pixbook/readOnly", false);

const devPeriodSeconds = computed(() => {
  const seconds = parseInt(
    import.meta.env.VITE_STICKERBOOK_PERIOD_SECONDS || "",
    10
  );
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
});

const devMode = computed(
  () => import.meta.env.VITE_STICKERBOOK_DEV_MODE !== "true"
);
const devPeriodMs = computed(() =>
  devPeriodSeconds.value ? devPeriodSeconds.value * 1000 : null
);

const enabledSeries = computed(() =>
  seriesOptions.value.filter((entry) => entry.enabled !== false)
);
const seriesItems = computed(() =>
  enabledSeries.value.map((entry) => ({ value: entry.id, label: entry.label }))
);
const tabItems = [
  { value: "book", label: "Pixbook" },
  { value: "swaps", label: "Dupes" },
  { value: "progress", label: "Progress" },
];

const periodDate = computed(() => {
  if (!devPeriodMs.value) return new Date(now.value);
  return new Date(now.value + periodOffset.value * devPeriodMs.value);
});
const periodId = computed(() => {
  if (devMode.value) return `dev-${devNonce.value}`;
  return getPeriodId(periodDate.value);
});
const periodLabel = computed(() => {
  if (devMode.value) return `${periodId.value} (dev)`;
  if (devPeriodSeconds.value) return `${periodId.value} (dev)`;
  return periodId.value;
});
const secondsUntilNextPeriod = computed(() => {
  if (!devPeriodSeconds.value) return null;
  const windowMs = devPeriodSeconds.value * 1000;
  const remaining = windowMs - (now.value % windowMs);
  return Math.max(1, Math.ceil(remaining / 1000));
});
const currentPackRequestId = ref("");
watch(
  () => [selectedSeriesId.value, periodId.value, profileId.value] as const,
  async ([seriesId, period, profile]) => {
    if (!seriesId || !period || !profile) {
      currentPackRequestId.value = "";
      return;
    }
    currentPackRequestId.value = await hashCanonical({
      seriesId,
      periodId: period,
      profileId: profile,
    });
  },
  { immediate: true }
);
const openedForPeriod = computed(() => {
  if (!currentPackRequestId.value) return null;
  return (
    receivedPacks.value.find(
      (entry) =>
        entry.data?.issuerIssuePayload?.packRequestId ===
        currentPackRequestId.value
    ) || null
  );
});
const openedPackIds = computed(
  () => new Set(receivedPacks.value.map((entry) => entry.data.packId))
);

const rarityOrder = ["mythic", "rare", "uncommon", "common"];
const packCount = 5;

const normalizeKey = (key: string) => (key ? stripIdentityKey(key) : "");

const catalogueEntries = computed(() => {
  if (!catalogue.value) return [];
  return catalogue.value.creatures || catalogue.value.stickers || [];
});

const catalogueStyleType = computed(() => {
  return catalogue.value?.styleType || "creature";
});

const catalogueThemeId = computed(() => {
  return catalogue.value?.themeId || null;
});
const entriesByRarity = computed(() => {
  if (!catalogueEntries.value.length) return new Map();
  const map = new Map<string, any[]>();
  for (const entry of catalogueEntries.value) {
    const list = map.get(entry.rarity) || [];
    list.push(entry);
    map.set(entry.rarity, list);
  }
  return map;
});

const catalogueById = computed(() => {
  const map = new Map<string, any>();
  if (!catalogueEntries.value.length) return map;
  for (const entry of catalogueEntries.value) {
    map.set(entry.id, entry);
  }
  return map;
});

const totalCreatures = computed(() => catalogueEntries.value.length || 0);

const stickerRecords = ref<any[]>([]);
const stickerRecordById = computed(() => {
  const map = new Map<string, any>();
  for (const record of stickerRecords.value) {
    map.set(record.stickerId, record);
  }
  return map;
});

const ownershipByStickerId = ref(new Map<string, any>());
const packRevealCards = computed(() => cardsToReveal.value);
const ownedCountByCatalogueId = computed(() => {
  const map = new Map<string, number>();
  const ownedStatuses = new Set(["owned", "received"]);
  const activePackId = isPackRevealOpen.value
    ? packMeta.value?.packId || null
    : null;
  for (const record of stickerRecords.value) {
    if (activePackId && record.packId === activePackId) continue;
    const ownership = ownershipByStickerId.value.get(record.stickerId);
    const status = ownership?.status || "unowned";
    if (!ownedStatuses.has(status)) continue;
    const key = record.catalogueId || record.stickerId;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
});

const revealPlan = computed(() => {
  const counts = new Map(ownedCountByCatalogueId.value);
  const needs: any[] = [];
  const duplicates: any[] = [];
  const rarityRank = new Map([
    ["rare", 0],
    ["common", 1],
    ["uncommon", 2],
    ["mythic", 3],
  ]);

  for (const card of packRevealCards.value) {
    const key = card?.catalogueId || card?.creature?.id;
    if (!key) continue;
    const count = counts.get(key) || 0;
    if (count === 0) {
      needs.push(card);
    } else {
      duplicates.push(card);
    }
    counts.set(key, count + 1);
  }

  needs.sort((a, b) => {
    const aRank = rarityRank.get(a?.rarity) ?? 99;
    const bRank = rarityRank.get(b?.rarity) ?? 99;
    return aRank - bRank;
  });

  return { needs, duplicates };
});
const revealNeeds = computed(() => revealPlan.value.needs);
const revealDuplicates = computed(() => revealPlan.value.duplicates);
const revealDuplicateGroups = computed(() => {
  const byKey = new Map<string, { card: any; count: number }>();
  for (const card of revealDuplicates.value) {
    const key = card?.catalogueId || card?.creature?.id;
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    byKey.set(key, { card, count: 1 });
  }
  return Array.from(byKey.values());
});
const activePackCard = computed(
  () => revealNeeds.value[packRevealIndex.value] || null
);
const remainingPackCards = computed(() =>
  revealNeeds.value.slice(packRevealIndex.value)
);
const revealDismissed = ref(false);
const revealComplete = computed(
  () => packRevealIndex.value >= revealNeeds.value.length
);
const isPackRevealOpen = computed(
  () =>
    packPhase.value === "done" &&
    !revealDismissed.value &&
    (packRevealIndex.value < revealNeeds.value.length ||
      revealDuplicates.value.length > 0)
);

function getRevealTag() {
  return "Need it";
}

const statusByStickerId = computed(() => {
  const map = new Map<string, string>();
  for (const [stickerId, info] of ownershipByStickerId.value.entries()) {
    map.set(stickerId, info.status);
  }
  return map;
});

const collectedByCreatureId = computed(() => {
  const map = new Map<string, any>();
  const rankStatus = (status: string) => {
    if (isOwnedStatus(status)) return 3;
    if (status === "sent") return 2;
    if (status === "conflicted") return 1;
    return 0;
  };
  for (const record of stickerRecords.value) {
    const key = record.catalogueId || record.stickerId;
    if (!key) continue;
    const ownership = ownershipByStickerId.value.get(record.stickerId);
    const status = ownership?.status || "unowned";
    const existing = map.get(key);
    if (existing && rankStatus(existing.status) >= rankStatus(status)) {
      continue;
    }
    map.set(key, {
      packId: record.packId,
      status,
      rarity: record.rarity,
      finish: "base",
    });
  }
  return map;
});

const collectedByRarityForSeries = computed(() => {
  const map = new Map<string, any[]>();
  for (const entry of catalogueEntries.value) {
    const status = getStatus(entry.id);
    if (!isOwnedStatus(status)) continue;
    const list = map.get(entry.rarity) || [];
    list.push(entry);
    map.set(entry.rarity, list);
  }
  return map;
});

const collectedCount = computed(() => {
  let count = 0;
  for (const entry of catalogueEntries.value) {
    if (isOwnedStatus(getStatus(entry.id))) count += 1;
  }
  return count;
});

const swapsForSeries = computed(() => {
  const ownedStatuses = new Set(["owned", "received"]);
  const byCatalogue = new Map<string, any[]>();

  for (const record of stickerRecords.value) {
    const ownership = ownershipByStickerId.value.get(record.stickerId);
    const status = ownership?.status || "unowned";
    if (!ownedStatuses.has(status)) continue;
    const key = record.catalogueId || record.stickerId;
    const list = byCatalogue.get(key) || [];
    list.push({ record, stickerId: record.stickerId });
    byCatalogue.set(key, list);
  }

  const swaps: any[] = [];
  for (const list of byCatalogue.values()) {
    if (list.length <= 1) continue;
    for (const entry of list.slice(1)) {
      swaps.push({
        ...entry,
        status: "swap",
      });
    }
  }

  return swaps;
});

const swapCount = computed(() => swapsForSeries.value.length);
const swapGroups = computed(() => {
  const byKey = new Map<string, { record: any; count: number }>();
  for (const swap of swapsForSeries.value) {
    const record = swap.record;
    const key = record?.catalogueId || record?.stickerId || swap.stickerId;
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    byKey.set(key, { record, count: 1 });
  }
  return Array.from(byKey.values());
});

const progressByRarity = computed(() => {
  return rarityOrder.map((rarity) => {
    const total = entriesByRarity.value.get(rarity)?.length || 0;
    const collected = collectedByRarityForSeries.value.get(rarity)?.length || 0;
    return { rarity, total, collected };
  });
});

function buildAttributeKey(entry: any) {
  const attrs = entry?.attributes || entry;
  return [
    attrs?.archetypeId,
    attrs?.bodyId,
    attrs?.eyesId,
    attrs?.identityId ?? null,
    attrs?.accessoryId ?? null,
    attrs?.frameId ?? null,
    attrs?.fxId ?? null,
    entry?.paletteId ?? attrs?.paletteId ?? null,
  ]
    .map((value) =>
      value === null || value === undefined ? "null" : String(value)
    )
    .join("|");
}

function getStatus(id: string) {
  return collectedByCreatureId.value.get(id)?.status || "unowned";
}

function isOwnedStatus(status: string) {
  return status === "owned" || status === "received";
}

const catalogueByAttributes = computed(() => {
  const map = new Map<string, any>();
  for (const entry of catalogueEntries.value) {
    map.set(buildAttributeKey(entry), entry);
  }
  return map;
});

watch(
  () =>
    [
      receivedPacks.value,
      transfers.value,
      catalogue.value,
      selectedSeriesId.value,
      publicKey.value,
    ] as const,
  async () => {
    if (!catalogue.value || !selectedSeriesId.value) {
      stickerRecords.value = [];
      ownershipByStickerId.value = new Map();
      return;
    }
    const kitJson = deriveKitFromCatalogue(catalogue.value);
    const nextRecords: any[] = [];
    const defaultOwners = new Map<string, string>();

    for (const pack of receivedPacks.value) {
      const issuePayload = pack.data?.issuerIssuePayload;
      if (!issuePayload || issuePayload.seriesId !== selectedSeriesId.value)
        continue;
      const entries = generatePack({
        packSeed: issuePayload.packSeed,
        seriesId: issuePayload.seriesId,
        themeId: issuePayload.themeId,
        count: issuePayload.count,
        algoVersion: issuePayload.algoVersion,
        kitJson,
      });

      const resolved = await Promise.all(
        entries.map(async (entry: any) => {
          const stickerId = await deriveStickerId(
            issuePayload.packRoot,
            entry.index
          );
          const key = buildAttributeKey({
            ...entry,
            paletteId: entry.paletteId,
          });
          const catalogueEntry = catalogueByAttributes.value.get(key);
          const rarity = catalogueEntry?.rarity ?? entry.rarity;
          return {
            stickerId,
            packId: issuePayload.packRoot,
            index: entry.index,
            rarity,
            entry,
            catalogueId: catalogueEntry?.id ?? null,
            creature: catalogueEntry,
            finish: "base",
          };
        })
      );

      for (const record of resolved) {
        nextRecords.push(record);
        defaultOwners.set(
          record.stickerId,
          normalizeKey(pack.author) || publicKey.value
        );
      }
    }

    stickerRecords.value = nextRecords;
    ownershipByStickerId.value = resolveOwnership({
      records: nextRecords,
      transferEntries: transfers.value,
      defaultOwnerByStickerId: defaultOwners,
      currentKey: publicKey.value,
    });
  },
  { immediate: true }
);

const cardsToReveal = computed(() => {
  if (!packCards.value.length) return [];
  const cards = packCards.value.map((card) => {
    const creature =
      card.catalogueId && catalogueById.value.get(card.catalogueId)
        ? catalogueById.value.get(card.catalogueId)
        : card.creature;
    return {
      ...card,
      packId: packMeta.value?.packId,
      creature,
    };
  });
  return cards.filter((card) => card.creature);
});

const canOpenPack = computed(() =>
  devMode.value
    ? packPhase.value !== "opening" && packPhase.value !== "reveal"
    : !openedForPeriod.value && packPhase.value === "idle"
);
const canTapOpenPack = computed(() => canOpenPack.value && !isLoading.value);
const openPackLabel = computed(() => {
  if (packPhase.value === "opening" || packPhase.value === "reveal") {
    return "Opening pack...";
  }
  if (canTapOpenPack.value)
    return devMode.value ? "Open dev pack" : "Open pack";
  if (secondsUntilNextPeriod.value) {
    return `Open pack in ${secondsUntilNextPeriod.value}s`;
  }
  return "Open pack next period";
});

async function loadCatalogue() {
  if (!selectedSeriesId.value) {
    catalogue.value = null;
    return;
  }
  isLoading.value = true;
  loadError.value = "";
  try {
    const url = new URL(
      buildApiUrl("/v1/stickerbook/catalogue"),
      window.location.origin
    );
    url.searchParams.set("seriesId", selectedSeriesId.value);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to load catalogue (${response.status})`);
    }
    catalogue.value = await response.json();
  } catch (error: any) {
    loadError.value = error?.message || "Failed to load stickerbook catalogue.";
  } finally {
    isLoading.value = false;
  }
}

async function loadIndex() {
  try {
    const url = new URL(
      buildApiUrl("/v1/stickerbook/index"),
      window.location.origin
    );
    const response = await fetch(url.toString());
    if (!response.ok) return;
    const index = await response.json();
    if (Array.isArray(index?.series) && index.series.length) {
      seriesOptions.value = index.series;
      const enabled = index.series.filter(
        (entry: any) => entry.enabled !== false
      );
      if (!enabled.find((entry: any) => entry.id === selectedSeriesId.value)) {
        selectedSeriesId.value = enabled[0]?.id || "";
      }
    }
  } catch {
    // Ignore index load failures and keep local defaults.
  }
}

async function openWeeklyPack(options: { force?: boolean } = {}) {
  if (!catalogue.value || (!options.force && !canOpenPack.value)) return;
  packError.value = "";
  if (devMode.value) {
    devNonce.value += 1;
    packCards.value = [];
    packMeta.value = null;
  }
  packPhase.value = "opening";

  try {
    if (!issuerPublicKeyPem) {
      throw new Error("Missing issuer public key.");
    }
    const packRequestId = await hashCanonical({
      seriesId: selectedSeriesId.value,
      periodId: periodId.value,
      profileId: profileId.value,
    });
    const clientNonce = crypto.randomUUID();
    const clientNonceHash = await hashCanonical(clientNonce);

    const commitResponse = await fetch(buildApiUrl("/v1/stickerbook/commit"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packRequestId,
        seriesId: selectedSeriesId.value,
        themeId: catalogueThemeId.value,
        count: packCount,
        clientNonceHash,
      }),
    });

    if (!commitResponse.ok) {
      throw new Error(`Failed to commit pack (${commitResponse.status})`);
    }
    const commitData = await commitResponse.json();

    const issueResponse = await fetch(buildApiUrl("/v1/stickerbook/issue"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packRequestId, clientNonce }),
    });

    if (!issueResponse.ok) {
      throw new Error(`Failed to issue pack (${issueResponse.status})`);
    }
    const issueData = await issueResponse.json();

    const verification = await verifyPackIssue({
      commit: commitData.entry,
      issue: issueData.entry,
      issuerPublicKeyPem,
      catalogue: catalogue.value,
    });

    if (!verification.ok) {
      throw new Error(`Pack verification failed: ${verification.reason}`);
    }
    const issuePayload = issueData.entry.payload;
    const entries = verification.entries;
    const packId = issuePayload.packRoot;

    const packEntries = await Promise.all(
      entries.map(async (entry: any) => {
        const stickerId = await deriveStickerId(
          issuePayload.packRoot,
          entry.index
        );
        const proof = await generateProof(entries, entry.index);
        const key = buildAttributeKey({
          ...entry,
          paletteId: entry.paletteId,
        });
        const catalogueEntry = catalogueByAttributes.value.get(key);
        const resolvedRarity = catalogueEntry?.rarity ?? entry.rarity;
        return {
          index: entry.index,
          stickerId,
          proof,
          entry,
          rarity: resolvedRarity,
          catalogueId: catalogueEntry?.id ?? null,
          verified: true,
          finish: "base",
          creature: catalogueEntry || {
            id: stickerId,
            rarity: resolvedRarity,
            paletteId: entry.paletteId,
            attributes: {
              archetypeId: entry.archetypeId,
              bodyId: entry.bodyId,
              eyesId: entry.eyesId,
              identityId: entry.identityId,
              accessoryId: entry.accessoryId,
              frameId: entry.frameId,
              fxId: entry.fxId,
            },
          },
        };
      })
    );

    packCards.value = packEntries;
    packMeta.value = {
      packId,
      packRequestId,
      seriesId: issuePayload.seriesId,
      themeId: issuePayload.themeId,
      periodId: periodId.value,
      profileId: profileId.value,
      packSeed: issuePayload.packSeed,
      packRoot: issuePayload.packRoot,
      algoVersion: issuePayload.algoVersion,
      kitHash: issuePayload.kitHash,
      themeHash: issuePayload.themeHash,
      count: issuePayload.count,
    };

    packPhase.value = "reveal";
    await new Promise((resolve) => setTimeout(resolve, 650));
    packPhase.value = "done";
    packRevealIndex.value = 0;
    revealDismissed.value = false;

    if (!openedPackIds.value.has(packId)) {
      const packPayload = {
        type: "pack.received",
        packId,
        issuerIssuePayload: issueData.entry.payload,
        issuerSignature: issueData.entry.signature,
        issuerKeyId: issueData.entry.payload?.issuerKeyId,
      };

      await recordPackAndCommit(packPayload);
    }
  } catch (error: any) {
    packError.value = error?.message || "Pack opening failed.";
    packPhase.value = "idle";
  }
}

function collectNextPackCard() {
  if (!activePackCard.value) return;
  packRevealIndex.value += 1;
  if (
    packRevealIndex.value >= revealNeeds.value.length &&
    revealDuplicates.value.length === 0
  ) {
    revealDismissed.value = true;
  }
}

function skipPackReveal() {
  packRevealIndex.value = revealNeeds.value.length;
  if (revealDuplicates.value.length === 0) {
    revealDismissed.value = true;
  }
}

function closePackReveal() {
  revealDismissed.value = true;
}

function collectDuplicateReveal() {
  revealDismissed.value = true;
}

onMounted(async () => {
  await loadIndex();
  await loadCatalogue();
});

watch(
  devPeriodSeconds,
  (seconds) => {
    if (nowTimer) {
      clearInterval(nowTimer);
      nowTimer = null;
    }
    if (!seconds) return;
    nowTimer = window.setInterval(() => {
      now.value = Date.now();
    }, 1000);
  },
  { immediate: true }
);

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer);
});

watch(selectedSeriesId, () => {
  packCards.value = [];
  packMeta.value = null;
  packPhase.value = "idle";
  loadCatalogue();
});

watch(periodId, () => {
  if (devMode.value) return;
  packCards.value = [];
  packMeta.value = null;
  packPhase.value = "idle";
  packError.value = "";
});
</script>

<template>
  <div class="flex flex-1 flex-col max-w-5xl mx-auto w-full">
    <div class="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <section class="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div
          class="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <SBadge size="xs" tone="neutral" variant="outline">
              Collected
            </SBadge>
            <span class="text-sm font-semibold text-[var(--ui-fg)]">
              {{ collectedCount }}/{{ totalCreatures }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <SBadge size="xs" tone="neutral" variant="outline">Series</SBadge>
            <SSegmentedControl
              v-if="seriesItems.length"
              v-model="selectedSeriesId"
              :items="seriesItems"
              size="xs"
              aria-label="Sticker series"
            />
            <span v-else class="text-xs text-[var(--ui-fg-muted)]">
              No series available
            </span>
          </div>
        </div>
        <div
          v-if="!pixbookReadOnly"
          class="flex flex-wrap items-center justify-between gap-4 bg-blur-lg rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 92%, transparent)] px-4 py-3"
        >
          <div class="flex flex-col gap-1 text-xs text-[var(--ui-fg-muted)]">
            <span class="uppercase tracking-[0.14em]">Pack drop</span>
            <span>
              Period:
              <strong class="text-[var(--ui-fg)]">{{ periodLabel }}</strong>
            </span>
          </div>
          <div class="flex flex-col items-end gap-1">
            <Button
              class="!rounded-full"
              :disabled="!canTapOpenPack"
              @click="openWeeklyPack"
            >
              {{ openPackLabel }}
            </Button>
            <span
              v-if="!canTapOpenPack && secondsUntilNextPeriod"
              class="text-[10px] uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
            >
              Next pack in {{ secondsUntilNextPeriod }}s
            </span>
          </div>
        </div>
        <p
          v-if="packError && !pixbookReadOnly"
          class="text-sm font-semibold text-red-600"
        >
          {{ packError }}
        </p>
        <SSegmentedControl
          v-model="activeTab"
          :items="tabItems"
          size="sm"
          aria-label="Stickerbook sections"
          class="self-start"
        />
      </section>

      <section v-if="activeTab === 'book'" class="mx-auto w-full max-w-4xl">
        <div
          v-if="isLoading"
          class="text-sm font-semibold text-[var(--ui-fg-muted)]"
        >
          Loading catalogue...
        </div>
        <div v-else-if="loadError" class="text-sm font-semibold text-red-600">
          {{ loadError }}
        </div>
        <div v-else class="flex flex-col gap-6" v-if="!isPackRevealOpen">
          <section v-for="rarity in rarityOrder" :key="rarity" class="p-4">
            <header
              class="mb-3 flex items-baseline justify-between text-xs uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
            >
              <h3 class="text-xs font-semibold text-[var(--ui-fg)]">
                {{ rarity }}
              </h3>
              <span>
                {{ collectedByRarityForSeries.get(rarity)?.length || 0 }}/{{
                  entriesByRarity.get(rarity)?.length || 0
                }}
              </span>
            </header>

            <div class="flex gap-6 flex-wrap items-center justify-center">
              <Sticker
                v-if="catalogueStyleType === 'pixel'"
                v-for="creature in entriesByRarity.get(rarity) || []"
                :key="creature.id"
                :art="{
                  kind: 'grid',
                  data: { creature, palettes: catalogue?.palettes || [] },
                }"
                :rarity="creature.rarity"
                :label="creature.id"
                :sublabel="creature.rarity"
                :status="getStatus(creature.id)"
                :finish="collectedByCreatureId.get(creature.id)?.finish"
                :pack-id="collectedByCreatureId.get(creature.id)?.packId"
                :missing="!isOwnedStatus(getStatus(creature.id))"
                size="compact"
              />
              <Sticker
                v-else-if="
                  ['8bit-sprites', 'animal-archetype-8bit'].includes(
                    catalogueThemeId
                  )
                "
                v-for="sticker in entriesByRarity.get(rarity) || []"
                :key="sticker.id"
                :art="{
                  kind: 'kit',
                  data: {
                    sticker,
                    palettes: catalogue?.palettes || [],
                    kitId:
                      catalogueThemeId === 'animal-archetype-8bit'
                        ? '8bit-animal-archetype'
                        : '8bit-sprites',
                  },
                }"
                :rarity="sticker.rarity"
                :label="sticker.id"
                :sublabel="sticker.rarity"
                :status="getStatus(sticker.id)"
                :finish="collectedByCreatureId.get(sticker.id)?.finish"
                :pack-id="collectedByCreatureId.get(sticker.id)?.packId"
                :missing="!isOwnedStatus(getStatus(sticker.id))"
                size="compact"
              />
            </div>
          </section>
        </div>
      </section>

      <div
        v-if="isPackRevealOpen && !pixbookReadOnly"
        class="absolute inset-0 z-50 flex items-center justify-center bg-[color-mix(in srgb, var(--ui-bg) 78%, transparent)] px-4 py-10 backdrop-blur-lg"
      >
        <div class="flex w-full max-w-3xl flex-col gap-6">
          <div class="flex items-center justify-between">
            <div
              class="flex items-center gap-3 text-xs uppercase tracking-[0.16em] bg-[var(--ui-surface)] rounded-full px-3 py-1 text-[var(--ui-fg-muted)]"
            >
              <span v-if="revealNeeds.length">
                {{ Math.min(packRevealIndex + 1, revealNeeds.length) }}/{{
                  revealNeeds.length
                }}
              </span>
              <span v-else>Duplicates</span>
              <span
                v-if="activePackCard?.rarity === 'mythic'"
                class="text-[var(--ui-accent)]"
              >
                Mythic
              </span>
              <span v-else-if="activePackCard?.rarity">{{
                activePackCard.rarity
              }}</span>
              <span
                v-if="revealDuplicates.length"
                class="text-[var(--ui-fg-muted)]"
              >
                +{{ revealDuplicates.length }} dupes
              </span>
            </div>
            <button
              type="button"
              class="text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]"
              @click="revealComplete ? closePackReveal() : skipPackReveal()"
            >
              {{ revealComplete ? "End" : "Skip" }}
            </button>
          </div>

          <div
            class="relative mx-auto h-[340px] w-[260px]"
            v-if="!revealComplete"
          >
            <div
              v-for="(card, index) in remainingPackCards"
              :key="`${card.stickerId || card.creature?.id}-${index}`"
              class="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
              :style="{
                transform: `translateY(${index * 8}px) translateX(${
                  index * 5
                }px) rotate(${index * 1.5}deg)`,
                zIndex: remainingPackCards.length - index,
              }"
            >
              <button
                type="button"
                class="relative rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-[0_16px_28px_rgba(15,23,42,0.22)]"
                @click="collectNextPackCard"
                :class="{
                  'reveal-mythic':
                    activePackCard?.rarity === 'mythic' && index === 0,
                }"
                :key="packRevealIndex"
              >
                <span
                  v-if="activePackCard?.rarity === 'mythic' && index === 0"
                  class="absolute inset-0 rounded-2xl pointer-events-none mythic-glow"
                ></span>
                <Sticker
                  v-if="catalogueStyleType === 'pixel'"
                  :art="{
                    kind: 'grid',
                    data: {
                      creature: card.creature,
                      palettes: catalogue?.palettes || [],
                    },
                  }"
                  :rarity="card.rarity"
                  :finish="card.finish"
                  :pack-id="card.packId"
                />
                <Sticker
                  v-else-if="
                    ['8bit-sprites', 'animal-archetype-8bit'].includes(
                      catalogueThemeId
                    )
                  "
                  :art="{
                    kind: 'kit',
                    data: {
                      sticker: card.creature,
                      palettes: catalogue?.palettes || [],
                      kitId:
                        catalogueThemeId === 'animal-archetype-8bit'
                          ? '8bit-animal-archetype'
                          : '8bit-sprites',
                    },
                  }"
                  :rarity="card.rarity"
                  :finish="card.finish"
                  :pack-id="card.packId"
                />
                <span
                  class="mt-3 block text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
                >
                  Tap to collect
                </span>
              </button>
            </div>
          </div>

          <div
            v-else-if="revealDuplicateGroups.length"
            class="flex flex-col gap-3 rounded-2xl p-3 items-center"
            @click="collectDuplicateReveal"
          >
            <div class="flex gap-2">
              <div
                v-for="(group, index) in revealDuplicateGroups"
                :key="`dup-${
                  group.card?.stickerId || group.card?.creature?.id
                }-${index}`"
                class="relative"
              >
                <span
                  v-if="group.count > 1"
                  class="absolute -right-1 -top-1 z-20 rounded-full bg-[var(--ui-fg)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-bg)]"
                >
                  x{{ group.count }}
                </span>
                <Sticker
                  v-if="catalogueStyleType === 'pixel'"
                  :art="{
                    kind: 'grid',
                    data: {
                      creature: group.card.creature,
                      palettes: catalogue?.palettes || [],
                    },
                  }"
                  :rarity="group.card.rarity"
                  :finish="group.card.finish"
                  :pack-id="group.card.packId"
                  size="compact"
                />
                <Sticker
                  v-else-if="
                    ['8bit-sprites', 'animal-archetype-8bit'].includes(
                      catalogueThemeId
                    )
                  "
                  :art="{
                    kind: 'kit',
                    data: {
                      sticker: group.card.creature,
                      palettes: catalogue?.palettes || [],
                      kitId:
                        catalogueThemeId === 'animal-archetype-8bit'
                          ? '8bit-animal-archetype'
                          : '8bit-sprites',
                    },
                  }"
                  :rarity="group.card.rarity"
                  :finish="group.card.finish"
                  :pack-id="group.card.packId"
                  size="compact"
                />
              </div>
            </div>
            <div class="flex items-center justify-between">
              <Button
                size="xs"
                variant="secondary"
                @click="collectDuplicateReveal"
              >
                Collect {{ revealDuplicates.length }} dupes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section
        v-if="activeTab === 'swaps'"
        class="flex flex-col items-center gap-4 rounded-2xl p-6"
      >
        <div class="space-y-1">
          <h3 class="text-lg font-semibold text-[var(--ui-fg)]">Swaps pile</h3>
          <p class="text-sm text-[var(--ui-fg-muted)]">
            Duplicates you can trade without affecting collection totals.
          </p>
        </div>
        <div
          v-if="!swapsForSeries.length"
          class="text-sm font-semibold text-[var(--ui-fg-muted)]"
        >
          No swaps yet.
        </div>
        <div v-else class="flex flex-wrap gap-4 justify-center">
          <div
            v-for="(swap, index) in swapGroups"
            :key="`${
              swap.record?.catalogueId || swap.record?.stickerId
            }-${index}`"
            class="relative flex flex-col items-center gap-2 rounded-xl p-3 text-center"
          >
            <span
              v-if="swap.count > 1"
              class="absolute z-20 right-1 top-1 rounded-full bg-[var(--ui-fg)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-bg)]"
            >
              x{{ swap.count }}
            </span>
            <template v-if="swap.record">
              <Sticker
                v-if="catalogueStyleType === 'pixel'"
                :art="{
                  kind: 'grid',
                  data: {
                    creature:
                      swap.record.creature ||
                      catalogueById.get(swap.record.catalogueId),
                    palettes: catalogue?.palettes || [],
                  },
                }"
                :rarity="swap.record.rarity"
                :finish="swap.record.finish"
                :pack-id="swap.record.packId"
                size="compact"
              />
              <Sticker
                v-else-if="
                  ['8bit-sprites', 'animal-archetype-8bit'].includes(
                    catalogueThemeId
                  )
                "
                :art="{
                  kind: 'kit',
                  data: {
                    sticker:
                      swap.record.creature ||
                      catalogueById.get(swap.record.catalogueId),
                    palettes: catalogue?.palettes || [],
                    kitId:
                      catalogueThemeId === 'animal-archetype-8bit'
                        ? '8bit-animal-archetype'
                        : '8bit-sprites',
                  },
                }"
                :rarity="swap.record.rarity"
                :finish="swap.record.finish"
                :pack-id="swap.record.packId"
                size="compact"
              />
            </template>
            <div
              class="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
            >
              <span>{{
                swap.record?.catalogueId || swap.record?.stickerId
              }}</span>
              <span>swap</span>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="activeTab === 'progress'"
        class="grid gap-4 lg:grid-cols-2"
      >
        <div
          class="rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 96%, transparent)] p-5"
        >
          <h3 class="text-lg font-semibold text-[var(--ui-fg)]">
            Your Collection
          </h3>
          <p class="mt-1 text-sm text-[var(--ui-fg-muted)]">
            Total:
            <strong class="text-[var(--ui-fg)]">{{ collectedCount }}</strong>
            of
            <strong class="text-[var(--ui-fg)]">{{ totalCreatures }}</strong>
          </p>
          <ul
            class="mt-3 grid gap-2 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]"
          >
            <li
              v-for="item in progressByRarity"
              :key="item.rarity"
              class="flex items-center justify-between"
            >
              <span>{{ item.rarity }}</span>
              <strong class="text-[var(--ui-fg)]">
                {{ item.collected }}/{{ item.total }}
              </strong>
            </li>
          </ul>
        </div>
        <div class="p-5">
          <h3 class="text-lg font-semibold text-[var(--ui-fg)]">Series</h3>
          <p class="mt-1 text-sm text-[var(--ui-fg-muted)]">
            Series collected:
            <strong class="text-[var(--ui-fg)]">{{ collectedCount }}</strong>
          </p>
          <p class="mt-1 text-sm text-[var(--ui-fg-muted)]">
            Swaps pile:
            <strong class="text-[var(--ui-fg)]">{{ swapCount }}</strong>
          </p>
          <p class="mt-1 text-sm text-[var(--ui-fg-muted)]">
            Opened this period:
            <strong class="text-[var(--ui-fg)]">
              {{ openedForPeriod ? "yes" : "no" }}
            </strong>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
@keyframes mythicShake {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  20% {
    transform: translateY(-2px) rotate(-1deg);
  }
  40% {
    transform: translateY(2px) rotate(1deg);
  }
  60% {
    transform: translateY(-1px) rotate(0deg);
  }
  80% {
    transform: translateY(1px) rotate(-0.5deg);
  }
}

@keyframes mythicGlow {
  0% {
    box-shadow: 0 0 0 rgba(252, 211, 77, 0.2);
    opacity: 0.2;
  }
  50% {
    box-shadow: 0 0 24px rgba(252, 211, 77, 0.6);
    opacity: 0.7;
  }
  100% {
    box-shadow: 0 0 12px rgba(252, 211, 77, 0.4);
    opacity: 0.4;
  }
}

.reveal-mythic {
  animation: mythicShake 0.9s ease-in-out infinite;
}

.mythic-glow {
  animation: mythicGlow 1.4s ease-in-out infinite;
  background: radial-gradient(
    circle at 50% 30%,
    rgba(252, 211, 77, 0.18),
    rgba(251, 191, 36, 0.04) 60%,
    transparent 70%
  );
}

.reveal-delay {
  animation-delay: 1s;
}

.reveal-mythic.reveal-flip {
  animation-delay: 3s;
}

@keyframes revealFlip {
  0% {
    opacity: 0;
    transform: rotateY(90deg) scale(0.96);
  }
  40% {
    opacity: 1;
    transform: rotateY(-8deg) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: rotateY(0deg) scale(1);
  }
}

.reveal-flip {
  transform-style: preserve-3d;
  animation: revealFlip 0.6s ease-out both;
}
</style>
