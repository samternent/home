import { computed, inject, onMounted, provide, shallowRef, watch } from "vue";
import { usePixpaxAccount } from "../auth/usePixpaxAccount";
import {
  type PixpaxContextStore,
  usePixpaxContextStore,
} from "./usePixpaxContextStore";
import { createAccountItemActions } from "./account/useAccountItemActions";
import { createAccountListLoader } from "./account/useAccountListLoader";
import { createAccountPixbookItemLoader } from "./account/useAccountPixbookItemLoader";

const usePixpaxCloudSyncSymbol = Symbol("usePixpaxCloudSync");

export type PixpaxCloudSync = ReturnType<typeof createPixpaxCloudSync>;

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

  const cloudSyncing = shallowRef(false);
  const cloudSyncStatus = shallowRef("");
  const cloudSyncError = shallowRef("");
  const identityDirectorySyncing = shallowRef(false);
  const identityDirectorySyncError = shallowRef("");
  const identityDirectorySyncStatus = shallowRef("");
  const recoveryPassphrase = shallowRef("");
  const recoveryPassphraseUnlocked = computed(
    () => String(recoveryPassphrase.value || "").length > 0
  );

  const cloudBookId = shallowRef("");

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

  const listLoader = createAccountListLoader({
    account,
    activeCollectionId,
    cloudBookId,
  });

  const canCloudSync = computed(() => {
    const selectedBookId = String(
      listLoader.selectedCloudBookId.value || cloudBookId.value || ""
    ).trim();
    return (
      account.isAuthenticated.value &&
      !context.pixbookReadOnly.value &&
      Boolean(context.ledger.value) &&
      Boolean(selectedBookId)
    );
  });

  const itemLoader = createAccountPixbookItemLoader({
    account,
    activeCollectionId,
    cloudBooks: listLoader.cloudBooks,
    selectedCloudBookId: listLoader.selectedCloudBookId,
    selectedCloudProfileId: listLoader.selectedCloudProfileId,
    cloudBookId,
    cloudSyncStatus,
    cloudSyncError,
    refreshCloudLibrary: listLoader.refreshCloudLibrary,
    resetCloudLibraryState: listLoader.resetCloudLibraryState,
  });

  const actions = createAccountItemActions({
    account,
    context,
    activeCollectionId,
    canCloudSync,
    cloudProfiles: listLoader.cloudProfiles,
    cloudBooks: listLoader.cloudBooks,
    selectedCloudProfileId: listLoader.selectedCloudProfileId,
    selectedCloudBookId: listLoader.selectedCloudBookId,
    cloudBookId: itemLoader.cloudBookId,
    cloudSnapshotVersion: itemLoader.cloudSnapshotVersion,
    cloudSnapshotAt: itemLoader.cloudSnapshotAt,
    cloudWorkspaceId: itemLoader.cloudWorkspaceId,
    cloudSnapshotLedgerHead: itemLoader.cloudSnapshotLedgerHead,
    cloudSnapshotPayload: itemLoader.cloudSnapshotPayload,
    cloudSyncing,
    cloudSyncStatus,
    cloudSyncError,
    identityDirectorySyncing,
    identityDirectorySyncError,
    identityDirectorySyncStatus,
    recoveryPassphrase,
    refreshCloudLibrary: listLoader.refreshCloudLibrary,
    refreshCloudSnapshot: itemLoader.refreshCloudSnapshot,
  });

  function unlockRecoveryPassphrase(passphrase: string) {
    const normalized = String(passphrase || "").normalize("NFC");
    recoveryPassphrase.value = normalized;
    if (normalized) {
      identityDirectorySyncStatus.value = "Recovery passphrase unlocked for this session.";
      identityDirectorySyncError.value = "";
      return true;
    }
    identityDirectorySyncError.value = "Passphrase is required.";
    identityDirectorySyncStatus.value = "";
    return false;
  }

  function clearRecoveryPassphrase() {
    recoveryPassphrase.value = "";
    identityDirectorySyncStatus.value = "Recovery passphrase cleared.";
    identityDirectorySyncError.value = "";
  }

  function bindCloudSelectionToActiveIdentity() {
    const activeBooks = listLoader.cloudBooks.value.filter((entry) => {
      return (
        String(entry.status || "").trim() !== "deleted" &&
        String(entry.collectionId || "").trim() === String(activeCollectionId.value || "").trim()
      );
    });
    if (activeBooks.length === 0) {
      listLoader.selectedCloudProfileId.value = "";
      listLoader.selectedCloudBookId.value = "";
      itemLoader.cloudBookId.value = "";
      return;
    }

    const localActiveIdentity = context.activeIdentity.value;
    const localProfileId = String(localActiveIdentity?.profileId || "").trim();
    const localIdentityPublicKey = String(localActiveIdentity?.publicKeyPEM || "").trim();
    let preferredProfileId = "";
    if (localProfileId && localIdentityPublicKey) {
      const managedUser = listLoader.cloudProfiles.value.find((entry) => {
        return (
          String(entry.status || "").trim() !== "deleted" &&
          String(entry.profileId || "").trim() === localProfileId &&
          String(entry.identityPublicKey || "").trim() === localIdentityPublicKey
        );
      });
      preferredProfileId = String(managedUser?.id || "").trim();
    }

    const selectedProfileId = String(listLoader.selectedCloudProfileId.value || "").trim();
    const selectedProfileExists = activeBooks.some(
      (entry) => String(entry.managedUserId || "").trim() === selectedProfileId
    );
    const preferredProfileExists = preferredProfileId
      ? activeBooks.some(
          (entry) => String(entry.managedUserId || "").trim() === preferredProfileId
        )
      : false;
    const resolvedProfileId = preferredProfileExists
      ? preferredProfileId
      : selectedProfileExists
        ? selectedProfileId
        : String(activeBooks[0]?.managedUserId || "").trim();

    listLoader.selectedCloudProfileId.value = resolvedProfileId;
    const profileBooks = activeBooks.filter(
      (entry) => String(entry.managedUserId || "").trim() === resolvedProfileId
    );
    const selectedBookId = String(
      listLoader.selectedCloudBookId.value || itemLoader.cloudBookId.value || ""
    ).trim();
    const selectedBookExists = profileBooks.some(
      (entry) => String(entry.id || "").trim() === selectedBookId
    );
    const resolvedBookId = selectedBookExists
      ? selectedBookId
      : String(profileBooks[0]?.id || activeBooks[0]?.id || "").trim();
    listLoader.selectedCloudBookId.value = resolvedBookId;
    itemLoader.cloudBookId.value = resolvedBookId;
  }

  async function refreshCloudForActiveIdentity() {
    if (!account.isAuthenticated.value) return;
    await listLoader.refreshCloudLibrary();
    bindCloudSelectionToActiveIdentity();
    await itemLoader.refreshCloudSnapshot();
  }

  function resetCloudSyncState() {
    cloudSyncStatus.value = "";
    cloudSyncError.value = "";
    itemLoader.resetCloudSnapshotState();
    listLoader.resetCloudLibraryState();
  }

  function clearIdentityScopedState() {
    cloudSyncStatus.value = "";
    cloudSyncError.value = "";
    itemLoader.cloudSnapshotPayload.value = null;
    itemLoader.cloudSnapshotLedgerHead.value = "";
    itemLoader.cloudSnapshotVersion.value = null;
    itemLoader.cloudSnapshotAt.value = "";
  }

  async function flushPersistQueue(timeoutMs = 2500) {
    return actions.flushPersistQueue(timeoutMs);
  }

  async function selectCloudProfile(profileId: string) {
    await flushPersistQueue(2500);
    clearIdentityScopedState();
    return actions.selectCloudProfile(profileId);
  }

  async function selectCloudBook(bookId: string) {
    const targetBookId = String(bookId || "").trim();
    if (!targetBookId) return false;
    await flushPersistQueue(2500);
    clearIdentityScopedState();
    const selectedBook = listLoader.cloudBooks.value.find((entry) => entry.id === targetBookId);
    if (!selectedBook) {
      cloudSyncError.value = "Selected account pixbook was not found.";
      return false;
    }
    listLoader.selectedCloudProfileId.value = String(selectedBook.managedUserId || "").trim();
    listLoader.selectedCloudBookId.value = targetBookId;
    itemLoader.cloudBookId.value = targetBookId;
    return actions.openSelectedCloudBook();
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
      await itemLoader.refreshCloudSnapshot();
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
      await itemLoader.refreshCloudSnapshot();
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
      clearRecoveryPassphrase();
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
    await refreshCloudForActiveIdentity();
  });

  watch(
    () => account.isAuthenticated.value,
    async (next) => {
      if (!next) {
        resetCloudSyncState();
        recoveryPassphrase.value = "";
        identityDirectorySyncStatus.value = "";
        identityDirectorySyncError.value = "";
        return;
      }
      await refreshCloudForActiveIdentity();
    },
    { immediate: true }
  );

  watch(
    () =>
      [
        account.isAuthenticated.value,
        account.workspace.value?.workspaceId || "",
        activeCollectionId.value,
      ] as const,
    async ([authenticated]) => {
      if (!authenticated) return;
      await refreshCloudForActiveIdentity();
    }
  );

  watch(
    () => listLoader.selectedCloudProfileId.value,
    (nextProfileId) => {
      if (!nextProfileId) {
        listLoader.selectedCloudBookId.value = "";
        return;
      }
      const nextBooks = listLoader.cloudBooks.value.filter(
        (entry) =>
          entry.managedUserId === nextProfileId &&
          String(entry.status || "").trim() !== "deleted" &&
          String(entry.collectionId || "").trim() === String(activeCollectionId.value || "").trim()
      );
      if (nextBooks.length === 0) {
        listLoader.selectedCloudBookId.value = "";
        return;
      }
      const stillValid = nextBooks.some(
        (entry) => entry.id === listLoader.selectedCloudBookId.value
      );
      if (!stillValid) {
        listLoader.selectedCloudBookId.value = nextBooks[0].id;
      }
    }
  );

  watch(
    () => listLoader.selectedCloudBookId.value,
    async (nextBookId, previousBookId) => {
      const next = String(nextBookId || "").trim();
      const prev = String(previousBookId || "").trim();
      if (!account.isAuthenticated.value || !next || next === prev) return;
      itemLoader.cloudBookId.value = next;
      await itemLoader.refreshCloudSnapshot();
    }
  );

  watch(
    () => [
      account.isAuthenticated.value,
      recoveryPassphraseUnlocked.value,
      JSON.stringify(
        context.identities.value.map((entry) => ({
          id: entry.id,
          profileId: entry.profileId,
          updatedAt: entry.updatedAt,
        }))
      ),
    ] as const,
    ([authenticated, passphraseUnlocked]) => {
      if (!authenticated || !passphraseUnlocked) return;
      actions.scheduleAutoBackupLocalIdentities();
    }
  );

  watch(
    () =>
      [
        account.isAuthenticated.value,
        context.pixbookReadOnly.value,
        context.dirty.value,
        String(context.ledger.value?.head || "").trim(),
        String(listLoader.selectedCloudBookId.value || itemLoader.cloudBookId.value || "").trim(),
      ] as const,
    async ([authenticated, readOnly, dirty, localHead, targetBookId]) => {
      if (!authenticated || readOnly) return;
      if (!dirty) return;
      if (!localHead || !targetBookId) return;
      await actions.saveCloudSnapshot();
    }
  );

  return {
    account,

    authEmail,
    authOtp,
    authBusy,
    authMessage,

    canUsePasskey,

    cloudSyncing,
    cloudSyncStatus,
    cloudSyncError,

    cloudSnapshotVersion: itemLoader.cloudSnapshotVersion,
    cloudSnapshotAt: itemLoader.cloudSnapshotAt,
    cloudWorkspaceId: itemLoader.cloudWorkspaceId,
    cloudBookId: itemLoader.cloudBookId,
    cloudSnapshotLedgerHead: itemLoader.cloudSnapshotLedgerHead,
    cloudSnapshotPayload: itemLoader.cloudSnapshotPayload,

    cloudProfiles: listLoader.cloudProfiles,
    cloudBooks: listLoader.cloudBooks,
    selectedCloudProfileId: listLoader.selectedCloudProfileId,
    selectedCloudBookId: listLoader.selectedCloudBookId,
    selectedCloudProfile: listLoader.selectedCloudProfile,
    filteredCloudBooks: listLoader.filteredCloudBooks,
    cloudLibraryLoading: listLoader.cloudLibraryLoading,
    cloudLibraryError: listLoader.cloudLibraryError,
    identityDirectorySyncing,
    identityDirectorySyncError,
    identityDirectorySyncStatus,
    recoveryPassphraseUnlocked,

    canCloudSync,
    activeCollectionId,

    refreshCloudLibrary: listLoader.refreshCloudLibrary,
    refreshCloudSnapshot: itemLoader.refreshCloudSnapshot,
    refreshCloudForActiveIdentity,
    selectCloudProfile,
    selectCloudBook,
    flushPersistQueue,
    saveCloudSnapshot: actions.saveCloudSnapshot,
    restoreCloudSnapshot: actions.restoreCloudSnapshot,
    openSelectedCloudBook: actions.openSelectedCloudBook,
    importAccountIdentityToDevice: actions.importAccountIdentityToDevice,
    removeCloudIdentity: actions.removeCloudIdentity,
    resetAccountIdentityData: actions.resetAccountIdentityData,
    removeCloudPixbook: actions.removeCloudPixbook,
    saveLocalIdentityToCloud: actions.saveLocalIdentityToCloud,
    syncLocalIdentitiesToCloud: actions.syncLocalIdentitiesToCloud,
    backupLocalIdentityToAccount: actions.backupLocalIdentityToAccount,
    backupAllLocalIdentitiesToAccount: actions.backupAllLocalIdentitiesToAccount,
    unlockRecoveryPassphrase,
    clearRecoveryPassphrase,

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
