<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";
import CanvasSticker16 from "../../module/pixpax/CanvasSticker16.vue";
import PixPaxStickerCard from "../../module/pixpax/PixPaxStickerCard.vue";
import type { PackPalette16, Sticker } from "../../module/pixpax/sticker-types";
import { argbToCss, packIndicesToIdx4Base64 } from "../../module/pixpax/pixel";

const apiBase = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_TERNENT_API_URL || "https://api.ternent.dev";

function buildApiUrl(path: string) {
  if (!apiBase) return path;
  return new URL(path, apiBase).toString();
}

type DraftCard = {
  cardId: string;
  label: string;
  role: string;
  shiny: boolean;
  art: number[];
};

type DraftProject = {
  collectionId: string;
  version: string;
  name: string;
  description: string;
  createdAt: string;
  palette: PackPalette16;
  series: {
    seriesId: string;
    name: string;
    shinyLimit: number;
  };
  cards: DraftCard[];
};

const DEFAULT_PALETTE: PackPalette16 = {
  id: "default-palette",
  colors: [
    0x00000000, 0xff111111, 0xffffffff, 0xffef4444, 0xff22c55e, 0xff3b82f6,
    0xfff59e0b, 0xffa855f7, 0xff06b6d4, 0xfff97316, 0xff84cc16, 0xffec4899,
    0xff8b5cf6, 0xfff5d0fe, 0xffbae6fd, 0xfffde68a,
  ],
};

function createBlankArt() {
  return new Array(16 * 16).fill(0);
}

function createCard(cardId: string): DraftCard {
  return {
    cardId,
    label: "",
    role: "card",
    shiny: false,
    art: createBlankArt(),
  };
}

function createDefaultProject(): DraftProject {
  return {
    collectionId: "my-collection",
    version: "v1",
    name: "My PixPax Collection",
    description: "",
    createdAt: new Date().toISOString(),
    palette: { id: DEFAULT_PALETTE.id, colors: [...DEFAULT_PALETTE.colors] },
    series: {
      seriesId: "core",
      name: "Core",
      shinyLimit: 6,
    },
    cards: [createCard("card-001")],
  };
}

const project = useLocalStorage<DraftProject>(
  "pixpax/creator/project",
  createDefaultProject(),
);
const selectedCardId = useLocalStorage("pixpax/creator/selectedCardId", "");

const savedAdminToken = useLocalStorage("pixpax/admin/token", "");
const loginToken = ref(savedAdminToken.value);
const loginStatus = ref("");

const activeColorIndex = ref(1);
const painting = ref(false);
const cardIdInput = ref("");
const cardIdError = ref("");
const shinyError = ref("");
const uploadStatus = ref("");
const uploadError = ref("");
const uploading = ref(false);
const uploadStep = ref("");

function ensurePalette() {
  if (!project.value.palette) {
    project.value.palette = {
      id: DEFAULT_PALETTE.id,
      colors: [...DEFAULT_PALETTE.colors],
    };
    return;
  }
  const colors = project.value.palette.colors;
  if (!Array.isArray(colors)) {
    project.value.palette.colors = [...DEFAULT_PALETTE.colors];
    return;
  }
  if (colors.length !== 16) {
    project.value.palette.colors = [...DEFAULT_PALETTE.colors];
  }
  project.value.palette.colors[0] = 0x00000000;
  for (let i = 1; i < project.value.palette.colors.length; i += 1) {
    const value = project.value.palette.colors[i] >>> 0;
    project.value.palette.colors[i] = (0xff << 24) | (value & 0x00ffffff);
  }
}

function ensureCards() {
  if (!Array.isArray(project.value.cards)) {
    project.value.cards = [];
  }
  if (project.value.cards.length === 0) {
    project.value.cards.push(createCard("card-001"));
  }
  for (const card of project.value.cards) {
    if (!Array.isArray(card.art) || card.art.length !== 16 * 16) {
      card.art = createBlankArt();
    }
  }
}

watch(
  () => project.value,
  () => {
    ensurePalette();
    ensureCards();
    if (!selectedCardId.value && project.value.cards[0]) {
      selectedCardId.value = project.value.cards[0].cardId;
    }
  },
  { deep: true, immediate: true },
);

const currentCard = computed(() => {
  const active = project.value.cards.find(
    (card) => card.cardId === selectedCardId.value,
  );
  return active || project.value.cards[0] || null;
});

watch(
  () => project.value.cards.map((card) => card.cardId),
  () => {
    if (!project.value.cards.find((card) => card.cardId === selectedCardId.value)) {
      selectedCardId.value = project.value.cards[0]?.cardId || "";
    }
  },
  { immediate: true },
);

watch(
  () => currentCard.value?.cardId,
  (value) => {
    cardIdInput.value = value || "";
  },
  { immediate: true },
);

const shinyCount = computed(() =>
  project.value.cards.filter((card) => card.shiny).length,
);
const shinyLimit = computed(() => Math.max(0, project.value.series.shinyLimit));
const shinyLimitReached = computed(
  () => shinyLimit.value > 0 && shinyCount.value >= shinyLimit.value,
);

const paletteOptions = computed(() => project.value.palette.colors || []);

function toHex2(value: number) {
  return Math.max(0, Math.min(255, Math.trunc(value)))
    .toString(16)
    .padStart(2, "0");
}

function hexFromArgb(argb: number) {
  const value = argb >>> 0;
  const r = (value >>> 16) & 0xff;
  const g = (value >>> 8) & 0xff;
  const b = value & 0xff;
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

function argbFromHex(hex: string) {
  const normalized = String(hex || "")
    .trim()
    .replace("#", "");
  if (normalized.length !== 6) return 0xff000000;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (0xff << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

function selectColor(index: number) {
  activeColorIndex.value = index;
}

function updatePaletteColor(index: number, hex: string) {
  if (index === 0) return;
  project.value.palette.colors[index] = argbFromHex(hex);
}

function handlePaletteInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  updatePaletteColor(index, target.value);
}

function paintCell(index: number) {
  const card = currentCard.value;
  if (!card) return;
  card.art[index] = activeColorIndex.value;
}

function startPainting(index: number) {
  painting.value = true;
  paintCell(index);
}

function stopPainting() {
  painting.value = false;
}

function handlePointerEnter(index: number) {
  if (!painting.value) return;
  paintCell(index);
}

function cellColor(index: number) {
  const card = currentCard.value;
  if (!card) return "transparent";
  const paletteIndex = card.art[index] ?? 0;
  const color = paletteOptions.value[paletteIndex] ?? 0;
  return color ? argbToCss(color) : "transparent";
}

function clearArt() {
  const card = currentCard.value;
  if (!card) return;
  card.art = createBlankArt();
}

function fillArt() {
  const card = currentCard.value;
  if (!card) return;
  card.art = new Array(16 * 16).fill(activeColorIndex.value);
}

function makeUniqueCardId(base: string) {
  const normalized = String(base || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_.]/g, "");
  if (!normalized) return "card";
  let candidate = normalized;
  let index = 2;
  const exists = (id: string) =>
    project.value.cards.some((card) => card.cardId === id);
  while (exists(candidate)) {
    candidate = `${normalized}-${index}`;
    index += 1;
  }
  return candidate;
}

function addCard() {
  const nextId = makeUniqueCardId(
    `card-${String(project.value.cards.length + 1).padStart(3, "0")}`,
  );
  const card = createCard(nextId);
  project.value.cards.push(card);
  selectedCardId.value = card.cardId;
}

function duplicateCard() {
  const card = currentCard.value;
  if (!card) return;
  const nextId = makeUniqueCardId(`${card.cardId}-copy`);
  const clone: DraftCard = {
    cardId: nextId,
    label: card.label,
    role: card.role,
    shiny: card.shiny,
    art: [...card.art],
  };
  project.value.cards.push(clone);
  selectedCardId.value = clone.cardId;
}

function removeCard() {
  const card = currentCard.value;
  if (!card) return;
  const next = project.value.cards.filter((entry) => entry !== card);
  project.value.cards = next;
  selectedCardId.value = next[0]?.cardId || "";
}

function updateCardId() {
  const card = currentCard.value;
  if (!card) return;
  const normalized = String(cardIdInput.value || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_.]/g, "");
  if (!normalized) {
    cardIdError.value = "Card id is required.";
    cardIdInput.value = card.cardId;
    return;
  }
  if (
    project.value.cards.some(
      (entry) => entry !== card && entry.cardId === normalized,
    )
  ) {
    cardIdError.value = "Card id already exists.";
    cardIdInput.value = card.cardId;
    return;
  }
  cardIdError.value = "";
  card.cardId = normalized;
  selectedCardId.value = normalized;
}

function toggleShiny(next: boolean) {
  const card = currentCard.value;
  if (!card) return;
  shinyError.value = "";
  if (next && shinyLimitReached.value && !card.shiny) {
    shinyError.value = `Shiny limit reached for ${project.value.series.name}.`;
    return;
  }
  card.shiny = next;
}

function handleShinyChange(event: Event) {
  const target = event.target as HTMLSelectElement | null;
  if (!target) return;
  toggleShiny(target.value === "true");
}

function login() {
  savedAdminToken.value = String(loginToken.value || "").trim();
  loginStatus.value = savedAdminToken.value
    ? "Admin token saved locally."
    : "";
}

function logout() {
  savedAdminToken.value = "";
  loginToken.value = "";
  loginStatus.value = "Logged out.";
}

const activePalette = computed<PackPalette16>(() => ({
  id: project.value.palette.id,
  colors: project.value.palette.colors.map((value) => Number(value) >>> 0),
}));

const currentArt = computed(() => {
  const card = currentCard.value;
  const indices = card ? Uint8Array.from(card.art) : new Uint8Array(16 * 16);
  return {
    v: 1 as const,
    w: 16 as const,
    h: 16 as const,
    fmt: "idx4" as const,
    px: packIndicesToIdx4Base64(indices),
  };
});

const previewSticker = computed<Sticker>(() => {
  const card = currentCard.value;
  const cardId = card?.cardId || "card";
  return {
    meta: {
      id: cardId,
      contentHash: "",
      name: card?.label || cardId,
      collectionId: project.value.collectionId,
      collectionName: project.value.name,
      series: project.value.series.seriesId,
      rarity: "common",
      finish: "matte",
      shiny: Boolean(card?.shiny),
    },
    art: currentArt.value,
  };
});

function buildCollectionPayload() {
  return {
    collectionId: project.value.collectionId,
    version: project.value.version,
    name: project.value.name,
    description: project.value.description,
    gridSize: 16,
    createdAt: project.value.createdAt,
    palette: {
      id: project.value.palette.id,
      colors: project.value.palette.colors.map((value) => Number(value) >>> 0),
    },
  };
}

function buildIndexPayload() {
  const cards = project.value.cards.map((card) => card.cardId);
  const cardMap: Record<string, { seriesId: string; slotIndex: number; role: string }> = {};
  project.value.cards.forEach((card, index) => {
    cardMap[card.cardId] = {
      seriesId: project.value.series.seriesId,
      slotIndex: index,
      role: card.role || "card",
    };
  });
  return {
    series: [
      {
        seriesId: project.value.series.seriesId,
        name: project.value.series.name,
      },
    ],
    cards,
    cardMap,
  };
}

function buildCardPayload(card: DraftCard, slotIndex: number) {
  return {
    cardId: card.cardId,
    seriesId: project.value.series.seriesId,
    slotIndex,
    role: card.role || "card",
    label: card.label || card.cardId,
    attributes: {
      shiny: card.shiny,
    },
    renderPayload: {
      gridSize: 16,
      gridB64: packIndicesToIdx4Base64(Uint8Array.from(card.art)),
    },
  };
}

function buildUploadBundle() {
  const collection = buildCollectionPayload();
  const index = buildIndexPayload();
  const cards = project.value.cards.map((card, idx) =>
    buildCardPayload(card, idx),
  );
  return { collection, index, cards };
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportProject() {
  downloadJson(
    `${project.value.collectionId || "pixpax"}-${project.value.version}-draft.json`,
    project.value,
  );
}

function exportUploadBundle() {
  downloadJson(
    `${project.value.collectionId || "pixpax"}-${project.value.version}-bundle.json`,
    buildUploadBundle(),
  );
}

const importInputRef = ref<HTMLInputElement | null>(null);

function triggerImport() {
  importInputRef.value?.click();
}

async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.files?.length) return;
  const file = target.files[0];
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as DraftProject;
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid JSON.");
    }
    project.value = parsed;
    selectedCardId.value = parsed.cards?.[0]?.cardId || "";
    uploadStatus.value = "Draft imported.";
    uploadError.value = "";
  } catch (error: any) {
    uploadError.value = error?.message || "Failed to import JSON.";
  } finally {
    if (target) target.value = "";
  }
}

function validateProject() {
  const collectionId = String(project.value.collectionId || "").trim();
  const version = String(project.value.version || "").trim();
  if (!collectionId) return "Collection id is required.";
  if (!version) return "Version is required.";
  if (!project.value.cards.length) return "Add at least one card.";
  const ids = new Set<string>();
  for (const card of project.value.cards) {
    const cardId = String(card.cardId || "").trim();
    if (!cardId) return "Every card needs a card id.";
    if (ids.has(cardId)) return `Duplicate card id: ${cardId}`;
    ids.add(cardId);
  }
  return "";
}

async function putJson(path: string, payload: unknown, token: string) {
  const response = await fetch(buildApiUrl(path), {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${response.status} ${response.statusText}: ${text || "request failed"}`,
    );
  }
}

async function uploadAll() {
  const token = String(savedAdminToken.value || "").trim();
  if (!token) {
    uploadError.value = "Please login with your admin token first.";
    return;
  }

  const validation = validateProject();
  if (validation) {
    uploadError.value = validation;
    return;
  }

  uploading.value = true;
  uploadError.value = "";
  uploadStatus.value = "";

  try {
    const encodedCollectionId = encodeURIComponent(
      project.value.collectionId.trim(),
    );
    const encodedVersion = encodeURIComponent(project.value.version.trim());

    uploadStep.value = "Uploading collection.json";
    await putJson(
      `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/collection`,
      buildCollectionPayload(),
      token,
    );

    uploadStep.value = "Uploading index.json";
    await putJson(
      `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/index`,
      buildIndexPayload(),
      token,
    );

    uploadStep.value = "Uploading cards";
    for (let i = 0; i < project.value.cards.length; i += 1) {
      const card = project.value.cards[i];
      uploadStep.value = `Uploading ${card.cardId} (${i + 1}/${project.value.cards.length})`;
      await putJson(
        `/v1/pixpax/collections/${encodedCollectionId}/${encodedVersion}/cards/${encodeURIComponent(
          card.cardId,
        )}`,
        buildCardPayload(card, i),
        token,
      );
    }

    uploadStatus.value = "Upload complete. Collection is now stored server-side.";
  } catch (error: any) {
    uploadError.value = error?.message || "Upload failed.";
  } finally {
    uploading.value = false;
    uploadStep.value = "";
  }
}

function copyEnvSnippet() {
  const payload = JSON.stringify([
    {
      collectionId: project.value.collectionId,
      version: project.value.version,
    },
  ]);
  navigator.clipboard
    .writeText(payload)
    .then(() => {
      uploadStatus.value = "Env snippet copied to clipboard.";
    })
    .catch(() => {
      uploadError.value = "Copy failed. Clipboard access was denied.";
    });
}

onMounted(() => {
  window.addEventListener("pointerup", stopPainting);
});

onUnmounted(() => {
  window.removeEventListener("pointerup", stopPainting);
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h1 class="text-xl font-semibold mb-2">PixPax Studio</h1>
      <p class="text-sm text-[var(--ui-fg-muted)]">
        Create sticker art, manage palette, and upload collections. Drafts save
        locally, so you can work over multiple sessions.
      </p>
    </section>

    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h2 class="text-lg font-medium mb-3">Admin Token</h2>
      <div class="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <label class="field">
          <span>Admin token</span>
          <input
            v-model="loginToken"
            type="password"
            autocomplete="off"
            placeholder="Paste PIX_PAX_ADMIN_TOKEN"
          />
        </label>
        <div class="flex items-end">
          <Button class="!px-4 !py-2" @click="login">Login</Button>
        </div>
        <div class="flex items-end">
          <Button class="!px-4 !py-2" @click="logout">Logout</Button>
        </div>
      </div>
      <p class="mt-2 text-xs text-[var(--ui-fg-muted)]">
        Status:
        {{ savedAdminToken ? "token saved locally" : "not logged in" }}
      </p>
      <p v-if="loginStatus" class="mt-2 text-xs text-[var(--ui-fg-muted)]">
        {{ loginStatus }}
      </p>
    </section>

    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h2 class="text-lg font-medium mb-3">Collection Settings</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field">
          <span>Collection id</span>
          <input v-model="project.collectionId" type="text" />
        </label>
        <label class="field">
          <span>Version</span>
          <input v-model="project.version" type="text" />
        </label>
        <label class="field">
          <span>Name</span>
          <input v-model="project.name" type="text" />
        </label>
        <label class="field">
          <span>Palette id</span>
          <input v-model="project.palette.id" type="text" />
        </label>
        <label class="field md:col-span-2">
          <span>Description</span>
          <textarea v-model="project.description" rows="2"></textarea>
        </label>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <label class="field">
          <span>Series id (single for now)</span>
          <input v-model="project.series.seriesId" type="text" />
        </label>
        <label class="field">
          <span>Series name</span>
          <input v-model="project.series.name" type="text" />
        </label>
        <label class="field">
          <span>Shiny limit (per series)</span>
          <input
            v-model.number="project.series.shinyLimit"
            type="number"
            min="0"
            max="200"
          />
        </label>
      </div>
      <p class="mt-2 text-xs text-[var(--ui-fg-muted)]">
        Shiny count: {{ shinyCount }} / {{ shinyLimit || "∞" }}
      </p>
      <p class="text-xs text-[var(--ui-fg-muted)]">Set to 0 for unlimited.</p>
    </section>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section class="rounded-xl border border-[var(--ui-border)] p-4">
        <h2 class="text-lg font-medium mb-3">Palette + Editor</h2>
        <div class="grid gap-4 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
          <div class="grid gap-2">
            <div class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
              Palette
            </div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="(color, index) in paletteOptions"
                :key="`palette-${index}`"
                type="button"
                class="palette-chip"
                :class="{
                  active: index === activeColorIndex,
                  transparent: index === 0,
                }"
                :style="{ background: argbToCss(color) }"
                @click="selectColor(index)"
              >
                <span>{{ index }}</span>
              </button>
            </div>

            <div class="grid gap-2">
              <div
                v-for="(color, index) in paletteOptions"
                :key="`palette-edit-${index}`"
                class="palette-edit"
              >
                <span class="text-xs text-[var(--ui-fg-muted)]">{{ index }}</span>
                <input
                  v-if="index !== 0"
                  type="color"
                  :value="hexFromArgb(color)"
                  @input="handlePaletteInput(index, $event)"
                />
                <input
                  v-else
                  type="text"
                  value="transparent"
                  readonly
                  class="mono"
                />
                <span class="mono text-[11px]">{{ hexFromArgb(color) }}</span>
              </div>
            </div>
          </div>

          <div class="grid gap-4">
            <div class="flex flex-wrap items-center gap-2">
              <Button class="!px-3 !py-2" @click="clearArt">Clear</Button>
              <Button class="!px-3 !py-2" @click="fillArt">Fill</Button>
              <span class="text-xs text-[var(--ui-fg-muted)]">
                Active color index: {{ activeColorIndex }}
              </span>
            </div>

            <div class="editor-grid" @contextmenu.prevent>
              <button
                v-for="(_, index) in 256"
                :key="`cell-${index}`"
                type="button"
                class="editor-cell"
                :style="{ background: cellColor(index) }"
                @pointerdown.prevent="startPainting(index)"
                @pointerenter.prevent="handlePointerEnter(index)"
              ></button>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-[var(--ui-border)] p-4">
        <h2 class="text-lg font-medium mb-3">Cards</h2>
        <div class="grid gap-2">
          <div class="flex flex-wrap gap-2">
            <Button class="!px-3 !py-2" @click="addCard">Add card</Button>
            <Button class="!px-3 !py-2" @click="duplicateCard"
              >Duplicate</Button
            >
            <Button class="!px-3 !py-2" @click="removeCard">Delete</Button>
          </div>

          <div class="grid gap-2 max-h-[240px] overflow-auto">
            <button
              v-for="card in project.cards"
              :key="card.cardId"
              type="button"
              class="card-row"
              :class="{ active: card.cardId === currentCard?.cardId }"
              @click="selectedCardId = card.cardId"
            >
              <span class="mono text-xs">{{ card.cardId }}</span>
              <span class="text-xs text-[var(--ui-fg-muted)]">
                {{ card.label || "Untitled" }}
              </span>
              <span v-if="card.shiny" class="badge">Shiny</span>
            </button>
          </div>
        </div>

        <div v-if="currentCard" class="mt-4 grid gap-3">
          <label class="field">
            <span>Card id</span>
            <input v-model="cardIdInput" type="text" @blur="updateCardId" />
          </label>
          <p v-if="cardIdError" class="text-xs text-red-600">
            {{ cardIdError }}
          </p>
          <label class="field">
            <span>Title</span>
            <input v-model="currentCard.label" type="text" />
          </label>
          <label class="field">
            <span>Role</span>
            <input v-model="currentCard.role" type="text" />
          </label>
          <label class="field">
            <span>Shiny</span>
            <select
              :value="currentCard.shiny"
              @change="handleShinyChange"
            >
              <option :value="false">No</option>
              <option :value="true">Yes</option>
            </select>
          </label>
          <p v-if="shinyError" class="text-xs text-red-600">
            {{ shinyError }}
          </p>

          <div class="grid gap-3">
            <div class="text-xs uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
              Preview
            </div>
            <PixPaxStickerCard
              :sticker="previewSticker"
              :palette="activePalette"
              :compact="false"
              :animated="false"
              :sparkles="previewSticker.meta.shiny"
              :glow="previewSticker.meta.shiny"
              :shimmer="previewSticker.meta.shiny"
            />
            <div class="flex items-center gap-2">
              <CanvasSticker16
                :art="currentArt"
                :palette="activePalette"
                :scale="8"
                class="border border-[var(--ui-border)] rounded-md"
              />
              <div class="text-xs text-[var(--ui-fg-muted)]">
                gridB64 length: {{ currentArt.px.length }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h2 class="text-lg font-medium mb-3">Export + Upload</h2>
      <div class="flex flex-wrap gap-2">
        <Button class="!px-4 !py-2" @click="exportProject">
          Download draft JSON
        </Button>
        <Button class="!px-4 !py-2" @click="exportUploadBundle">
          Download upload bundle
        </Button>
        <Button class="!px-4 !py-2" @click="triggerImport">
          Import draft JSON
        </Button>
        <input
          ref="importInputRef"
          type="file"
          class="hidden"
          accept="application/json"
          @change="handleImport"
        />
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <Button
          class="!px-5 !py-2 !bg-[var(--ui-accent)]"
          :disabled="uploading"
          @click="uploadAll"
        >
          {{ uploading ? "Uploading..." : "Upload collection" }}
        </Button>
        <Button class="!px-4 !py-2" @click="copyEnvSnippet">
          Copy env snippet
        </Button>
      </div>
      <p v-if="uploadStep" class="mt-3 text-xs text-[var(--ui-fg-muted)]">
        {{ uploadStep }}
      </p>
      <p v-if="uploadError" class="mt-3 text-sm font-semibold text-red-600">
        {{ uploadError }}
      </p>
      <p v-if="uploadStatus" class="mt-3 text-sm text-[var(--ui-fg-muted)]">
        {{ uploadStatus }}
      </p>

      <div class="mt-4 rounded-lg border border-[var(--ui-border)] p-3">
        <div class="text-xs uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
          Deploy Checklist
        </div>
        <ul class="mt-2 text-xs text-[var(--ui-fg-muted)] list-disc list-inside">
          <li>Upload collection, index, and cards (button above).</li>
          <li>
            Add the collection to `VITE_PIXPAX_PUBLIC_COLLECTIONS` and rebuild
            the app.
          </li>
          <li>
            Use `/pixpax/collections` to verify cards render with the palette.
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ui-fg-muted);
}

.field input,
.field select,
.field textarea {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: var(--ui-bg);
  color: var(--ui-fg);
  padding: 10px 12px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

.palette-chip {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--ui-border);
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--ui-fg);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.palette-chip.transparent {
  background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 25%,
      transparent 25%
    ),
    linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.1) 25%,
      transparent 25%
    ),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
}

.palette-chip.active {
  transform: translateY(-2px);
  box-shadow: 0 0 0 2px var(--ui-accent);
}

.palette-edit {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.palette-edit input[type="color"] {
  width: 100%;
  height: 32px;
  border: none;
  background: transparent;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: 2px;
  background: var(--ui-border);
  padding: 4px;
  border-radius: 12px;
}

.editor-cell {
  aspect-ratio: 1 / 1;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: crosshair;
}

.card-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--ui-border);
  text-align: left;
}

.card-row.active {
  border-color: var(--ui-accent);
  background: color-mix(in_srgb, var(--ui-accent) 12%, transparent);
}

.badge {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  padding: 4px 6px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
}
</style>
