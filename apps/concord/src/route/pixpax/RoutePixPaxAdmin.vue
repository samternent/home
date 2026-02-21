<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Button } from "ternent-ui/primitives";
import {
  type AccountBook,
  type AccountManagedUser,
  PixPaxApiError,
  createAccountBook,
  createAccountManagedUser,
  createOverrideCode,
  listPixpaxAdminCollections,
  listAccountBooks,
  listAccountManagedUsers,
  updateAccountBook,
  updateAccountManagedUser,
} from "../../module/pixpax/api/client";
import { usePixpaxAuth } from "../../module/pixpax/auth/usePixpaxAuth";
import { usePixpaxAccount } from "../../module/pixpax/auth/usePixpaxAccount";

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

function extractError(error: unknown, fallback: string) {
  if (error instanceof PixPaxApiError) {
    const body = error.body as { error?: string } | null;
    const message = String(body?.error || error.message || "").trim();
    if (message) return message;
  }
  return String((error as Error)?.message || fallback);
}

const router = useRouter();
const auth = usePixpaxAuth();
const account = usePixpaxAccount();
const refs = ref<CollectionRef[]>(parseCollectionRefs());
const selectedRef = ref("");
const activePanel = ref<"profiles" | "books" | "codes">("profiles");
const refsLoading = ref(false);
const refsError = ref("");

const loggedIn = computed(() => auth.isAuthenticated.value);
const workspaceId = computed(() => account.workspace.value?.workspaceId || "");
const workspaceLabel = computed(() => {
  const ws = account.workspace.value;
  if (!ws) return "No workspace loaded";
  return `${ws.name} (${ws.workspaceId.slice(0, 8)})`;
});
const hasAccountManage = computed(() =>
  Boolean(
    account.workspace.value?.capabilities?.includes("platform.account.manage"),
  ),
);

const profiles = ref<AccountManagedUser[]>([]);
const books = ref<AccountBook[]>([]);
const loadingProfiles = ref(false);
const loadingBooks = ref(false);
const profileError = ref("");
const bookError = ref("");
const profileStatus = ref("");
const bookStatus = ref("");
const profileActionBusyId = ref("");
const bookActionBusyId = ref("");

const newProfileName = ref("");
const newProfileUserKey = ref("");
const newProfileId = ref("");
const newProfileIdentityPublicKey = ref("");

const newBookName = ref("My Pixbook");
const newBookManagedUserId = ref("");

const mintKind = ref<"pack" | "fixed-card">("pack");
const dropId = ref(`week-${toIsoWeek(new Date())}`);
const count = ref(5);
const fixedCardId = ref("");
const expiresInSeconds = ref(86400);

const minting = ref(false);
const mintError = ref("");
const mintStatus = ref("");
const minted = ref<Awaited<ReturnType<typeof createOverrideCode>> | null>(null);
const copied = ref<"" | "code" | "link">("");

function ensureSelectedRef() {
  const available = refs.value;
  if (!available.length) {
    selectedRef.value = "";
    return;
  }
  const current = String(selectedRef.value || "").trim();
  if (
    current &&
    available.some(
      (entry) => `${entry.collectionId}::${entry.version}` === current,
    )
  ) {
    return;
  }
  selectedRef.value = `${available[0].collectionId}::${available[0].version}`;
}

async function loadAdminCollectionRefs() {
  refsLoading.value = true;
  refsError.value = "";
  try {
    const response = await listPixpaxAdminCollections(
      auth.token.value || undefined,
    );
    const nextRefs = Array.isArray(response?.refs)
      ? response.refs
          .map((entry) => ({
            collectionId: String(entry?.collectionId || "").trim(),
            version: String(entry?.version || "").trim(),
          }))
          .filter((entry) => entry.collectionId && entry.version)
      : [];
    refs.value = nextRefs.length ? nextRefs : parseCollectionRefs();
  } catch (error) {
    refs.value = parseCollectionRefs();
    refsError.value =
      "Unable to load all admin collections. Showing fallback list.";
  } finally {
    refsLoading.value = false;
    ensureSelectedRef();
  }
}

ensureSelectedRef();

const activeRef = computed(() => {
  const [collectionId, version] = String(selectedRef.value || "").split("::");
  return {
    collectionId: String(collectionId || "").trim(),
    version: String(version || "").trim(),
  };
});

const isFixedCardMint = computed(() => mintKind.value === "fixed-card");

const redeemCode = computed(() => String(minted.value?.token || "").trim());

const shareLink = computed(() => {
  if (!redeemCode.value) return "";
  const resolved = router.resolve({
    name: "pixpax-redeem",
    query: { token: redeemCode.value },
  });
  if (typeof window === "undefined") return resolved.fullPath;
  return `${window.location.origin}${resolved.fullPath}`;
});

async function ensureAdmin() {
  const ok = await auth.ensurePermission("pixpax.admin.manage");
  if (!ok) {
    await router.replace({
      name: "pixpax-control-login",
      query: {
        redirect: router.resolve({ name: "pixpax-control-admin" }).fullPath,
      },
    });
    return false;
  }
  return true;
}

async function loadProfiles() {
  if (!loggedIn.value) return;
  loadingProfiles.value = true;
  profileError.value = "";
  try {
    const response = await listAccountManagedUsers(
      workspaceId.value || undefined,
    );
    profiles.value = response.users || [];
    if (!newBookManagedUserId.value && profiles.value.length) {
      newBookManagedUserId.value = profiles.value[0].id;
    }
  } catch (error: unknown) {
    profileError.value = extractError(error, "Unable to load profiles.");
  } finally {
    loadingProfiles.value = false;
  }
}

async function loadBooks() {
  if (!loggedIn.value) return;
  loadingBooks.value = true;
  bookError.value = "";
  try {
    const response = await listAccountBooks(workspaceId.value || undefined);
    books.value = response.books || [];
  } catch (error: unknown) {
    bookError.value = extractError(error, "Unable to load books.");
  } finally {
    loadingBooks.value = false;
  }
}

async function refreshAccountCollections() {
  profileStatus.value = "";
  bookStatus.value = "";
  await Promise.all([loadProfiles(), loadBooks()]);
}

async function createProfile() {
  const displayName = String(newProfileName.value || "").trim();
  const profileId = String(newProfileId.value || "").trim();
  const identityPublicKey = String(
    newProfileIdentityPublicKey.value || "",
  ).trim();
  if (!displayName) {
    profileError.value = "Display name is required.";
    return;
  }
  if (!profileId || !identityPublicKey) {
    profileError.value = "profileId and identity public key are required.";
    return;
  }
  profileActionBusyId.value = "create-profile";
  profileError.value = "";
  profileStatus.value = "";
  try {
    await createAccountManagedUser(
      {
        displayName,
        profileId,
        identityPublicKey,
        userKey: String(newProfileUserKey.value || "").trim() || undefined,
      },
      workspaceId.value || undefined,
    );
    newProfileName.value = "";
    newProfileUserKey.value = "";
    newProfileId.value = "";
    newProfileIdentityPublicKey.value = "";
    profileStatus.value = "Profile created.";
    await loadProfiles();
  } catch (error: unknown) {
    profileError.value = extractError(error, "Unable to create profile.");
  } finally {
    profileActionBusyId.value = "";
  }
}

async function renameProfile(user: AccountManagedUser) {
  const nextName = window.prompt(
    "New profile display name",
    user.displayName || "",
  );
  if (!nextName || nextName.trim() === user.displayName) return;
  profileActionBusyId.value = user.id;
  profileError.value = "";
  profileStatus.value = "";
  try {
    await updateAccountManagedUser(
      user.id,
      { displayName: nextName.trim() },
      workspaceId.value || undefined,
    );
    profileStatus.value = "Profile updated.";
    await loadProfiles();
  } catch (error: unknown) {
    profileError.value = extractError(error, "Unable to rename profile.");
  } finally {
    profileActionBusyId.value = "";
  }
}

async function toggleProfileStatus(user: AccountManagedUser) {
  const nextStatus = user.status === "active" ? "paused" : "active";
  profileActionBusyId.value = user.id;
  profileError.value = "";
  profileStatus.value = "";
  try {
    await updateAccountManagedUser(
      user.id,
      { status: nextStatus },
      workspaceId.value || undefined,
    );
    profileStatus.value = `Profile marked ${nextStatus}.`;
    await loadProfiles();
  } catch (error: unknown) {
    profileError.value = extractError(
      error,
      "Unable to change profile status.",
    );
  } finally {
    profileActionBusyId.value = "";
  }
}

async function attachProfileIdentity(user: AccountManagedUser) {
  const nextProfileId = window.prompt(
    "Concord profile id",
    String(user.profileId || ""),
  );
  if (!nextProfileId) return;
  const nextIdentityPublicKey = window.prompt(
    "Concord identity public key (PEM)",
    String(user.identityPublicKey || ""),
  );
  if (!nextIdentityPublicKey) return;

  profileActionBusyId.value = user.id;
  profileError.value = "";
  profileStatus.value = "";
  try {
    await updateAccountManagedUser(
      user.id,
      {
        profileId: nextProfileId.trim(),
        identityPublicKey: nextIdentityPublicKey.trim(),
      },
      workspaceId.value || undefined,
    );
    profileStatus.value = "Profile identity attached.";
    await loadProfiles();
  } catch (error: unknown) {
    profileError.value = extractError(
      error,
      "Unable to attach profile identity.",
    );
  } finally {
    profileActionBusyId.value = "";
  }
}

async function createBookForProfile() {
  const managedUserId = String(newBookManagedUserId.value || "").trim();
  const name = String(newBookName.value || "").trim();
  if (!managedUserId) {
    bookError.value = "Select a profile first.";
    return;
  }
  if (!name) {
    bookError.value = "Book name is required.";
    return;
  }
  bookActionBusyId.value = "create-book";
  bookError.value = "";
  bookStatus.value = "";
  try {
    await createAccountBook(
      { managedUserId, name },
      workspaceId.value || undefined,
    );
    newBookName.value = "My Pixbook";
    bookStatus.value = "Book created.";
    await loadBooks();
  } catch (error: unknown) {
    bookError.value = extractError(error, "Unable to create book.");
  } finally {
    bookActionBusyId.value = "";
  }
}

async function renameBook(book: AccountBook) {
  const nextName = window.prompt("New book name", book.name || "");
  if (!nextName || nextName.trim() === book.name) return;
  bookActionBusyId.value = book.id;
  bookError.value = "";
  bookStatus.value = "";
  try {
    await updateAccountBook(
      book.id,
      { name: nextName.trim() },
      workspaceId.value || undefined,
    );
    bookStatus.value = "Book renamed.";
    await loadBooks();
  } catch (error: unknown) {
    bookError.value = extractError(error, "Unable to rename book.");
  } finally {
    bookActionBusyId.value = "";
  }
}

async function toggleBookStatus(book: AccountBook) {
  const nextStatus = book.status === "active" ? "paused" : "active";
  bookActionBusyId.value = book.id;
  bookError.value = "";
  bookStatus.value = "";
  try {
    await updateAccountBook(
      book.id,
      { status: nextStatus },
      workspaceId.value || undefined,
    );
    bookStatus.value = `Book marked ${nextStatus}.`;
    await loadBooks();
  } catch (error: unknown) {
    bookError.value = extractError(error, "Unable to change book status.");
  } finally {
    bookActionBusyId.value = "";
  }
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
  const canMint = await auth.ensurePermission("pixpax.admin.manage");
  if (!canMint) {
    mintError.value = "Admin permission required.";
    await router.replace({
      name: "pixpax-control-login",
      query: {
        redirect: router.resolve({ name: "pixpax-control-admin" }).fullPath,
      },
    });
    return;
  }

  const { collectionId, version } = activeRef.value;
  if (!collectionId || !version) {
    mintError.value = "Select a collection and version.";
    return;
  }

  minting.value = true;
  mintError.value = "";
  mintStatus.value = "";
  minted.value = null;

  try {
    if (isFixedCardMint.value) {
      if (!String(fixedCardId.value || "").trim()) {
        mintError.value = "cardId is required for fixed-card mint.";
        return;
      }
    } else if (
      !Number.isInteger(Number(count.value || 0)) ||
      Number(count.value || 0) < 1
    ) {
      mintError.value = "Card count must be at least 1.";
      return;
    }

    const requestPayload = {
      kind: mintKind.value,
      dropId: String(dropId.value || "").trim(),
      expiresInSeconds: Number(expiresInSeconds.value || 0),
      ...(isFixedCardMint.value
        ? { cardId: String(fixedCardId.value || "").trim() }
        : { count: Number(count.value || 0) }),
    };

    const payload = await createOverrideCode(
      collectionId,
      version,
      requestPayload,
      auth.token.value || undefined,
    );
    minted.value = payload;
    const payloadDropId = String(payload?.payload?.dropId || "").trim();
    const payloadKind = String(payload?.payload?.kind || mintKind.value);
    const payloadCardId = String(payload?.payload?.cardId || "").trim();
    mintStatus.value = `Token minted (${payloadKind}${
      payloadCardId ? `:${payloadCardId}` : ""
    }) for ${payload.collectionId}/${payload.version}${
      payloadDropId ? ` (${payloadDropId})` : ""
    }.`;
  } catch (error: unknown) {
    if (
      error instanceof PixPaxApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      auth.logout();
      mintError.value = "Admin session expired. Login again.";
      await router.replace({
        name: "pixpax-control-login",
        query: {
          redirect: router.resolve({ name: "pixpax-control-admin" }).fullPath,
        },
      });
    } else {
      mintError.value = String(
        (error as Error)?.message || "Failed to mint override code.",
      );
    }
  } finally {
    minting.value = false;
  }
}

onMounted(async () => {
  const ok = await ensureAdmin();
  if (!ok) return;
  await account.refreshSession({ force: true });
  await Promise.all([refreshAccountCollections(), loadAdminCollectionRefs()]);
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
    <section class="rounded-xl border border-[var(--ui-border)] p-4">
      <h1 class="text-xl font-semibold mb-2">PixPax Admin</h1>
      <p class="text-sm text-[var(--ui-fg-muted)] mb-3">
        Explicit account control. No auto mutation, no hidden sync.
      </p>
      <p class="text-xs text-[var(--ui-fg-muted)]">
        Auth: {{ loggedIn ? "authenticated" : "not authenticated" }} |
        Workspace: {{ workspaceLabel }}
      </p>
      <p v-if="!hasAccountManage" class="text-xs text-amber-600 mt-2">
        Your current workspace session does not include
        `platform.account.manage`, so profile/book actions may be blocked.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <Button
          class="!px-4 !py-2"
          :class="{ active: activePanel === 'profiles' }"
          @click="activePanel = 'profiles'"
        >
          Profiles
        </Button>
        <Button
          class="!px-4 !py-2"
          :class="{ active: activePanel === 'books' }"
          @click="activePanel = 'books'"
        >
          Books
        </Button>
        <Button
          class="!px-4 !py-2"
          :class="{ active: activePanel === 'codes' }"
          @click="activePanel = 'codes'"
        >
          Gift Codes
        </Button>
        <Button class="!px-4 !py-2" @click="refreshAccountCollections">
          Refresh
        </Button>
      </div>
    </section>

    <section
      v-if="activePanel === 'profiles'"
      class="rounded-xl border border-[var(--ui-border)] p-4"
    >
      <h2 class="text-lg font-medium mb-3">Profiles</h2>
      <p class="text-xs text-[var(--ui-fg-muted)] mb-4">
        Profile = identity owner bucket. Each profile can have multiple books.
      </p>

      <div class="grid gap-3 md:grid-cols-2">
        <label class="field">
          <span>Profile display name</span>
          <input
            v-model="newProfileName"
            type="text"
            placeholder="Sam / Kid A / Kid B"
          />
        </label>
        <label class="field">
          <span>User key (optional)</span>
          <input
            v-model="newProfileUserKey"
            type="text"
            placeholder="public:kid-a"
          />
        </label>
        <label class="field">
          <span>Concord profile id</span>
          <input v-model="newProfileId" type="text" placeholder="profile_..." />
        </label>
        <label class="field md:col-span-2">
          <span>Concord identity public key (PEM)</span>
          <textarea
            v-model="newProfileIdentityPublicKey"
            rows="4"
            placeholder="-----BEGIN PUBLIC KEY-----"
          />
        </label>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <Button
          class="!px-4 !py-2"
          :disabled="profileActionBusyId === 'create-profile'"
          @click="createProfile"
        >
          {{
            profileActionBusyId === "create-profile"
              ? "Creating..."
              : "Create profile"
          }}
        </Button>
      </div>

      <div class="mt-5 grid gap-2">
        <div v-if="loadingProfiles" class="text-xs text-[var(--ui-fg-muted)]">
          Loading profiles...
        </div>
        <div
          v-else-if="profiles.length === 0"
          class="text-xs text-[var(--ui-fg-muted)]"
        >
          No profiles yet.
        </div>
        <div v-for="user in profiles" :key="user.id" class="item-card">
          <div class="item-main">
            <p class="item-title">{{ user.displayName }}</p>
            <p class="item-sub">
              id {{ user.id.slice(0, 12) }} | key {{ user.userKey }} | status
              {{ user.status }}
            </p>
            <p class="item-sub">
              profile {{ user.profileId || "missing" }} | identity
              {{
                user.identityKeyFingerprint
                  ? user.identityKeyFingerprint.slice(0, 16)
                  : "missing"
              }}
            </p>
          </div>
          <div class="item-actions">
            <Button
              class="!px-3 !py-1"
              :disabled="profileActionBusyId === user.id"
              @click="renameProfile(user)"
            >
              Rename
            </Button>
            <Button
              class="!px-3 !py-1"
              :disabled="profileActionBusyId === user.id"
              @click="attachProfileIdentity(user)"
            >
              Attach identity
            </Button>
            <Button
              class="!px-3 !py-1"
              :disabled="profileActionBusyId === user.id"
              @click="toggleProfileStatus(user)"
            >
              {{ user.status === "active" ? "Pause" : "Activate" }}
            </Button>
          </div>
        </div>
      </div>
      <p v-if="profileStatus" class="mt-3 text-xs text-green-600">
        {{ profileStatus }}
      </p>
      <p v-if="profileError" class="mt-2 text-xs text-red-600">
        {{ profileError }}
      </p>
    </section>

    <section
      v-if="activePanel === 'books'"
      class="rounded-xl border border-[var(--ui-border)] p-4"
    >
      <h2 class="text-lg font-medium mb-3">Books</h2>
      <p class="text-xs text-[var(--ui-fg-muted)] mb-4">
        Books are explicit datasets under a profile. Checkout/restore remains
        manual.
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field">
          <span>Owner profile</span>
          <select v-model="newBookManagedUserId">
            <option v-for="user in profiles" :key="user.id" :value="user.id">
              {{ user.displayName }} ({{ user.id.slice(0, 6) }})
            </option>
          </select>
        </label>
        <label class="field">
          <span>Book name</span>
          <input v-model="newBookName" type="text" placeholder="My Pixbook" />
        </label>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <Button
          class="!px-4 !py-2"
          :disabled="
            bookActionBusyId === 'create-book' || profiles.length === 0
          "
          @click="createBookForProfile"
        >
          {{
            bookActionBusyId === "create-book" ? "Creating..." : "Create book"
          }}
        </Button>
      </div>
      <div class="mt-5 grid gap-2">
        <div v-if="loadingBooks" class="text-xs text-[var(--ui-fg-muted)]">
          Loading books...
        </div>
        <div
          v-else-if="books.length === 0"
          class="text-xs text-[var(--ui-fg-muted)]"
        >
          No books yet.
        </div>
        <div v-for="book in books" :key="book.id" class="item-card">
          <div class="item-main">
            <p class="item-title">{{ book.name }}</p>
            <p class="item-sub">
              id {{ book.id.slice(0, 12) }} | owner
              {{
                book.managedUserDisplayName || book.managedUserId.slice(0, 6)
              }}
              | v{{ book.currentVersion }} | status {{ book.status }}
            </p>
          </div>
          <div class="item-actions">
            <Button
              class="!px-3 !py-1"
              :disabled="bookActionBusyId === book.id"
              @click="renameBook(book)"
            >
              Rename
            </Button>
            <Button
              class="!px-3 !py-1"
              :disabled="bookActionBusyId === book.id"
              @click="toggleBookStatus(book)"
            >
              {{ book.status === "active" ? "Pause" : "Activate" }}
            </Button>
          </div>
        </div>
      </div>
      <p v-if="bookStatus" class="mt-3 text-xs text-green-600">
        {{ bookStatus }}
      </p>
      <p v-if="bookError" class="mt-2 text-xs text-red-600">{{ bookError }}</p>
    </section>

    <section
      v-if="activePanel === 'codes'"
      class="rounded-xl border border-[var(--ui-border)] p-4"
    >
      <h2 class="text-lg font-medium mb-3">Mint Redeem Token</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field">
          <span>Token kind</span>
          <select v-model="mintKind">
            <option value="pack">Pack</option>
            <option value="fixed-card">Fixed card</option>
          </select>
        </label>

        <label class="field">
          <span>Collection/version</span>
          <select
            v-model="selectedRef"
            :disabled="refsLoading || refs.length === 0"
          >
            <option v-if="refsLoading" value="">Loading collections...</option>
            <option v-else-if="refs.length === 0" value="">
              No collections found
            </option>
            <option
              v-for="entry in refs"
              :key="`${entry.collectionId}::${entry.version}`"
              :value="`${entry.collectionId}::${entry.version}`"
            >
              {{ entry.collectionId }} / {{ entry.version }}
            </option>
          </select>
        </label>
        <p v-if="refsError" class="text-xs text-amber-600 md:col-span-2">
          {{ refsError }}
        </p>

        <label class="field">
          <span>Drop id</span>
          <input v-model="dropId" type="text" placeholder="week-2026-W06" />
        </label>

        <label v-if="!isFixedCardMint" class="field">
          <span>Card count</span>
          <input v-model.number="count" type="number" min="1" max="50" />
        </label>

        <label v-else class="field">
          <span>Card id</span>
          <input v-model="fixedCardId" type="text" placeholder="arsenal-01" />
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
          {{
            minting
              ? "Minting..."
              : isFixedCardMint
              ? "Mint fixed-card token"
              : "Mint pack token"
          }}
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
          <span>Signed token</span>
          <input :value="redeemCode" readonly class="mono" />
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <Button class="!px-4 !py-2" @click="copyText(redeemCode, 'code')">
            {{ copied === "code" ? "Copied token" : "Copy token" }}
          </Button>
          <Button class="!px-4 !py-2" @click="copyText(shareLink, 'link')">
            {{ copied === "link" ? "Copied link" : "Copy redeem link" }}
          </Button>
        </div>
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

.item-card {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.item-main {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.item-title {
  font-size: 13px;
  color: var(--ui-fg);
  margin: 0;
}

.item-sub {
  font-size: 11px;
  color: var(--ui-fg-muted);
  margin: 0;
  overflow-wrap: anywhere;
}

.item-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
