<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import { useEncryption } from "../../module/encryption/useEncryption";
import {
  useProfile,
  type PrivateProfile,
} from "../../module/profile/useProfile";
import {
  getDefaultSession,
  handleIncomingRedirect,
} from "@inrupt/solid-client-authn-browser";
import {
  createContainerAt,
  getContainedResourceUrlAll,
  getFile,
  getPodUrlAll,
  getSolidDataset,
  overwriteFile,
} from "@inrupt/solid-client";
import {
  setAgentAccess,
  setPublicAccess,
} from "@inrupt/solid-client/universal";

type PrivacyLevel = "private" | "public" | "shared";

const { api, ledger } = useLedger();
const {
  privateKey: identityPrivateKey,
  publicKey: identityPublicKey,
  impersonate: impersonateIdentity,
} = useIdentity();
const { impersonate: impersonateEncryption } = useEncryption();
const profile = useProfile();
const myProfile = useLocalStorage(
  "concord/profile/me",
  profile.getPrivateProfileJson()
);

const session = getDefaultSession();

const oidcIssuer = ref("https://login.inrupt.com");
const status = ref("");
const error = ref("");
const busy = ref(false);

const sessionInfo = ref({
  isLoggedIn: false,
  webId: "",
});

const podUrls = ref<string[]>([]);
const selectedPod = ref("");
const privacy = ref<PrivacyLevel>("private");
const ledgerFiles = ref<{ url: string; name: string }[]>([]);
const selectedLedgerUrl = ref("");
const filename = ref("");
const sharedAgents = ref("");
const walletPrivateFiles = ref<{ url: string; name: string }[]>([]);
const walletPublicFiles = ref<{ url: string; name: string }[]>([]);
const selectedWalletProfileUrl = ref("");

const redirectUrl = computed(() => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/workspace/solid`;
});

const containerUrls = computed(() => {
  if (!selectedPod.value) return null;
  return {
    base: new URL("concord/", selectedPod.value).toString(),
    root: new URL("concord/ledgers/", selectedPod.value).toString(),
    public: new URL("concord/ledgers/public/", selectedPod.value).toString(),
    private: new URL("concord/ledgers/private/", selectedPod.value).toString(),
    shared: new URL("concord/ledgers/shared/", selectedPod.value).toString(),
    walletRoot: new URL("concord/wallet/", selectedPod.value).toString(),
    walletPrivate: new URL(
      "concord/wallet/private/",
      selectedPod.value
    ).toString(),
    walletPublic: new URL(
      "concord/wallet/public/",
      selectedPod.value
    ).toString(),
  };
});

const currentContainerUrl = computed(() => {
  if (!containerUrls.value) return "";
  return containerUrls.value[privacy.value];
});

const hasLedger = computed(() => !!ledger.value);

function syncSessionInfo() {
  sessionInfo.value = {
    isLoggedIn: !!session.info.isLoggedIn,
    webId: session.info.webId ?? "",
  };
}

async function ensureLedgerAuth() {
  if (!identityPrivateKey.value || !identityPublicKey.value) return;
  await api.auth(identityPrivateKey.value, identityPublicKey.value);
}

async function reauthAndReplay() {
  if (!identityPrivateKey.value || !identityPublicKey.value) return;
  await api.auth(identityPrivateKey.value, identityPublicKey.value);
  await api.replay();
}

async function handleRedirect() {
  if (typeof window === "undefined") return;
  await handleIncomingRedirect({ restorePreviousSession: true });
  syncSessionInfo();
  if (sessionInfo.value.isLoggedIn) {
    await loadPods();
  }
}

async function loginToPod() {
  error.value = "";
  if (!oidcIssuer.value.trim()) {
    error.value = "Provide an OIDC issuer to sign in.";
    return;
  }
  await session.login({
    oidcIssuer: oidcIssuer.value.trim(),
    redirectUrl: redirectUrl.value,
    clientName: "Concord",
  });
}

async function logoutFromPod() {
  await session.logout();
  syncSessionInfo();
  podUrls.value = [];
  selectedPod.value = "";
  ledgerFiles.value = [];
  selectedLedgerUrl.value = "";
  status.value = "Logged out of Solid.";
}

async function loadPods() {
  if (!sessionInfo.value.webId) return;
  try {
    status.value = "Loading pod storage...";
    const pods = await getPodUrlAll(sessionInfo.value.webId, {
      fetch: session.fetch,
    });
    podUrls.value = pods;
    selectedPod.value = pods[0] ?? "";
    status.value = pods.length ? "Pod storage loaded." : "No pods found.";
  } catch (err) {
    error.value = `Failed to load pod storage: ${String(err)}`;
  }
}

async function createContainerIfMissing(url: string) {
  try {
    await createContainerAt(url, { fetch: session.fetch });
  } catch (err: any) {
    const statusCode = err?.statusCode ?? err?.status;
    const message = String(err ?? "");
    if (statusCode === 409 || message.includes("409")) return;
    throw err;
  }
}

async function ensureSchema() {
  if (!containerUrls.value) return;
  error.value = "";
  busy.value = true;
  try {
    status.value = "Creating schema containers...";
    await createContainerIfMissing(containerUrls.value.base);
    await createContainerIfMissing(containerUrls.value.root);
    await createContainerIfMissing(containerUrls.value.public);
    await createContainerIfMissing(containerUrls.value.private);
    await createContainerIfMissing(containerUrls.value.shared);
    await createContainerIfMissing(containerUrls.value.walletRoot);
    await createContainerIfMissing(containerUrls.value.walletPrivate);
    await createContainerIfMissing(containerUrls.value.walletPublic);
    await setPublicAccess(
      containerUrls.value.public,
      { read: true, append: false, write: false, control: false },
      { fetch: session.fetch }
    );
    await setPublicAccess(
      containerUrls.value.private,
      { read: false, append: false, write: false, control: false },
      { fetch: session.fetch }
    );
    await setPublicAccess(
      containerUrls.value.shared,
      { read: false, append: false, write: false, control: false },
      { fetch: session.fetch }
    );
    await setPublicAccess(
      containerUrls.value.walletPublic,
      { read: true, append: false, write: false, control: false },
      { fetch: session.fetch }
    );
    await setPublicAccess(
      containerUrls.value.walletPrivate,
      { read: false, append: false, write: false, control: false },
      { fetch: session.fetch }
    );
    status.value = "Schema ready.";
  } catch (err) {
    error.value = `Failed to create schema: ${String(err)}`;
  } finally {
    busy.value = false;
  }
}

async function refreshLedgers() {
  if (!currentContainerUrl.value) return;
  error.value = "";
  busy.value = true;
  try {
    status.value = "Loading ledgers from pod...";
    const dataset = await getSolidDataset(currentContainerUrl.value, {
      fetch: session.fetch,
    });
    const urls = getContainedResourceUrlAll(dataset).filter(
      (url) => !url.endsWith("/")
    );
    ledgerFiles.value = urls.map((url) => ({
      url,
      name: url.split("/").pop() || url,
    }));
    status.value = "Ledgers loaded.";
  } catch (err: any) {
    const statusCode = err?.statusCode ?? err?.status;
    if (statusCode === 404) {
      ledgerFiles.value = [];
      status.value = "No container found yet for this privacy level.";
    } else {
      error.value = `Failed to load ledgers: ${String(err)}`;
    }
  } finally {
    busy.value = false;
  }
}

function parseSharedAgents() {
  return sharedAgents.value
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function saveLedger() {
  if (!currentContainerUrl.value) return;
  if (!ledger.value) {
    error.value = "No ledger loaded in the workspace.";
    return;
  }
  if (!filename.value.trim()) {
    error.value = "Provide a filename for the ledger.";
    return;
  }
  error.value = "";
  busy.value = true;
  try {
    status.value = "Saving ledger to pod...";
    const fileUrl = new URL(filename.value.trim(), currentContainerUrl.value)
      .toString()
      .trim();
    const blob = new Blob([JSON.stringify(ledger.value, null, 2)], {
      type: "application/json",
    });
    await overwriteFile(fileUrl, blob, {
      contentType: "application/json",
      fetch: session.fetch,
    });

    if (privacy.value === "public") {
      await setPublicAccess(
        fileUrl,
        { read: true, append: false, write: false, control: false },
        { fetch: session.fetch }
      );
    } else {
      await setPublicAccess(
        fileUrl,
        { read: false, append: false, write: false, control: false },
        { fetch: session.fetch }
      );
    }

    if (privacy.value === "shared") {
      const agents = parseSharedAgents();
      for (const agent of agents) {
        await setAgentAccess(
          fileUrl,
          agent,
          { read: true, append: true, write: true, control: false },
          { fetch: session.fetch }
        );
      }
    }

    status.value = "Ledger saved.";
    await refreshLedgers();
  } catch (err) {
    error.value = `Failed to save ledger: ${String(err)}`;
  } finally {
    busy.value = false;
  }
}

async function loadLedger() {
  if (!selectedLedgerUrl.value) return;
  error.value = "";
  busy.value = true;
  try {
    status.value = "Loading ledger from pod...";
    const file = await getFile(selectedLedgerUrl.value, {
      fetch: session.fetch,
    });
    const text = await file.text();
    const parsed = JSON.parse(text);
    await api.load(parsed, [], true, true);
    await ensureLedgerAuth();
    status.value = "Ledger loaded into the workspace.";
  } catch (err) {
    error.value = `Failed to load ledger: ${String(err)}`;
  } finally {
    busy.value = false;
  }
}

async function refreshWallet() {
  if (!containerUrls.value) return;
  error.value = "";
  busy.value = true;
  try {
    status.value = "Loading wallet profiles...";
    const [privateDataset, publicDataset] = await Promise.all([
      getSolidDataset(containerUrls.value.walletPrivate, {
        fetch: session.fetch,
      }),
      getSolidDataset(containerUrls.value.walletPublic, {
        fetch: session.fetch,
      }),
    ]);
    const privateUrls = getContainedResourceUrlAll(privateDataset).filter(
      (url) => !url.endsWith("/")
    );
    const publicUrls = getContainedResourceUrlAll(publicDataset).filter(
      (url) => !url.endsWith("/")
    );
    walletPrivateFiles.value = privateUrls.map((url) => ({
      url,
      name: url.split("/").pop() || url,
    }));
    walletPublicFiles.value = publicUrls.map((url) => ({
      url,
      name: url.split("/").pop() || url,
    }));
    status.value = "Wallet profiles loaded.";
  } catch (err: any) {
    const statusCode = err?.statusCode ?? err?.status;
    if (statusCode === 404) {
      walletPrivateFiles.value = [];
      walletPublicFiles.value = [];
      status.value = "Wallet container not found yet.";
    } else {
      error.value = `Failed to load wallet: ${String(err)}`;
    }
  } finally {
    busy.value = false;
  }
}

async function saveProfileToWallet() {
  if (!containerUrls.value) return;
  error.value = "";
  busy.value = true;
  try {
    status.value = "Saving profile to wallet...";
    await profile.ensureProfileId();
    const files = profile.getDownloadFiles({ pretty: true });
    const privateUrl = new URL(
      files.private.filename,
      containerUrls.value.walletPrivate
    ).toString();
    const publicUrl = new URL(
      files.public.filename,
      containerUrls.value.walletPublic
    ).toString();

    await overwriteFile(
      privateUrl,
      new Blob([files.private.json], { type: "application/json" }),
      {
        contentType: "application/json",
        fetch: session.fetch,
      }
    );
    await setPublicAccess(
      privateUrl,
      { read: false, append: false, write: false, control: false },
      { fetch: session.fetch }
    );

    await overwriteFile(
      publicUrl,
      new Blob([files.public.json], { type: "application/json" }),
      {
        contentType: "application/json",
        fetch: session.fetch,
      }
    );
    await setPublicAccess(
      publicUrl,
      { read: true, append: false, write: false, control: false },
      { fetch: session.fetch }
    );

    status.value = "Profile saved to wallet.";
    await refreshWallet();
  } catch (err) {
    error.value = `Failed to save profile: ${String(err)}`;
  } finally {
    busy.value = false;
  }
}

async function loginWithWalletProfile() {
  if (!selectedWalletProfileUrl.value) return;
  error.value = "";
  busy.value = true;
  try {
    status.value = "Signing in with Solid wallet profile...";
    const file = await getFile(selectedWalletProfileUrl.value, {
      fetch: session.fetch,
    });
    const text = await file.text();
    const parsed = JSON.parse(text) as PrivateProfile;
    if (parsed?.format !== "concord-profile-private") {
      throw new Error("Selected file is not a private profile.");
    }
    await impersonateIdentity(parsed);
    await impersonateEncryption(parsed);
    profile.replaceProfileMeta(parsed.metadata);
    profile.setProfileId(parsed.profileId);
    myProfile.value = JSON.stringify(parsed);
    await reauthAndReplay();
    status.value = "Signed in with Solid wallet profile.";
  } catch (err) {
    error.value = `Failed to sign in: ${String(err)}`;
  } finally {
    busy.value = false;
  }
}

async function copyPublicProfileUrl(url: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  await navigator.clipboard.writeText(url);
  status.value = "Public profile link copied.";
}

watch(
  () => ledger.value?.head,
  () => {
    if (filename.value.trim()) return;
    const head = ledger.value?.head?.slice(0, 7) || "latest";
    filename.value = `concord-ledger-${head}.json`;
  },
  { immediate: true }
);

watch([selectedPod, privacy], () => {
  ledgerFiles.value = [];
  selectedLedgerUrl.value = "";
});

watch(selectedPod, () => {
  walletPrivateFiles.value = [];
  walletPublicFiles.value = [];
  selectedWalletProfileUrl.value = "";
});

onMounted(async () => {
  await ensureLedgerAuth();
  await handleRedirect();
});
</script>

<template>
  <div class="w-full max-w-3xl space-y-6">
    <section class="border border-[var(--ui-border)] rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium">Solid pod connection</h2>
        <span
          class="text-xs px-2 py-1 rounded-full border border-[var(--ui-border)]"
          :class="{ 'opacity-50': !sessionInfo.isLoggedIn }"
        >
          {{ sessionInfo.isLoggedIn ? "Connected" : "Disconnected" }}
        </span>
      </div>
      <div v-if="!sessionInfo.isLoggedIn" class="space-y-3">
        <label class="block text-sm">
          OIDC issuer
          <input
            v-model="oidcIssuer"
            list="solid-issuers"
            class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
            placeholder="https://login.inrupt.com"
          />
        </label>
        <datalist id="solid-issuers">
          <option value="https://login.inrupt.com" />
          <option value="https://broker.pod.inrupt.com" />
          <option value="https://solidcommunity.net" />
        </datalist>
        <button
          class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
          @click="loginToPod"
        >
          Sign in to Solid
        </button>
      </div>
      <div v-else class="space-y-2 text-sm">
        <div class="font-mono break-all">{{ sessionInfo.webId }}</div>
        <div class="flex gap-2">
          <button
            class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
            @click="logoutFromPod"
          >
            Log out
          </button>
          <button
            class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
            @click="loadPods"
          >
            Refresh pods
          </button>
        </div>
      </div>
    </section>

    <section class="border border-[var(--ui-border)] rounded-xl p-4 space-y-3">
      <h3 class="text-base font-medium">Directory schema</h3>
      <div v-if="!sessionInfo.isLoggedIn" class="text-sm opacity-70">
        Sign in to select a pod and initialize directories.
      </div>
      <div v-else class="space-y-3 text-sm">
        <label class="block">
          Pod storage root
          <select
            v-model="selectedPod"
            class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="" disabled>Select a pod</option>
            <option v-for="pod in podUrls" :key="pod" :value="pod">
              {{ pod }}
            </option>
          </select>
        </label>
        <button
          class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
          :disabled="!selectedPod || busy"
          @click="ensureSchema"
        >
          Initialize ledger schema
        </button>
        <div v-if="containerUrls" class="text-xs font-mono space-y-1">
          <div>public: {{ containerUrls.public }}</div>
          <div>private: {{ containerUrls.private }}</div>
          <div>shared: {{ containerUrls.shared }}</div>
          <div>wallet/private: {{ containerUrls.walletPrivate }}</div>
          <div>wallet/public: {{ containerUrls.walletPublic }}</div>
        </div>
      </div>
    </section>

    <section class="border border-[var(--ui-border)] rounded-xl p-4 space-y-4">
      <h3 class="text-base font-medium">Ledgers in your pod</h3>
      <div class="grid gap-3">
        <label class="text-sm">
          Privacy level
          <select
            v-model="privacy"
            class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="shared">Shared</option>
          </select>
        </label>
        <label v-if="privacy === 'shared'" class="text-sm">
          Shared WebIDs (comma or line separated)
          <textarea
            v-model="sharedAgents"
            class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
            rows="2"
            placeholder="https://alice.example/profile/card#me"
          />
        </label>
        <label class="text-sm">
          Filename
          <input
            v-model="filename"
            class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
            placeholder="concord-ledger-latest.json"
          />
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
            :disabled="!selectedPod || busy"
            @click="refreshLedgers"
          >
            Refresh ledger list
          </button>
          <button
            class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
            :disabled="!selectedPod || busy || !hasLedger"
            @click="saveLedger"
          >
            Save current ledger
          </button>
        </div>
      </div>

      <div class="space-y-2 text-sm">
        <label class="block">
          Available ledgers
          <select
            v-model="selectedLedgerUrl"
            class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select a ledger</option>
            <option
              v-for="entry in ledgerFiles"
              :key="entry.url"
              :value="entry.url"
            >
              {{ entry.name }}
            </option>
          </select>
        </label>
        <button
          class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
          :disabled="!selectedLedgerUrl || busy"
          @click="loadLedger"
        >
          Load into workspace
        </button>
      </div>
    </section>

    <section class="border border-[var(--ui-border)] rounded-xl p-4 space-y-4">
      <h3 class="text-base font-medium">Solid wallet</h3>
      <div v-if="!sessionInfo.isLoggedIn" class="text-sm opacity-70">
        Sign in to manage profiles stored in your pod.
      </div>
      <div v-else class="space-y-3 text-sm">
        <div class="flex flex-wrap gap-2">
          <button
            class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
            :disabled="!selectedPod || busy"
            @click="refreshWallet"
          >
            Refresh wallet
          </button>
          <button
            class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
            :disabled="!selectedPod || busy"
            @click="saveProfileToWallet"
          >
            Save current profile
          </button>
        </div>

        <label class="block">
          Login with Solid profile
          <select
            v-model="selectedWalletProfileUrl"
            class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select a private profile</option>
            <option
              v-for="entry in walletPrivateFiles"
              :key="entry.url"
              :value="entry.url"
            >
              {{ entry.name }}
            </option>
          </select>
        </label>
        <button
          class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
          :disabled="!selectedWalletProfileUrl || busy"
          @click="loginWithWalletProfile"
        >
          Sign in with Solid profile
        </button>

        <div class="space-y-2">
          <div class="font-medium text-xs">Public profiles</div>
          <div v-if="!walletPublicFiles.length" class="text-xs opacity-70">
            No public profiles stored yet.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="entry in walletPublicFiles"
              :key="entry.url"
              class="flex items-center justify-between gap-2 border border-[var(--ui-border)] rounded-lg px-3 py-2"
            >
              <div class="text-xs font-mono break-all">
                {{ entry.url }}
              </div>
              <button
                class="text-xs border border-[var(--ui-border)] px-3 py-1 rounded-full"
                @click="copyPublicProfileUrl(entry.url)"
              >
                Copy link
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="status || error"
      class="border border-[var(--ui-border)] rounded-xl p-4 space-y-2 text-sm"
    >
      <div v-if="status" class="text-emerald-700">{{ status }}</div>
      <div v-if="error" class="text-red-600">{{ error }}</div>
    </section>
  </div>
</template>
