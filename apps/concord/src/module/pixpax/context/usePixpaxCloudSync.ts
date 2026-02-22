import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  watch,
} from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  createAccountBook,
  createAccountManagedUser,
  type AccountBook,
  type AccountManagedUser,
  type PixbookCloudBinding,
  PixPaxApiError,
  getPixbookCloudState,
  listAccountBooks,
  listAccountManagedUsers,
  removeAccountManagedIdentity,
  savePixbookCloudSnapshot,
  updateAccountManagedUser,
} from "../api/client";
import { usePixpaxAccount } from "../auth/usePixpaxAccount";
import {
  type PixbookExport,
  type PixpaxContextStore,
  usePixpaxContextStore,
} from "./usePixpaxContextStore";

const usePixpaxCloudSyncSymbol = Symbol("usePixpaxCloudSync");

export type PixpaxCloudSync = ReturnType<typeof createPixpaxCloudSync>;

const PIXBOOK_FORMAT = "pixpax-pixbook";
const PIXBOOK_VERSION = "1.0";
const DEFAULT_COLLECTION_ID = "primary";

type CreatePixpaxCloudSyncOptions = {
  context?: PixpaxContextStore;
};

function createPixpaxCloudSync(options: CreatePixpaxCloudSyncOptions = {}) {
  const context = options.context ?? usePixpaxContextStore();
  const account = usePixpaxAccount();

  const authEmail = shallowRef("");
  const authOtp = shallowRef("");
  const authBusy = shallowRef(false);
  const authMessage = shallowRef("");

  const cloudAutoSync = useLocalStorage("pixpax/pixbook/cloudAutoSync", false);
  const cloudSyncing = shallowRef(false);
  const cloudSyncStatus = shallowRef("");
  const cloudSyncError = shallowRef("");
  const pendingPackSyncHead = useLocalStorage(
    "pixpax/pixbook/pendingPackSyncHead",
    ""
  );
  const syncedPackHead = useLocalStorage("pixpax/pixbook/syncedPackHead", "");
  const suppressedIdentityBindings = useLocalStorage<string[]>(
    "pixpax/pixbook/cloudSuppressedIdentityBindings",
    []
  );

  const cloudSnapshotVersion = shallowRef<number | null>(null);
  const cloudSnapshotAt = shallowRef("");
  const cloudWorkspaceId = shallowRef("");
  const cloudBookId = shallowRef("");
  const cloudSnapshotLedgerHead = shallowRef("");
  const cloudSnapshotPayload = shallowRef<unknown | null>(null);

  const lastCloudSyncHead = shallowRef("");

  const cloudProfiles = shallowRef<AccountManagedUser[]>([]);
  const cloudBooks = shallowRef<AccountBook[]>([]);
  const selectedCloudProfileId = useLocalStorage(
    "pixpax/pixbook/cloudSelectedProfileId",
    ""
  );
  const selectedCloudBookId = useLocalStorage(
    "pixpax/pixbook/cloudSelectedBookId",
    ""
  );
  const cloudLibraryLoading = shallowRef(false);
  const cloudLibraryError = shallowRef("");
  const identityDirectorySyncing = shallowRef(false);
  const identityDirectorySyncError = shallowRef("");
  const identityDirectorySyncStatus = shallowRef("");

  let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;
  let identitySyncTimer: ReturnType<typeof setTimeout> | null = null;

  function normalizeCollectionId(value: unknown) {
    const normalized = String(value || "").trim();
    return normalized || DEFAULT_COLLECTION_ID;
  }

  const activeCollectionId = computed(() =>
    normalizeCollectionId(context.currentCollectionId.value)
  );

  const canUsePasskey = computed(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.isSecureContext && "PublicKeyCredential" in window);
  });

  const cloudBinding = computed<PixbookCloudBinding | null>(() => {
    if (context.pixbookReadOnly.value) return null;
    const profileId = String(context.profile.profileId.value || "").trim();
    const identityPublicKey = String(context.publicKeyPEM.value || "").trim();
    if (!profileId || !identityPublicKey) return null;

    const meta = context.profile.meta.value as { username?: string };
    return {
      profileId,
      identityPublicKey,
      profileDisplayName: meta?.username ? `@${meta.username}` : undefined,
    };
  });

  const canCloudSync = computed(() => {
    return (
      account.isAuthenticated.value &&
      !context.pixbookReadOnly.value &&
      Boolean(context.ledger.value) &&
      Boolean(cloudBinding.value)
    );
  });

  const selectedCloudProfile = computed(() => {
    if (!selectedCloudProfileId.value) return null;
    return (
      cloudProfiles.value.find((entry) => entry.id === selectedCloudProfileId.value) ||
      null
    );
  });

  const filteredCloudBooks = computed(() => {
    const profileId = String(selectedCloudProfileId.value || "").trim();
    return cloudBooks.value.filter((entry) => {
      if (normalizeCollectionId(entry.collectionId) !== activeCollectionId.value) {
        return false;
      }
      if (!profileId) return true;
      return entry.managedUserId === profileId;
    });
  });

  function resetCloudSyncState() {
    cloudSyncStatus.value = "";
    cloudSyncError.value = "";
    cloudSnapshotVersion.value = null;
    cloudSnapshotAt.value = "";
    cloudWorkspaceId.value = "";
    cloudBookId.value = "";
    cloudSnapshotLedgerHead.value = "";
    cloudSnapshotPayload.value = null;
    lastCloudSyncHead.value = "";
    cloudProfiles.value = [];
    cloudBooks.value = [];
    selectedCloudProfileId.value = "";
    selectedCloudBookId.value = "";
    cloudLibraryError.value = "";
  }

  function getCloudBindingOrThrow() {
    const binding = cloudBinding.value;
    if (!binding) {
      throw new Error(
        "Cloud sync requires a private Pixbook identity (profile + key)."
      );
    }
    return binding;
  }

  function identityDisplayName(input: { label?: string; metadata?: Record<string, unknown> }) {
    const username = String(input?.metadata?.username || "").trim();
    if (username) return username;
    const label = String(input?.label || "").trim();
    if (label) return label.replace(/^@/, "");
    return "Identity";
  }

  function toIdentityBindingKey(profileId: string, identityPublicKey: string) {
    const normalizedProfileId = String(profileId || "").trim();
    const normalizedIdentityPublicKey = String(identityPublicKey || "").trim();
    if (!normalizedProfileId || !normalizedIdentityPublicKey) return "";
    return `${normalizedProfileId}::${normalizedIdentityPublicKey}`;
  }

  function isIdentityBindingSuppressed(bindingKey: string) {
    if (!bindingKey) return false;
    const suppressed = Array.isArray(suppressedIdentityBindings.value)
      ? suppressedIdentityBindings.value
      : [];
    return suppressed.includes(bindingKey);
  }

  function suppressIdentityBinding(bindingKey: string) {
    if (!bindingKey) return;
    const suppressed = Array.isArray(suppressedIdentityBindings.value)
      ? suppressedIdentityBindings.value
      : [];
    if (suppressed.includes(bindingKey)) return;
    suppressedIdentityBindings.value = [...suppressed, bindingKey];
  }

  function unsuppressIdentityBinding(bindingKey: string) {
    if (!bindingKey) return;
    const suppressed = Array.isArray(suppressedIdentityBindings.value)
      ? suppressedIdentityBindings.value
      : [];
    if (!suppressed.includes(bindingKey)) return;
    suppressedIdentityBindings.value = suppressed.filter(
      (entry) => entry !== bindingKey
    );
  }

  async function refreshCloudLibrary() {
    if (!account.isAuthenticated.value) return;
    cloudLibraryLoading.value = true;
    cloudLibraryError.value = "";
    try {
      const [usersRes, booksRes] = await Promise.all([
        listAccountManagedUsers(account.workspace.value?.workspaceId || undefined),
        listAccountBooks(account.workspace.value?.workspaceId || undefined),
      ]);

      cloudProfiles.value = usersRes.users || [];
      cloudBooks.value = booksRes.books || [];

      if (selectedCloudProfileId.value) {
        const stillPresent = cloudProfiles.value.some(
          (entry) => entry.id === selectedCloudProfileId.value
        );
        if (!stillPresent) selectedCloudProfileId.value = "";
      }

      if (!selectedCloudProfileId.value && cloudBookId.value) {
        const activeBook = cloudBooks.value.find(
          (entry) => entry.id === cloudBookId.value
        );
        if (activeBook) selectedCloudProfileId.value = activeBook.managedUserId;
      }
      if (!selectedCloudProfileId.value && cloudProfiles.value.length > 0) {
        selectedCloudProfileId.value = cloudProfiles.value[0].id;
      }

      if (selectedCloudBookId.value) {
        const stillPresent = cloudBooks.value.some(
          (entry) => entry.id === selectedCloudBookId.value
        );
        if (!stillPresent) selectedCloudBookId.value = "";
      }

      if (!selectedCloudBookId.value && cloudBookId.value) {
        const activeBookPresent = cloudBooks.value.some(
          (entry) => entry.id === cloudBookId.value
        );
        if (activeBookPresent) selectedCloudBookId.value = cloudBookId.value;
      }

      if (!selectedCloudBookId.value && filteredCloudBooks.value.length > 0) {
        selectedCloudBookId.value = filteredCloudBooks.value[0].id;
      }
    } catch (error: unknown) {
      if (
        error instanceof PixPaxApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        cloudLibraryError.value =
          "Workspace identity/pixbook management is not available for this session.";
      } else {
        cloudLibraryError.value = String(
          (error as Error)?.message || "Failed to load cloud library."
        );
      }
    } finally {
      cloudLibraryLoading.value = false;
    }
  }

  async function syncLocalIdentitiesToCloud() {
    if (!account.isAuthenticated.value) return false;
    if (identityDirectorySyncing.value) return false;

    identityDirectorySyncing.value = true;
    identityDirectorySyncError.value = "";
    identityDirectorySyncStatus.value = "Syncing identities...";

    try {
      const workspaceId = account.workspace.value?.workspaceId || undefined;
      await refreshCloudLibrary();

      const existingByBinding = new Map<string, AccountManagedUser>();
      for (const entry of cloudProfiles.value) {
        const profileId = String(entry.profileId || "").trim();
        const identityPublicKey = String(entry.identityPublicKey || "").trim();
        if (!profileId || !identityPublicKey) continue;
        existingByBinding.set(toIdentityBindingKey(profileId, identityPublicKey), entry);
      }

      const activeBookByManagedUserCollection = new Set<string>();
      for (const book of cloudBooks.value) {
        if (String(book.status || "").trim() === "deleted") continue;
        const managedUserId = String(book.managedUserId || "").trim();
        const collectionId = normalizeCollectionId(book.collectionId);
        if (!managedUserId || !collectionId) continue;
        activeBookByManagedUserCollection.add(`${managedUserId}::${collectionId}`);
      }

      for (const identity of context.identities.value) {
        const profileId = String(identity.profileId || "").trim();
        const identityPublicKey = String(identity.publicKeyPEM || "").trim();
        if (!profileId || !identityPublicKey) continue;

        const displayName = identityDisplayName(identity);
        const bindingKey = toIdentityBindingKey(profileId, identityPublicKey);
        if (!bindingKey || isIdentityBindingSuppressed(bindingKey)) continue;
        const existing = existingByBinding.get(bindingKey) || null;

        let managedUserId = String(existing?.id || "").trim();

        if (existing) {
          unsuppressIdentityBinding(bindingKey);
          const needsUpdate =
            String(existing.displayName || "").trim() !== displayName ||
            String(existing.profileId || "").trim() !== profileId ||
            String(existing.identityPublicKey || "").trim() !== identityPublicKey ||
            String(existing.status || "").trim() !== "active";

          if (needsUpdate) {
            await updateAccountManagedUser(
              existing.id,
              {
                displayName,
                profileId,
                identityPublicKey,
                status: "active",
              },
              workspaceId
            );
          }
        } else {
          const created = await createAccountManagedUser(
            {
              displayName,
              profileId,
              identityPublicKey,
            },
            workspaceId
          );
          managedUserId = String(created?.id || "").trim();
          unsuppressIdentityBinding(bindingKey);
        }

        if (!managedUserId) continue;

        const localCollectionIds = new Set<string>();
        for (const pixbook of context.pixbooks.value) {
          if (String(pixbook.identityId || "").trim() !== String(identity.id || "").trim()) {
            continue;
          }
          localCollectionIds.add(normalizeCollectionId(pixbook.collectionId));
        }
        if (localCollectionIds.size === 0) {
          localCollectionIds.add(activeCollectionId.value);
        }

        for (const collectionId of localCollectionIds) {
          const bindingCollectionKey = `${managedUserId}::${collectionId}`;
          if (activeBookByManagedUserCollection.has(bindingCollectionKey)) continue;

          await createAccountBook(
            {
              managedUserId,
              name: "My Pixbook",
              collectionId,
            },
            workspaceId
          );
          activeBookByManagedUserCollection.add(bindingCollectionKey);
        }
      }

      await refreshCloudLibrary();
      identityDirectorySyncStatus.value = "Identity sync complete.";
      return true;
    } catch (error: unknown) {
      identityDirectorySyncError.value = String(
        (error as Error)?.message || "Identity sync failed."
      );
      identityDirectorySyncStatus.value = "";
      return false;
    } finally {
      identityDirectorySyncing.value = false;
    }
  }

  async function refreshCloudSnapshot() {
    if (!account.isAuthenticated.value) {
      resetCloudSyncState();
      return;
    }

    const binding = cloudBinding.value;
    if (!binding) {
      cloudWorkspaceId.value = "";
      cloudBookId.value = "";
      cloudSnapshotVersion.value = null;
      cloudSnapshotAt.value = "";
      cloudSnapshotLedgerHead.value = "";
      cloudSnapshotPayload.value = null;
      cloudSyncStatus.value = "";
      cloudSyncError.value = "";
      return;
    }

    cloudSyncError.value = "";
    try {
      const response = await getPixbookCloudState(
        account.workspace.value?.workspaceId || undefined,
        binding,
        undefined,
        activeCollectionId.value
      );

      cloudWorkspaceId.value = response.workspaceId || "";
      cloudBookId.value = response.book?.id || "";
      if (cloudBookId.value) selectedCloudBookId.value = cloudBookId.value;
      if (response.book?.managedUserId) {
        selectedCloudProfileId.value = response.book.managedUserId;
      }

      cloudSnapshotVersion.value = response.snapshot?.version ?? null;
      cloudSnapshotAt.value = response.snapshot?.createdAt || "";
      cloudSnapshotLedgerHead.value = String(
        response.snapshot?.ledgerHead || ""
      ).trim();
      cloudSnapshotPayload.value = response.snapshot?.payload ?? null;
      const localHead = String(context.ledger.value?.head || "").trim();
      const remoteHead = cloudSnapshotLedgerHead.value;
      if (localHead && remoteHead && localHead === remoteHead) {
        lastCloudSyncHead.value = localHead;
        syncedPackHead.value = localHead;
        if (pendingPackSyncHead.value === localHead) {
          pendingPackSyncHead.value = "";
        }
      }

      await refreshCloudLibrary();
    } catch (error: unknown) {
      if (error instanceof PixPaxApiError && error.status === 401) {
        resetCloudSyncState();
        return;
      }
      cloudSyncError.value = String(
        (error as Error)?.message || "Failed to load cloud snapshot."
      );
    }
  }

  async function saveCloudSnapshot() {
    if (!canCloudSync.value || !context.ledger.value) return false;
    if (cloudSyncing.value) return false;

    cloudSyncing.value = true;
    cloudSyncStatus.value = "Saving pixbook to cloud...";
    cloudSyncError.value = "";

    try {
      const binding = getCloudBindingOrThrow();
      const payload = context.buildPixbook("private");

      const response = await savePixbookCloudSnapshot({
        payload,
        ledgerHead: context.ledger.value?.head || "",
        expectedVersion: cloudSnapshotVersion.value ?? 0,
        expectedLedgerHead: cloudSnapshotLedgerHead.value,
        workspaceId: account.workspace.value?.workspaceId || undefined,
        collectionId: activeCollectionId.value,
        binding,
      });

      cloudWorkspaceId.value = response.workspaceId || "";
      cloudBookId.value = response.book?.id || "";
      if (cloudBookId.value) selectedCloudBookId.value = cloudBookId.value;
      if (response.book?.managedUserId) {
        selectedCloudProfileId.value = response.book.managedUserId;
      }

      cloudSnapshotVersion.value = response.snapshot?.version ?? null;
      cloudSnapshotAt.value = response.snapshot?.createdAt || "";
      cloudSnapshotLedgerHead.value = String(
        response.snapshot?.ledgerHead || ""
      ).trim();
      cloudSnapshotPayload.value = response.snapshot?.payload ?? payload;

      lastCloudSyncHead.value = context.ledger.value?.head || "";
      syncedPackHead.value = lastCloudSyncHead.value;
      if (pendingPackSyncHead.value === lastCloudSyncHead.value) {
        pendingPackSyncHead.value = "";
      }
      cloudSyncStatus.value = `Cloud save complete (v${
        cloudSnapshotVersion.value ?? 0
      }).`;
      return true;
    } catch (error: unknown) {
      if (error instanceof PixPaxApiError && error.status === 409) {
        cloudSyncStatus.value = "";
        cloudSyncError.value =
          "Cloud snapshot conflict detected. Load latest cloud snapshot before saving again.";
        await refreshCloudSnapshot();
        return false;
      }
      cloudSyncError.value = String(
        (error as Error)?.message || "Cloud save failed."
      );
      return false;
    } finally {
      cloudSyncing.value = false;
    }
  }

  async function restoreCloudSnapshot() {
    if (!account.isAuthenticated.value) {
      cloudSyncError.value = "Sign in to restore cloud pixbooks.";
      return false;
    }

    const binding = cloudBinding.value;
    if (!binding) {
      cloudSyncError.value =
        "Cloud restore requires your private Pixbook identity in this browser.";
      return false;
    }

    cloudSyncError.value = "";
    cloudSyncStatus.value = "Loading cloud snapshot...";

    try {
      const response = await getPixbookCloudState(
        account.workspace.value?.workspaceId || undefined,
        binding,
        undefined,
        activeCollectionId.value
      );

      const payload = response.snapshot?.payload as PixbookExport | null;
      if (!payload || typeof payload !== "object") {
        throw new Error("No cloud snapshot found yet.");
      }

      if (payload.format !== PIXBOOK_FORMAT || payload.version !== PIXBOOK_VERSION) {
        throw new Error("Cloud snapshot format is invalid.");
      }

      const file = new File([JSON.stringify(payload)], "cloud-pixbook.json", {
        type: "application/json",
      });
      const ok = await context.importPixbookFile(file, { confirm: false });
      if (!ok) {
        throw new Error(context.uploadError.value || "Cloud restore failed.");
      }

      if (payload.kind === "public") {
        cloudSyncStatus.value = "Public cloud pixbook loaded (read-only).";
      } else {
        cloudSyncStatus.value = `Cloud pixbook restored (v${
          response.snapshot?.version || 0
        }).`;
      }

      if (context.ledger.value?.head) {
        lastCloudSyncHead.value = context.ledger.value.head;
        syncedPackHead.value = context.ledger.value.head;
        if (pendingPackSyncHead.value === context.ledger.value.head) {
          pendingPackSyncHead.value = "";
        }
      }

      await refreshCloudSnapshot();
      return true;
    } catch (error: unknown) {
      cloudSyncError.value = String(
        (error as Error)?.message || "Cloud restore failed."
      );
      cloudSyncStatus.value = "";
      return false;
    }
  }

  async function openSelectedCloudBook() {
    if (!selectedCloudBookId.value) {
      cloudSyncError.value = "Select a cloud pixbook first.";
      return false;
    }

    const selectedBook = cloudBooks.value.find(
      (entry) => String(entry.id || "").trim() === String(selectedCloudBookId.value || "").trim()
    );
    if (!selectedBook) {
      cloudSyncError.value = "Selected cloud pixbook was not found.";
      return false;
    }
    if (normalizeCollectionId(selectedBook.collectionId) !== activeCollectionId.value) {
      cloudSyncError.value =
        "Selected cloud pixbook belongs to another collection.";
      return false;
    }

    const binding = cloudBinding.value;
    if (!binding) {
      cloudSyncError.value =
        "Private cloud restore requires your active identity in this browser.";
      return false;
    }
    const boundManagedUser = cloudProfiles.value.find((entry) => {
      return (
        String(entry.profileId || "").trim() === String(binding.profileId || "").trim() &&
        String(entry.identityPublicKey || "").trim() ===
          String(binding.identityPublicKey || "").trim() &&
        String(entry.status || "").trim() !== "deleted"
      );
    });
    if (!boundManagedUser || boundManagedUser.id !== selectedBook.managedUserId) {
      cloudSyncError.value =
        "Private cross-identity cloud restore is blocked. Switch identity first.";
      return false;
    }

    cloudBookId.value = selectedCloudBookId.value;
    return restoreCloudSnapshot();
  }

  function notePackLedgerMutation(head?: string) {
    const resolvedHead = String(head || context.ledger.value?.head || "").trim();
    if (!resolvedHead) return;
    pendingPackSyncHead.value = resolvedHead;
  }

  async function removeCloudIdentity(managedUserId: string) {
    if (!account.isAuthenticated.value) {
      cloudSyncError.value = "Sign in to remove identities from your account.";
      return false;
    }

    const targetId = String(managedUserId || "").trim();
    if (!targetId) {
      cloudSyncError.value = "Identity id is required.";
      return false;
    }

    cloudSyncError.value = "";
    cloudSyncStatus.value = "Removing identity from account...";

    try {
      const workspaceId = account.workspace.value?.workspaceId || undefined;
      const profileToRemove = cloudProfiles.value.find(
        (entry) => String(entry.id || "").trim() === targetId
      );
      const bindingKey = toIdentityBindingKey(
        String(profileToRemove?.profileId || "").trim(),
        String(profileToRemove?.identityPublicKey || "").trim()
      );
      const removed = await removeAccountManagedIdentity(targetId, workspaceId);

      suppressIdentityBinding(bindingKey);

      if (selectedCloudProfileId.value === targetId) {
        selectedCloudProfileId.value = "";
        selectedCloudBookId.value = "";
      }

      if (
        Array.isArray(removed?.removedBookIds) &&
        removed.removedBookIds.includes(cloudBookId.value)
      ) {
        cloudBookId.value = "";
      }

      await refreshCloudLibrary();
      cloudSyncStatus.value = "Identity removed from account.";
      return true;
    } catch (error: unknown) {
      cloudSyncError.value = String(
        (error as Error)?.message || "Failed to remove identity from account."
      );
      cloudSyncStatus.value = "";
      return false;
    }
  }

  async function sendOtpCode() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      await account.requestLoginOtp(authEmail.value);
      authMessage.value = "Verification code sent.";
    } catch (error: unknown) {
      authMessage.value = String(
        (error as Error)?.message || "Failed to send OTP."
      );
    } finally {
      authBusy.value = false;
    }
  }

  async function submitOtpCode() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      await account.loginWithOtp({
        email: authEmail.value,
        otp: authOtp.value,
      });
      authMessage.value = "Signed in with OTP.";
      authOtp.value = "";
      await refreshCloudSnapshot();
      return true;
    } catch (error: unknown) {
      authMessage.value = String(
        (error as Error)?.message || "OTP sign-in failed."
      );
      return false;
    } finally {
      authBusy.value = false;
    }
  }

  async function signInWithPasskey() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      await account.loginWithPasskey();
      authMessage.value = "Signed in with passkey.";
      await refreshCloudSnapshot();
      return true;
    } catch (error: unknown) {
      authMessage.value = String(
        (error as Error)?.message || "Passkey sign-in failed."
      );
      return false;
    } finally {
      authBusy.value = false;
    }
  }

  async function registerPasskeyForAccount() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      await account.registerPasskey();
      authMessage.value = "Passkey added for this device.";
      return true;
    } catch (error: unknown) {
      authMessage.value = String(
        (error as Error)?.message || "Passkey setup failed."
      );
      return false;
    } finally {
      authBusy.value = false;
    }
  }

  async function signOutAccount() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      await account.logout();
      resetCloudSyncState();
      authOtp.value = "";
      authMessage.value = "Signed out.";
      return true;
    } catch (error: unknown) {
      authMessage.value = String(
        (error as Error)?.message || "Sign-out failed."
      );
      return false;
    } finally {
      authBusy.value = false;
    }
  }

  onMounted(async () => {
    await account.refreshSession({ force: true });
    await refreshCloudSnapshot();
    await refreshCloudLibrary();
  });

  watch(
    () => account.isAuthenticated.value,
    async (next) => {
      if (!next) {
        resetCloudSyncState();
        identityDirectorySyncStatus.value = "";
        identityDirectorySyncError.value = "";
        return;
      }
      await refreshCloudSnapshot();
      await refreshCloudLibrary();
      await syncLocalIdentitiesToCloud();
    },
    { immediate: true }
  );

  watch(
    () =>
      [
        account.isAuthenticated.value,
        cloudBinding.value?.profileId || "",
        cloudBinding.value?.identityPublicKey || "",
        activeCollectionId.value,
      ] as const,
    async ([authenticated]) => {
      if (!authenticated) return;
      await refreshCloudSnapshot();
      await refreshCloudLibrary();
      await syncLocalIdentitiesToCloud();
    }
  );

  watch(
    () => context.pixbooks.value,
    () => {
      if (!account.isAuthenticated.value) return;
      if (identitySyncTimer) {
        clearTimeout(identitySyncTimer);
        identitySyncTimer = null;
      }
      identitySyncTimer = setTimeout(() => {
        void syncLocalIdentitiesToCloud();
      }, 900);
    },
    { deep: true }
  );

  watch(
    () => context.identities.value,
    () => {
      if (!account.isAuthenticated.value) return;
      if (identitySyncTimer) {
        clearTimeout(identitySyncTimer);
        identitySyncTimer = null;
      }
      identitySyncTimer = setTimeout(() => {
        void syncLocalIdentitiesToCloud();
      }, 900);
    },
    { deep: true }
  );

  watch(
    () => selectedCloudProfileId.value,
    (nextProfileId) => {
      if (!nextProfileId) {
        selectedCloudBookId.value = "";
        return;
      }
      const nextBooks = cloudBooks.value.filter(
        (entry) => entry.managedUserId === nextProfileId
      );
      if (nextBooks.length === 0) {
        selectedCloudBookId.value = "";
        return;
      }
      const stillValid = nextBooks.some(
        (entry) => entry.id === selectedCloudBookId.value
      );
      if (!stillValid) {
        selectedCloudBookId.value = nextBooks[0].id;
      }
    }
  );

  watch(
    () => [
      cloudAutoSync.value,
      canCloudSync.value,
      account.isAuthenticated.value,
      context.pixbookReadOnly.value,
      context.ledger.value?.head || "",
    ],
    ([autoSyncEnabled, canSync, authenticated, readOnly, head]) => {
      if (!autoSyncEnabled || !canSync || !authenticated || readOnly || !head) {
        if (cloudSyncTimer) {
          clearTimeout(cloudSyncTimer);
          cloudSyncTimer = null;
        }
        return;
      }
      if (head === lastCloudSyncHead.value) return;
      if (head !== pendingPackSyncHead.value) return;
      if (head === syncedPackHead.value) return;

      if (cloudSyncTimer) {
        clearTimeout(cloudSyncTimer);
        cloudSyncTimer = null;
      }

      cloudSyncTimer = setTimeout(() => {
        void saveCloudSnapshot();
      }, 1300);
    }
  );

  onUnmounted(() => {
    if (cloudSyncTimer) {
      clearTimeout(cloudSyncTimer);
      cloudSyncTimer = null;
    }
    if (identitySyncTimer) {
      clearTimeout(identitySyncTimer);
      identitySyncTimer = null;
    }
  });

  return {
    account,

    authEmail,
    authOtp,
    authBusy,
    authMessage,

    canUsePasskey,

    cloudAutoSync,
    cloudSyncing,
    cloudSyncStatus,
    cloudSyncError,

    cloudSnapshotVersion,
    cloudSnapshotAt,
    cloudWorkspaceId,
    cloudBookId,
    cloudSnapshotLedgerHead,
    cloudSnapshotPayload,

    cloudProfiles,
    cloudBooks,
    selectedCloudProfileId,
    selectedCloudBookId,
    selectedCloudProfile,
    filteredCloudBooks,
    cloudLibraryLoading,
    cloudLibraryError,
    identityDirectorySyncing,
    identityDirectorySyncError,
    identityDirectorySyncStatus,

    cloudBinding,
    canCloudSync,
    activeCollectionId,

    refreshCloudLibrary,
    refreshCloudSnapshot,
    saveCloudSnapshot,
    restoreCloudSnapshot,
    openSelectedCloudBook,
    notePackLedgerMutation,
    removeCloudIdentity,
    syncLocalIdentitiesToCloud,

    sendOtpCode,
    submitOtpCode,
    signInWithPasskey,
    registerPasskeyForAccount,
    signOutAccount,
  };
}

export function providePixpaxCloudSync(options: CreatePixpaxCloudSyncOptions = {}) {
  const sync = createPixpaxCloudSync(options);
  provide(usePixpaxCloudSyncSymbol, sync);
  return sync;
}

export function usePixpaxCloudSync() {
  const sync = inject<PixpaxCloudSync>(usePixpaxCloudSyncSymbol);
  if (!sync) {
    throw new Error("usePixpaxCloudSync() called without providePixpaxCloudSync().");
  }
  return sync;
}
