<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";
import {
  PixPaxApiError,
  createOverrideCode,
} from "../../module/pixpax/api/client";
import { usePixpaxAuth } from "../../module/pixpax/auth/usePixpaxAuth";

function toIsoWeek(date = new Date()) {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${utc.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

type CollectionRef = {
  collectionId: string;
  version: string;
};

function isDeprecatedCollectionRef(entry: CollectionRef) {
  return entry.collectionId === "pixel-animals" && entry.version === "v1";
}

function parseCollectionRefs(): CollectionRef[] {
  const raw = String(
    import.meta.env.VITE_PIXPAX_PUBLIC_COLLECTIONS || "",
  ).trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const refs = parsed
          .map((entry: any) => ({
            collectionId: String(entry?.collectionId || "").trim(),
            version: String(entry?.version || "").trim(),
          }))
          .filter(
            (entry) =>
              entry.collectionId &&
              entry.version &&
              !isDeprecatedCollectionRef(entry),
          );
        if (refs.length) return refs;
      }
    } catch {
      // fallback below
    }
  }
  return [{ collectionId: "pixel-animals", version: "v2" }];
}

const refs = parseCollectionRefs();
const selectedRef = ref(`${refs[0].collectionId}::${refs[0].version}`);

const router = useRouter();
const auth = usePixpaxAuth();
const userKey = useLocalStorage("pixpax/admin/userKey", "public:demo-user");
const bindToUser = ref(true);
const dropId = ref(`week-${toIsoWeek(new Date())}`);
const count = ref(5);
const expiresInSeconds = ref(86400);

const minting = ref(false);
const mintError = ref("");
const mintStatus = ref("");
const minted = ref<Awaited<ReturnType<typeof createOverrideCode>> | null>(null);
const copied = ref<"" | "code" | "link">("");

const activeRef = computed(() => {
  const [collectionId, version] = String(selectedRef.value || "").split("::");
  return {
    collectionId: String(collectionId || "").trim(),
    version: String(version || "").trim(),
  };
});

const loggedIn = computed(() => auth.isAuthenticated.value);
const redeemCode = computed(() =>
  String(minted.value?.giftCode || minted.value?.code || "").trim(),
);

const shareLink = computed(() => {
  if (!redeemCode.value) return "";
  const code = encodeURIComponent(redeemCode.value);
  if (typeof window === "undefined") return `?code=${code}`;
  return `${window.location.origin}?code=${code}`;
});

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
  const canMint = await auth.ensurePermission("pixpax.admin.manage");
  if (!canMint) {
    mintError.value = "Admin permission required.";
    await router.replace({
      path: "/pixpax/control/login",
      query: { redirect: "/pixpax/control/admin" },
    });
    return;
  }
  const token = String(auth.token.value || "").trim();
  if (!token) {
    mintError.value = "Admin token is not available.";
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
    const payload = await createOverrideCode(
      collectionId,
      version,
      {
        userKey: normalizedUserKey || undefined,
        bindToUser: bindToUser.value,
        dropId: String(dropId.value || "").trim(),
        count: Number(count.value || 0),
        expiresInSeconds: Number(expiresInSeconds.value || 0),
      },
      token,
    );
    minted.value = payload;
    mintStatus.value = `Code minted for ${payload.collectionId}/${payload.version} (${payload.dropId}).`;
  } catch (error: unknown) {
    if (error instanceof PixPaxApiError && error.status === 401) {
      auth.logout();
      mintError.value = "Admin session expired. Login again.";
      await router.replace({
        path: "/pixpax/control/login",
        query: { redirect: "/pixpax/control/admin" },
      });
    } else {
      mintError.value = String((error as Error)?.message || "Failed to mint override code.");
    }
  } finally {
    minting.value = false;
  }
}

onMounted(async () => {
  const ok = await auth.ensurePermission("pixpax.admin.manage");
  if (!ok) {
    await router.replace({
      path: "/pixpax/control/login",
      query: { redirect: "/pixpax/control/admin" },
    });
  }
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h1 class="text-xl font-semibold mb-2">PixPax Admin</h1>
      <p class="text-sm text-[var(--ui-fg-muted)] mb-4">
        Mint one-time pack override codes. This route requires admin permission
        and is server-verified.
      </p>
      <p class="mt-2 text-xs text-[var(--ui-fg-muted)]">
        Status: {{ loggedIn ? "authenticated" : "not authenticated" }}
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
        <Button
          class="!px-5 !py-2 !bg-[var(--ui-accent)]"
          :disabled="minting"
          @click="mintOverrideCode"
        >
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}
</style>
