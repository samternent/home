<script setup lang="ts">
import { computed, ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";

const apiBase = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_TERNENT_API_URL || "https://api.ternent.dev";

function buildApiUrl(path: string) {
  if (!apiBase) return path;
  return new URL(path, apiBase).toString();
}

function toIsoWeek(date = new Date()) {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    (((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7,
  );
  return `${utc.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

type CollectionRef = {
  collectionId: string;
  version: string;
};

type OverrideCodeResponse = {
  ok: boolean;
  code: string;
  giftCode?: string;
  codeId: string;
  collectionId: string;
  version: string;
  dropId: string;
  count: number;
  bindToUser?: boolean;
  issuedTo?: string | null;
  expiresAt: string;
  issuedAt: string;
};

function parseCollectionRefs(): CollectionRef[] {
  const raw = String(import.meta.env.VITE_PIXPAX_PUBLIC_COLLECTIONS || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const refs = parsed
          .map((entry: any) => ({
            collectionId: String(entry?.collectionId || "").trim(),
            version: String(entry?.version || "").trim(),
          }))
          .filter((entry) => entry.collectionId && entry.version);
        if (refs.length) return refs;
      }
    } catch {
      // fallback below
    }
  }
  return [{ collectionId: "premier-league-2026", version: "v2" }];
}

const refs = parseCollectionRefs();
const selectedRef = ref(`${refs[0].collectionId}::${refs[0].version}`);

const savedAdminToken = useLocalStorage("pixpax/admin/token", "");
const loginToken = ref(savedAdminToken.value);
const userKey = useLocalStorage("pixpax/admin/userKey", "public:demo-user");
const bindToUser = ref(true);
const dropId = ref(`week-${toIsoWeek(new Date())}`);
const count = ref(5);
const expiresInSeconds = ref(86400);

const minting = ref(false);
const mintError = ref("");
const mintStatus = ref("");
const minted = ref<OverrideCodeResponse | null>(null);
const copied = ref<"" | "code" | "link">("");

const activeRef = computed(() => {
  const [collectionId, version] = String(selectedRef.value || "").split("::");
  return {
    collectionId: String(collectionId || "").trim(),
    version: String(version || "").trim(),
  };
});

const loggedIn = computed(() => !!String(savedAdminToken.value || "").trim());
const redeemCode = computed(() =>
  String(minted.value?.giftCode || minted.value?.code || "").trim(),
);

const shareLink = computed(() => {
  if (!redeemCode.value) return "";
  const code = encodeURIComponent(redeemCode.value);
  if (typeof window === "undefined") return `/pixpax/collections?code=${code}`;
  return `${window.location.origin}/pixpax/collections?code=${code}`;
});

function login() {
  savedAdminToken.value = String(loginToken.value || "").trim();
  mintError.value = "";
  mintStatus.value = savedAdminToken.value ? "Admin token saved locally." : "";
}

function logout() {
  savedAdminToken.value = "";
  loginToken.value = "";
  mintStatus.value = "Logged out.";
}

async function copyText(value: string, kind: "code" | "link") {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    copied.value = kind;
    setTimeout(() => {
      if (copied.value === kind) copied.value = "";
    }, 1200);
  } catch {
    mintError.value = "Copy failed. Clipboard access was denied.";
  }
}

async function mintOverrideCode() {
  const token = String(savedAdminToken.value || "").trim();
  if (!token) {
    mintError.value = "Please login with your admin token first.";
    return;
  }

  const { collectionId, version } = activeRef.value;
  if (!collectionId || !version) {
    mintError.value = "Select a collection and version.";
    return;
  }

  const normalizedUserKey = String(userKey.value || "").trim();
  if (bindToUser.value && !normalizedUserKey) {
    mintError.value = "userKey is required when bind to user is enabled.";
    return;
  }

  minting.value = true;
  mintError.value = "";
  mintStatus.value = "";
  minted.value = null;

  try {
    const response = await fetch(
      buildApiUrl(`/v1/pixpax/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(version)}/override-codes`),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userKey: normalizedUserKey || undefined,
          bindToUser: bindToUser.value,
          dropId: String(dropId.value || "").trim(),
          count: Number(count.value || 0),
          expiresInSeconds: Number(expiresInSeconds.value || 0),
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text || "request failed"}`);
    }

    const payload = (await response.json()) as OverrideCodeResponse;
    minted.value = payload;
    mintStatus.value = `Code minted for ${payload.collectionId}/${payload.version} (${payload.dropId}).`;
  } catch (error: any) {
    mintError.value = error?.message || "Failed to mint override code.";
  } finally {
    minting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h1 class="text-xl font-semibold mb-2">PixPax Admin</h1>
      <p class="text-sm text-[var(--ui-fg-muted)] mb-4">
        Use admin token auth to mint one-time pack override codes. The server rejects requests without a valid token.
      </p>

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
        Status: {{ loggedIn ? "token saved locally" : "not logged in" }}
      </p>
    </section>

    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h2 class="text-lg font-medium mb-3">Mint Override Code</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field">
          <span>Collection/version</span>
          <select v-model="selectedRef">
            <option
              v-for="entry in refs"
              :key="`${entry.collectionId}::${entry.version}`"
              :value="`${entry.collectionId}::${entry.version}`"
            >
              {{ entry.collectionId }} / {{ entry.version }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>User key</span>
          <input
            v-model="userKey"
            type="text"
            placeholder="public:demo-user"
            autocomplete="off"
            :disabled="!bindToUser"
          />
        </label>

        <label class="field">
          <span>Bind to user</span>
          <select v-model="bindToUser">
            <option :value="true">Yes (recipient locked)</option>
            <option :value="false">No (gift code)</option>
          </select>
        </label>

        <label class="field">
          <span>Drop id</span>
          <input v-model="dropId" type="text" placeholder="week-2026-W06" />
        </label>

        <label class="field">
          <span>Card count</span>
          <input v-model.number="count" type="number" min="1" max="50" />
        </label>

        <label class="field">
          <span>Expires in seconds</span>
          <input
            v-model.number="expiresInSeconds"
            type="number"
            min="60"
            max="2592000"
          />
        </label>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <Button class="!px-5 !py-2 !bg-[var(--ui-accent)]" :disabled="minting" @click="mintOverrideCode">
          {{ minting ? "Minting..." : "Mint code" }}
        </Button>
      </div>

      <p v-if="mintError" class="mt-3 text-sm font-semibold text-red-600">
        {{ mintError }}
      </p>
      <p v-if="mintStatus" class="mt-3 text-sm text-[var(--ui-fg-muted)]">
        {{ mintStatus }}
      </p>

      <div v-if="minted" class="mt-4 grid gap-3">
        <label class="field">
          <span>Gift code (one-time)</span>
          <input :value="redeemCode" readonly class="mono" />
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <Button class="!px-4 !py-2" @click="copyText(redeemCode, 'code')">
            {{ copied === "code" ? "Copied code" : "Copy code" }}
          </Button>
          <Button class="!px-4 !py-2" @click="copyText(shareLink, 'link')">
            {{ copied === "link" ? "Copied link" : "Copy redeem link" }}
          </Button>
        </div>
        <p class="text-xs text-[var(--ui-fg-muted)]">
          Format: <code>PPX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX</code>
        </p>
        <label class="field">
          <span>Redeem link</span>
          <input :value="shareLink" readonly class="mono" />
        </label>
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}
</style>
