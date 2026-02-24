import { computed, inject, onMounted, provide, shallowRef, watch } from "vue";
import { type PixbookCloudBinding } from "../api/client";
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

  const listLoader = createAccountListLoader({
    account,
    activeCollectionId,
    cloudBookId,
  });

  const itemLoader = createAccountPixbookItemLoader({
    account,
    activeCollectionId,
    cloudBinding,
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
    cloudBinding,
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
    refreshCloudLibrary: listLoader.refreshCloudLibrary,
    refreshCloudSnapshot: itemLoader.refreshCloudSnapshot,
  });

  function bindCloudSelectionToActiveIdentity() {
    const binding = cloudBinding.value;
    if (!binding) {
      listLoader.selectedCloudProfileId.value = "";
      listLoader.selectedCloudBookId.value = "";
      itemLoader.cloudBookId.value = "";
      return;
    }

    const matchedProfile = listLoader.cloudProfiles.value.find((entry) => {
      return (
        String(entry.status || "").trim() !== "deleted" &&
        String(entry.profileId || "").trim() === String(binding.profileId || "").trim() &&
        String(entry.identityPublicKey || "").trim() ===
          String(binding.identityPublicKey || "").trim()
      );
    });

    if (!matchedProfile) {
      listLoader.selectedCloudProfileId.value = "";
      listLoader.selectedCloudBookId.value = "";
      itemLoader.cloudBookId.value = "";
      return;
    }

    listLoader.selectedCloudProfileId.value = matchedProfile.id;

    const matchedBook = listLoader.cloudBooks.value.find((entry) => {
      return (
        String(entry.status || "").trim() !== "deleted" &&
        String(entry.managedUserId || "").trim() === String(matchedProfile.id || "").trim() &&
        String(entry.collectionId || "").trim() === String(activeCollectionId.value || "").trim()
      );
    });

    const matchedBookId = String(matchedBook?.id || "").trim();
    listLoader.selectedCloudBookId.value = matchedBookId;
    itemLoader.cloudBookId.value = matchedBookId;
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
        cloudBinding.value?.profileId || "",
        cloudBinding.value?.identityPublicKey || "",
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
        (entry) => entry.managedUserId === nextProfileId
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

    cloudBinding,
    canCloudSync,
    activeCollectionId,

    refreshCloudLibrary: listLoader.refreshCloudLibrary,
    refreshCloudSnapshot: itemLoader.refreshCloudSnapshot,
    refreshCloudForActiveIdentity,
    saveCloudSnapshot: actions.saveCloudSnapshot,
    restoreCloudSnapshot: actions.restoreCloudSnapshot,
    openSelectedCloudBook: actions.openSelectedCloudBook,
    importAccountIdentityToDevice: actions.importAccountIdentityToDevice,
    removeCloudIdentity: actions.removeCloudIdentity,
    resetAccountIdentityData: actions.resetAccountIdentityData,
    removeCloudPixbook: actions.removeCloudPixbook,
    saveLocalIdentityToCloud: actions.saveLocalIdentityToCloud,
    syncLocalIdentitiesToCloud: actions.syncLocalIdentitiesToCloud,

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
