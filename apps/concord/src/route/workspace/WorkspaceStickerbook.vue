<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";
import StickerCreature from "../../module/stickerbook/StickerCreature.vue";
import StickerLetter from "../../module/stickerbook/StickerLetter.vue";
import StickerCreatureNatural from "../../module/stickerbook/StickerCreatureNatural.vue";
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

const apiBase = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_TERNENT_API_URL || "https://api.ternent.dev";

function buildApiUrl(path: string) {
  if (!apiBase) return path;
  return new URL(path, apiBase).toString();
}
const issuerPublicKeyPem = import.meta.env.VITE_ISSUER_PUBLIC_KEY_PEM || "";

const {
  profileId,
  openedEntries,
  openedBySeriesPeriod,
  collectedByCreatureId,
  collectedBySeries,
  collectedUniqueBySeries,
  collectedByPackId,
  swapsBySeries,
  recordPackAndStickers,
} = useStickerbook();

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
  if (openedForPeriod.value?.verified) return "verified";
  return packVerification.value;
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
const openedForPeriod = computed(() => {
  const key = `${selectedSeriesId.value}:${periodId.value}`;
  return openedBySeriesPeriod.value.get(key) || null;
});
const openedPackIds = computed(
  () => new Set(openedEntries.value.map((entry) => entry.data.packId))
);

const rarityOrder = ["mythic", "rare", "uncommon", "common"];
const packCount = 5;

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
const collectedCount = computed(() => {
  return collectedUniqueBySeries.value.get(selectedSeriesId.value)?.size || 0;
});

const collectedByRarityForSeries = computed(() => {
  const map = new Map<string, any[]>();
  for (const entry of collectedBySeries.value.get(selectedSeriesId.value) ||
    []) {
    if (!entry?.rarity) continue;
    const list = map.get(entry.rarity) || [];
    list.push(entry);
    map.set(entry.rarity, list);
  }
  return map;
});

const swapCount = computed(
  () => swapsBySeries.value.get(selectedSeriesId.value)?.length || 0
);

const swapsForSeries = computed(() => {
  return swapsBySeries.value.get(selectedSeriesId.value) || [];
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

const catalogueByAttributes = computed(() => {
  const map = new Map<string, any>();
  for (const entry of catalogueEntries.value) {
    map.set(buildAttributeKey(entry), entry);
  }
  return map;
});

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
    const list =
      collectedByPackId.value.get(openedForPeriod.value.packId) || [];
    return list.map((item) => ({
      creature:
        catalogueById.value.get(
          item.creatureId || item.catalogueId || item.stickerId
        ) || null,
      rarity: item.rarity,
      finish: "base",
      packId: item.packId,
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
        issuerKeyId: issuePayload.issuerKeyId,
        verified: true,
        verifiedAt: new Date().toISOString(),
      };

      const stickerPayloads = packEntries.map((card) => ({
        type: "sticker.owned",
        packId,
        packRequestId,
        seriesId: issuePayload.seriesId,
        themeId: issuePayload.themeId,
        stickerId: card.stickerId,
        creatureId: card.catalogueId ?? card.stickerId,
        index: card.index,
        rarity: card.rarity,
        catalogueId: card.catalogueId,
        finish: "base",
        verified: true,
        entry: card.entry,
        proof: card.proof,
        ownedAt: new Date().toISOString(),
      }));

      await recordPackAndStickers(packPayload, stickerPayloads);
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
  <div class="stickerbook-shell">
    <header class="stickerbook-header">
      <div>
        <p class="stickerbook-kicker">Concord Demo</p>
        <h2 class="stickerbook-title">Stickerbook</h2>
        <p class="stickerbook-subtitle">
          Collect stickers, open a weekly pack, and watch your ledger grow.
        </p>
      </div>
      <div class="stickerbook-status">
        <span>Collected</span>
        <strong>{{ collectedCount }}/{{ totalCreatures }}</strong>
      </div>
    </header>

    <div class="stickerbook-series">
      <span>Series</span>
      <div class="stickerbook-series-buttons">
        <button
          v-for="series in enabledSeries"
          :key="series.id"
          type="button"
          :class="selectedSeriesId === series.id ? 'active' : ''"
          @click="selectedSeriesId = series.id"
        >
          {{ series.label }}
        </button>
      </div>
    </div>

    <nav class="stickerbook-tabs">
      <button
        type="button"
        :class="activeTab === 'book' ? 'active' : ''"
        @click="activeTab = 'book'"
      >
        Stickerbook
      </button>
      <button
        type="button"
        :class="activeTab === 'pack' ? 'active' : ''"
        @click="activeTab = 'pack'"
      >
        Weekly Pack
      </button>
      <button
        type="button"
        :class="activeTab === 'swaps' ? 'active' : ''"
        @click="activeTab = 'swaps'"
      >
        Swaps
      </button>
      <button
        type="button"
        :class="activeTab === 'progress' ? 'active' : ''"
        @click="activeTab = 'progress'"
      >
        Progress
      </button>
    </nav>

    <section v-if="activeTab === 'book'" class="stickerbook-panel">
      <div v-if="isLoading" class="stickerbook-message">
        Loading catalogue...
      </div>
      <div v-else-if="loadError" class="stickerbook-message error">
        {{ loadError }}
      </div>
      <div v-else class="stickerbook-rows">
        <section
          v-for="rarity in rarityOrder"
          :key="rarity"
          class="rarity-section"
        >
          <header>
            <h3>{{ rarity }}</h3>
            <span>
              {{ collectedByRarityForSeries.get(rarity)?.length || 0 }}/{{
                entriesByRarity.get(rarity)?.length || 0
              }}
            </span>
          </header>
          <div class="rarity-grid">
            <StickerCreature
              v-if="catalogueStyleType === 'creature'"
              v-for="creature in entriesByRarity.get(rarity) || []"
              :key="creature.id"
              :creature="creature"
              :finish="collectedByCreatureId.get(creature.id)?.finish"
              :pack-id="collectedByCreatureId.get(creature.id)?.packId"
              :missing="!collectedByCreatureId.has(creature.id)"
              compact
            />
            <StickerCreatureNatural
              v-else-if="catalogueStyleType === 'natural'"
              v-for="creature in entriesByRarity.get(rarity) || []"
              :key="creature.id"
              :creature="creature"
              :palettes="catalogue?.palettes || []"
              :finish="collectedByCreatureId.get(creature.id)?.finish"
              :pack-id="collectedByCreatureId.get(creature.id)?.packId"
              :missing="!collectedByCreatureId.has(creature.id)"
              compact
            />
            <StickerPixel
              v-else-if="catalogueStyleType === 'pixel'"
              v-for="creature in entriesByRarity.get(rarity) || []"
              :key="creature.id"
              :creature="creature"
              :palettes="catalogue?.palettes || []"
              :finish="collectedByCreatureId.get(creature.id)?.finish"
              :pack-id="collectedByCreatureId.get(creature.id)?.packId"
              :missing="!collectedByCreatureId.has(creature.id)"
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
              :missing="!collectedByCreatureId.has(sticker.id)"
              compact
            />
            <StickerLetter
              v-else
              v-for="sticker in entriesByRarity.get(rarity) || []"
              :key="sticker.id"
              :attributes="sticker.attributes"
              :finish="collectedByCreatureId.get(sticker.id)?.finish"
              :pack-id="collectedByCreatureId.get(sticker.id)?.packId"
              :missing="!collectedByCreatureId.has(sticker.id)"
              compact
            />
          </div>
        </section>
      </div>
    </section>

    <section v-if="activeTab === 'pack'" class="stickerbook-panel pack-panel">
      <div class="pack-left">
        <h3>Weekly Pack</h3>
        <p class="pack-copy">
          Each week has one deterministic pack. Open it, verify the signature,
          then lock your stickers into the ledger.
        </p>
        <p class="pack-copy">
          Editorial rarity is curated in the set (rule breaks). Drop rarity is
          rolled per card using the odds below.
        </p>
        <p class="pack-meta">
          Period: <strong>{{ periodLabel }}</strong>
        </p>
        <p v-if="secondsUntilNextPeriod" class="pack-meta">
          Refresh in: <strong>{{ secondsUntilNextPeriod }}s</strong>
        </p>
        <p v-if="devMode" class="pack-meta">
          Dev seed: <strong>{{ devSeed }}</strong>
        </p>
        <p class="pack-meta">
          Series: <strong>{{ selectedSeriesId }}</strong>
        </p>
        <p class="pack-meta">
          Verification:
          <strong v-if="packVerificationState === 'verified'">Verified</strong>
          <strong v-else-if="packVerificationState === 'failed'">Failed</strong>
          <strong v-else>Pending</strong>
        </p>
        <p class="pack-meta" v-if="mythicChance">
          Mythic per card:
          <strong>{{ (mythicChance * 100).toFixed(2) }}%</strong>
          <span>•</span>
          Pack size: <strong>{{ packSize }}</strong>
          <span>•</span>
          Chance of ≥1 mythic:
          <strong>{{ (mythicChancePerPack * 100).toFixed(2) }}%</strong>
        </p>
        <Button
          v-if="canOpenPack"
          class="pack-button"
          :disabled="isLoading"
          @click="openWeeklyPack"
        >
          {{ devMode ? "Open dev pack" : "Open pack" }}
        </Button>
        <div v-else-if="!devMode" class="pack-locked">
          <strong>Pack opened</strong>
          <p>Come back next period for a new drop.</p>
          <p v-if="devPeriodSeconds">Dev period: {{ devPeriodSeconds }}s</p>
        </div>
        <p v-if="packError" class="pack-error">{{ packError }}</p>
      </div>

      <div class="pack-right">
        <div class="pack-stage" :class="`phase-${displayPhase}`">
          <div class="pack-wrap">
            <div class="pack-top"></div>
            <div class="pack-body">
              <span>Sticker Pack</span>
              <small>{{ periodId }}</small>
            </div>
          </div>
          <div class="pack-ripple" v-if="packPhase !== 'idle'"></div>
        </div>

        <div class="pack-cards" v-if="visibleCards.length">
          <div
            v-for="(card, index) in visibleCards"
            :key="`${card.creature?.id || card.creatureId}-${index}`"
            class="pack-card"
            :class="[displayPhase !== 'idle' ? 'show' : '', card.rarity]"
            :style="`--delay:${index * 120}ms;`"
          >
            <StickerCreature
              v-if="catalogueStyleType === 'creature'"
              :creature="card.creature"
              :finish="card.finish"
              :pack-id="card.packId"
            />
            <StickerCreatureNatural
              v-else-if="catalogueStyleType === 'natural'"
              :creature="card.creature"
              :palettes="catalogue?.palettes || []"
              :finish="card.finish"
              :pack-id="card.packId"
            />
            <StickerPixel
              v-else-if="catalogueStyleType === 'pixel'"
              :creature="card.creature"
              :palettes="catalogue?.palettes || []"
              :finish="card.finish"
              :pack-id="card.packId"
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
            />
            <StickerLetter
              v-else
              :attributes="card.creature.attributes"
              :finish="card.finish"
              :pack-id="card.packId"
            />
            <span class="pack-card-label">{{ card.rarity }}</span>
          </div>
        </div>

        <div v-if="hasMythic && packPhase !== 'idle'" class="mythic-reveal">
          Mythic reveal!
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'swaps'" class="stickerbook-panel swaps-panel">
      <div class="swaps-header">
        <h3>Swaps pile</h3>
        <p>Duplicates you can trade without affecting collection totals.</p>
      </div>
      <div v-if="!swapsForSeries.length" class="stickerbook-message">
        No swaps yet.
      </div>
      <div v-else class="swaps-grid">
        <div
          v-for="(swap, index) in swapsForSeries"
          :key="`${swap.creatureId}-${index}`"
          class="swap-card"
        >
          <StickerCreature
            v-if="catalogueStyleType === 'creature'"
            :creature="catalogueById.get(swap.creatureId)"
            :finish="swap.finish"
            :pack-id="swap.packId"
            compact
          />
          <StickerCreatureNatural
            v-else-if="catalogueStyleType === 'natural'"
            :creature="catalogueById.get(swap.creatureId)"
            :palettes="catalogue?.palettes || []"
            :finish="swap.finish"
            :pack-id="swap.packId"
            compact
          />
          <StickerPixel
            v-else-if="catalogueStyleType === 'pixel'"
            :creature="catalogueById.get(swap.creatureId)"
            :palettes="catalogue?.palettes || []"
            :finish="swap.finish"
            :pack-id="swap.packId"
            compact
          />
          <Sticker8Bit
            v-else-if="
              ['8bit-sprites', 'animal-archetype-8bit'].includes(
                catalogueThemeId
              )
            "
            :sticker="catalogueById.get(swap.creatureId)"
            :palettes="catalogue?.palettes || []"
            :finish="swap.finish"
            :pack-id="swap.packId"
            :kit-id="
              catalogueThemeId === 'animal-archetype-8bit'
                ? '8bit-animal-archetype'
                : '8bit-sprites'
            "
            compact
          />
          <StickerLetter
            v-else
            :attributes="catalogueById.get(swap.creatureId)?.attributes"
            :finish="swap.finish"
            :pack-id="swap.packId"
            compact
          />
          <div class="swap-meta">
            <span>{{ swap.creatureId }}</span>
            <span>{{ swap.rarity }}</span>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="activeTab === 'progress'"
      class="stickerbook-panel progress-panel"
    >
      <div class="progress-card">
        <h3>Your Collection</h3>
        <p>
          Total: <strong>{{ collectedCount }}</strong> of
          <strong>{{ totalCreatures }}</strong>
        </p>
        <ul>
          <li v-for="item in progressByRarity" :key="item.rarity">
            <span>{{ item.rarity }}</span>
            <strong>{{ item.collected }}/{{ item.total }}</strong>
          </li>
        </ul>
      </div>
      <div class="progress-card">
        <h3>Series</h3>
        <p>
          Series collected:
          <strong>{{ collectedCount }}</strong>
        </p>
        <p>
          Swaps pile:
          <strong>{{ swapCount }}</strong>
        </p>
        <p>
          Opened this period:
          <strong>{{ openedForPeriod ? "yes" : "no" }}</strong>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.stickerbook-shell {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: radial-gradient(
    circle at top,
    #fff7d6 0%,
    #ffe3f0 40%,
    #d4f2ff 100%
  );
  min-height: 100%;
  font-family: "Trebuchet MS", "Comic Sans MS", "Verdana", sans-serif;
}

.stickerbook-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
  border: 3px solid rgba(15, 23, 42, 0.1);
}

.stickerbook-kicker {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  color: #a855f7;
  margin-bottom: 0.3rem;
}

.stickerbook-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
}

.stickerbook-subtitle {
  color: #475569;
  margin: 0.4rem 0 0;
}

.stickerbook-status {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: #0f172a;
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  align-self: flex-start;
}

.stickerbook-tabs {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.stickerbook-series {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #0f172a;
}

.stickerbook-series-buttons {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.stickerbook-series-buttons button {
  border: 2px solid rgba(15, 23, 42, 0.2);
  background: #fff;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: all 0.2s ease;
}

.stickerbook-series-buttons button.active {
  background: #0f172a;
  color: #fff;
  transform: translateY(-2px);
}

.stickerbook-tabs button {
  border: 2px solid rgba(15, 23, 42, 0.2);
  background: #fff;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: all 0.2s ease;
}

.stickerbook-tabs button.active {
  background: #0f172a;
  color: #fff;
  transform: translateY(-2px);
}

.stickerbook-panel {
  background: #ffffffc7;
  border-radius: 20px;
  padding: 1.5rem;
  border: 3px dashed rgba(15, 23, 42, 0.18);
}

.stickerbook-message {
  font-weight: 600;
  color: #475569;
}

.stickerbook-message.error {
  color: #dc2626;
}

.stickerbook-rows {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rarity-section header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.85rem;
  color: #0f172a;
  margin-bottom: 0.6rem;
}

.rarity-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
}

.pack-panel {
  display: grid;
  gap: 1.5rem;
}

.pack-left h3 {
  margin: 0;
  font-size: 1.5rem;
}

.pack-copy {
  color: #475569;
}

.pack-meta {
  font-size: 0.9rem;
}

.pack-locked {
  background: #0f172a;
  color: #fff;
  padding: 0.8rem 1rem;
  border-radius: 16px;
}

.pack-error {
  color: #b91c1c;
  margin-top: 0.6rem;
}

.pack-right {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pack-stage {
  position: relative;
  width: 180px;
  height: 240px;
}

.pack-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: center;
  transition: transform 0.5s ease;
}

.pack-top {
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 50px;
  background: #fca5a5;
  border: 4px solid #0f172a;
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
}

.pack-body {
  position: absolute;
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 200px;
  background: #fde68a;
  border: 4px solid #0f172a;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.pack-body small {
  font-size: 0.7rem;
  margin-top: 0.4rem;
  opacity: 0.7;
}

.pack-stage.phase-opening .pack-wrap {
  transform: rotate(-4deg) translateY(-4px);
}

.pack-stage.phase-reveal .pack-wrap,
.pack-stage.phase-done .pack-wrap {
  transform: rotate(3deg) translateY(4px);
}

.pack-ripple {
  position: absolute;
  inset: -20px;
  border: 2px dashed rgba(15, 23, 42, 0.25);
  border-radius: 24px;
  animation: ripple 2s infinite;
}

.pack-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  width: 100%;
}

.pack-card {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  transition: all 0.5s ease;
}

.pack-card.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: var(--delay);
}

.pack-card-label {
  display: inline-block;
  margin-top: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  color: #0f172a;
}

.pack-card.mythic .sticker-creature {
  box-shadow: 0 12px 28px rgba(124, 58, 237, 0.4),
    inset 0 0 0 4px rgba(124, 58, 237, 0.4);
}

.pack-card.mythic .sticker-natural {
  box-shadow: 0 12px 28px rgba(124, 58, 237, 0.4),
    inset 0 0 0 4px rgba(124, 58, 237, 0.4);
}

.pack-card.mythic .sticker-pixel {
  box-shadow: 0 12px 28px rgba(124, 58, 237, 0.4),
    inset 0 0 0 4px rgba(124, 58, 237, 0.4);
}

.mythic-reveal {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #7c3aed;
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 8px 18px rgba(124, 58, 237, 0.4);
  animation: pop 1.5s ease-in-out infinite;
}

.progress-panel {
  display: grid;
  gap: 1.5rem;
}

.swaps-panel {
  display: grid;
  gap: 1rem;
}

.swaps-header h3 {
  margin: 0;
}

.swaps-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.swap-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.swap-meta {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  color: #1f2937;
}

.progress-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.25rem;
  border: 3px solid rgba(15, 23, 42, 0.1);
}

.progress-card h3 {
  margin-top: 0;
}

.progress-card ul {
  list-style: none;
  padding: 0;
  margin: 0.8rem 0 0;
  display: grid;
  gap: 0.4rem;
}

.progress-card li {
  display: flex;
  justify-content: space-between;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
}

@media (min-width: 900px) {
  .stickerbook-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .pack-panel {
    grid-template-columns: minmax(220px, 320px) 1fr;
    align-items: center;
  }

  .progress-panel {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }
}

@keyframes ripple {
  0% {
    transform: scale(0.95);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.05);
    opacity: 0;
  }
}

@keyframes pop {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}
</style>
