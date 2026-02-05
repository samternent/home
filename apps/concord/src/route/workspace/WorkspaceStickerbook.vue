<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";
import { SBadge, SSegmentedControl } from "ternent-ui/components";
import { stripIdentityKey } from "ternent-utils";
import StickerPixel from "../../module/stickerbook/StickerPixel.vue";
import Sticker8Bit from "../../module/stickerbook/Sticker8Bit.vue";
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

const activeTab = ref<"book" | "pack" | "swaps" | "progress">("book");
const catalogue = ref<any | null>(null);
const isLoading = ref(false);
const loadError = ref("");
const packPhase = ref<"idle" | "opening" | "reveal" | "done">("idle");
const packError = ref("");
const packCards = ref<any[]>([]);
const packMeta = ref<any | null>(null);
const packVerification = ref<"pending" | "verified" | "failed">("pending");
const packVerificationState = computed(() => {
  if (openedForPeriod.value) return "verified";
  return packVerification.value;
});
const packVerificationTone = computed(() => {
  if (packVerificationState.value === "verified") return "secondary";
  if (packVerificationState.value === "failed") return "critical";
  return "neutral";
});
const packVerificationLabel = computed(() => {
  if (packVerificationState.value === "verified") return "Verified";
  if (packVerificationState.value === "failed") return "Failed";
  return "Pending";
});
const selectedSeriesId = ref("");
const seriesOptions = ref<
  { id: string; label: string; styleType: string; enabled: boolean }[]
>([]);
const now = ref(Date.now());
let nowTimer: number | null = null;
const periodOffset = ref(0);
const devNonce = useLocalStorage("stickerbook/dev-pack-nonce", 0);

const devPeriodSeconds = computed(() => {
  const seconds = parseInt(
    import.meta.env.VITE_STICKERBOOK_PERIOD_SECONDS || "",
    10
  );
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
});

const devMode = computed(
  () => import.meta.env.VITE_STICKERBOOK_DEV_MODE === "true"
);
const devSeed = computed(
  () => import.meta.env.VITE_STICKERBOOK_DEV_SEED || "dev"
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
  { value: "book", label: "Stickerbook" },
  { value: "pack", label: "Weekly Pack" },
  { value: "swaps", label: "Swaps" },
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

function chanceAtLeastOne(p: number, k: number) {
  return 1 - Math.pow(1 - p, k);
}

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

const swapCount = computed(() => {
  let count = 0;
  for (const info of ownershipByStickerId.value.values()) {
    if (info.status === "sent") count += 1;
  }
  return count;
});

const swapsForSeries = computed(() => {
  return Array.from(ownershipByStickerId.value.values()).filter(
    (info) => info.status === "sent"
  );
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

const revealedCards = computed(() => {
  if (!packMeta.value && openedForPeriod.value) {
    return stickerRecords.value
      .filter((record) => record.packId === openedForPeriod.value.data?.packId)
      .map((record) => ({
        creature:
          record.creature || catalogueById.value.get(record.catalogueId),
        rarity: record.rarity,
        finish: "base",
        packId: record.packId,
      }));
  }
  return cardsToReveal.value;
});

const hasMythic = computed(() =>
  cardsToReveal.value.some((card) => card.rarity === "mythic")
);

const rarityWeights = computed(() => catalogue.value?.rarityWeights || {});
const mythicChance = computed(() => {
  const weights = rarityWeights.value;
  const total = Object.values(weights).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  if (!total) return 0;
  return (weights.mythic || 0) / total;
});
const packSize = computed(
  () => packMeta.value?.count || packCards.value.length || 5
);
const mythicChancePerPack = computed(() =>
  chanceAtLeastOne(mythicChance.value, packSize.value)
);

const canOpenPack = computed(() =>
  devMode.value
    ? packPhase.value !== "opening" && packPhase.value !== "reveal"
    : !openedForPeriod.value && packPhase.value === "idle"
);

const displayPhase = computed(() =>
  devMode.value
    ? packPhase.value
    : openedForPeriod.value
    ? "done"
    : packPhase.value
);

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
  packVerification.value = "pending";

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
      packVerification.value = "failed";
      throw new Error(`Pack verification failed: ${verification.reason}`);
    }

    packVerification.value = "verified";
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
    packVerification.value = "failed";
  }
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

const visibleCards = computed(() =>
  revealedCards.value.filter((card) => card?.creature)
);
</script>

<template>
  <div class="flex flex-1 flex-col overflow-auto bg-[image:var(--bg-pixpax)]">
    <div class="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <header
        class="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center"
      >
        <div class="w-full max-w-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 560 160"
            role="img"
            aria-label="PixPax"
          >
            <!-- ICON (16x16 grid mapped into 128x128 area; pixel = 8 units) -->
            <g transform="translate(24 16)">
              <!-- Outer card (sharp, stepped notch top-right) -->
              <!-- Card bounds: (16,16) to (112,112) with a 2-step notch -->
              <path
                fill="var(--ui-bg)"
                stroke="var(--ui-border)"
                stroke-width="8"
                shape-rendering="crispEdges"
                d="
        M 16 16
        H 88
        V 24
        H 96
        V 32
        H 112
        V 112
        H 16
        Z
      "
              />

              <!-- Inner frame (offset by 8 units / 1 grid pixel) -->
              <path
                fill="none"
                stroke="var(--ui-border)"
                stroke-width="6"
                shape-rendering="crispEdges"
                d="
        M 24 24
        H 80
        V 32
        H 88
        V 40
        H 104
        V 104
        H 24
        Z
      "
              />

              <!-- Accent pixels hugging the notch (rare cue, minimal) -->
              <g fill="var(--ui-accent)" shape-rendering="crispEdges">
                <rect x="88" y="16" width="8" height="8" />
                <rect x="96" y="24" width="8" height="8" />
                <rect x="104" y="32" width="8" height="8" />
              </g>

              <!-- Tiny "rare mark" (keep or delete; still grid-aligned) -->
              <g fill="var(--ui-fg)" shape-rendering="crispEdges">
                <!-- diamond-ish made of pixels -->
                <rect x="56" y="64" width="8" height="8" />
                <rect x="48" y="72" width="8" height="8" />
                <rect x="64" y="72" width="8" height="8" />
                <rect x="56" y="80" width="8" height="8" />
                <!-- small pixel below -->
                <rect x="56" y="96" width="8" height="8" />
              </g>
            </g>

            <!-- WORDMARK -->
            <g transform="translate(190 0)">
              <text
                x="0"
                y="98"
                fill="var(--ui-fg)"
                font-family="var(--brand-font)"
                font-size="56"
                font-weight="700"
                letter-spacing="0"
                class="tracking-[-0.08em]"
              >
                PixPax
              </text>

              <!-- Pixel dot for the i: square accent -->
              <!-- Position tuned for Pixelify Sans; you can tweak x/y by a couple px if needed -->
              <rect
                x="42"
                y="51"
                width="10"
                height="10"
                fill="var(--ui-accent)"
                shape-rendering="crispEdges"
              />
            </g>
          </svg>

          <p class="mt-4 text-sm text-[var(--ui-fg-muted)]">
            Collect stickers, open a weekly pack, and watch your ledger grow.
          </p>
        </div>
      </header>

      <section class="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div
          class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 92%, transparent)] px-4 py-3"
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
        <div
          v-else-if="loadError"
          class="text-sm font-semibold text-red-600"
        >
          {{ loadError }}
        </div>
        <div v-else class="flex flex-col gap-6">
          <section
            v-for="rarity in rarityOrder"
            :key="rarity"
            class="rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 96%, transparent)] p-4"
          >
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
            <div
              class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]"
            >
              <StickerPixel
                v-if="catalogueStyleType === 'pixel'"
                v-for="creature in entriesByRarity.get(rarity) || []"
                :key="creature.id"
                :creature="creature"
                :palettes="catalogue?.palettes || []"
                :finish="collectedByCreatureId.get(creature.id)?.finish"
                :pack-id="collectedByCreatureId.get(creature.id)?.packId"
                :missing="!isOwnedStatus(getStatus(creature.id))"
                :status="getStatus(creature.id)"
                compact
              />
              <Sticker8Bit
                v-else-if="
                  ['8bit-sprites', 'animal-archetype-8bit'].includes(
                    catalogueThemeId
                  )
                "
                v-for="sticker in entriesByRarity.get(rarity) || []"
                :key="sticker.id"
                :sticker="sticker"
                :palettes="catalogue?.palettes || []"
                :finish="collectedByCreatureId.get(sticker.id)?.finish"
                :pack-id="collectedByCreatureId.get(sticker.id)?.packId"
                :kit-id="
                  catalogueThemeId === 'animal-archetype-8bit'
                    ? '8bit-animal-archetype'
                    : '8bit-sprites'
                "
                :missing="!isOwnedStatus(getStatus(sticker.id))"
                :status="getStatus(sticker.id)"
                compact
              />
            </div>
          </section>
        </div>
      </section>

      <section
        v-if="activeTab === 'pack'"
        class="grid gap-6 rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 92%, transparent)] p-6 lg:grid-cols-[minmax(220px,320px)_1fr] lg:items-center"
      >
        <div class="flex flex-col gap-3 text-sm">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold text-[var(--ui-fg)]">
              Weekly Pack
            </h3>
            <p class="text-sm text-[var(--ui-fg-muted)]">
              Each week has one deterministic pack. Open it, verify the
              signature, then lock your stickers into the ledger.
            </p>
            <p class="text-sm text-[var(--ui-fg-muted)]">
              Editorial rarity is curated in the set (rule breaks). Drop rarity
              is rolled per card using the odds below.
            </p>
          </div>
          <div class="flex flex-col gap-2 text-xs text-[var(--ui-fg-muted)]">
            <p>
              Period:
              <strong class="text-[var(--ui-fg)]">{{ periodLabel }}</strong>
            </p>
            <p v-if="secondsUntilNextPeriod">
              Refresh in:
              <strong class="text-[var(--ui-fg)]">
                {{ secondsUntilNextPeriod }}s
              </strong>
            </p>
            <p v-if="devMode">
              Dev seed:
              <strong class="text-[var(--ui-fg)]">{{ devSeed }}</strong>
            </p>
            <p>
              Series:
              <strong class="text-[var(--ui-fg)]">{{ selectedSeriesId }}</strong>
            </p>
            <div class="flex items-center gap-2">
              <span class="uppercase tracking-[0.14em] text-[10px]">
                Verification
              </span>
              <SBadge size="xs" :tone="packVerificationTone" variant="outline">
                {{ packVerificationLabel }}
              </SBadge>
            </div>
            <p v-if="mythicChance" class="flex flex-wrap items-center gap-2">
              <span>Mythic per card:</span>
              <strong class="text-[var(--ui-fg)]">
                {{ (mythicChance * 100).toFixed(2) }}%
              </strong>
              <span>•</span>
              <span>Pack size:</span>
              <strong class="text-[var(--ui-fg)]">{{ packSize }}</strong>
              <span>•</span>
              <span>Chance of ≥1 mythic:</span>
              <strong class="text-[var(--ui-fg)]">
                {{ (mythicChancePerPack * 100).toFixed(2) }}%
              </strong>
            </p>
          </div>
          <Button
            v-if="canOpenPack"
            class="!rounded-full self-start"
            :disabled="isLoading"
            @click="openWeeklyPack"
          >
            {{ devMode ? "Open dev pack" : "Open pack" }}
          </Button>
          <div
            v-else-if="!devMode"
            class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-fg)] p-4 text-sm text-[var(--ui-bg)]"
          >
            <strong>Pack opened</strong>
            <p>Come back next period for a new drop.</p>
            <p v-if="devPeriodSeconds">Dev period: {{ devPeriodSeconds }}s</p>
          </div>
          <p v-if="packError" class="text-sm font-semibold text-red-600">
            {{ packError }}
          </p>
        </div>

        <div class="relative flex flex-col items-center gap-4">
          <div class="relative h-[240px] w-[180px]">
            <div
              class="relative h-full w-full origin-center transition-transform duration-500 ease-out"
              :class="[
                displayPhase === 'opening'
                  ? 'rotate-[-4deg] -translate-y-1'
                  : '',
                displayPhase === 'reveal' || displayPhase === 'done'
                  ? 'rotate-[3deg] translate-y-1'
                  : '',
              ]"
            >
              <div
                class="absolute left-5 right-5 top-0 h-12 rounded-t-[12px] border-4 border-[var(--ui-fg)] bg-[color-mix(in srgb, var(--ui-accent) 40%, var(--ui-bg))]"
              ></div>
              <div
                class="absolute bottom-0 left-3 right-3 flex h-[200px] flex-col items-center justify-center rounded-[16px] border-4 border-[var(--ui-fg)] bg-[color-mix(in srgb, var(--ui-accent) 18%, var(--ui-bg))] text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg)]"
              >
                <span>Sticker Pack</span>
                <small class="mt-2 text-[10px] opacity-70">{{ periodId }}</small>
              </div>
            </div>
            <div
              v-if="packPhase !== 'idle'"
              class="absolute inset-[-20px] rounded-[24px] border-2 border-dashed border-[color-mix(in srgb, var(--ui-border) 70%, transparent)] animate-ping"
            ></div>
          </div>

          <div
            v-if="visibleCards.length"
            class="grid w-full grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4"
          >
            <div
              v-for="(card, index) in visibleCards"
              :key="`${card.creature?.id || card.creatureId}-${index}`"
              class="flex flex-col items-center gap-2 rounded-xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 96%, transparent)] p-3 text-center shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition-all duration-500 ease-out"
              :class="[
                displayPhase !== 'idle'
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-6 scale-[0.98]',
              ]"
              :style="{ transitionDelay: `${index * 120}ms` }"
            >
              <StickerPixel
                v-if="catalogueStyleType === 'pixel'"
                :creature="card.creature"
                :palettes="catalogue?.palettes || []"
                :finish="card.finish"
                :pack-id="card.packId"
                :class="[
                  card.rarity === 'mythic'
                    ? 'rounded-[28px] ring-4 ring-[rgba(124,58,237,0.4)] shadow-[0_12px_28px_rgba(124,58,237,0.4)]'
                    : '',
                ]"
              />
              <Sticker8Bit
                v-else-if="
                  ['8bit-sprites', 'animal-archetype-8bit'].includes(
                    catalogueThemeId
                  )
                "
                :sticker="card.creature"
                :palettes="catalogue?.palettes || []"
                :finish="card.finish"
                :pack-id="card.packId"
                :kit-id="
                  catalogueThemeId === 'animal-archetype-8bit'
                    ? '8bit-animal-archetype'
                    : '8bit-sprites'
                "
                :class="[
                  card.rarity === 'mythic'
                    ? 'rounded-[28px] ring-4 ring-[rgba(124,58,237,0.4)] shadow-[0_12px_28px_rgba(124,58,237,0.4)]'
                    : '',
                ]"
              />
              <span
                class="text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
              >
                {{ card.rarity }}
              </span>
            </div>
          </div>

          <div
            v-if="hasMythic && packPhase !== 'idle'"
            class="absolute -right-2 -top-2 rounded-full bg-[var(--ui-accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ui-bg)] shadow-[0_8px_18px_rgba(124,58,237,0.4)] animate-pulse"
          >
            Mythic reveal!
          </div>
        </div>
      </section>

      <section
        v-if="activeTab === 'swaps'"
        class="grid gap-4 rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 92%, transparent)] p-6"
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
        <div
          v-else
          class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4"
        >
          <div
            v-for="(swap, index) in swapsForSeries"
            :key="`${swap.stickerId || swap.record?.stickerId}-${index}`"
            class="flex flex-col items-center gap-2 rounded-xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 96%, transparent)] p-3 text-center"
          >
            <template v-if="swap.record">
              <StickerPixel
                v-if="catalogueStyleType === 'pixel'"
                :creature="
                  swap.record.creature ||
                  catalogueById.get(swap.record.catalogueId)
                "
                :palettes="catalogue?.palettes || []"
                :finish="swap.record.finish"
                :pack-id="swap.record.packId"
                :status="swap.status"
                compact
              />
              <Sticker8Bit
                v-else-if="
                  ['8bit-sprites', 'animal-archetype-8bit'].includes(
                    catalogueThemeId
                  )
                "
                :sticker="
                  swap.record.creature ||
                  catalogueById.get(swap.record.catalogueId)
                "
                :palettes="catalogue?.palettes || []"
                :finish="swap.record.finish"
                :pack-id="swap.record.packId"
                :kit-id="
                  catalogueThemeId === 'animal-archetype-8bit'
                    ? '8bit-animal-archetype'
                    : '8bit-sprites'
                "
                :status="swap.status"
                compact
              />
            </template>
            <div
              class="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
            >
              <span>{{ swap.record?.catalogueId || swap.stickerId }}</span>
              <span>{{ swap.status }}</span>
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
        <div
          class="rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 96%, transparent)] p-5"
        >
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
